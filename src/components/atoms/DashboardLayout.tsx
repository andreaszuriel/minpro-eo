import { JSX, useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileModal from '@/components/atoms/ProfileModal';
import { Eye, EyeOff, Copy, Loader2, BadgeAlert, Ticket, Star, CalendarClock } from 'lucide-react'; // Added icons
import Link from 'next/link';
import { toast } from 'sonner';

// Define types for points and coupons data
interface PointsData {
  totalPoints: number;
  nextExpiration?: string | null; 
}

interface CouponData {
  id: number; 
  code: string;
  expiresAt: string; 
}

interface DashboardLayoutProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
    role: 'customer' | 'organizer';
    referralCode?: string | null;
    image?: string | null;
    pointsData?: PointsData | null;
    couponsData?: CouponData[] | null;
  };
  tabs: { value: string; label: string }[];
  renderTabContent: (activeTab: string) => JSX.Element | null;
  actionButton: JSX.Element;
}

export default function DashboardLayout({ user, tabs, renderTabContent, actionButton }: DashboardLayoutProps) {
  const { data: session, status, update } = useSession();
  const [activeTab, setActiveTab] = useState(tabs[0].value);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    email: user.email || '', // Email shouldn't be editable here directly
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    image: user.image || '',
  });
  const [showEmail, setShowEmail] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingProfileUpdate, setLoadingProfileUpdate] = useState(false); // Renamed loading state

  // Determine if the logged-in user is the owner of this profile
  const isOwner = session?.user?.id === user.id;

  // Update profileData when user data changes (especially image/name from session update)
  useEffect(() => {
    if (isOwner) { // Only update local state if it's the owner's dashboard
      setProfileData(prevData => ({
        ...prevData,
        name: session?.user?.name || user.name || '',
        // Email shouldn't change locally based on session, it's fixed
        image: session?.user?.image || user.image || '',
        // Reset password fields on user data change for safety
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } else {
       // If not the owner, just use the static user prop data
       setProfileData(prevData => ({
        ...prevData, // Keep password fields potentially if needed, but usually not for non-owners
        name: user.name || '',
        email: user.email || '',
        image: user.image || '',
      }));
    }
  }, [user, session?.user, isOwner]); // Depend on isOwner as well

  // Authentication check
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2 text-lg font-medium text-black">Loading Session...</span>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-6 text-center border border-red-200">
          <BadgeAlert className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">Authentication Required</h2>
          <p className="mt-2 text-gray-600">Please sign in to view the dashboard.</p>
          <Button className="mt-4" asChild><Link href="/auth/signin">Sign In</Link></Button>
        </div>
      </div>
    );
  }

  // Minimal check if session exists but user object is somehow missing
  if (!session?.user) {
     return (
       <div className="container mx-auto px-4 py-8">
           <div className="rounded-lg bg-yellow-50 p-6 text-center border border-yellow-200">
                <BadgeAlert className="mx-auto h-12 w-12 text-yellow-500" />
                <h2 className="mt-4 text-xl font-bold text-gray-900">Session Error</h2>
                <p className="mt-2 text-gray-600">Could not retrieve user session details. Please try signing in again.</p>
                <Button className="mt-4" asChild><Link href="/auth/signin">Sign In</Link></Button>
           </div>
       </div>
     );
  }

   if (session.user.id !== user.id && !isOwner) { // Redundant check, isOwner covers this
     console.warn("DashboardLayout: Session user ID does not match prop user ID.");
     return (
       <div className="container mx-auto px-4 py-8">
         <div className="rounded-lg bg-red-50 p-6 text-center border border-red-200">
           <BadgeAlert className="mx-auto h-12 w-12 text-red-500" />
           <h2 className="mt-4 text-xl font-bold text-gray-900">Unauthorized Access</h2>
           <p className="mt-2 text-gray-600">You are not authorized to view this dashboard.</p>
           {/* Provide a link back to their own dashboard */}
           <Button className="mt-4" asChild><Link href={`/dashboard/${session.user.id}`}>Go to Your Dashboard</Link></Button>
         </div>
       </div>
     );
   }


  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const updateProfile = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!isOwner) return; // Extra safety check

    // Password validation
    if (profileData.newPassword && (profileData.newPassword !== profileData.confirmPassword)) {
      toast.error('Password Error', { description: 'New passwords do not match' });
      return;
    }
    if (profileData.newPassword && !profileData.currentPassword) {
      toast.error('Password Error', { description: 'Please enter your current password to set a new one' });
      return;
    }

    setLoadingProfileUpdate(true);

    const payload: { name: string; image?: string; currentPassword?: string; newPassword?: string } = {
      name: profileData.name,
      image: profileData.image !== user.image ? profileData.image || undefined : undefined,
    };

    // Only include password fields if a new password is provided
    if (profileData.newPassword && profileData.currentPassword) {
      payload.currentPassword = profileData.currentPassword;
      payload.newPassword = profileData.newPassword;
    }

    // Don't send empty image string if it was initially null/undefined
    if (payload.image === '') payload.image = undefined;


    try {
      const res = await fetch('/api/user/profile', { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setIsProfileModalOpen(false);
      // Reset password fields after successful update
       setProfileData((prev) => ({
         ...prev,
         currentPassword: '',
         newPassword: '',
         confirmPassword: '',
       }));

      // Update the session data which might trigger useEffect to update local state
      await update(); // Use the update function from useSession

      toast.success('Success', { description: 'Profile updated successfully' });

    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Update Failed', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setLoadingProfileUpdate(false);
    }
  };

  const copyReferralCode = () => {
    if (user.referralCode) {
      navigator.clipboard.writeText(user.referralCode)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success('Referral code copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy referral code: ', err);
          toast.error('Copy Failed', { description: 'Could not copy code to clipboard.' });
        });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* --- Profile Header --- */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start"> 
          {/* Profile Picture and Edit Button */}
          <div className="flex flex-col items-center self-center md:self-start">
            {profileData.image ? (
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary-600">
                <Image src={profileData.image} alt={profileData.name || 'Profile'} width={96} height={96} className="object-cover w-full h-full" priority />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-600">
                <span className="text-4xl font-bold text-primary-600">
                  {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
            {/* Edit Profile Button - Only for Owner */}
            {isOwner && (
              <Button
                variant="default"
                size="sm"
                className="mt-4 bg-primary-400 text-white hover:bg-secondary-500 transition-colors duration-200 cursor-pointer"
                onClick={() => setIsProfileModalOpen(true)}
                disabled={loadingProfileUpdate}
              >
                {loadingProfileUpdate ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Edit Profile"
                )}
              </Button>
            )}
          </div>

            {/* User Info (Center Column ) */}
            <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary-700">{user.name || 'User'}</h1>
            <div className="mt-2 space-y-1">
              {/* Role and Member Since */}
              <p className="text-gray-600 font-medium capitalize">{user.role}</p>
              <p className="text-gray-600 text-sm">
                Member since: {format(new Date(user.createdAt), 'MMMM d, yyyy')}
              </p>
              {/* Email */}
              <div className="flex items-center gap-2">
                <p className="text-gray-600 text-sm">
                  {isOwner && showEmail
                    ? user.email
                    : user.email.replace(/(.{2})(.*)(@.*)/, '$1****$3')}
                </p>
                {isOwner && (
                   <button onClick={() => setShowEmail(!showEmail)} className="..." title={showEmail ? "Hide" : "Show"}>
                     {showEmail ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                   </button>
                )}
              </div>
            </div>

            {/* --- Points and Coupons Section --- */}
            {isOwner && (
              <div className="w-xs mt-3 pt-3 border-t border-primary-200 space-y-2"> {/* Separator and spacing */}
                {/* Points Line */}
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <span className="font-medium">Points:</span>
                  <span className="font-semibold">{(user.pointsData?.totalPoints ?? 0).toLocaleString()}</span>
                  {user.pointsData?.nextExpiration && user.pointsData?.totalPoints > 0 && (
                    <span className="ml-auto text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
                       <CalendarClock className="w-3 h-3" />
                       <span>Exp: {format(new Date(user.pointsData.nextExpiration), 'MMM d, yyyy')}</span>
                    </span>
                  )}
                </div>

                {/* Coupons Section */}
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                       <Ticket className="w-4 h-4 text-green-600 flex-shrink-0" />
                       <span className="font-medium">Active Coupons:</span>
                    </div>
                    {user.couponsData && user.couponsData.length > 0 ? (
                        <ul className="space-y-0.5 pl-6 list-none max-h-24 overflow-y-auto pr-2"> {/* Indent & Scroll */}
                            {user.couponsData.map(coupon => (
                                <li key={coupon.id} className="flex items-center justify-between gap-2 text-xs">
                                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-700 font-mono">
                                        {coupon.code}
                                    </code>
                                    <span className="text-gray-500 flex items-center gap-1 whitespace-nowrap">
                                        <CalendarClock className="w-3 h-3" />
                                        Exp: {format(new Date(coupon.expiresAt), 'MMM d, yyyy')}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="pl-6 text-xs text-gray-500 italic">No active coupons</p>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Referral Code & Action Button */}
          <div className="flex flex-col gap-4 items-center md:items-end mt-4 md:mt-0 self-center md:self-start">
            {/* Referral Code - Only for Owner */}
            {isOwner && user.referralCode && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 w-full max-w-[280px] md:min-w-[250px]">
                 <h3 className="text-base font-semibold text-gray-800 mb-1">Your Referral Code</h3>
                 <div className="flex items-center">
                   <code className="bg-gray-100 text-primary-700 px-3 py-1 rounded border border-gray-300 flex-1 text-sm font-mono">
                     {user.referralCode}
                   </code>
                   <button onClick={copyReferralCode} className="ml-2 text-primary-600" title="Copy" disabled={copied}>
                     {copied ? <span className="text-green-600 text-xs">Copied!</span> : <Copy className="h-4 w-4" />}
                   </button>
                 </div>
              </div>
            )}

             {/* Action Button  */}
             <div className="mt-2 md:mt-0">{actionButton}</div>
          </div>
        </div>
      </div>

      {/* --- Tabs --- */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid w-full md:w-auto grid-cols-2 md:grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-black data-[state=active]:text-primary-600 data-[state=active]:shadow-sm hover:text-primary-400 transition-colors duration-200 cursor-pointer" // Adjusted active style
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {renderTabContent(activeTab)}
      </Tabs>

      {/* --- Profile Modal --- */}
      {/* Only render modal if owner */}
      {isOwner && isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profileData={profileData}
          handleProfileChange={handleProfileChange}
          updateProfile={updateProfile}
          loading={loadingProfileUpdate} // Pass the correct loading state
          profileUpdateLoading={false}        />
      )}
    </div>
  );
}
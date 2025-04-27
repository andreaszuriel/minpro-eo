import { JSX, useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileModal from '@/components/atoms/ProfileModal';
import { Eye, EyeOff, Copy, Loader2, BadgeAlert } from 'lucide-react';
import Link from 'next/link';

interface DashboardLayoutProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
    role: 'customer' | 'organizer';
    referralCode?: string | null;
    image?: string | null;
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
    email: user.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showEmail, setShowEmail] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOrganizer = user.role === 'organizer';

  // Authentication check moved to Dashboard Layout
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2 text-lg font-medium text-black">Loading...</span>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-6 text-center border border-red-200">
          <BadgeAlert className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">Authentication Required</h2>
          <p className="mt-2 text-gray-600">Please sign in to view this dashboard.</p>
          <Button className="mt-4" asChild><Link href="/auth/signin">Sign In</Link></Button>
        </div>
      </div>
    );
  }

  // Authorization check - ensure user is viewing their own dashboard
  if (session.user.id !== user.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-6 text-center border border-red-200">
          <BadgeAlert className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">Unauthorized</h2>
          <p className="mt-2 text-gray-600">You don't have permission to view this dashboard.</p>
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
    if (profileData.newPassword && (profileData.newPassword !== profileData.confirmPassword || !profileData.currentPassword)) {
      alert(profileData.newPassword !== profileData.confirmPassword ? "New passwords don't match!" : "Please enter your current password.");
      return;
    }
    
    setLoading(true);
    
    const payload = {
      name: profileData.name,
      ...(profileData.newPassword && { currentPassword: profileData.currentPassword, newPassword: profileData.newPassword }),
    };
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to update profile');
      }

      setIsProfileModalOpen(false);
      setProfileData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));

      // Update the session if the update function exists
      if (typeof update === 'function') {
        await update();
      }

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (user.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center">
            {user.image ? (
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary-600">
                <Image src={user.image} alt={user.name || 'Profile'} width={96} height={96} className="object-cover w-full h-full" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-600">
                <span className="text-4xl font-bold text-primary-600">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
            {session?.user?.id === user.id && (
              <Button
                variant="default"
                size="sm"
                className="mt-4 bg-primary-400 text-white hover:bg-secondary-500 transition-colors duration-200 cursor-pointer"
                onClick={() => setIsProfileModalOpen(true)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Edit Profile"
                )}
              </Button>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary-700">{user.name}</h1>
            <div className="mt-2 space-y-1">
              <p className="text-gray-600 font-medium">{isOrganizer ? 'Event Organizer' : 'Customer'}</p>
              <p className="text-gray-600 text-sm">
                Member since: {format(new Date(user.createdAt), 'MMMM d, yyyy')}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-gray-600 text-sm">
                  {showEmail ? user.email : user.email.replace(/(.{2})(.*)(@.*)/, '$1****$3')}
                </p>
                <button
                  onClick={() => setShowEmail(!showEmail)}
                  className="text-gray-500 hover:text-primary-600"
                >
                  {showEmail ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          {isOrganizer && user.referralCode && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-w-[250px]">
              <h3 className="text-lg font-bold text-gray-800">Referral Code</h3>
              <div className="mt-2 flex items-center">
                <code className="bg-primary-400 px-3 py-1 rounded border border-gray-300 flex-1">
                  {user.referralCode}
                </code>
                <button
                  onClick={copyReferralCode}
                  className="ml-2 p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <span className="text-green-600 text-xs font-medium">Copied!</span>
                  ) : (
                    <Copy className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          )}
          <div className="self-center">{actionButton}</div>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid w-full md:w-auto grid-cols-2 md:grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-black hover:text-primary-400 transition-colors duration-200 cursor-pointer"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {renderTabContent(activeTab)}
      </Tabs>
      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profileData={profileData}
          handleProfileChange={handleProfileChange}
          updateProfile={updateProfile}
        />
      )}
    </div>
  );
}
"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation"; 
import { useEffect, useState } from "react";
import { Loader2, BadgeAlert } from "lucide-react"; 
import CustomerDashboard from "@/components/molecules/CustomerDashboard";
import OrganizerDashboard from "@/components/molecules/OrganizerDashboard";
import { Button } from "@/components/ui/button"; 
import Link from "next/link";

interface PointsData {
  totalPoints: number;
  nextExpiration?: string | null;
}

interface CouponData {
  id: number; // Or string
  code: string;
  expiresAt: string;
}

// Update CompleteUser type
type CompleteUser = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  role: "customer" | "organizer";
  referralCode?: string | null;
  image?: string | null;
  isAdmin: boolean; 
  pointsData?: PointsData | null;
  couponsData?: CouponData[] | null;
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter(); 
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<CompleteUser | null>(null);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    // Initial check: If session is loaded but user is not authenticated, redirect
    if (status === 'unauthenticated') {
      router.push('/auth/signin'); // Redirect to signin page
      return; // Stop further execution
    }

    // Fetch data only if session is authenticated and userId is available
    if (status === 'authenticated' && userId) {
      setLoading(true); // Set loading true when fetch starts
      setError(null); // Reset error

      const fetchUserData = async () => {
        // Check if the session user ID matches the requested user ID
        if (session.user?.id !== userId) {
          setError("You are not authorized to view this dashboard.");
          setLoading(false);
          // Optional: Redirect to their own dashboard
          // router.push(`/dashboard/${session.user.id}`);
          return;
        }

        try {
          const response = await fetch(`/api/user/${userId}`);

          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              setError("Authorization failed. You cannot view this data.");
            } else if (response.status === 404) {
              setError("User profile not found.");
            } else {
               const errorData = await response.json().catch(() => ({ message: 'An unknown server error occurred.' }));
               setError(`Failed to load profile: ${errorData.message || response.statusText}`);
            }
            setUserData(null); // Clear user data on error
          } else {
            const data: CompleteUser = await response.json();
            setUserData(data);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError("An unexpected error occurred while fetching user data.");
          setUserData(null); // Clear user data on error
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    } else if (status === 'loading') {
        // If session status is still loading, keep the page loading state
        setLoading(true);
    }
  }, [userId, status, session, router]); // Add router to dependencies

  // --- Loading State ---
  if (loading || status === 'loading') { // Show loading if component is loading OR session is loading
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2 text-lg">Loading Dashboard...</span>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="container mx-auto px-4 py-8">
           <div className="rounded-lg bg-red-50 p-6 text-center border border-red-200 max-w-md mx-auto">
              <BadgeAlert className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-4 text-xl font-bold text-gray-900">Access Denied</h2>
              <p className="mt-2 text-gray-600">{error}</p>
              {/* Link to their own dashboard if possible and makes sense */}
              {session?.user?.id && session.user.id !== userId && (
                  <Button className="mt-4" asChild>
                      <Link href={`/dashboard/${session.user.id}`}>Go to Your Dashboard</Link>
                  </Button>
              )}
              {/* Or a generic sign-in link if the error is authentication-related */}
               {!session?.user?.id && (
                   <Button className="mt-4" asChild>
                       <Link href="/auth/signin">Sign In</Link>
                   </Button>
               )}
           </div>
        </div>
      </div>
    );
  }

  // --- User Not Found State ---
  // This state might be covered by the error handling above if the API returns 404
  if (!userData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Not Found</h1>
          <p className="mt-2 text-gray-600">Could not find the requested user profile.</p>
        </div>
      </div>
    );
  }

  // --- Render Dashboard based on Role ---
  return (
    <div className="min-h-screen bg-gray-50 pt-20 md:pt-24"> 
        {userData.role === "customer" ? (
          <CustomerDashboard user={userData} /> // Pass the full userData
        ) : userData.role === "organizer" ? (
          <OrganizerDashboard user={userData} /> // Pass the full userData
        ) : (
          <div className="container mx-auto px-4 py-8"> 
            <div className="rounded-lg bg-white p-6 shadow-md max-w-md mx-auto text-center">
                <h1 className="text-xl font-semibold text-gray-800">Unknown Role</h1>
                <p className="mt-2 text-gray-600">Your user role is not recognized.</p>
            </div>
          </div>
        )}
    </div>
  );
}
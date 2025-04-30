"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, Home, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import OrganizerManagement from "@/components/admin/ManageOrganizers";
import GenreManagement from "@/components/admin/ManageGenres";
import CountryManagement from "@/components/admin/ManageCountries";


export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  const handleReturnHome = () => {
    setIsRedirecting(true);
    setTimeout(() => {
      router.push("/");
    }, 300);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

   const isAdmin = status === "authenticated" && session?.user?.isAdmin === true;
   const userRole = session?.user?.role; 
   const userEmail = session?.user?.email; 


  useEffect(() => {
    if (status === "authenticated" && !isAdmin) {
      setIsRedirecting(true);
      const timer = setTimeout(() => {
        router.push("/");
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (status === "unauthenticated") {
        setIsRedirecting(false);
    }
  }, [status, isAdmin, router]);

  // --- Loading State ---
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary-600" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">Verifying Access...</h2>
        </div>
      </div>
    );
  }

  // --- Unauthorized State ---
  if (status === "unauthenticated" || (status === "authenticated" && !isAdmin)) { // Added check for authenticated but not admin
    return (
      <motion.div
        className="flex flex-col items-center justify-center h-screen bg-red-50 p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ShieldAlert className="h-16 w-16 md:h-20 md:w-20 text-red-500 mb-6" />
        <h1 className="text-2xl md:text-3xl font-bold text-red-700 mb-4">Access Denied</h1>
        <p className="text-md md:text-lg text-red-600 max-w-md mb-8">
          {status === 'unauthenticated'
            ? "You must be signed in as an administrator to access this page."
            // Check if redirecting is true for the authenticated but not admin case
            : isRedirecting ? "You are not authorized to view the admin dashboard. Redirecting..." : "You are not authorized to view the admin dashboard."
          }
        </p>
        {/* Show loader only when redirecting for non-admin */}
        {status === 'authenticated' && !isAdmin && isRedirecting && (
             <Loader2 className="h-8 w-8 animate-spin text-red-500 mb-8" />
        )}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center"
        >
           {status === 'authenticated' && !isAdmin ? ( // Authenticated but not admin
                 <Button
                     onClick={handleReturnHome}
                     className="bg-primary-600 hover:bg-primary-700 flex items-center justify-center w-full sm:w-auto"
                     disabled={isRedirecting} // Disable if redirecting
                 >
                     <Home className="mr-2 h-4 w-4" />
                     Return Home Now
                 </Button>
           ) : status === 'unauthenticated' ? ( 
                 <Button onClick={() => router.push('/api/auth/signin')} className="w-full sm:w-auto">
                     Sign In
                 </Button>
           ) : null }

        </motion.div>
      </motion.div>
    );
  }

  // --- Authorized Admin View ---
  // Ensure session is not null 
  if (!session) {
       return (
         <div className="flex items-center justify-center h-screen bg-gray-50">
             <p>Error: Session not found despite being authenticated.</p>
         </div>
        );
   }

  return (
    <motion.div
      className="min-h-screen bg-gray-100 p-4 md:p-8"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 pb-6 border-b border-gray-200">
               <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                   <p className="text-gray-500 mt-1">Manage application settings and data.</p>
               </div>
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium whitespace-nowrap self-start sm:self-center">
                 Admin Access
              </span>
          </div>

          {/* Welcome Message  */}
          <div className="bg-blue-50 border border-blue-200 p-5 rounded-lg mb-8 text-sm md:text-base">
              <h2 className="text-lg md:text-xl font-semibold text-blue-800 mb-2">
                  Welcome, Admin!
              </h2>
              <p className="text-blue-700">
                  Signed in as <span className="font-medium">{userEmail ?? 'N/A'}</span>
                  {/* Display role only if it exists */}
                  {userRole && <> (Role: <span className="font-medium capitalize">{userRole.toLowerCase()}</span>)</>}.
              </p>
              <p className="text-blue-600 mt-1">Use the sections below to manage organizers, genres, and countries.</p>
          </div>

          {/* Management Sections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <OrganizerManagement />
              <GenreManagement />
              <CountryManagement />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row justify-end items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-10 pt-6 border-t border-gray-200">
              <Button
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="w-full sm:w-auto flex items-center justify-center"
              >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Homepage
              </Button>
              <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  className="w-full sm:w-auto flex items-center justify-center"
              >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
              </Button>
          </div>
          </div>
      </div>
    </motion.div>
  );
}
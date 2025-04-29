"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, Home, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);

  // Redirect to homepage when access denied button is clicked
  const handleReturnHome = () => {
    setIsAnimating(true);
    setTimeout(() => {
      router.push("/");
    }, 500);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  // For security, also redirect non-admin users automatically
  useEffect(() => {
    // Only check once the session is loaded (not during loading state)
    if (status === "authenticated" && !session?.user?.isAdmin) {
      // Add a small delay to show the access denied message first
      const timer = setTimeout(() => {
        router.push("/");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, session, router]);
  
  // Handling loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary-600" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">Loading...</h2>
        </div>
      </div>
    );
  }
  
  // Access denied view
  if (status === "authenticated" && !session?.user?.isAdmin) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-screen bg-red-50 p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <ShieldAlert className="h-20 w-20 text-red-500 mb-6" />
        <h1 className="text-3xl font-bold text-red-700 mb-4">Access Denied</h1>
        <p className="text-lg text-center max-w-md mb-8">
          You are not authorized to access the admin dashboard. This area is restricted to administrators only.
        </p>
        <motion.div
          whileHover={{ scale: isAnimating ? 1 : 1.05 }}
          whileTap={{ scale: isAnimating ? 1 : 0.95 }}
        >
          <Button 
            onClick={handleReturnHome}
            className="bg-primary-600 hover:bg-primary-700 flex items-center"
            disabled={isAnimating}
          >
            {isAnimating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <Home className="mr-2 h-4 w-4" />
                Return to Homepage
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    );
  }
  
  // Admin dashboard view
  return (
    <motion.div 
      className="min-h-screen bg-gray-50 p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Admin Access
            </span>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">
              Hello, Admin!
            </h2>
            <p className="text-blue-700">
              Welcome to your administrator control panel. You are signed in as{" "}
              <span className="font-semibold">{session?.user?.email}</span> with role{" "}
              <span className="font-semibold">{session?.user?.role}</span>.
            </p>
          </div>
          
          {/* Admin stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-indigo-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">Users</h3>
              <p className="text-3xl font-bold text-indigo-700">120</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Events</h3>
              <p className="text-3xl font-bold text-purple-700">24</p>
            </div>
            <div className="bg-pink-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-pink-900 mb-2">Revenue</h3>
              <p className="text-3xl font-bold text-pink-700">$5,280</p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
  <Button 
    onClick={() => router.push("/")}
    variant="outline" 
    className="text-white bg-primary-500 flex items-center"
  >
    <Home className="text-white mr-2 h-4 w-4" />
    Go to Homepage
  </Button>
  
  <Button 
    onClick={handleSignOut}
    variant="destructive" 
    className=" text-white bg-red-500 flex items-center"
  >
    <LogOut className="bg-primary 600 text-white mr-2 h-4 w-4" />
    Sign Out
  </Button>
</div>
        </div>
      </div>
    </motion.div>
  );
}
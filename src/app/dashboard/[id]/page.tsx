"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import CustomerDashboard from "@/components/molecules/CustomerDashboard";
import OrganizerDashboard from "@/components/molecules/OrganizerDashboard";

type CompleteUser = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  role: "customer" | "organizer";
  referralCode?: string | null;
  image?: string | null;
};

export default function Dashboard() {
  const { data: session, status, update } = useSession(); 
  const params = useParams();
  const userId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<CompleteUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); 

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/user/${userId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("User not found");
          } else {
            setError("Something went wrong");
          }
          setLoading(false);
          return;
        }
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId, refreshKey, session?.user]); 

  // Listen for session changes to trigger refresh
  useEffect(() => {
    if (session?.user) {
      setRefreshKey((prev) => prev + 1); 
    }
  }, [session?.user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Not Found</h1>
          <p className="mt-2 text-gray-600">Could not find the requested dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4">
        {userData.role === "customer" ? (
          <CustomerDashboard user={userData} />
        ) : userData.role === "organizer" ? (
          <OrganizerDashboard user={userData} />
        ) : (
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h1 className="text-xl font-semibold text-gray-800">Unknown Role</h1>
            <p className="mt-2 text-gray-600">Your user role is not recognized.</p>
          </div>
        )}
      </div>
    </div>
  );
}
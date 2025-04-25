"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import CustomerDashboard from "@/components/molecules/CustomerDashboard";
import OrganizerDashboard from "@/components/molecules/OrganizerDashboard";


export default function Dashboard() {
  const { data: session, status } = useSession();
  const params = useParams();
  const userId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Only check authorization once session is loaded
    if (status === "loading") return;
    
    if (session?.user?.id === userId) {
      setAuthorized(true);
    }
    
    setLoading(false);
  }, [session, status, userId]);

  // Show loading state
  if (loading || status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Show unauthorized message
  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
          <p className="mt-2 text-gray-600">You don't have permission to view this dashboard.</p>
        </div>
      </div>
    );
  }

  // Render different dashboard based on role
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4">
        {session?.user?.role === "customer" ? (
          <CustomerDashboard user={session.user} />
        ) : session?.user?.role === "organizer" ? (
          <OrganizerDashboard user={session.user} />
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
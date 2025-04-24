// app/dashboard/components/OrganizerDashboard.tsx
"use client";

import { User } from "next-auth";

interface OrganizerDashboardProps {
  user: User;
}

export default function OrganizerDashboard({ user }: OrganizerDashboardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-primary-700">Welcome to Organizer Dashboard</h1>
        <p className="mt-2 text-gray-600">Hello, {user.name || "Organizer"}!</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-green-50 p-4">
          <h2 className="font-medium text-green-700">Your Events</h2>
          <p className="mt-2 text-sm text-green-600">Manage your concerts and events.</p>
        </div>
        
        <div className="rounded-lg bg-amber-50 p-4">
          <h2 className="font-medium text-amber-700">Analytics</h2>
          <p className="mt-2 text-sm text-amber-600">View ticket sales and performance metrics.</p>
        </div>
      </div>
    </div>
  );
}
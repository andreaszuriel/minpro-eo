"use client";

import { User } from "next-auth";

interface CustomerDashboardProps {
  user: User;
}

export default function CustomerDashboard({ user }: CustomerDashboardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-primary-700">Welcome to Customer Dashboard</h1>
        <p className="mt-2 text-gray-600">Hello, {user.name || "Customer"}!</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-blue-50 p-4">
          <h2 className="font-medium text-blue-700">Your Tickets</h2>
          <p className="mt-2 text-sm text-blue-600">View your upcoming events and tickets.</p>
        </div>
        
        <div className="rounded-lg bg-purple-50 p-4">
          <h2 className="font-medium text-purple-700">Your Reviews</h2>
          <p className="mt-2 text-sm text-purple-600">See all your concert reviews.</p>
        </div>
      </div>
    </div>
  );
}
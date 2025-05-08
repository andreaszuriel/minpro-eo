"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ShieldAlert,
  Home,
  LogOut,
  Settings,
  User,
  Music,
  Globe,
  Bell,
  BarChart3,
  Calendar,
  Users,
  HelpCircle,
  ChevronRight,
  LucideIcon
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import OrganizerManagement from "@/components/admin/ManageOrganizers";
import GenreManagement from "@/components/admin/ManageGenres";
import CountryManagement from "@/components/admin/ManageCountries";
import EventManagement from "@/components/admin/EventManagement"; 
import UserManagement from "@/components/admin/ManageUsers";



interface StatCardProps { 
  icon: LucideIcon;
  title: string;
  value: string;
  trend?: number;
  color: string;
}

function StatCard({ icon, title, value, trend, color }: StatCardProps) { 
  const Icon = icon;
  const bgColorClass = `bg-${color}-50`;
  const iconColorClass = `text-${color}-600`;
  const borderColorClass = `border-${color}-200`;

  return (
    <div className={`p-5 rounded-xl border ${borderColorClass} ${bgColorClass}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-white/70 ${iconColorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? `+${trend}%` : `${trend}%`}
          </span>
        )}
      </div>
      <h4 className="text-gray-700 text-sm mb-1">{title}</h4>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

interface QuickActionButtonProps { 
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  color?: string;
}

function QuickActionButton({ icon, label, onClick, color = "primary" }: QuickActionButtonProps) { // Keep this component
  const Icon = icon;
  const bgClass = `bg-${color}-600 hover:bg-${color}-700`;

  return (
    <Button
      onClick={onClick}
      className={`${bgClass} text-white shadow-lg shadow-${color}-500/20 w-full text-sm`}
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

interface NavItemProps { 
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  const Icon = icon;

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors ${
        active
          ? 'bg-primary-100 text-primary-700 font-medium'
          : 'hover:bg-gray-100 text-gray-700'
      }`}
    >
      <div className="flex items-center">
        <Icon className={`h-5 w-5 mr-3 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
        <span>{label}</span>
      </div>
      {active && <ChevronRight className="h-4 w-4 text-primary-600" />}
    </button>
  );
}


type AdminTabType = "overview" | "organizers" | "genres" | "countries" | "events" | "users";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AdminTabType>("overview");

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
  const userName = session?.user?.name || (userEmail ? userEmail.split('@')[0] : "Admin User");

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
       <div className="flex items-center justify-center h-screen bg-slate-50">
         <div className="text-center">
           <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary-600" />
           <h2 className="mt-4 text-xl font-semibold text-gray-700">Verifying Access...</h2>
           <p className="mt-2 text-gray-500">Please wait while we check your credentials</p>
         </div>
       </div>
     );
  }

  // --- Unauthorized State ---
  if (status === "unauthenticated" || (status === "authenticated" && !isAdmin)) {
     return (
       <motion.div
         className="flex flex-col items-center justify-center h-screen bg-red-50 p-6 text-center"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         transition={{ duration: 0.3 }}
       >
         <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
           <ShieldAlert className="h-16 w-16 text-red-500 mb-6 mx-auto" />
           <h1 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h1>
           <p className="text-md text-red-600 mb-8">
             {status === 'unauthenticated'
               ? "You must be signed in as an administrator to access this page."
               : isRedirecting ? "You are not authorized to view the admin dashboard. Redirecting..." : "You are not authorized to view the admin dashboard."
             }
           </p>

           {status === 'authenticated' && !isAdmin && isRedirecting && (
             <Loader2 className="h-8 w-8 animate-spin text-red-500 mb-8 mx-auto" />
           )}

           <motion.div className="flex flex-col gap-4 w-full justify-center">
             {status === 'authenticated' && !isAdmin ? (
               <Button
                 onClick={handleReturnHome}
                 className="bg-primary-600 hover:bg-primary-700 flex items-center justify-center w-full"
                 disabled={isRedirecting}
               >
                 <Home className="mr-2 h-4 w-4" />
                 Return Home Now
               </Button>
             ) : status === 'unauthenticated' ? (
               <Button
                 onClick={() => router.push('/api/auth/signin')}
                 className="w-full bg-primary-600 hover:bg-primary-700"
               >
                 Sign In
               </Button>
             ) : null}
           </motion.div>
         </div>
       </motion.div>
     );
  }

  // --- Authorized Admin View ---
  if (!session) {
     return (
       <div className="flex items-center justify-center h-screen bg-slate-50">
         <p>Error: Session not found despite being authenticated.</p>
       </div>
     );
  }

  return (
    <motion.div
      className="min-h-screen bg-slate-50"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 bg-white border-r border-gray-200 lg:min-h-screen p-5">
           <div className="flex items-center space-x-3 mb-8">
             <div className="bg-primary-600 rounded-lg p-2">
               <Settings className="h-6 w-6 text-white" />
             </div>
             <div>
               <h2 className="font-bold text-gray-800">Admin Portal</h2>
               <p className="text-xs text-gray-500">Management Console</p>
             </div>
           </div>
           <div className="flex items-center p-3 bg-gray-50 rounded-xl mb-6">
             <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
               {userName.charAt(0).toUpperCase()}
             </div>
             <div className="ml-3 overflow-hidden">
               <p className="font-medium text-sm text-gray-900 truncate">{userName}</p>
               <p className="text-xs text-gray-500 truncate">{userEmail}</p>
             </div>
           </div>

          {/* Navigation Menu */}
          <nav className="space-y-1 mb-6">
            <NavItem
              icon={BarChart3}
              label="Dashboard Overview"
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            />
            <NavItem
              icon={Users}
              label="Organizer Management"
              active={activeTab === "organizers"}
              onClick={() => setActiveTab("organizers")}
            />
            <NavItem
              icon={Music}
              label="Genre Management"
              active={activeTab === "genres"}
              onClick={() => setActiveTab("genres")}
            />
            <NavItem
              icon={Globe}
              label="Country Management"
              active={activeTab === "countries"}
              onClick={() => setActiveTab("countries")}
            />
            {/* Ensure this NavItem correctly sets the activeTab */}
            <NavItem
              icon={Calendar}
              label="Event Settings"
              active={activeTab === "events"}
              onClick={() => setActiveTab("events")}
            />
            <NavItem
              icon={User}
              label="User Management"
              active={activeTab === "users"}
              onClick={() => setActiveTab("users")}
            />
          </nav>

          {/* Help & Logout */}
           <div className="pt-6 mt-6 border-t border-gray-200 space-y-3">
             <button className="flex items-center text-gray-600 hover:text-gray-800 w-full">
               <HelpCircle className="h-5 w-5 mr-3 text-gray-500" />
               <span className="text-sm">Help & Documentation</span>
             </button>
             <Button
               onClick={handleSignOut}
               variant="destructive"
               className="w-full flex items-center justify-center"
             >
               <LogOut className="mr-2 h-4 w-4" />
               Sign Out
             </Button>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-5 lg:p-8">
          {/* Page Header */}
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
             <div>
               <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
               <p className="text-gray-500">Welcome back, {userName}! Here's what's happening.</p>
             </div>
             <div className="mt-4 sm:mt-0">
               <Button
                 onClick={() => router.push("/")}
                 variant="outline"
                 className="flex items-center justify-center"
               >
                 <Home className="mr-2 h-4 w-4" />
                 Go to Homepage
               </Button>
             </div>
           </div>

          {/* Alert/Notification Banner */}
           <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6 flex items-start">
             <Bell className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0 mt-0.5" />
             <div>
               <h4 className="font-medium text-blue-800 mb-1">Welcome to the New Admin Dashboard</h4>
               <p className="text-sm text-blue-700">
                 We've updated the management interface with new features and an improved layout.
                 Explore the sidebar for all available management options.
               </p>
             </div>
           </div>

          {/* Stats Overview */}
          {activeTab === "overview" && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
               <StatCard icon={Calendar} title="Total Events" value="128" trend={5.2} color="primary" />
               <StatCard icon={Users} title="Registered Users" value="2,845" trend={12.8} color="secondary" />
               <StatCard icon={Globe} title="Countries" value="42" trend={0} color="emerald" />
               <StatCard icon={Music} title="Genres" value="18" trend={2.3} color="amber" />
             </div>
          )}

          {/* Quick Actions */}
          {activeTab === "overview" && (
             <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-8">
               <h3 className="text-gray-800 font-medium text-lg mb-4">Quick Actions</h3>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <QuickActionButton icon={Calendar} label="Manage Events" onClick={() =>  setActiveTab("events")}  color="primary" />
                 <QuickActionButton icon={Users} label="Manage Organizer" onClick={() => setActiveTab("organizers")}  color="secondary" />
                 <QuickActionButton icon={Globe} label="Manage Countries" onClick={() => setActiveTab("countries")} color="tertiary" />
                 <QuickActionButton icon={Music} label="Manage Genre" onClick={() => setActiveTab("genres")} color="primary" />
                 <QuickActionButton icon={User} label="Manage User" onClick={() => setActiveTab("users")} color="secondary" />
               </div>
             </div>
          )}

          {/* --- Management Components --- */}
          {/* Render based on activeTab */}
          {activeTab === "organizers" && <OrganizerManagement />}
          {activeTab === "genres" && <GenreManagement />}
          {activeTab === "countries" && <CountryManagement />}
          {activeTab === "events" && <EventManagement />}
          {activeTab === "users" && <UserManagement />}

          {/* Footer */}
           <div className="mt-auto pt-8">
             <div className="bg-white p-4 rounded-xl border border-gray-200 text-center text-sm text-gray-500">
               © {new Date().getFullYear()} Event Management Portal • Admin Version 2.0
             </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
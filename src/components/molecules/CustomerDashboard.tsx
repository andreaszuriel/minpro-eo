"use client";

import { JSX, useState, useEffect } from 'react'; 
import DashboardLayout from '@/components/atoms/DashboardLayout';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, Search } from 'lucide-react'; 
import CustomerTickets from '../atoms/Customers/DashboardTickets';
import CustomerDashboardOverview from '@/components/atoms/Customers/DashboardOverview'; 
import CustomerEventList from '../atoms/Customers/DashboardEvents';
import type { CustomerStats, CustomerUpcomingEvent, DashboardUser } from '@/types/customerDashboard'; 


interface CustomerDashboardProps {
  user: DashboardUser;
}

// Define the tabs for the customer dashboard
const customerTabs = [
  { value: 'overview', label: 'Overview' }, 
  { value: 'events', label: 'My Events' },
  { value: 'tickets', label: 'My Tickets' }, 
];

export default function CustomerDashboard({ user }: CustomerDashboardProps) {
  const [overviewData, setOverviewData] = useState<{ stats: CustomerStats; upcomingEvents: CustomerUpcomingEvent[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverviewData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // --- API Call ---
        const response = await fetch(`/api/user/${user.id}/overview`);
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard overview data');
        }
        const data = await response.json();
        // --- Data Validation  ---
        if (!data || !data.stats || !data.upcomingEvents) {
             throw new Error('Invalid data format received from API');
        }
        setOverviewData(data);
      } catch (err) {
        console.error("Error fetching customer overview:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setOverviewData(null); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverviewData();
  }, [user.id]);

  // Function to render content based on the active tab
  const renderCustomerTabContent = (activeTab: string): JSX.Element | null => {
    switch (activeTab) {
      case 'overview':
        return (
          <TabsContent value="overview">
            {isLoading && (
              <div className="flex justify-center items-center p-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500 mr-2" />
                <span>Loading overview...</span>
              </div>
            )}
            {error && (
               <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-red-700">
                 Error: {error}
               </div>
            )}
            {!isLoading && !error && overviewData && (
              <CustomerDashboardOverview
                stats={overviewData.stats}
                upcomingEvents={overviewData.upcomingEvents}
                userId={user.id}
                userName={user.name}
              />
            )}
             {!isLoading && !error && !overviewData && (
               <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200 text-yellow-700">
                 Could not load overview data.
               </div>
             )}
          </TabsContent>
        );
      case 'tickets':
        return (
          <TabsContent value="tickets">
          <CustomerTickets userId={user.id} />
        </TabsContent>
        );
      case 'events': 
        return (
          <TabsContent value="events">
            <CustomerEventList userId={user.id} />
          </TabsContent>
        );
      default:
        return null; // Or redirect to 'overview'
    }
  };

  // Define an optional action button for the customer
  const customerActionButton = (
      <Button asChild size="sm" className="bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-primary-600 hover:to-primary-700 text-white">
          <Link href="/events"><Search className="h-4 w-4 mr-1.5"/>Find Events</Link>
      </Button>
  );

  return (
    <DashboardLayout
      user={user}
      tabs={customerTabs}
      renderTabContent={renderCustomerTabContent}
      actionButton={customerActionButton}
    />
  );
}
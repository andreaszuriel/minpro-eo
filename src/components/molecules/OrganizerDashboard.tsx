'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Calendar, BarChart3, ListChecks, PieChart, Plus,
  Loader2, ChartArea,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import type { Event, Transaction, TransactionStatus, Genre, Country } from '@prisma/client';
import DashboardLayout from '@/components/atoms/DashboardLayout';
import { User } from "next-auth";
import EventsTab from '@/components/atoms/Organizers/DashboardEvents';
import DashboardTransactions, { ExtendedTransaction } from '@/components/atoms/Organizers/DashboardTransactions';
import DashboardOverview from '@/components/atoms/Organizers/DashboardOverview'; 
import DashboardStats from '@/components/atoms/Organizers/DashboardStats'; 

// --- Interfaces  ---
// TODO: Move these interfaces to a separate file (e.g., @/types/dashboard.ts) for better organization
export interface OrganizerDashboardProps {
  user: User & {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
    role: 'customer' | 'organizer';
    referralCode?: string | null;
    image?: string | null;
    isAdmin: boolean;
  };
}

export type ExtendedEvent = Omit<Event, 'genreId' | 'countryId'> & {
  genre: Genre;
  country: Country;
  soldSeats: number;
  totalRevenue: number;
  averageRating: number | null;
};

export type FetchedEvent = Event & {
  genre: Genre;
  country: Country;
};

export type StatSummary = {
  totalEvents: number;
  totalTransactions: number;
  totalRevenue: number;
  totalSeats: number;
  soldSeats: number;
};

export type SalesData = { date: string; sales: number; revenue: number }[];
export type StatusDistribution = { name: string; value: number }[];
export type EventPerformanceData = { name: string; revenue: number; ticketsSold: number }[];
export type { TransactionStatus };

// --- Utility functions specific to dashboard data processing ---

function processEvents(fetchedEvents: FetchedEvent[], transactions: ExtendedTransaction[]): ExtendedEvent[] {
    return fetchedEvents.map(event => {
        const eventTransactions = transactions.filter(t => t.eventId === event.id && t.status === 'PAID');
        const soldSeats = eventTransactions.reduce((sum, t) => sum + t.ticketQuantity, 0);
        const totalRevenue = eventTransactions.reduce((sum, t) => sum + t.finalPrice, 0);
        const averageRating = event.averageRating ?? null;
        return { ...event, soldSeats, totalRevenue, averageRating };
    });
}

function calculateStatistics(events: ExtendedEvent[], transactions: ExtendedTransaction[]): StatSummary {
    return {
        totalEvents: events.length,
        totalTransactions: transactions.length,
        totalRevenue: transactions.filter(t => t.status === 'PAID').reduce((sum, t) => sum + t.finalPrice, 0),
        totalSeats: events.reduce((sum, e) => sum + e.seats, 0),
        soldSeats: events.reduce((sum, e) => sum + (e.soldSeats || 0), 0),
    };
}

function getSalesData(transactions: ExtendedTransaction[], timeRange: string): SalesData {
  const formats = {
    year: { groupBy: 'yyyy-MM', display: 'MMM yyyy' },
    month: { groupBy: 'yyyy-MM-dd', display: 'd MMM' },
    week: { groupBy: 'yyyy-MM-dd', display: 'EEE' },
  };
  const { groupBy, display } = formats[timeRange as keyof typeof formats] || formats.month;
  const grouped: { [key: string]: { sales: number; revenue: number } } = {};
  const endDate = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      startDate.setDate(1); // Start from beginning of the month one year ago
      break;
    case 'month':
      startDate.setMonth(endDate.getMonth() - 1);
      startDate.setDate(1); // Start from beginning of the previous month
      break;
    case 'week':
      startDate.setDate(endDate.getDate() - 6); // Last 7 days including today
      break;
    default: // Default to month
      startDate.setMonth(endDate.getMonth() - 1);
      startDate.setDate(1);
  }
   startDate.setHours(0, 0, 0, 0); // Start of the day

  transactions.forEach(t => {
    const transactionDate = new Date(t.createdAt);
    // Filter transactions within the selected time range and that are PAID
    if (t.status === 'PAID' && transactionDate >= startDate && transactionDate <= endDate) {
      const dateKey = format(transactionDate, groupBy);
      grouped[dateKey] = grouped[dateKey] || { sales: 0, revenue: 0 };
      grouped[dateKey].sales += t.ticketQuantity;
      grouped[dateKey].revenue += t.finalPrice;
    }
  });

  // Create entries for all dates/months/weeks in the range, even if no sales
  const allDateEntries: { dateKey: string; displayDate: string; sales: number; revenue: number }[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
      const dateKey = format(currentDate, groupBy);
      const displayDate = format(currentDate, display);
      // Check if its already processed this key to avoid duplicates when groupBy isn't daily
      if (!allDateEntries.some(entry => entry.dateKey === dateKey)) {
         const data = grouped[dateKey] || { sales: 0, revenue: 0 };
         allDateEntries.push({ dateKey, displayDate, sales: data.sales, revenue: data.revenue });
      }
      // Increment date based on the time range
      if (timeRange === 'year') {
          currentDate.setMonth(currentDate.getMonth() + 1); // Move to next month
      } else {
          currentDate.setDate(currentDate.getDate() + 1); // Move to next day for week/month display
      }
  }

  if (timeRange === 'year') {
       const monthlyEntries: { [key: string]: { displayDate: string; sales: number; revenue: number } } = {};
       let loopDate = new Date(startDate);
       while (loopDate <= endDate) {
          const monthKey = format(loopDate, groupBy); 
          const displayMonth = format(loopDate, display); 
          if (!monthlyEntries[monthKey]) {
              monthlyEntries[monthKey] = { displayDate: displayMonth, sales: 0, revenue: 0 };
          }
          // Find matching processed data and aggregate
           if (grouped[monthKey]) {
               monthlyEntries[monthKey].sales = grouped[monthKey].sales;
               monthlyEntries[monthKey].revenue = grouped[monthKey].revenue;
           }
           loopDate.setMonth(loopDate.getMonth() + 1); // Increment month
           loopDate.setDate(1); // Go to the first day of the next month
       }
        return Object.entries(monthlyEntries)
           .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()) // Sort by 'yyyy-MM' key
           .map(([_, data]) => ({ date: data.displayDate, sales: data.sales, revenue: data.revenue }));
  }

 // For week/month range (daily granularity)
 return allDateEntries
          .sort((a, b) => new Date(format(new Date(a.dateKey), 'yyyy-MM-dd')).getTime() - new Date(format(new Date(b.dateKey), 'yyyy-MM-dd')).getTime()) // Ensure correct sorting by actual date
          .map(({ displayDate, sales, revenue }) => ({ date: displayDate, sales, revenue }));
}


function getStatusDistribution(transactions: ExtendedTransaction[]): StatusDistribution {
    const statusCounts: Record<TransactionStatus, number> = { PENDING: 0, WAITING_ADMIN: 0, PAID: 0, EXPIRED: 0, CANCELED: 0 };
    transactions.forEach(t => {
      // Ensure status exists in the map before incrementing
      if (statusCounts.hasOwnProperty(t.status)) {
         statusCounts[t.status]++;
      }
    });
    return Object.entries(statusCounts).map(([status, value]) => ({ name: formatStatus(status as TransactionStatus), value }));
}

function getEventPerformanceData(events: ExtendedEvent[]): EventPerformanceData {
    return events
        .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
        .slice(0, 5)
        .map(event => ({
            name: event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title,
            revenue: event.totalRevenue || 0,
            ticketsSold: event.soldSeats || 0,
        }));
}

// Keep formatStatus and getStatusBadge here as they are passed as props to DashboardTransactions
function formatStatus(status: TransactionStatus): string {
  const statusMap: Record<TransactionStatus, string> = {
    PENDING: 'Pending',
    WAITING_ADMIN: 'Waiting Approval',
    PAID: 'Paid',
    EXPIRED: 'Expired',
    CANCELED: 'Canceled',
  };
  return statusMap[status] || status;
}

function getStatusBadge(status: TransactionStatus) {
  const badgeStyles: Record<TransactionStatus, string> = {
    PENDING: 'bg-blue-50 text-blue-600 border-blue-200',
    WAITING_ADMIN: 'bg-amber-50 text-amber-600 border-amber-200',
    PAID: 'bg-green-50 text-green-600 border-green-200',
    EXPIRED: 'bg-gray-50 text-gray-600 border-gray-200',
    CANCELED: 'bg-red-50 text-red-600 border-red-200',
  };
  const style = badgeStyles[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  return <Badge variant="outline" className={`${style} whitespace-nowrap`}>{formatStatus(status)}</Badge>;
}


// --- Main Component ---
export default function OrganizerDashboard({ user }: OrganizerDashboardProps) {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<ExtendedEvent[]>([]);
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); 

  // Define Tabs for Organizer
  const tabs = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'events', label: 'My Events', icon: Calendar },
    { value: 'transactions', label: 'Transactions', icon: ListChecks },
    { value: 'statistics', label: 'Statistics', icon: ChartArea },
  ];

  // Define Action Button for Organizer
  const actionButton = user?.id ? ( // Ensure user.id exists before creating link
    <Link href={`/organizer/events/${user.id}/create`} passHref>
      <Button className="bg-secondary-600 hover:bg-primary-500 cursor-pointer">
        <Plus className="mr-2 h-5 w-5" />Create New Event
      </Button>
    </Link>
  ) : null; // Render nothing if user.id is not available yet

  // Fetch Data specific to Organizer
  useEffect(() => {
    // Use authenticated user ID preferentially, fallback to session if needed (though should be same)
    const userId = user?.id || session?.user?.id;
    if (status === 'authenticated' && userId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // Construct API URLs correctly
          const eventsUrl = `/api/events?userId=${userId}`;
          const transactionsUrl = `/api/transactions?userId=${userId}`; 

          const [eventsRes, transactionsRes] = await Promise.all([
            fetch(eventsUrl).then(res => {
              if (!res.ok) throw new Error(`Event fetch failed (${res.status}): ${res.statusText}`);
              return res.json();
            }),
            fetch(transactionsUrl).then(res => {
               if (!res.ok) throw new Error(`Transaction fetch failed (${res.status}): ${res.statusText}`);
               return res.json();
            }),
          ]);

          // Add checks for expected data structure
          const fetchedEvents: FetchedEvent[] = eventsRes?.events || [];
          const fetchedTransactions: ExtendedTransaction[] = transactionsRes?.transactions || [];

          const processedEvents = processEvents(fetchedEvents, fetchedTransactions);

          setEvents(processedEvents);
          setTransactions(fetchedTransactions);
          // Calculate initial statistics after data is fetched
          setStatistics(calculateStatistics(processedEvents, fetchedTransactions));

        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          // Reset state on error
          setEvents([]);
          setTransactions([]);
          setStatistics({ totalEvents: 0, totalTransactions: 0, totalRevenue: 0, totalSeats: 0, soldSeats: 0 });
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else if (status === 'unauthenticated') {
       console.log("User not authenticated, skipping data fetch.");
      setLoading(false); // Stop loading if not authenticated
       // Optionally redirect or show a login message
    }
  }, [status, user?.id]); // Rerun effect if status or user.id changes


  // State for calculated statistics (initialized)
  const [statistics, setStatistics] = useState<StatSummary>({
    totalEvents: 0, totalTransactions: 0, totalRevenue: 0, totalSeats: 0, soldSeats: 0
  });

  // UseMemo hooks for derived data (pass to child components)
  const salesData = useMemo(() => getSalesData(transactions, timeRange), [transactions, timeRange]);
  const statusDistribution = useMemo(() => getStatusDistribution(transactions), [transactions]);
  const eventPerformanceData = useMemo(() => getEventPerformanceData(events), [events]);
  const upcomingEvents = useMemo(() =>
    events
      .filter(event => new Date(event.startDate) > new Date())
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [events]
  );

  // --- Render Tab Content Function ---
  const renderTabContent = (activeTab: string) => {
    switch (activeTab) {
      case 'overview':
        return (
          <TabsContent value="overview" className="mt-0">
            <DashboardOverview
              statistics={statistics}
              salesData={salesData}
              statusDistribution={statusDistribution}
              upcomingEvents={upcomingEvents}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              userId={user.id} 
            />
          </TabsContent>
        );
      case 'events':
        return (
            <TabsContent value="events" className="mt-0">
                <EventsTab events={events} />
            </TabsContent>
        );
      case 'transactions':
        return (
            <TabsContent value="transactions" className="mt-0">
                <DashboardTransactions
                    initialTransactions={transactions}
                    formatStatus={formatStatus} 
                    getStatusBadge={getStatusBadge} 
                    formatCurrency={formatCurrency} 
                />
            </TabsContent>
        );
      case 'statistics':
        return (
          <TabsContent value="statistics" className="mt-0">
            <DashboardStats
                salesData={salesData}
                statusDistribution={statusDistribution}
                eventPerformanceData={eventPerformanceData}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
            />
          </TabsContent>
        );
      default:
        return null;
    }
  };

  // --- Loading States ---
  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-3 text-lg font-medium text-gray-700">Loading Dashboard...</span>
      </div>
    );
  }

   // --- Unauthenticated State ---
   if (status === 'unauthenticated') {
     // Optional: Redirect to login or show a message
     return (
       <div className="flex h-screen items-center justify-center">
         <p className="text-lg text-gray-600">Please log in to view your dashboard.</p>
         {/* Optionally add a login button */}
       </div>
     );
   }

   // --- Authenticated but no user data yet (edge case) ---
   if (!user?.id) {
     // This might happen briefly if session is authenticated but prop hasn't updated
      return (
       <div className="flex h-screen items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
         <span className="ml-3 text-lg font-medium text-gray-700">Initializing...</span>
       </div>
     );
   }
 // Ensure user object for layout has the expected properties 
   const layoutUser = {
     id: user.id,
     name: user.name ?? 'Organizer', 
     email: user.email ?? '',
     createdAt: user.createdAt,
     role: user.role,
     referralCode: user.referralCode ?? null,
     image: user.image ?? null,
   };

  // --- Render using DashboardLayout ---
  return (
    <DashboardLayout
      user={layoutUser}
      tabs={tabs}
      renderTabContent={renderTabContent}
      actionButton={actionButton || <></>}
    />
  );
}
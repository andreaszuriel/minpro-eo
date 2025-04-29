'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Calendar, BarChart3, ListChecks, PieChart, Plus,
  Loader2, ChartArea,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import type { Event, Transaction, TransactionStatus, Genre, Country } from '@prisma/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import DashboardLayout from '@/components/atoms/DashboardLayout';
import { User } from "next-auth";
import EventsTab from '@/components/atoms/DashboardEvents';
import DashboardTransactions, { ExtendedTransaction } from '@/components/atoms/DashboardTransactions'; 

// --- Interfaces  ---
interface OrganizerDashboardProps {
  user: User & {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
    role: 'customer' | 'organizer';
    referralCode?: string | null;
    image?: string | null;
  };
}

interface OverviewTabProps { 
  statistics: StatSummary;
  salesData: SalesData;
  statusDistribution: StatusDistribution;
  upcomingEvents: ExtendedEvent[];
  timeRange: string;
  setTimeRange: (value: string) => void;
  userId: string; 
}

type ExtendedEvent = Omit<Event, 'genreId' | 'countryId'> & {
  genre: Genre;
  country: Country;
  soldSeats: number;
  totalRevenue: number;
  averageRating: number | null;
};

type FetchedEvent = Event & {
  genre: Genre;
  country: Country;
};

type StatSummary = {
  totalEvents: number;
  totalTransactions: number;
  totalRevenue: number;
  totalSeats: number;
  soldSeats: number;
};

type SalesData = { date: string; sales: number; revenue: number }[];
type StatusDistribution = { name: string; value: number }[];
type EventPerformanceData = { name: string; revenue: number; ticketsSold: number }[];

const COLORS = ['#4F46E5', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6'];

// --- Utility functions specific to dashboard data processing ---
// Keep utilities used by Overview, Statistics, or data fetching
function processEvents(fetchedEvents: FetchedEvent[], transactions: ExtendedTransaction[]): ExtendedEvent[] {
    return fetchedEvents.map(event => {
        const eventTransactions = transactions.filter(t => t.eventId === event.id && t.status === 'PAID');
        const soldSeats = eventTransactions.reduce((sum, t) => sum + t.ticketQuantity, 0);
        const totalRevenue = eventTransactions.reduce((sum, t) => sum + t.finalPrice, 0);
        const averageRating = (event as any).averageRating ?? null;
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
  transactions.forEach(t => {
    if (t.status === 'PAID') {
      const dateKey = format(new Date(t.createdAt), groupBy);
      grouped[dateKey] = grouped[dateKey] || { sales: 0, revenue: 0 };
      grouped[dateKey].sales += t.ticketQuantity;
      grouped[dateKey].revenue += t.finalPrice;
    }
  });
  
  return Object.entries(grouped)
         .map(([dateKey, data]) => ({ dateKey: dateKey, displayDate: format(new Date(dateKey), display), sales: data.sales, revenue: data.revenue }))
         .sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime())
         .map(({displayDate, sales, revenue}) => ({ date: displayDate, sales, revenue })); 
}


function getStatusDistribution(transactions: ExtendedTransaction[]): StatusDistribution {
    const statusCounts: Record<TransactionStatus, number> = { PENDING: 0, WAITING_ADMIN: 0, PAID: 0, EXPIRED: 0, CANCELED: 0 };
    transactions.forEach(t => statusCounts[t.status]++);
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

// Keep formatStatus and getStatusBadge here as they are passed as props
// and might be used by Overview tab too
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
  return <Badge variant="outline" className={`${badgeStyles[status]} whitespace-nowrap`}>{formatStatus(status)}</Badge>;
}


// --- Sub-components for Tab Content ---

// Overview Tab 
function OverviewTab({ statistics, salesData, statusDistribution, upcomingEvents, timeRange, setTimeRange, userId }: OverviewTabProps) { // Destructure userId
  return (
    <div className="space-y-6">
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span>Total Revenue</span>
              <BarChart3 className="h-4 w-4 opacity-80" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.totalRevenue, 'IDR')}</div>
            <p className="mt-1 text-xs opacity-80">Across all events</p>
          </CardContent>
        </Card>
        {/* Other Stat Cardss */}
        <Card>
          <CardHeader>
            <CardTitle className="text-primary-700 font-bold flex items-center justify-between text-sm">
              <span>Events</span>
              <Calendar className="h-4 w-4 text-primary-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-black text-2xl font-bold">{statistics.totalEvents}</div>
            <p className="mt-1 text-xs text-gray-500">Created events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-primary-700 font-bold flex items-center justify-between text-sm">
              <span>Ticket Sales</span>
              <ListChecks className="h-4 w-4 text-primary-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-black text-2xl font-bold">{statistics.soldSeats}</div>
            <p className="mt-1 text-xs text-gray-500">Out of {statistics.totalSeats} seats</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-primary-700 font-bold flex items-center justify-between text-sm">
              <span>Transactions</span>
              <PieChart className="h-4 w-4 text-primary-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-black text-2xl font-bold">{statistics.totalTransactions}</div>
            <p className="mt-1 text-xs text-gray-500">Ticket transactions</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 text-primary-700 pb-2">
          <CardTitle className="font-bold text-lg">Recent Sales</CardTitle>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-32 bg-primary-400 text-white hover:bg-white hover:text-primary-600 border border-primary-600 transition-colors text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              className="bg-primary-400 text-white
                data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2
                data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-2
                duration-200 text-xs"
            >
              <SelectItem
                value="week"
                className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors min-h-0 py-1.5"
              >
                This Week
              </SelectItem>
              <SelectItem
                value="month"
                 className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors min-h-0 py-1.5"
              >
                This Month
              </SelectItem>
              <SelectItem
                value="year"
                className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors min-h-0 py-1.5"
              >
                This Year
              </SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>

          <CardContent className="pt-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip
                    formatter={(value, name) => [name === 'revenue' ? formatCurrency(value as number, 'IDR') : value, name === 'revenue' ? 'Revenue' : 'Tickets']}
                    labelStyle={{ fontSize: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{fontSize: "11px"}}/>
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4F46E5" fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="sales" name="Tickets" stroke="#10B981" fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-primary-700 text-lg">Transaction Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} fill="#8884d8" paddingAngle={2} dataKey="value" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                     const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                     const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                     const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                     return (percent > 0.05) ? <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10}>
                       {`${(percent * 100).toFixed(0)}%`}
                     </text> : null;
                   }}>
                    {statusDistribution.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{fontSize: "11px"}}/>
                   <Tooltip formatter={(value, name) => [`${value} transactions`, name]} labelStyle={{ fontSize: '12px' }} itemStyle={{ fontSize: '12px' }} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-primary-700 text-lg">Upcoming Events</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.slice(0, 3).map(event => ( // Limit to 3 upcoming
              <Link href={`/organizer/events/edit/${event.id}`} key={event.id} className="block hover:bg-gray-50 rounded-lg border border-gray-200 p-4 transition-colors">
                  <div className="flex items-center">
                    <div className="relative mr-4 h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                    {event.image ? <Image src={event.image} alt={event.title} fill className="object-cover" sizes="48px" /> : <Calendar className="h-full w-full bg-gray-200 p-3 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{event.title}</h3>
                    <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="mr-1 h-3 w-3" />
                        {format(new Date(event.startDate), 'MMM d, yyyy')}
                    </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                    <div className="font-medium text-primary-600 text-sm">{formatCurrency(event.totalRevenue || 0, 'IDR')}</div>
                    <div className="text-xs text-gray-500">{event.soldSeats || 0}/{event.seats} tickets</div>
                    </div>
                </div>
               </Link>
            ))}
            {upcomingEvents.length === 0 && (
              <div className="flex h-24 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-4 text-center">
                <p className="text-sm text-gray-500">No upcoming events scheduled</p>
                <Link href={`/organizer/events/${userId}/create`}>
                   <Button variant="outline" size="sm" className="mt-2 text-primary-600 text-xs h-7">
                    <Plus className="mr-1 h-3 w-3" />Create an Event
                   </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// Statistics Tab 
function StatisticsTab({ salesData, statusDistribution, eventPerformanceData, timeRange, setTimeRange }: {
  salesData: SalesData;
  statusDistribution: StatusDistribution;
  eventPerformanceData: EventPerformanceData;
  timeRange: string;
  setTimeRange: (value: string) => void;
}) {
 
   return (
    <Card>
      <CardHeader><CardTitle className="text-primary-700 font-bold text-xl">Performance Statistics</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2"> {/* Adjusted grid for better layout */}

          {/* Revenue Over Time */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 text-primary-700 pb-2">
              <CardTitle className="font-bold text-lg">Revenue Over Time</CardTitle>
               <Select value={timeRange} onValueChange={setTimeRange}>
                 <SelectTrigger className="w-full sm:w-32 bg-primary-400 text-white hover:bg-white hover:text-primary-600 border border-primary-600 transition-colors text-xs h-8">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent className="bg-primary-400 text-white data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 duration-200 text-xs">
                   <SelectItem value="week" className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors min-h-0 py-1.5">This Week</SelectItem>
                   <SelectItem value="month" className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors min-h-0 py-1.5">This Month</SelectItem>
                   <SelectItem value="year" className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors min-h-0 py-1.5">This Year</SelectItem>
                 </SelectContent>
               </Select>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorRevenueStat" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                         <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                     <XAxis dataKey="date" fontSize={10} />
                     <YAxis fontSize={10} />
                      <Tooltip formatter={(value) => formatCurrency(value as number, 'IDR')} labelStyle={{ fontSize: '12px' }} itemStyle={{ fontSize: '12px' }} />
                     <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4F46E5" fillOpacity={1} fill="url(#colorRevenueStat)" />
                   </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Sales Over Time */}
          <Card>
             <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 text-primary-700 pb-2">
                <CardTitle className="font-bold text-lg">Ticket Sales Over Time</CardTitle>
                {/* Use the same time range selector or have independent ones */}
                 <Select value={timeRange} onValueChange={setTimeRange}>
                   <SelectTrigger className="w-full sm:w-32 bg-primary-400 text-white hover:bg-white hover:text-primary-600 border border-primary-600 transition-colors text-xs h-8">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="bg-primary-400 text-white data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 duration-200 text-xs">
                     <SelectItem value="week" className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors min-h-0 py-1.5">This Week</SelectItem>
                     <SelectItem value="month" className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors min-h-0 py-1.5">This Month</SelectItem>
                     <SelectItem value="year" className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors min-h-0 py-1.5">This Year</SelectItem>
                   </SelectContent>
                 </Select>
             </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorSalesStat" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                         <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0"/>
                    <XAxis dataKey="date" fontSize={10}/>
                    <YAxis fontSize={10}/>
                     <Tooltip formatter={(value, name) => [value, 'Tickets Sold']} labelStyle={{ fontSize: '12px' }} itemStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="sales" name="Tickets Sold" stroke="#10B981" fillOpacity={1} fill="url(#colorSalesStat)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Event Performance Comparison */}
          <Card>
             <CardHeader><CardTitle className="text-primary-700 font-bold text-lg">Top 5 Event Performance</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical"> {/* Adjusted margins */}
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0"/>
                    <XAxis type="number" fontSize={10}/>
                    <YAxis type="category" dataKey="name" width={100} fontSize={10} interval={0}/> {/* Adjusted width, font size, interval */}
                     <Tooltip
                       formatter={(value, name) => [name === 'revenue' ? formatCurrency(value as number, 'IDR') : value, name === 'revenue' ? 'Revenue' : 'Tickets Sold']}
                       labelStyle={{ fontSize: '12px' }}
                       itemStyle={{ fontSize: '12px' }}
                     />
                    <Legend wrapperStyle={{fontSize: "11px"}}/>
                    <Bar dataKey="revenue" name="Revenue" fill="#4F46E5" barSize={15}/> {/* Adjusted bar size */}
                    <Bar dataKey="ticketsSold" name="Tickets Sold" fill="#10B981" barSize={15}/> {/* Adjusted bar size */}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Status Distribution */}
          <Card>
            <CardHeader><CardTitle className="text-primary-700 font-bold text-lg">Transaction Status</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                     <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} fill="#8884d8" paddingAngle={2} dataKey="value" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                       const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                       const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                       const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                       return (percent > 0.05) ? <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10}>
                         {`${(percent * 100).toFixed(0)}%`}
                       </text> : null;
                     }}>
                      {statusDistribution.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{fontSize: "11px"}}/>
                    <Tooltip formatter={(value, name) => [`${value} transactions`, name]} labelStyle={{ fontSize: '12px' }} itemStyle={{ fontSize: '12px' }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </div>
      </CardContent>
    </Card>
  );
}


// --- Main Component ---
export default function OrganizerDashboard({ user }: OrganizerDashboardProps) {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<ExtendedEvent[]>([]);
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]); // State remains here
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
  const actionButton = (
    <Link href={`/organizer/events/${user.id}/create`} passHref>
      <Button className="bg-secondary-600 hover:bg-secondary-700 cursor-pointer">
        <Plus className="mr-2 h-5 w-5" />Create New Event
      </Button>
    </Link>
  );

  // Fetch Data specific to Organizer (Remains the same)
  useEffect(() => {
    const userId = user?.id || session?.user?.id;
    if (status === 'authenticated' && userId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [eventsRes, transactionsRes] = await Promise.all([
            fetch(`/api/events?userId=${userId}`).then(res => res.ok ? res.json() : Promise.reject(new Error(`Event fetch failed: ${res.statusText}`))),
            fetch(`/api/transactions?userId=${userId}`).then(res => res.ok ? res.json() : Promise.reject(new Error(`Transaction fetch failed: ${res.statusText}`))),
          ]);

          const fetchedEvents: FetchedEvent[] = eventsRes.events || [];
          const fetchedTransactions: ExtendedTransaction[] = transactionsRes.transactions || [];

          const processedEvents = processEvents(fetchedEvents, fetchedTransactions);

          setEvents(processedEvents);
          setTransactions(fetchedTransactions); // Set the transactions state here
          setStatistics(calculateStatistics(processedEvents, fetchedTransactions));

        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          setEvents([]);
          setTransactions([]);
          setStatistics({ totalEvents: 0, totalTransactions: 0, totalRevenue: 0, totalSeats: 0, soldSeats: 0 });
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
    // Note: Include `user?.id` in dependency array if it might change
  }, [status, user?.id, session?.user?.id]);


  // Derived State Calculation (Remains the same)
  const [statistics, setStatistics] = useState<StatSummary>({
    totalEvents: 0, totalTransactions: 0, totalRevenue: 0, totalSeats: 0, soldSeats: 0
  });

  // UseMemo hooks for derived data (Remains the same)
  const salesData = useMemo(() => getSalesData(transactions, timeRange), [transactions, timeRange]);
  const statusDistribution = useMemo(() => getStatusDistribution(transactions), [transactions]);
  const eventPerformanceData = useMemo(() => getEventPerformanceData(events), [events]);
  const upcomingEvents = useMemo(() =>
    events
      .filter(event => new Date(event.startDate) > new Date())
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [events]
  );


  // --- Render Tab Content Function (Updated for Transactions) ---
  const renderTabContent = (activeTab: string) => {
    switch (activeTab) {
      case 'overview':
        return (
          <TabsContent value="overview" className="mt-0">
            <OverviewTab
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
        // Assuming EventsTab expects 'ExtendedEvent[]'
        return <TabsContent value="events" className="mt-0"><EventsTab events={events} /></TabsContent>;
        case 'transactions':
          return <TabsContent value="transactions" className="mt-0">
                   <DashboardTransactions
                     initialTransactions={transactions}
                     formatStatus={formatStatus}
                     getStatusBadge={getStatusBadge}
                     formatCurrency={formatCurrency}
                   />
                 </TabsContent>;
      case 'statistics':
        return <TabsContent value="statistics" className="mt-0"><StatisticsTab salesData={salesData} statusDistribution={statusDistribution} eventPerformanceData={eventPerformanceData} timeRange={timeRange} setTimeRange={setTimeRange} /></TabsContent>;
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

  // Ensure user object for layout has the expected properties
  const layoutUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    role: user.role,
    referralCode: user.referralCode,
    image: user.image,
  };


  // --- Render using DashboardLayout ---
  return (
    <DashboardLayout
      user={layoutUser}
      tabs={tabs}
      renderTabContent={renderTabContent}
      actionButton={actionButton}
    />
  );
}
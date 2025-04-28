'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Calendar, BarChart3, ListChecks, PieChart, Plus, Search, UserCheck, MoreHorizontal, Loader2,
  CircleCheck,  XCircle,
  Ticket, ChartArea,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import type { Event, Transaction, TransactionStatus, Genre, Country } from '@prisma/client';import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import DashboardLayout from '@/components/atoms/DashboardLayout';
import { User } from "next-auth";
import EventsTab from '@/components/atoms/DashboardEvents'; 


// --- Interfaces ---
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

type ExtendedTransaction = Transaction & {
  event: { title: string; image: string | null };
  user: { name: string | null; email: string; image?: string | null };
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
  return <Badge variant="outline" className={`${badgeStyles[status]} whitespace-nowrap`}>{formatStatus(status)}</Badge>; // Added whitespace-nowrap
}


// --- Sub-components for Tab Content ---

// Overview Tab 
function OverviewTab({ statistics, salesData, statusDistribution, upcomingEvents, timeRange, setTimeRange }: {
  statistics: StatSummary;
  salesData: SalesData;
  statusDistribution: StatusDistribution;
  upcomingEvents: ExtendedEvent[];
  timeRange: string;
  setTimeRange: (value: string) => void;
}) {
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
            {upcomingEvents.slice(0, 3).map(event => ( // Limit to 3 upcomin`g`
              <Link href={`/organizer/events/edit/${event.id}`} key={event.id} className="block hover:bg-gray-50 rounded-lg border border-gray-200 p-4 transition-colors">
                  <div className="flex items-center">
                    <div className="relative mr-4 h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg"> 
                    {event.image ? <Image src={event.image} alt={event.title} fill className="object-cover" sizes="48px" /> : <Calendar className="h-full w-full bg-gray-200 p-3 text-gray-400" />} {/* Adjusted padding */}
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
                <Link href={`/organizer/create`}> 
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

// Transaction Tab 
function TransactionsTab({ transactions: initialTransactions }: { transactions: ExtendedTransaction[] }) {
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'ALL'>('ALL');
  const [selectedTransaction, setSelectedTransaction] = useState<ExtendedTransaction | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>(initialTransactions);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
      setTransactions(initialTransactions);
  }, [initialTransactions]);

  const updateStatus = async (id: number, status: TransactionStatus) => {
    const originalTransactions = [...transactions];
    const transactionIndex = transactions.findIndex(t => t.id === id);
    if (transactionIndex === -1) return;

    // Optimistically update UI
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    if (selectedTransaction?.id === id) {
      setSelectedTransaction(prev => prev ? { ...prev, status } : null);
    }
    
    try {
      const res = await fetch(`/api/transaction/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
         const errorData = await res.json();
         throw new Error(errorData.error || 'Failed to update status');
      }
      // Success - UI is already updated
       alert(`Transaction #${id} status updated to ${formatStatus(status)}.`); // Or use toast
    } catch (error) {
      console.error('Failed to update transaction status:', error);
      // Revert UI on failure
      setTransactions(originalTransactions);
       if (selectedTransaction?.id === id) {
         // Find the original status again
         const originalStatus = originalTransactions.find(t => t.id === id)?.status;
         if (originalStatus) {
            setSelectedTransaction(prev => prev ? { ...prev, status: originalStatus } : null);
         }
       }
      alert(`Failed to update transaction status: ${error instanceof Error ? error.message : 'Please try again.'}`); // Or use toast
    } finally {
      // Close modal regardless of success/failure if it was open for this transaction
       if (selectedTransaction?.id === id) {
         setIsDetailsOpen(false);
       }
    }
  };


  const resendTicket = async (id: number) => {
    // Add a loading indicator state if desired
    try {
      const res = await fetch(`/api/transaction/${id}/resend-ticket`, { method: 'POST' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to resend ticket');
      }
      alert('Ticket resent successfully!'); // Use toast ideally
    } catch (error) {
      console.error('Failed to resend ticket:', error);
       alert(`Failed to resend ticket: ${error instanceof Error ? error.message : 'Please try again.'}`); // Use toast ideally
    } finally {
        // Remove loading state indicator
         if (selectedTransaction?.id === id) { // Close modal if action was triggered from there
            setIsDetailsOpen(false);
         }
    }
  };

  // Filtered Transactions
  const filteredTransactions = transactions
    .filter(t => statusFilter === 'ALL' || t.status === statusFilter)
    .filter(t => {
        const term = searchTerm.toLowerCase();
        return (
            t.id.toString().includes(term) ||
            (t.user.name && t.user.name.toLowerCase().includes(term)) ||
            t.user.email.toLowerCase().includes(term) ||
            t.event.title.toLowerCase().includes(term) ||
            t.tierType.toLowerCase().includes(term)
        );
    });


   return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <CardTitle className="text-primary-700 font-bold text-lg">Ticket Transactions</CardTitle> 
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-700" />
              <Input
                 placeholder="Search ID, name, email, event..."
                 className="pl-8 text-primary-500 h-9 text-sm" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
             <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TransactionStatus | 'ALL')}>
              <SelectTrigger className="w-full sm:w-40 bg-primary-400 text-white hover:bg-white hover:text-primary-600 border border-primary-600 transition-colors h-9 text-xs"> {/* Adjusted size */}
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                className="bg-primary-400 text-white
                  data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2
                  data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-2
                  duration-200 text-xs" 
              >
                <SelectItem
                  value="ALL"
                  className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors min-h-0 py-1.5" 
                >
                  All Statuses
                </SelectItem>
                {['PENDING', 'WAITING_ADMIN', 'PAID', 'EXPIRED', 'CANCELED'].map(status => (
                  <SelectItem
                    key={status}
                    value={status}
                    className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors min-h-0 py-1.5" 
                  >
                    {formatStatus(status as TransactionStatus)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {initialTransactions.length === 0 ? ( // Check initial length for the "no transactions ever" message
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-6 text-center">
              <ListChecks className="mb-2 h-10 w-10 text-gray-400" />
              <h3 className="text-black mb-1 text-lg font-medium">No Transactions Found</h3>
              <p className="text-gray-600">No ticket purchases have been made yet.</p>
            </div>
          ) : filteredTransactions.length === 0 ? ( // Show if filters result in no matches
             <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-6 text-center">
                <Search className="mb-2 h-10 w-10 text-gray-400" />
                <h3 className="text-black mb-1 text-lg font-medium">No Matching Transactions</h3>
                <p className="text-gray-600">Try adjusting your search or filter.</p>
             </div>
           ) : (
            <div className="overflow-auto">
              <table className="w-full min-w-[800px] divide-y divide-gray-200 text-sm"> 
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Transaction</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Event</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                    <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3"> 
                        <div className="font-medium text-gray-900">#{t.id}</div>
                        <div className="text-xs text-gray-500">{t.ticketQuantity} x {t.tierType}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center">
                           <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"> 
                            {t.user.image ? <Image src={t.user.image} alt={t.user.name || ''} width={28} height={28} className="rounded-full" /> : <UserCheck className="h-4 w-4 text-gray-500" />}
                          </div>
                          <div className="ml-2 min-w-0"> 
                            <div className="font-medium text-gray-900 truncate">{t.user.name || 'Anonymous'}</div>
                            <div className="text-xs text-gray-500 truncate">{t.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-900 truncate max-w-xs">{t.event.title}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-medium text-gray-900">{formatCurrency(t.finalPrice, 'IDR')}</div>
                        {t.couponDiscount > 0 && <div className="text-xs text-green-600">-{formatCurrency(t.couponDiscount, 'IDR')}</div>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{getStatusBadge(t.status)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">{format(new Date(t.createdAt), 'PP')}</td> 
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="sm" className="h-7 w-7 p-0 data-[state=open]:bg-muted"> 
                               <MoreHorizontal className="h-4 w-4" />
                             </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs"> 
                            <DropdownMenuItem onClick={() => { setSelectedTransaction(t); setIsDetailsOpen(true); }}>View Details</DropdownMenuItem>
                            {t.status === 'WAITING_ADMIN' && (
                              <>
                                <DropdownMenuItem onClick={() => updateStatus(t.id, 'PAID')} className="text-green-600">Approve Payment</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus(t.id, 'CANCELED')} className="text-red-600">Reject Payment</DropdownMenuItem>
                              </>
                            )}
                            {t.status === 'PAID' && <DropdownMenuItem onClick={() => resendTicket(t.id)}>Resend Ticket</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
       {/* Transaction Details Modal */}
       {isDetailsOpen && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200" onClick={() => setIsDetailsOpen(false)}> 
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}> 
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-lg font-semibold text-primary-800">Transaction #{selectedTransaction.id}</h3>
               <Button variant="ghost" size="icon" onClick={() => setIsDetailsOpen(false)} className="h-7 w-7 text-gray-500 hover:bg-gray-100">
                 <XCircle className="h-5 w-5" />
               </Button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4"> 
                <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <h4 className="font-medium text-gray-700 text-sm mb-1">Customer Details</h4> 
                    <div className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-1 text-xs"> 
                    <span className="text-gray-500">Name:</span><span className="font-medium break-words">{selectedTransaction.user.name || 'Anonymous'}</span>
                    <span className="text-gray-500">Email:</span><span className="font-medium break-words">{selectedTransaction.user.email}</span>
                    <span className="text-gray-500">Purchase Date:</span><span className="font-medium">{format(new Date(selectedTransaction.createdAt), 'PPp')}</span>
                    </div>
                </div>
                <div>
                    <h4 className="font-medium text-gray-700 text-sm mb-1">Transaction Details</h4> 
                    <div className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-1 text-xs"> 
                    <span className="text-gray-500">Event:</span><span className="font-medium break-words">{selectedTransaction.event.title}</span>
                    <span className="text-gray-500">Ticket Type:</span><span className="font-medium">{selectedTransaction.tierType}</span>
                    <span className="text-gray-500">Quantity:</span><span className="font-medium">{selectedTransaction.ticketQuantity}</span>
                    <span className="text-gray-500">Base Price:</span><span className="font-medium">{formatCurrency(selectedTransaction.basePrice, 'IDR')}</span>
                    {selectedTransaction.couponDiscount > 0 && (
                        <>
                        <span className="text-gray-500">Discount:</span><span className="font-medium text-green-600">-{formatCurrency(selectedTransaction.couponDiscount, 'IDR')}</span>
                        </>
                    )}
                    {selectedTransaction.pointsUsed > 0 && (
                        <>
                        <span className="text-gray-500">Points Used:</span><span className="font-medium">{selectedTransaction.pointsUsed} pts</span>
                        </>
                    )}
                    <span className="text-gray-500">Final Price:</span><span className="font-bold">{formatCurrency(selectedTransaction.finalPrice, 'IDR')}</span>
                    <span className="text-gray-500">Status:</span><span>{getStatusBadge(selectedTransaction.status)}</span>
                    </div>
                </div>
                </div>
                {selectedTransaction.paymentProof && (
                <div className="mt-3"> 
                    <h4 className="font-medium text-gray-700 text-sm mb-1">Payment Proof</h4> {/* Adjusted size/margin */}
                    <div className="mt-1 max-h-60 w-full overflow-hidden rounded-md border border-gray-200 flex justify-center items-center bg-gray-50 p-1"> {/* Adjusted size/padding */}
                    <a href={selectedTransaction.paymentProof} target="_blank" rel="noopener noreferrer" className="block max-h-full max-w-full">
                        <Image
                            src={selectedTransaction.paymentProof}
                            alt="Payment Proof"
                            width={300} 
                            height={200} 
                            className="max-h-full max-w-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        />
                    </a>
                    </div>
                </div>
                )}
             </div> 
             {/* Footer Actions */}
              <div className="mt-4 border-t pt-4 flex justify-end space-x-2">
                 {selectedTransaction.status === 'WAITING_ADMIN' && (
                     <>
                     <Button variant="outline" onClick={() => updateStatus(selectedTransaction.id, 'CANCELED')} className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 h-8 px-3 text-xs"> {/* Adjusted size */}
                         <XCircle className="mr-1.5 h-4 w-4" />Reject
                     </Button>
                     <Button variant="outline" onClick={() => updateStatus(selectedTransaction.id, 'PAID')} className="border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700 h-8 px-3 text-xs"> {/* Adjusted size */}
                         <CircleCheck className="mr-1.5 h-4 w-4" />Approve
                     </Button>
                     </>
                 )}
                 {selectedTransaction.status === 'PAID' && (
                    <Button variant="outline" onClick={() => resendTicket(selectedTransaction.id)} className="h-8 px-3 text-xs"> {/* Adjusted size */}
                        <Ticket className="mr-1.5 h-4 w-4" /> Resend Ticket
                    </Button>
                 )}
                 <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="h-8 px-3 text-xs">Close</Button> {/* Adjusted size */}
             </div>
          </div>
        </div>
      )}
    </>
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
  const actionButton = (
    <Link href={`/organizer/events/${user.id}/create`} passHref>
  <Button className="bg-secondary-600 hover:bg-secondary-700 cursor-pointer">
    <Plus className="mr-2 h-5 w-5" />Create New Event
  </Button>
</Link>
  );

  // Fetch Data specific to Organizer
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

           // Cast or ensure fetchedEvents matches the expected input type for processEvents
           const fetchedEvents: FetchedEvent[] = eventsRes.events || []; 
           const fetchedTransactions: ExtendedTransaction[] = transactionsRes.transactions || []; 

           // Process events 
           const processedEvents = processEvents(fetchedEvents, fetchedTransactions);

           setEvents(processedEvents); 
           setTransactions(fetchedTransactions); 
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
  }, [status, user?.id, session?.user?.id]);


  // Derived State Calculation
  const [statistics, setStatistics] = useState<StatSummary>({
    totalEvents: 0, totalTransactions: 0, totalRevenue: 0, totalSeats: 0, soldSeats: 0
  });

  // UseMemo hooks for derived data 
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
        return <TabsContent value="overview" className="mt-0"><OverviewTab statistics={statistics} salesData={salesData} statusDistribution={statusDistribution} upcomingEvents={upcomingEvents} timeRange={timeRange} setTimeRange={setTimeRange} /></TabsContent>;
      case 'events':
        return <TabsContent value="events" className="mt-0"><EventsTab events={events} /></TabsContent>;
      case 'transactions':
        return <TabsContent value="transactions" className="mt-0"><TransactionsTab transactions={transactions} /></TabsContent>;
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
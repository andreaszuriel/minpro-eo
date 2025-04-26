'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image'; 
import Link from 'next/link';
import { useSession } from 'next-auth/react'; 
import {
  Calendar, BarChart3, ListChecks, PieChart, Plus, Search, UserCheck, Clock, MapPin, ChevronDown, ChevronUp, MoreHorizontal, Loader2,
  CircleCheck,  CircleX, XCircle,
  Pencil, Ticket, ChartArea 
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
import type { Event, Transaction, TransactionStatus } from '@prisma/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import DashboardLayout from '@/components/atoms/DashboardLayout'; 
import { User } from "next-auth"; 

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

type ExtendedEvent = Event & {
  soldSeats: number;
  totalRevenue: number;
  averageRating: number | null;
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

// --- Utility functions specific to dashboard data processing  ---
function processEvents(events: Event[], transactions: ExtendedTransaction[]): ExtendedEvent[] {
  return events.map(event => {
    const eventTransactions = transactions.filter(t => t.eventId === event.id && t.status === 'PAID');
    const soldSeats = eventTransactions.reduce((sum, t) => sum + t.ticketQuantity, 0);
    const totalRevenue = eventTransactions.reduce((sum, t) => sum + t.finalPrice, 0);
    return { ...event, soldSeats, totalRevenue, averageRating: event.averageRating };
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
    .map(([date, data]) => ({ date: format(new Date(date), display), sales: data.sales, revenue: data.revenue }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
  return <Badge variant="outline" className={badgeStyles[status]}>{formatStatus(status)}</Badge>;
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
       <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Total Revenue</span>
              <BarChart3 className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(statistics.totalRevenue, 'IDR')}</div>
            <p className="mt-2 text-sm opacity-90">Across all events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Events</span>
              <Calendar className="h-5 w-5 text-primary-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.totalEvents}</div>
            <p className="mt-2 text-sm text-gray-500">Created events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ticket Sales</span>
              <ListChecks className="h-5 w-5 text-primary-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.soldSeats}</div>
            <p className="mt-2 text-sm text-gray-500">Out of {statistics.totalSeats} seats</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transactions</span>
              <PieChart className="h-5 w-5 text-primary-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.totalTransactions}</div>
            <p className="mt-2 text-sm text-gray-500">Ticket transactions</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Recent Sales</CardTitle>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number, 'IDR')} />
                  <Area type="monotone" dataKey="revenue" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="sales" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Transaction Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} fill="#8884d8" paddingAngle={2} dataKey="value">
                    {statusDistribution.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Upcoming Events</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.map(event => (
              <div key={event.id} className="flex items-center rounded-lg border border-gray-200 p-4">
                <div className="relative mr-4 h-16 w-16 overflow-hidden rounded-lg">
                  {event.image ? <Image src={event.image} alt={event.title} fill className="object-cover" /> : <Calendar className="h-full w-full bg-gray-200 p-4 text-gray-400" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{event.title}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="mr-1 h-3 w-3" />
                    {format(new Date(event.startDate), 'MMM d, yyyy')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-primary-600">{formatCurrency(event.totalRevenue || 0, 'IDR')}</div>
                  <div className="text-sm text-gray-500">{event.soldSeats || 0}/{event.seats} tickets</div>
                </div>
              </div>
            ))}
            {upcomingEvents.length === 0 && (
              <div className="flex h-24 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-4 text-center">
                <p className="text-gray-500">No upcoming events scheduled</p>
                <Button variant="outline" size="sm" className="mt-2 text-primary-600"><Plus className="mr-1 h-4 w-4" />Create an Event</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Events Tab
function EventsTab({ events }: { events: ExtendedEvent[] }) {
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
   return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <CardTitle>My Events</CardTitle>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search events..." className="pl-8" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past Events</SelectItem>
              <SelectItem value="soldout">Sold Out</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-6 text-center">
            <Calendar className="mb-2 h-10 w-10 text-gray-400" />
            <h3 className="mb-1 text-lg font-medium">No Events Found</h3>
            <p className="mb-4 text-gray-500">You haven't created any events yet.</p>
            <Button className="bg-secondary-600 hover:bg-secondary-700"><Plus className="mr-2 h-4 w-4" />Create Your First Event</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="overflow-hidden rounded-lg border border-gray-200">
                <div className="group flex cursor-pointer items-center justify-between bg-white p-4 hover:bg-gray-50" onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}>
                  <div className="flex items-center">
                    <div className="relative mr-4 h-16 w-16 overflow-hidden rounded-lg">
                      {event.image ? <Image src={event.image} alt={event.title} fill className="object-cover" /> : <Calendar className="h-full w-full bg-gray-200 p-4 text-gray-400" />}
                    </div>
                    <div>
                      <h3 className="font-medium">{event.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <div className="flex items-center"><Calendar className="mr-1 h-3 w-3" />{format(new Date(event.startDate), 'MMM d, yyyy')}</div>
                        <div className="flex items-center"><Clock className="mr-1 h-3 w-3" />{format(new Date(event.startDate), 'h:mm a')}</div>
                        <div className="flex items-center"><MapPin className="mr-1 h-3 w-3" />{event.location}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium text-primary-600">{formatCurrency(event.totalRevenue || 0, 'IDR')}</div>
                      <div className="text-xs text-gray-500">{event.soldSeats || 0}/{event.seats} tickets</div>
                    </div>
                    {expandedEventId === event.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </div>
                {expandedEventId === event.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <h4 className="font-medium text-primary-700">Event Details</h4>
                        <div className="grid grid-cols-2 gap-y-1 text-sm">
                          <span className="text-gray-500">Genre:</span><span className="font-medium text-black">{event.genre}</span>
                          <span className="text-gray-500">Start Date:</span><span className="font-medium text-black">{format(new Date(event.startDate), 'MMM d, yyyy')}</span>
                          <span className="text-gray-500">End Date:</span><span className="font-medium text-black">{format(new Date(event.endDate), 'MMM d, yyyy')}</span>
                          <span className="text-gray-500">Location:</span><span className="font-medium text-black">{event.location}</span>
                          <span className="text-gray-500">Capacity:</span><span className="font-medium text-black">{event.seats} seats</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-primary-700">Sales Summary</h4>
                        <div className="grid grid-cols-2 gap-y-1 text-sm">
                          <span className="text-gray-500">Tickets Sold:</span><span className="font-medium text-black">{event.soldSeats || 0}</span>
                          <span className="text-gray-500">Available:</span><span className="font-medium text-black">{event.seats - (event.soldSeats || 0)}</span>
                          <span className="text-gray-500">Revenue:</span><span className="font-medium text-black">{formatCurrency(event.totalRevenue || 0, 'IDR')}</span>
                          <span className="text-gray-500">Average Rating:</span><span className="font-medium text-black">{event.averageRating ? event.averageRating.toFixed(1) + ' / 5.0' : 'No ratings'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col justify-between gap-2">
                        <h4 className="font-medium text-primary-700">Actions</h4>
                        <div className="flex flex-col justify-end gap-2">
                        <Button size="sm" variant="outline" className="text-black w-full justify-start">
                          <Pencil className="mr-2 h-4 w-4" /> Edit Event
                        </Button>
                        <Button size="sm" variant="outline" className="text-black w-full justify-start">
                          <ChartArea className="mr-2 h-4 w-4" /> View Analytics
                        </Button>
                        <Button size="sm" variant="outline" className="text-black w-full justify-start">
                          <Ticket className="mr-2 h-4 w-4" /> Manage Tickets
                        </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Transaction Tab
function TransactionsTab({ transactions: initialTransactions }: { transactions: ExtendedTransaction[] }) {
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'ALL'>('ALL');
  const [selectedTransaction, setSelectedTransaction] = useState<ExtendedTransaction | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>(initialTransactions); // Local state to manage updates

  useEffect(() => {
      setTransactions(initialTransactions); 
  }, [initialTransactions]);

  const updateStatus = async (id: number, status: TransactionStatus) => {
    const originalTransactions = transactions;
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    setIsDetailsOpen(false); 

    try {
      const res = await fetch(`/api/organizer/transaction/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      // No need to re-set state if API call succeeds
    } catch (error) {
      console.error('Failed to update transaction status:', error);
      // Revert UI on failure
      setTransactions(originalTransactions);
      alert('Failed to update transaction status. Please try again.');
    }
  };

  const resendTicket = async (id: number) => {
    try {
      const res = await fetch(`/api/organizer/transaction/${id}/resend-ticket`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to resend ticket');
      alert('Ticket resent successfully!');
    } catch (error) {
      console.error('Failed to resend ticket:', error);
       alert('Failed to resend ticket. Please try again.');
    } finally {
        // Remove loading state indicator
    }
  };

   return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <CardTitle>Ticket Transactions</CardTitle>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TransactionStatus | 'ALL')}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {['PENDING', 'WAITING_ADMIN', 'PAID', 'EXPIRED', 'CANCELED'].map(status => (
                  <SelectItem key={status} value={status}>{formatStatus(status as TransactionStatus)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search transactions..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-6 text-center">
              <ListChecks className="mb-2 h-10 w-10 text-gray-400" />
              <h3 className="mb-1 text-lg font-medium">No Transactions Found</h3>
              <p className="text-gray-500">No ticket purchases yet.</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full min-w-[800px] divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Transaction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {transactions.filter(t => statusFilter === 'ALL' || t.status === statusFilter).map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">#{t.id}</div>
                        <div className="text-xs text-gray-500">{t.ticketQuantity} x {t.tierType}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            {t.user.image ? <Image src={t.user.image} alt={t.user.name || ''} width={32} height={32} className="rounded-full" /> : <UserCheck className="h-4 w-4 text-gray-500" />}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{t.user.name || 'Anonymous'}</div>
                            <div className="text-xs text-gray-500">{t.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{t.event.title}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(t.finalPrice, 'IDR')}</div>
                        {t.couponDiscount > 0 && <div className="text-xs text-green-600">-{formatCurrency(t.couponDiscount, 'IDR')}</div>}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">{getStatusBadge(t.status)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{format(new Date(t.createdAt), 'MMM d, yyyy')}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg overflow-auto max-h-[90vh]"> {/* Added overflow & max-height */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Transaction #{selectedTransaction.id}</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsDetailsOpen(false)}><CircleX className="h-5 w-5" /></Button> {/* Use size="icon" */}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium text-gray-700">Customer Details</h4>
                <div className="mt-2 grid grid-cols-[auto,1fr] gap-x-2 gap-y-1 text-sm"> 
                  <span className="text-gray-500">Name:</span><span className="font-medium break-words">{selectedTransaction.user.name || 'Anonymous'}</span>
                  <span className="text-gray-500">Email:</span><span className="font-medium break-words">{selectedTransaction.user.email}</span>
                  <span className="text-gray-500">Purchase Date:</span><span className="font-medium">{format(new Date(selectedTransaction.createdAt), 'PPp')}</span>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Transaction Details</h4>
                <div className="mt-2 grid grid-cols-[auto,1fr] gap-x-2 gap-y-1 text-sm"> 
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
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Payment Proof</h4>
                <div className="mt-2 max-h-80 w-full overflow-hidden rounded-md border border-gray-200 flex justify-center items-center bg-gray-100"> 
                   <a href={selectedTransaction.paymentProof} target="_blank" rel="noopener noreferrer">
                     <Image
                        src={selectedTransaction.paymentProof}
                        alt="Payment Proof"
                        width={400} 
                        height={300} 
                        className="max-h-full max-w-full object-contain cursor-pointer" 
                      />
                   </a>
                </div>
              </div>
            )}
            {selectedTransaction.status === 'WAITING_ADMIN' && (
              <div className="mt-6 flex justify-end space-x-2 border-t pt-4"> 
                <Button variant="outline" onClick={() => updateStatus(selectedTransaction.id, 'CANCELED')} className="border-red-200 text-red-600 hover:bg-red-50">
                  <XCircle className="mr-2 h-4 w-4" />Reject Payment
                </Button>
                <Button variant="outline" onClick={() => updateStatus(selectedTransaction.id, 'PAID')} className="border-green-200 text-green-600 hover:bg-green-50">
                  <CircleCheck className="mr-2 h-4 w-4" />Approve Payment
                </Button>
              </div>
            )}
             {selectedTransaction.status === 'PAID' && ( 
                <div className="mt-6 flex justify-end space-x-2 border-t pt-4">
                    <Button variant="outline" onClick={() => resendTicket(selectedTransaction.id)}>
                        <Ticket className="mr-2 h-4 w-4" /> Resend Ticket
                    </Button>
                </div>
            )}
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
      <CardHeader><CardTitle>Performance Statistics</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revenue Over Time</CardTitle>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number, 'IDR')} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ticket Sales</CardTitle>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="sales" name="Tickets Sold" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Event Performance Comparison</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventPerformanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <Tooltip formatter={(value) => formatCurrency(value as number, 'IDR')} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#4F46E5" />
                    <Bar dataKey="ticketsSold" name="Tickets Sold" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Transaction Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} fill="#8884d8" paddingAngle={2} dataKey="value" label>
                      {statusDistribution.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <Tooltip />
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

// --- Main Refactored Component ---
export default function OrganizerDashboard({ user }: OrganizerDashboardProps) {
  const { data: session, status } = useSession(); 
  const [events, setEvents] = useState<ExtendedEvent[]>([]);
  // Use initialTransactions prop for TransactionsTab, but keep a state for updates if needed
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); 

  // Define Tabs for Organizer
  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'events', label: 'My Events' },
    { value: 'transactions', label: 'Transactions' },
    { value: 'statistics', label: 'Statistics' },
  ];

  // Define Action Button for Organizer
  const actionButton = (
    <Link href="/events/create" passHref>
      <Button className="bg-secondary-600 hover:bg-secondary-700 cursor-pointer">
        <Plus className="mr-2 h-5 w-5" />Create New Event
      </Button>
    </Link>
  );

  // Fetch Data specific to Organizer
  useEffect(() => {
    // Use user.id from props if available and reliable, otherwise fallback to session?.user?.id
    const userId = user?.id || session?.user?.id;
    if (status === 'authenticated' && userId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [eventsRes, transactionsRes] = await Promise.all([
            fetch(`/api/organizer/events?userId=${userId}`).then(res => res.ok ? res.json() : { events: [] }),
            fetch(`/api/organizer/transactions?userId=${userId}`).then(res => res.ok ? res.json() : { transactions: [] }),
          ]);
          const fetchedTransactions = transactionsRes.transactions || [];
          const processedEvents = processEvents(eventsRes.events || [], fetchedTransactions);
          setEvents(processedEvents);
          setTransactions(fetchedTransactions); 
          // Calculate statistics derived from the processed data
          setStatistics(calculateStatistics(processedEvents, fetchedTransactions));

        } catch (error) {
          console.error('Error fetching data:', error);
          setEvents([]);
          setTransactions([]);
           setStatistics({ totalEvents: 0, totalTransactions: 0, totalRevenue: 0, totalSeats: 0, soldSeats: 0 });
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else if (status === 'unauthenticated') {
         setLoading(false); // Stop loading if not authenticated
    }
  }, [status, user?.id, session?.user?.id]);


  // Derived State Calculation 
  const [statistics, setStatistics] = useState<StatSummary>({
    totalEvents: 0, totalTransactions: 0, totalRevenue: 0, totalSeats: 0, soldSeats: 0
  });
  const salesData = useMemo(() => getSalesData(transactions, timeRange), [transactions, timeRange]);
  const statusDistribution = useMemo(() => getStatusDistribution(transactions), [transactions]);
  const eventPerformanceData = useMemo(() => getEventPerformanceData(events), [events]);
  const upcomingEvents = useMemo(() =>
    events
      .filter(event => new Date(event.startDate) > new Date())
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 3),
    [events]
  );

  // --- Render Tab Content Function ---
  const renderTabContent = (activeTab: string) => {
    switch (activeTab) {
      case 'overview':
        return <TabsContent value="overview"><OverviewTab statistics={statistics} salesData={salesData} statusDistribution={statusDistribution} upcomingEvents={upcomingEvents} timeRange={timeRange} setTimeRange={setTimeRange} /></TabsContent>;
      case 'events':
        return <TabsContent value="events"><EventsTab events={events} /></TabsContent>;
      case 'transactions':
        return <TabsContent value="transactions"><TransactionsTab transactions={transactions} /></TabsContent>;
      case 'statistics':
        return <TabsContent value="statistics"><StatisticsTab salesData={salesData} statusDistribution={statusDistribution} eventPerformanceData={eventPerformanceData} timeRange={timeRange} setTimeRange={setTimeRange} /></TabsContent>;
      default:
        return null;
    }
  };

// --- Loading States ---
if (status === 'loading' || loading) {
  return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /> <span className="ml-2 text-lg font-medium text-black">Loading Dashboard...</span></div>;
}

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
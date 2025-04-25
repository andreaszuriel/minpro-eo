'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  Calendar, 
  BarChart3, 
  ListChecks, 
  PieChart, 
  Plus, 
  Search,  
UserCheck,
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Event, Transaction, TransactionStatus } from '@prisma/client';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { User } from "next-auth";

interface OrganizerDashboardProps {
    user: User;
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

type GroupedData = {
  [key: string]: { sales: number; revenue: number };
};

type StatSummary = {
  totalEvents: number;
  totalTransactions: number;
  totalRevenue: number;
  totalSeats: number;
  soldSeats: number;
};

const COLORS = ['#4F46E5', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6'];

export default function OrganizerDashboard({ user }: OrganizerDashboardProps) {  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState<ExtendedEvent[]>([]);
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
  const [statistics, setStatistics] = useState<StatSummary>({
    totalEvents: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    totalSeats: 0,
    soldSeats: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState<TransactionStatus | 'ALL'>('ALL');
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<ExtendedTransaction | null>(null);
  const [isTransactionDetailsOpen, setIsTransactionDetailsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchData();
    }
  }, [status, session?.user?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch events
      const eventsResponse = await fetch(`/api/organizer/events?userId=${session?.user?.id}`);
      let eventsData;
  
      if (!eventsResponse.ok) {
        if (eventsResponse.status === 404) {
          console.log("No events found for this organizer.");
          setEvents([]); // No events exist, set to empty array
        } else {
          const errorText = await eventsResponse.text();
          console.error(`Events API error - Status: ${eventsResponse.status}`, errorText);
          throw new Error(`Events fetch failed with status: ${eventsResponse.status}`);
        }
      } else {
        const eventsText = await eventsResponse.text();
        console.log("Raw events response:", eventsText);
        try {
          eventsData = JSON.parse(eventsText);
          const processedEvents = processEvents(eventsData.events, []); // Use empty transactions for now
          setEvents(processedEvents);
        } catch (parseError) {
          console.error("Failed to parse events response:", parseError);
          console.error("Response content:", eventsText);
          throw new Error("Invalid JSON in events response");
        }
      }
  
      // Fetch transactions
      const transactionsResponse = await fetch(`/api/organizer/transactions?userId=${session?.user?.id}`);
      let transactionsData;
  
      if (!transactionsResponse.ok) {
        if (transactionsResponse.status === 404) {
          console.log("No transactions found for this organizer.");
          setTransactions([]); // No transactions exist, set to empty array
        } else {
          const errorText = await transactionsResponse.text();
          console.error(`Transactions API error - Status: ${transactionsResponse.status}`, errorText);
          throw new Error(`Transactions fetch failed with status: ${transactionsResponse.status}`);
        }
      } else {
        const transactionsText = await transactionsResponse.text();
        console.log("Raw transactions response:", transactionsText);
        try {
          transactionsData = JSON.parse(transactionsText);
          setTransactions(transactionsData.transactions);
        } catch (parseError) {
          console.error("Failed to parse transactions response:", parseError);
          console.error("Response content:", transactionsText);
          throw new Error("Invalid JSON in transactions response");
        }
      }
  
      // Process data only if both fetches succeed
      if (eventsResponse.ok && transactionsResponse.ok) {
        const processedEvents = processEvents(eventsData.events, transactionsData.transactions);
        setEvents(processedEvents);
        const stats = calculateStatistics(processedEvents, transactionsData.transactions);
        setStatistics(stats);
      } else if (eventsResponse.ok) {
        const processedEvents = processEvents(eventsData.events, []);
        setEvents(processedEvents);
        setStatistics(calculateStatistics(processedEvents, []));
      } else {
        setStatistics({
          totalEvents: 0,
          totalTransactions: 0,
          totalRevenue: 0,
          totalSeats: 0,
          soldSeats: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setEvents([]);
      setTransactions([]);
      setStatistics({
        totalEvents: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        totalSeats: 0,
        soldSeats: 0,
      });
    }
    setLoading(false);
  };

  const processEvents = (events: Event[], transactions: ExtendedTransaction[]): ExtendedEvent[] => {
    return events.map(event => {
      const eventTransactions = transactions.filter(
        t => t.eventId === event.id && t.status === 'PAID'
      );
      const soldSeats = eventTransactions.reduce((sum, t) => sum + t.ticketQuantity, 0);
      const totalRevenue = eventTransactions.reduce((sum, t) => sum + t.finalPrice, 0);
      return { ...event, soldSeats, totalRevenue, averageRating: event.averageRating };
    });
  };

  const calculateStatistics = (events: ExtendedEvent[], transactions: ExtendedTransaction[]): StatSummary => {
    const totalEvents = events.length;
    const totalTransactions = transactions.length;
    const totalRevenue = transactions
      .filter(t => t.status === 'PAID')
      .reduce((sum, t) => sum + t.finalPrice, 0);
    const totalSeats = events.reduce((sum, e) => sum + e.seats, 0);
    const soldSeats = events.reduce((sum, e) => sum + (e.soldSeats || 0), 0);
    return { totalEvents, totalTransactions, totalRevenue, totalSeats, soldSeats };
  };

  const getSalesData = () => {
    let groupByFormat: string;
    let dateFormat: string;
    switch (timeRange) {
      case 'year':
        groupByFormat = 'yyyy-MM';
        dateFormat = 'MMM yyyy';
        break;
      case 'month':
        groupByFormat = 'yyyy-MM-dd';
        dateFormat = 'd MMM';
        break;
      case 'week':
        groupByFormat = 'yyyy-MM-dd';
        dateFormat = 'EEE';
        break;
      default:
        groupByFormat = 'yyyy-MM-dd';
        dateFormat = 'd MMM';
    }
    const groupedData: GroupedData = {};
    transactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      const formattedDate = format(date, groupByFormat);
      if (!groupedData[formattedDate]) {
        groupedData[formattedDate] = { sales: 0, revenue: 0 };
      }
      if (transaction.status === 'PAID') {
        groupedData[formattedDate].sales += transaction.ticketQuantity;
        groupedData[formattedDate].revenue += transaction.finalPrice;
      }
    });
    return Object.entries(groupedData)
      .map(([date, data]) => ({
        date: format(new Date(date), dateFormat),
        sales: data.sales,
        revenue: data.revenue / 100
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getStatusDistribution = () => {
    const statusCounts: Record<TransactionStatus, number> = {
      'PENDING': 0,
      'WAITING_ADMIN': 0,
      'PAID': 0,
      'EXPIRED': 0,
      'CANCELED': 0
    };
    transactions.forEach(transaction => {
      statusCounts[transaction.status]++;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: formatStatus(status as TransactionStatus),
      value: count
    }));
  };

  const getEventPerformanceData = () => {
    const topEvents = [...events]
      .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
      .slice(0, 5);
    return topEvents.map(event => ({
      name: event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title,
      revenue: (event.totalRevenue || 0) / 100,
      ticketsSold: event.soldSeats || 0
    }));
  };

  const formatStatus = (status: TransactionStatus): string => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'WAITING_ADMIN': return 'Waiting Approval';
      case 'PAID': return 'Paid';
      case 'EXPIRED': return 'Expired';
      case 'CANCELED': return 'Canceled';
      default: return status;
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Pending</Badge>;
      case 'WAITING_ADMIN':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Waiting Approval</Badge>;
      case 'PAID':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Paid</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Expired</Badge>;
      case 'CANCELED':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Canceled</Badge>;
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount / 100);
  };

  const formatDate = (date: Date | string): string => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  const updateTransactionStatus = async (transactionId: number, newStatus: TransactionStatus) => {
    try {
      await fetch(`/api/organizer/transaction/${transactionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error('Failed to update transaction status:', error);
    }
  };

  const toggleEventExpand = (eventId: number) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  const viewTransactionDetails = (transactionId: number) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      setSelectedTransaction(transaction);
      setIsTransactionDetailsOpen(true);
    }
  };

  const resendTicket = async (transactionId: number) => {
    try {
      await fetch(`/api/organizer/transaction/${transactionId}/resend-ticket`, { method: 'POST' });
      alert('Ticket resent successfully!');
    } catch (error) {
      console.error('Failed to resend ticket:', error);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Client-side password validation ---
    if (profileData.newPassword) {
      if (profileData.newPassword !== profileData.confirmPassword) {
        alert("New passwords don't match!");
        return;
      }
      if (!profileData.currentPassword) {
        // Require current password only if changing password
        alert("Please enter your current password to set a new one.");
        return;
      }
    }

    // --- Prepare the request body ---
    const bodyPayload: { name: string; currentPassword?: string; newPassword?: string } = {
      name: profileData.name,
    };
    // Only include password fields if a new password is being set
    if (profileData.newPassword && profileData.currentPassword) {
        bodyPayload.currentPassword = profileData.currentPassword;
        bodyPayload.newPassword = profileData.newPassword;
    } else if (profileData.currentPassword && !profileData.newPassword) {
        // Optional: You might want to send currentPassword even if only name changes,
        // depending on your API's security requirements. If not needed, remove this else if.
        // If your API *only* needs currentPassword when *changing* password, this can be removed.
        // bodyPayload.currentPassword = profileData.currentPassword; // Example: Send if API requires it for name change too
    }


    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload) // Send the carefully constructed payload
      });

      // --- Robust Error Handling ---
      if (!response.ok) {
        let errorMessage = `Failed to update profile. Status: ${response.status} ${response.statusText}`;
        try {
          // Attempt to read the body as text first
          const errorBody = await response.text();
          console.error("Server error response body:", errorBody); // Log the raw response for debugging

          // *Now* try to parse it as JSON
          if (errorBody) {
             const data = JSON.parse(errorBody);
             errorMessage = data.message || errorMessage; // Use JSON message if available
          } else {
             // Handle empty response body case
             errorMessage = `Failed to update profile. Status: ${response.status} ${response.statusText} (No error details provided)`;
          }
        } catch (parseError) {
          // Parsing failed, it wasn't JSON. The 'errorMessage' already has status/statusText.
          console.error("Failed to parse error response as JSON:", parseError);
          // You could potentially include the raw 'errorBody' in the error if it's helpful and not too large
          // errorMessage += `\nServer Response: ${errorBody.substring(0, 100)}...`; // Example
        }
        throw new Error(errorMessage); // Throw the constructed error message
      }

      // --- Success Handling ---
      // Optional: Check if the success response has a body you need to parse
      // const successData = await response.json(); // If PUT returns updated user data, for example

      if (session?.user) {
        session.user.name = profileData.name; // Update client-side session immediately
        // Consider if you need to refresh the session fully if password changes
      }
      setIsProfileModalOpen(false);
      alert('Profile updated successfully!');
      // Clear password fields after successful update
      setProfileData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));

    } catch (error) {
      console.error('Error updating profile:', error);
      // Display the potentially more detailed error message from the 'throw' above
      alert(error instanceof Error ? error.message : 'An unexpected error occurred while updating profile.');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-lg font-medium">Loading dashboard...</span>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-bold text-gray-900">Authentication Required</h2>
        <p className="mt-2 text-gray-600">Please sign in to access the organizer dashboard.</p>
        <Button className="mt-4" asChild>
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Organizer Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session.user.name || 'Organizer'}!</p>
        </div>
        <Button className="bg-secondary-600 hover:bg-secondary-700">
          <Plus className="mr-2 h-5 w-5" />
          Create New Event
        </Button>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid w-full grid-cols-3 md:w-auto md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">My Events</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Total Revenue</span>
                  <BarChart3 className="h-5 w-5" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(statistics.totalRevenue)}</div>
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
                <p className="mt-2 text-sm text-gray-500">Out of {statistics.totalSeats} available seats</p>
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
          <div className="grid gap-6 pt-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Recent Sales</CardTitle>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
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
                    <AreaChart data={getSalesData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="sales" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Transaction Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie data={getStatusDistribution()} cx="50%" cy="50%" innerRadius={60} outerRadius={90} fill="#8884d8" paddingAngle={2} dataKey="value">
                        {getStatusDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events
                    .filter(event => new Date(event.startDate) > new Date())
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .slice(0, 3)
                    .map(event => (
                      <div key={event.id} className="flex items-center rounded-lg border border-gray-200 p-4">
                        <div className="relative mr-4 h-16 w-16 overflow-hidden rounded-lg">
                          {event.image ? (
                            <Image src={event.image} alt={event.title} fill className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-200">
                              <Calendar className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{event.title}</h3>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="mr-1 h-3 w-3" />
                            <span>{formatDate(event.startDate)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-primary-600">{formatCurrency(event.totalRevenue || 0)}</div>
                          <div className="text-sm text-gray-500">{event.soldSeats || 0}/{event.seats} tickets</div>
                        </div>
                      </div>
                    ))}
                  {events.filter(event => new Date(event.startDate) > new Date()).length === 0 && (
                    <div className="flex h-24 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-4 text-center">
                      <p className="text-gray-500">No upcoming events scheduled</p>
                      <Button variant="outline" size="sm" className="mt-2 text-primary-600">
                        <Plus className="mr-1 h-4 w-4" />
                        Create an Event
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle>My Events</CardTitle>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Search events..." className="pl-8" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
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
                  <Button className="bg-secondary-600 hover:bg-secondary-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Event
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map(event => (
                    <div key={event.id} className="overflow-hidden rounded-lg border border-gray-200">
                      <div className="group flex cursor-pointer items-center justify-between bg-white p-4 hover:bg-gray-50" onClick={() => toggleEventExpand(event.id)}>
                        <div className="flex items-center">
                          <div className="relative mr-4 h-16 w-16 overflow-hidden rounded-lg">
                            {event.image ? (
                              <Image src={event.image} alt={event.title} fill className="object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gray-200">
                                <Calendar className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">{event.title}</h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                <span>{formatDate(event.startDate)}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                <span>{format(new Date(event.startDate), 'h:mm a')}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="mr-1 h-3 w-3" />
                                <span>{event.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium text-primary-600">{formatCurrency(event.totalRevenue || 0)}</div>
                            <div className="text-xs text-gray-500">{event.soldSeats || 0}/{event.seats} tickets</div>
                          </div>
                          {expandedEventId === event.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                        </div>
                      </div>
                      {expandedEventId === event.id && (
                        <div className="border-t border-gray-200 bg-gray-50 p-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-700">Event Details</h4>
                              <div className="grid grid-cols-2 gap-y-1 text-sm">
                                <span className="text-gray-500">Genre:</span>
                                <span className="font-medium">{event.genre}</span>
                                <span className="text-gray-500">Start Date:</span>
                                <span className="font-medium">{formatDate(event.startDate)}</span>
                                <span className="text-gray-500">End Date:</span>
                                <span className="font-medium">{formatDate(event.endDate)}</span>
                                <span className="text-gray-500">Location:</span>
                                <span className="font-medium">{event.location}</span>
                                <span className="text-gray-500">Capacity:</span>
                                <span className="font-medium">{event.seats} seats</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-700">Sales Summary</h4>
                              <div className="grid grid-cols-2 gap-y-1 text-sm">
                                <span className="text-gray-500">Tickets Sold:</span>
                                <span className="font-medium">{event.soldSeats || 0}</span>
                                <span className="text-gray-500">Available:</span>
                                <span className="font-medium">{event.seats - (event.soldSeats || 0)}</span>
                                <span className="text-gray-500">Revenue:</span>
                                <span className="font-medium">{formatCurrency(event.totalRevenue || 0)}</span>
                                <span className="text-gray-500">Average Rating:</span>
                                <span className="font-medium">{event.averageRating ? event.averageRating.toFixed(1) + ' / 5.0' : 'No ratings'}</span>
                              </div>
                            </div>
                            <div className="flex flex-col justify-between gap-2">
                              <h4 className="font-medium text-gray-700">Actions</h4>
                              <div className="flex flex-col justify-end gap-2">
                                <Button size="sm" variant="outline" className="w-full justify-start">
                                  <img src="/icons/edit.svg" alt="Edit" className="mr-2 h-4 w-4" />
                                  Edit Event
                                </Button>
                                <Button size="sm" variant="outline" className="w-full justify-start">
                                  <img src="/icons/chart.svg" alt="Chart" className="mr-2 h-4 w-4" />
                                  View Analytics
                                </Button>
                                <Button size="sm" variant="outline" className="w-full justify-start">
                                  <img src="/icons/ticket.svg" alt="Ticket" className="mr-2 h-4 w-4" />
                                  Manage Tickets
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
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle>Ticket Transactions</CardTitle>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                <Select value={transactionStatusFilter} onValueChange={(value) => setTransactionStatusFilter(value as TransactionStatus | 'ALL')}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="WAITING_ADMIN">Waiting Approval</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="CANCELED">Canceled</SelectItem>
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
                  <p className="text-gray-500">Once customers start purchasing tickets for your events, transactions will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
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
                        {transactions
                          .filter(t => transactionStatusFilter === 'ALL' || t.status === transactionStatusFilter)
                          .map(transaction => (
                            <tr key={transaction.id} className="hover:bg-gray-50">
                              <td className="whitespace-nowrap px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">#{transaction.id}</div>
                                <div className="text-xs text-gray-500">{transaction.ticketQuantity} x {transaction.tierType}</div>
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                                    {transaction.user.image ? (
                                      <Image src={transaction.user.image} alt={transaction.user.name || ''} width={32} height={32} className="rounded-full" />
                                    ) : (
                                      <UserCheck className="h-4 w-4 text-gray-500" />
                                    )}
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">{transaction.user.name || 'Anonymous'}</div>
                                    <div className="text-xs text-gray-500">{transaction.user.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                <div className="text-sm text-gray-900">{transaction.event.title}</div>
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{formatCurrency(transaction.finalPrice)}</div>
                                {transaction.couponDiscount > 0 && (
                                  <div className="text-xs text-green-600">-{formatCurrency(transaction.couponDiscount)} discount</div>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">{getStatusBadge(transaction.status)}</td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(transaction.createdAt)}</td>
                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => viewTransactionDetails(transaction.id)} className="cursor-pointer">
                                      View Details
                                    </DropdownMenuItem>
                                    {transaction.status === 'WAITING_ADMIN' && (
                                      <>
                                        <DropdownMenuItem onClick={() => updateTransactionStatus(transaction.id, 'PAID')} className="cursor-pointer text-green-600">
                                          Approve Payment
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateTransactionStatus(transaction.id, 'CANCELED')} className="cursor-pointer text-red-600">
                                          Reject Payment
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {transaction.status === 'PAID' && (
                                      <DropdownMenuItem onClick={() => resendTicket(transaction.id)} className="cursor-pointer">
                                        Resend Ticket
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Revenue Over Time</CardTitle>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
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
                        <AreaChart data={getSalesData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency((value as number) * 100)} />
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
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
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
                        <AreaChart data={getSalesData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
              </div>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Event Performance Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getEventPerformanceData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={150} />
                          <Tooltip formatter={(value) => formatCurrency((value as number) * 100)} />
                          <Legend />
                          <Bar dataKey="revenue" name="Revenue" fill="#4F46E5" />
                          <Bar dataKey="ticketsSold" name="Tickets Sold" fill="#10B981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Transaction Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie data={getStatusDistribution()} cx="50%" cy="50%" innerRadius={60} outerRadius={90} fill="#8884d8" paddingAngle={2} dataKey="value" label>
                            {getStatusDistribution().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
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
        </TabsContent>
      </Tabs>

      {isTransactionDetailsOpen && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Transaction #{selectedTransaction.id}</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsTransactionDetailsOpen(false)}>
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium text-gray-700">Customer Details</h4>
                <div className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium">{selectedTransaction.user.name || 'Anonymous'}</span>
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium">{selectedTransaction.user.email}</span>
                  <span className="text-gray-500">Purchase Date:</span>
                  <span className="font-medium">{formatDate(selectedTransaction.createdAt)}</span>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Transaction Details</h4>
                <div className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
                  <span className="text-gray-500">Event:</span>
                  <span className="font-medium">{selectedTransaction.event.title}</span>
                  <span className="text-gray-500">Ticket Type:</span>
                  <span className="font-medium">{selectedTransaction.tierType}</span>
                  <span className="text-gray-500">Quantity:</span>
                  <span className="font-medium">{selectedTransaction.ticketQuantity}</span>
                  <span className="text-gray-500">Base Price:</span>
                  <span className="font-medium">{formatCurrency(selectedTransaction.basePrice)}</span>
                  {selectedTransaction.couponDiscount > 0 && (
                    <>
                      <span className="text-gray-500">Discount:</span>
                      <span className="font-medium text-green-600">-{formatCurrency(selectedTransaction.couponDiscount)}</span>
                    </>
                  )}
                  {selectedTransaction.pointsUsed > 0 && (
                    <>
                      <span className="text-gray-500">Points Used:</span>
                      <span className="font-medium">{selectedTransaction.pointsUsed} points</span>
                    </>
                  )}
                  <span className="text-gray-500">Final Price:</span>
                  <span className="font-bold">{formatCurrency(selectedTransaction.finalPrice)}</span>
                  <span className="text-gray-500">Status:</span>
                  <span>{getStatusBadge

(selectedTransaction.status)}</span>
                </div>
              </div>
            </div>
            {selectedTransaction.paymentProof && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700">Payment Proof</h4>
                <div className="mt-2 h-64 w-full overflow-hidden rounded-md border border-gray-200">
                  <Image src={selectedTransaction.paymentProof} alt="Payment Proof" width={800} height={600} className="h-full w-full object-contain" />
                </div>
              </div>
            )}
            {selectedTransaction.status === 'WAITING_ADMIN' && (
              <div className="mt-4 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => { updateTransactionStatus(selectedTransaction.id, 'CANCELED'); setIsTransactionDetailsOpen(false); }} className="border-red-200 text-red-600 hover:bg-red-50">
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Payment
                </Button>
                <Button variant="outline" onClick={() => { updateTransactionStatus(selectedTransaction.id, 'PAID'); setIsTransactionDetailsOpen(false); }} className="border-green-200 text-green-600 hover:bg-green-50">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve Payment
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Edit Profile</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsProfileModalOpen(false)}>
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <Input className="mt-1 text-black focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" type="text" name="name" value={profileData.name} onChange={handleProfileChange}  />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <Input type="email" value={profileData.email} disabled className="mt-1 text-black focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                <p className="mt-1 text-xs text-gray-500">Email address cannot be changed</p>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium">Change Password</h4>
                <p className="text-xs text-gray-500">Leave blank if you don't want to change your password</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                <Input type="password" name="currentPassword" value={profileData.currentPassword} onChange={handleProfileChange} className="mt-1 text-black focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <Input type="password" name="newPassword" value={profileData.newPassword} onChange={handleProfileChange} className="mt-1 text-black focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <Input type="password" name="confirmPassword" value={profileData.confirmPassword} onChange={handleProfileChange} className="mt-1 text-black focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div className="flex justify-end">
                <Button onClick={updateProfile} className="bg-primary-600 hover:bg-primary-700">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6">
        <Button onClick={() => setIsProfileModalOpen(true)} className="rounded-full h-12 w-12 p-0 bg-secondary-600 hover:bg-secondary-700">
          <UserCheck className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
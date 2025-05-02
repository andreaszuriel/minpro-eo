'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar, BarChart3, ListChecks, PieChart, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';
import type { StatSummary, SalesData, StatusDistribution, ExtendedEvent } from '@/components/molecules/OrganizerDashboard'; 

// --- Constants ---
const COLORS = ['#4F46E5', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6'];

// --- Interfaces ---
interface DashboardOverviewProps {
  statistics: StatSummary;
  salesData: SalesData;
  statusDistribution: StatusDistribution;
  upcomingEvents: ExtendedEvent[];
  timeRange: string;
  setTimeRange: (value: string) => void;
  userId: string;
}

// --- Component ---
export default function DashboardOverview({
  statistics,
  salesData,
  statusDistribution,
  upcomingEvents,
  timeRange,
  setTimeRange,
  userId,
}: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Stat Cards */}
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

      {/* Charts */}
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
                    <linearGradient id="colorRevenueOverview" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSalesOverview" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4F46E5" fillOpacity={1} fill="url(#colorRevenueOverview)" />
                  <Area type="monotone" dataKey="sales" name="Tickets" stroke="#10B981" fillOpacity={1} fill="url(#colorSalesOverview)" />
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

      {/* Upcoming Events */}
      <Card>
        <CardHeader><CardTitle className="text-primary-700 text-lg">Upcoming Events</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.slice(0, 3).map(event => (
              <Link href={`/organizer/events/edit/${event.id}`} key={event.id} className="block hover:bg-gray-50 rounded-lg border border-gray-200 p-4 transition-colors">
                <div className="flex items-center">
                  <div className="relative mr-4 h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                  {event.image ? <Image src={event.image} alt={event.title} fill className="object-cover" sizes="48px" /> : <Calendar className="h-full w-full bg-gray-200 p-3 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                  <h3 className="text-black font-medium text-sm truncate">{event.title}</h3>
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
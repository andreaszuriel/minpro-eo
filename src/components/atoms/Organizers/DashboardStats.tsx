'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

import type { SalesData, StatusDistribution, EventPerformanceData } from '@/components/molecules/OrganizerDashboard'; // Adjust path if needed

// --- Constants ---
const COLORS = ['#4F46E5', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6'];

// --- Interfaces ---
interface DashboardStatsProps {
  salesData: SalesData;
  statusDistribution: StatusDistribution;
  eventPerformanceData: EventPerformanceData;
  timeRange: string;
  setTimeRange: (value: string) => void;
}

// --- Component ---
export default function DashboardStats({
  salesData,
  statusDistribution,
  eventPerformanceData,
  timeRange,
  setTimeRange,
}: DashboardStatsProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-primary-700 font-bold text-xl">Performance Statistics</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">

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
                     <Tooltip formatter={(value) => [`${value}`, 'Tickets Sold']} labelStyle={{ fontSize: '12px' }} itemStyle={{ fontSize: '12px' }} />
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
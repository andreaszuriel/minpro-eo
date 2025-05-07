'use client';

import { useState, useEffect, JSX } from 'react';
import Image from 'next/image';
import { Toaster } from 'sonner';
import {
  Search, TicketCheck, Calendar, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import TicketDetailsModal from './TicketDetailsModal';
import type { Transaction, TransactionStatus, Ticket, Promotion } from '@prisma/client';

// Extended types for our components
export type ExtendedTicketTransaction = Transaction & {
  event: { 
    id: number;
    title: string; 
    image: string | null;
    startDate: Date;
    location: string;
  };
  tickets: (Ticket & {
    serialCode: string;
    isUsed: boolean;
  })[];
  promotion: Promotion | null; 
};

interface CustomerTicketsProps {
  userId: string;
}

function CustomerTickets({ userId }: CustomerTicketsProps) {
  const [transactions, setTransactions] = useState<ExtendedTicketTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<ExtendedTicketTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<ExtendedTicketTransaction | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Fetch Ticket Transactions ---
  useEffect(() => {
    const fetchTickets = async () => {
      if (!userId) { // <-- Add a check here too for good measure
        console.error("Cannot fetch tickets, userId is missing!");
        setError("User ID is missing.");
        setIsLoading(false);
        return;
     }
     console.log("Fetching tickets for userId:", userId); // <-- ADD THIS LOG
     setIsLoading(true);
      
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/user/${userId}/tickets`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch tickets');
        }
        
        const data = await response.json();
        setTransactions(data.transactions);
      } catch (err) {
        console.error("Error fetching tickets:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [userId]);

  // --- Apply filters ---
  useEffect(() => {
    let filtered = [...transactions];
    
    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => (
        t.event.title.toLowerCase().includes(term) ||
        t.tierType.toLowerCase().includes(term) ||
        t.id.toString().includes(term)
      ));
    }
    
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, statusFilter]);

  // --- Helper Functions ---
  const formatStatus = (status: TransactionStatus): string => {
    const statusMap: Record<TransactionStatus, string> = {
      PENDING: 'Pending Payment',
      WAITING_ADMIN: 'Payment Verification',
      PAID: 'Paid',
      EXPIRED: 'Expired',
      CANCELED: 'Canceled'
    };
    
    return statusMap[status] || status;
  };
  
  const getStatusBadge = (status: TransactionStatus): JSX.Element => {
    const statusStyles: Record<TransactionStatus, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      WAITING_ADMIN: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
      CANCELED: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}>
        {formatStatus(status)}
      </span>
    );
  };
  
  const formatCurrency = (amount: number, currency: string = 'IDR'): string => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTimeLeft = (deadline: Date): string => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    
    if (now > deadlineDate) {
      return 'Expired';
    }
    
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 24) {
      return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} left`;
    }
    
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
  };

  // --- Loading and Error States ---
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-10">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary-500 border-r-2 border-b-2 mr-2"></div>
          <span>Loading tickets...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-red-700">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Render Main Component ---
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <CardTitle className="text-primary-700 font-bold text-lg">My Tickets</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-700" />
              <Input
                placeholder="Search event, ticket type..."
                className="pl-8 text-primary-500 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TransactionStatus | 'ALL')}>
              <SelectTrigger className="w-full sm:w-40 bg-primary-400 text-white hover:bg-white hover:text-primary-600 border border-primary-600 transition-colors h-9 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent
                className="bg-primary-400 text-white data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-2 duration-200 text-xs"
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
          {transactions.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-6 text-center">
              <TicketCheck className="mb-2 h-10 w-10 text-gray-400" />
              <h3 className="text-black mb-1 text-lg font-medium">No Tickets Found</h3>
              <p className="text-gray-600">You haven't purchased any tickets yet.</p>
              <Button className="mt-4 bg-primary-500 hover:bg-primary-600 text-white" size="sm" asChild>
                <a href="/events">Browse Events</a>
              </Button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-6 text-center">
              <Search className="mb-2 h-10 w-10 text-gray-400" />
              <h3 className="text-black mb-1 text-lg font-medium">No Matching Tickets</h3>
              <p className="text-gray-600">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full min-w-[800px] divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-800">Event</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-800">Order ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-800">Date & Venue</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-800">Tickets</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-800">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-800">Total</th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredTransactions.map((transaction, index) => (
                    <tr 
                      key={transaction.id} 
                      className={`hover:bg-gray-200 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      onClick={() => { setSelectedTransaction(transaction); setIsDetailsOpen(true); }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 flex-shrink-0 rounded-md bg-gray-100 overflow-hidden">
                            {transaction.event.image ? (
                              <Image 
                                src={transaction.event.image} 
                                alt={transaction.event.title} 
                                width={40} 
                                height={40} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Calendar className="h-full w-full p-2 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate max-w-xs">{transaction.event.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-900">#{transaction.id}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{format(new Date(transaction.event.startDate), 'MMM d, yyyy')}</div>
                        <div className="text-xs text-gray-600 truncate max-w-[150px]">{transaction.event.location}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-medium text-gray-900">{transaction.ticketQuantity} × {transaction.tierType}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {getStatusBadge(transaction.status)}
                        {transaction.status === 'PENDING' && (
                          <div className="text-xs text-yellow-600 mt-1">
                            {getTimeLeft(new Date(transaction.paymentDeadline))}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-medium text-gray-900">{formatCurrency(transaction.finalPrice)}</div>
                        {transaction.couponDiscount > 0 && (
                          <div className="text-xs text-green-600">-{formatCurrency(transaction.couponDiscount)}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-primary-500 text-primary-600 hover:bg-primary-50"
                          onClick={(e) => { 
                            e.stopPropagation();
                            setSelectedTransaction(transaction);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <Info className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTransaction && (
        <TicketDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          transaction={selectedTransaction}
          formatStatus={formatStatus}
          getStatusBadge={getStatusBadge}
          formatCurrency={formatCurrency}
        />
      )}
    </>
  );
}

export default CustomerTickets;
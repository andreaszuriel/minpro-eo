'use client';

import { useState, useEffect, JSX } from 'react';
import Image from 'next/image';
import { toast, Toaster } from 'sonner';
import {
  Search, MoreHorizontal, UserCheck, ListChecks
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import type { Transaction, TransactionStatus } from '@prisma/client';
import TransactionDetailsModal from './TransactionDetailsModal';

// --- Interfaces ---
export type ExtendedTransaction = Transaction & {
  event: { title: string; image: string | null };
  user: { name: string | null; email: string; image?: string | null };
};

interface DashboardTransactionsProps {
  initialTransactions: ExtendedTransaction[];
  formatStatus: (status: TransactionStatus) => string;
  getStatusBadge: (status: TransactionStatus) => JSX.Element;
  formatCurrency: (amount: number, currency: string) => string;
}

// --- Component ---
function DashboardTransactionsComponent({
  initialTransactions,
  formatStatus,
  getStatusBadge,
  formatCurrency
}: DashboardTransactionsProps) {
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'ALL'>('ALL');
  const [selectedTransaction, setSelectedTransaction] = useState<ExtendedTransaction | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>(initialTransactions);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Sync state if initialTransactions prop changes
  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  // --- Action Handlers ---
  const updateStatus = async (id: number, status: TransactionStatus) => {
    const originalTransactions = [...transactions];
    const transactionIndex = transactions.findIndex(t => t.id === id);
    if (transactionIndex === -1) return;

    // Optimistically update UI
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      
      // Success toast notification
      toast.success(`Status Updated`, {
        description: `Transaction #${id} status updated to ${formatStatus(status)}.`,
        duration: 4000,
      });
    } catch (error) {
      console.error('Failed to update transaction status:', error);
      
      // Revert UI on failure
      setTransactions(originalTransactions);
      
      // Error toast
      toast.error('Update Failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
        duration: 5000,
      });
    }
  };

  const resendTicket = async (id: number) => {
    try {
      const res = await fetch(`/api/transactions/${id}/resend-ticket`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to resend ticket');
      }
      
      // Success toast
      toast.success('Ticket Resent', {
        description: `Ticket for transaction #${id} was successfully resent to the customer.`,
        duration: 4000,
      });
    } catch (error) {
      console.error('Failed to resend ticket:', error);
      
      // Error toast
      toast.error('Resend Failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
        duration: 5000,
      });
    }
  };

  // Handle transaction refresh after modal actions
  const handleTransactionUpdate = (id: number, status: TransactionStatus) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  // --- Filtering Logic ---
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

  // --- Render ---
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
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
              <SelectTrigger className="w-full sm:w-40 bg-primary-400 text-white hover:bg-white hover:text-primary-600 border border-primary-600 transition-colors h-9 text-xs">
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
          {initialTransactions.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-6 text-center">
              <ListChecks className="mb-2 h-10 w-10 text-gray-400" />
              <h3 className="text-black mb-1 text-lg font-medium">No Transactions Found</h3>
              <p className="text-gray-600">No ticket purchases have been made yet.</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-6 text-center">
              <Search className="mb-2 h-10 w-10 text-gray-400" />
              <h3 className="text-black mb-1 text-lg font-medium">No Matching Transactions</h3>
              <p className="text-gray-600">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full min-w-[800px] divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-800">Transaction</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-800">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-800">Event</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-800">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-800">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-800">Date</th>
                    <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredTransactions.map((t, index) => (
                    <tr 
                      key={t.id} 
                      className={`hover:bg-gray-200 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      onClick={() => { setSelectedTransaction(t); setIsDetailsOpen(true); }}
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-medium text-gray-900">#{t.id}</div>
                        <div className="text-xs text-gray-800">{t.ticketQuantity} x {t.tierType}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center">
                          <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {t.user.image ? <Image src={t.user.image} alt={t.user.name || ''} width={28} height={28} className="rounded-full" /> : <UserCheck className="h-4 w-4 text-gray-800" />}
                          </div>
                          <div className="ml-2 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{t.user.name || 'Anonymous'}</div>
                            <div className="text-xs text-gray-800 truncate">{t.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-900 truncate max-w-xs">{t.event.title}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-medium text-gray-900">{formatCurrency(t.finalPrice, 'IDR')}</div>
                        {t.couponDiscount > 0 && <div className="text-xs text-green-600">-{formatCurrency(t.couponDiscount, 'IDR')}</div>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{getStatusBadge(t.status)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-800">{format(new Date(t.createdAt), 'PP')}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="lg" className="cursor-pointer text-black h-7 w-7 ml-24 p-0 border border-gray-700 rounded-md flex items-center hover:bg-primary-500 justify-center data-[state=open]:bg-primary-500 hover:text-white">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-black text-xs">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedTransaction(t); setIsDetailsOpen(true); }} className="bg-white cursor-pointer hover:bg-primary-500 text-gray-700 hover:text-white">View Details</DropdownMenuItem>
                            {t.status === 'WAITING_ADMIN' && (
                              <>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatus(t.id, 'PAID'); }} className="cursor-pointer hover:bg-secondary-50 hover:text-secondary-700 text-secondary-600 bg-white">Approve Payment</DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatus(t.id, 'CANCELED'); }} className="cursor-pointer hover:bg-red-50 hover:text-red-700 text-red-600 bg-white">Reject Payment</DropdownMenuItem>
                              </>
                            )}
                            {t.status === 'PAID' && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); resendTicket(t.id); }} className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 text-blue-600">Resend Ticket</DropdownMenuItem>}
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

      {/* Transaction Details Modal - Imported as separate component */}
      {selectedTransaction && (
        <TransactionDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          transaction={selectedTransaction}
          formatStatus={formatStatus}
          getStatusBadge={getStatusBadge}
          formatCurrency={formatCurrency}
          onTransactionUpdate={handleTransactionUpdate}
        />
      )}
    </>
  );
}

export default DashboardTransactionsComponent;
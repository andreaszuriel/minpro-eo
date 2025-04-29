'use client';

import { JSX, useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  XCircle, UserCheck, Ticket, ImageIcon,
  Loader2, CircleCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { TransactionStatus } from '@prisma/client';
import type { ExtendedTransaction } from './DashboardTransactions';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: ExtendedTransaction;
  formatStatus: (status: TransactionStatus) => string;
  getStatusBadge: (status: TransactionStatus) => JSX.Element;
  formatCurrency: (amount: number, currency: string) => string;
  onTransactionUpdate?: (id: number, status: TransactionStatus) => void;
}

const TransactionDetailsModal = ({
  isOpen,
  onClose,
  transaction,
  formatStatus,
  getStatusBadge,
  formatCurrency,
  onTransactionUpdate
}: TransactionDetailsModalProps) => {
  const [loadingAction, setLoadingAction] = useState<{
    id: number | null;
    type: 'approve' | 'reject' | 'resend' | null;
  }>({ id: null, type: null });

  // Check if a specific action is loading
  const isActionLoading = (id: number, type: 'approve' | 'reject' | 'resend') => {
    return loadingAction.id === id && loadingAction.type === type;
  };

  const updateStatus = async (id: number, status: TransactionStatus) => {
    const actionType = status === 'PAID' ? 'approve' : 'reject';
    
    // Set loading state
    setLoadingAction({ id, type: actionType });
    
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
      
      if (res.ok && onTransactionUpdate) {
        onTransactionUpdate(id, status);
      }
      
      // Close modal on success
      setTimeout(() => onClose(), 800);
    } catch (error) {
      console.error('Failed to update transaction status:', error);
      
      // Error toast
      toast.error('Update Failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
        duration: 5000,
      });
    } finally {
      // Clear loading state
      setLoadingAction({ id: null, type: null });
    }
  };

  const resendTicket = async (id: number) => {
    // Set loading state
    setLoadingAction({ id, type: 'resend' });
    
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
      
      if (res.ok && onTransactionUpdate) {
        onTransactionUpdate(id, transaction.status);
      }

      // Close modal on success
      setTimeout(() => onClose(), 800);
    } catch (error) {
      console.error('Failed to resend ticket:', error);
      
      // Error toast
      toast.error('Resend Failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
        duration: 5000,
      });
    } finally {
      // Clear loading state
      setLoadingAction({ id: null, type: null });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl overflow-hidden bg-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 rounded-lg p-2 mr-3 shadow-lg">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Transaction #{transaction.id}</h3>
                <p className="text-sm text-white/80">{format(new Date(transaction.createdAt), 'PPp')}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-primary-500/20 hover:text-white"
            >
              <XCircle className="h-7 w-7" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Status Badge - Prominent at top */}
          <div className="mb-4 flex justify-center">
            {getStatusBadge(transaction.status)}
          </div>

          {/* Main Content Sections */}
          <div className="space-y-6">
            {/* Customer Section */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="flex items-center text-gray-800 font-medium mb-3">
                <UserCheck className="h-4 w-4 mr-2 text-primary-600" />
                Customer Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {transaction.user.image ? (
                      <Image 
                        src={transaction.user.image} 
                        alt={transaction.user.name || ''}
                        width={48} 
                        height={48} 
                        className="rounded-full" 
                      />
                    ) : (
                      <UserCheck className="h-6 w-6 text-gray-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{transaction.user.name || 'Anonymous'}</div>
                    <div className="text-sm text-gray-600">{transaction.user.email}</div>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center">
                    <span className="w-24 text-gray-600">Purchase Date:</span>
                    <span className="font-medium text-gray-800">{format(new Date(transaction.createdAt), 'PP')}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 text-gray-600">Purchase Time:</span>
                    <span className="font-medium text-gray-800">{format(new Date(transaction.createdAt), 'p')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event & Ticket Details */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="flex items-center text-gray-800 font-medium mb-3">
                <Ticket className="h-4 w-4 mr-2 text-primary-600" />
                Event & Ticket Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-600 mb-1">Event:</span>
                    <span className="font-medium text-gray-800 text-base">{transaction.event.title}</span>
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="w-24 text-gray-600">Ticket Type:</span>
                    <span className="font-medium text-gray-800">{transaction.tierType}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 text-gray-600">Quantity:</span>
                    <span className="font-medium text-gray-800">{transaction.ticketQuantity}</span>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="space-y-1 text-sm">
                  <div className="flex items-center">
                    <span className="w-24 text-gray-600">Base Price:</span>
                    <span className="font-medium text-gray-800">{formatCurrency(transaction.basePrice, 'IDR')}</span>
                  </div>
                  {transaction.couponDiscount > 0 && (
                    <div className="flex items-center">
                      <span className="w-24 text-gray-600">Discount:</span>
                      <span className="font-medium text-green-600">-{formatCurrency(transaction.couponDiscount, 'IDR')}</span>
                    </div>
                  )}
                  {transaction.pointsUsed > 0 && (
                    <div className="flex items-center">
                      <span className="w-24 text-gray-600">Points Used:</span>
                      <span className="font-medium text-gray-800">{transaction.pointsUsed} pts</span>
                    </div>
                  )}
                  <div className="flex items-center pt-2 border-t border-gray-200 mt-2">
                    <span className="w-24 text-gray-700">Final Price:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(transaction.finalPrice, 'IDR')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Proof Section */}
            {transaction.paymentProof && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="flex items-center text-gray-800 font-medium mb-3">
                  <ImageIcon className="h-4 w-4 mr-2 text-primary-600" />
                  Payment Proof
                </h4>
                <div className="flex justify-center p-2 bg-white rounded-lg border border-gray-200">
                  <a 
                    href={transaction.paymentProof} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block max-h-72 rounded-md overflow-hidden hover:opacity-90 transition-opacity"
                  >
                    <Image
                      src={transaction.paymentProof}
                      alt="Payment Proof"
                      width={300}
                      height={200}
                      className="max-h-full max-w-full object-contain"
                    />
                  </a>
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">Click image to view full size</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="mr-1 text-primary-600 font-medium">Status:</span>
              {formatStatus(transaction.status)}
            </div>
            <div className="flex space-x-2">
              {transaction.status === 'WAITING_ADMIN' && (
                <>
                  {/* Reject Button with Loading State */}
                  <Button
                    variant="outline"
                    onClick={() => updateStatus(transaction.id, 'CANCELED')}
                    disabled={isActionLoading(transaction.id, 'reject') || isActionLoading(transaction.id, 'approve')}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    {isActionLoading(transaction.id, 'reject') ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-1.5 h-4 w-4" />
                        Reject
                      </>
                    )}
                  </Button>
                  
                  {/* Approve Button with Loading State */}
                  <Button
                    onClick={() => updateStatus(transaction.id, 'PAID')}
                    disabled={isActionLoading(transaction.id, 'approve') || isActionLoading(transaction.id, 'reject')}
                    className="bg-secondary-600 hover:bg-secondary-700 text-white transition-all shadow-lg shadow-secondary-500/20 group"
                  >
                    {isActionLoading(transaction.id, 'approve') ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CircleCheck className="mr-1.5 h-4 w-4 transition-transform group-hover:scale-110" />
                        Approve
                      </>
                    )}
                  </Button>
                </>
              )}
              
              {/* Resend Ticket Button with Loading State */}
              {transaction.status === 'PAID' && (
                <Button
                  onClick={() => resendTicket(transaction.id)}
                  disabled={isActionLoading(transaction.id, 'resend')}
                  className="bg-primary-600 hover:bg-primary-700 text-white transition-all shadow-lg shadow-primary-500/20 group"
                >
                  {isActionLoading(transaction.id, 'resend') ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Ticket className="mr-1.5 h-4 w-4 transition-transform group-hover:scale-110" /> 
                      Resend Ticket
                    </>
                  )}
                </Button>
              )}
              
              {/* Close Button */}
              <Button
                variant="outline"
                onClick={onClose}
                className="border-slate-200 text-gray-700 bg-slate-100 hover:bg-slate-200"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
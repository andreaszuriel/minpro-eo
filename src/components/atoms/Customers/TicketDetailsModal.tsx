'use client';

import { JSX, useState } from 'react';
import Image from 'next/image';
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Download,
  Info,
  ChevronRight,
  Tag,
  Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import type { ExtendedTicketTransaction } from './DashboardTickets';
import type { TransactionStatus } from '@prisma/client';
import { useRouter } from 'next/navigation'; 
import Link from 'next/link';

interface TicketDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: ExtendedTicketTransaction;
  formatStatus: (status: TransactionStatus) => string;
  getStatusBadge: (status: TransactionStatus) => JSX.Element;
  formatCurrency: (amount: number, currency?: string) => string;
}

function TicketDetailsModal({
  isOpen,
  onClose,
  transaction,
  formatStatus,
  getStatusBadge,
  formatCurrency
}: TicketDetailsModalProps) {
  // Check if we have e-tickets available (paid status)
  const hasETickets = transaction.status === 'PAID' && transaction.tickets && transaction.tickets.length > 0;
  
  const TAX_RATE = 0.11;
  const router = useRouter();

  // Format date for display
  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'PPP');
  };
  
  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'h:mm a');
  };

  // Function to handle downloading a ticket
  const downloadTicket = (ticketId: string) => {
    window.open(`/api/tickets/${ticketId}/download`, '_blank');
    // Show success toast
    toast.success('Ticket Download Started', {
      description: 'Your ticket is downloading now.',
      duration: 3000,
    });
  };

  // Active ticket state for animation
  const [activeTicket, setActiveTicket] = useState<string | null>(null);

    // --- Financial Calculations ---
    let promotionDisplayAmount = 0;
    let promotionCodeDisplay = ''; // For display
    if (transaction.promotion && transaction.promotion.discount > 0) {
        promotionCodeDisplay = transaction.promotion.code;
        if (transaction.promotion.discountType === 'PERCENTAGE') {
            promotionDisplayAmount = (transaction.basePrice * transaction.promotion.discount) / 100;
        } else { // FIXED_AMOUNT
            promotionDisplayAmount = transaction.promotion.discount;
        }
    }
    
    const subtotalAfterDiscounts = transaction.basePrice - transaction.couponDiscount - promotionDisplayAmount;
    const taxAmount = subtotalAfterDiscounts > 0 ? subtotalAfterDiscounts * TAX_RATE : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogContent className="bg-white sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
        {/* Header with gradient background */}
        <DialogHeader className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 rounded-lg p-2 mr-3 shadow-lg">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  Ticket Order #{transaction.id}
                </DialogTitle>
                <p className="text-sm text-white/80">{formatDateTime(transaction.createdAt)}</p>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        {/* Status Badge - Prominent at top */}
        <div className="flex justify-center -mt-3 relative z-10">
          <div className="bg-white shadow-md rounded-full px-4 py-1.5 border border-gray-100">
            {getStatusBadge(transaction.status)}
          </div>
        </div>
        
        <div className="max-h-[calc(90vh-130px)] overflow-y-auto p-5">
          <Tabs defaultValue={hasETickets ? "tickets" : "details"} className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100 rounded-lg">
              <TabsTrigger 
                value="details" 
                className="cursor-pointer text-gray-600 rounded-md data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm"
              >
                Order Details
              </TabsTrigger>
              <TabsTrigger 
                value="tickets" 
                disabled={!hasETickets}
                className="cursor-pointer text-gray-600 rounded-md data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm"
              >
                My Tickets {hasETickets ? `(${transaction.ticketQuantity})` : ''}
              </TabsTrigger>
            </TabsList>
            
            {/* Order Details Tab */}
            <TabsContent value="details" className="pt-4 pb-2 focus:outline-none">
              <div className="space-y-6">
                {/* Event Information */}
                <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-medium text-primary-700 flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-primary-600" />
                      Event Information
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="flex gap-4">
                      <div className="h-24 w-24 rounded-md overflow-hidden bg-gray-100 shadow-md flex-shrink-0">
                        {transaction.event.image ? (
                          <Image 
                            src={transaction.event.image} 
                            alt={transaction.event.title} 
                            width={96} 
                            height={96} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Calendar className="h-full w-full p-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-primary-700 mb-2">{transaction.event.title}</h4>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="mr-2 h-4 w-4 text-primary-500" />
                            <span className="font-medium">{formatDateTime(transaction.event.startDate)}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="mr-2 h-4 w-4 text-primary-500" />
                            <span className="font-medium">{formatTime(transaction.event.startDate)}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="mr-2 h-4 w-4 text-primary-500" />
                            <span className="font-medium">{transaction.event.location}</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-primary-300 text-primary-600 hover:bg-primary-50 group transition-all"
                            asChild
                          >
                            <a href={`/events/${transaction.event.id}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                              View Event Page
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Order Summary */}
                <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-medium text-primary-700 flex items-center">
        <Info className="mr-2 h-4 w-4 text-primary-600" />
        Order Summary
        </h3>
        </div>
        <div className="p-4">
        <div className="space-y-3 text-sm"> 
        <div className="flex justify-between items-center py-1.5">
        <span className="text-gray-600">Status</span>
        <div>{getStatusBadge(transaction.status)}</div>
        </div>
                      
                      {transaction.status === 'PENDING' && (
                        <div className="flex justify-between items-center py-1.5 bg-yellow-50 px-3 rounded-md">
                          <span className="text-yellow-700">Payment Deadline</span>
                          <span className="text-yellow-800 font-medium">
                            {formatDateTime(transaction.paymentDeadline)} ({formatTime(transaction.paymentDeadline)})
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-gray-600">Ticket Type</span>
                        <span className="font-medium text-gray-800">{transaction.tierType}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-gray-600">Quantity</span>
                        <span className="font-medium text-gray-800">{transaction.ticketQuantity}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-gray-600">Price per Ticket</span>
                        <span className="font-medium text-gray-800">{formatCurrency(transaction.basePrice / transaction.ticketQuantity)}</span>
                      </div>

                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-gray-600">Total Base Price</span>
                        <span className="font-medium text-gray-800">{formatCurrency(transaction.basePrice)}</span>
                      </div>
                      
                      {transaction.couponDiscount > 0 && (
                        <div className="flex justify-between items-center py-1.5 bg-green-50 px-3 rounded-md">
                          <span className="text-green-700 flex items-center"><Tag className="w-3.5 h-3.5 mr-1"/>Coupon Discount</span>
                          <span className="text-green-700 font-medium">-{formatCurrency(transaction.couponDiscount)}</span>
                        </div>
                      )}

                      {promotionDisplayAmount > 0 && (
                        <div className="flex justify-between items-center py-1.5 bg-blue-50 px-3 rounded-md">
                           <span className="text-blue-700 flex items-center"><Tag className="w-3.5 h-3.5 mr-1"/>Promotion ({promotionCodeDisplay})</span>
                           <span className="text-blue-700 font-medium">-{formatCurrency(promotionDisplayAmount)}</span>
                        </div>
                      )}
                      
                      {transaction.pointsUsed > 0 && (
                        <div className="flex justify-between items-center py-1.5 bg-sky-50 px-3 rounded-md"> {/* Changed color slightly for points */}
                          <span className="text-sky-700">Points Used</span>
                          <span className="text-sky-700 font-medium">{transaction.pointsUsed} points</span>
                        </div>
                      )}

                      {(transaction.couponDiscount > 0 || promotionDisplayAmount > 0) && (
                        <div className="flex justify-between items-center py-1.5 border-t border-gray-200/60 mt-1.5 pt-1.5">
                            <span className="text-gray-700">Subtotal</span>
                            <span className="font-medium text-gray-800">{formatCurrency(subtotalAfterDiscounts)}</span>
                        </div>
                      )}
                      
                      {taxAmount > 0 && (
                         <div className="flex justify-between items-center py-1.5">
                            <span className="text-gray-600 flex items-center"><Percent className="w-3.5 h-3.5 mr-1"/>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                            <span className="font-medium text-gray-800">{formatCurrency(taxAmount)}</span>
                        </div>
                      )}
                      
                      <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center py-1.5">
                        <span className="text-gray-800 font-semibold">Total Amount</span>
                        <span className="font-bold text-lg text-primary-700">{formatCurrency(transaction.finalPrice)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Payment Instructions (for PENDING status) */}
                {transaction.status === 'PENDING' && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-yellow-800">Payment Required</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Please complete your payment before the deadline to secure your tickets.
                          You can view payment instructions in your email or by contacting support.
                        </p>
                          <Button 
                          asChild // Allows Button to wrap Link behavior
                          className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm shadow-yellow-500/20"
                        >
                          <Link href={`/payment-pending?transactionId=${transaction.id}`}>
                            View Payment Instructions
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Verification Notice (for WAITING_ADMIN status) */}
                {transaction.status === 'WAITING_ADMIN' && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-blue-800">Payment Verification in Progress</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          Your payment is being verified by our team. This usually takes 1-2 business days.
                          You'll receive a confirmation email once your tickets are ready.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Canceled Notice */}
                {transaction.status === 'CANCELED' && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-red-800">Order Canceled</h3>
                        <p className="text-sm text-red-700 mt-1">
                          This order has been canceled. If you believe this was done in error,
                          please contact our support team for assistance.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Expired Notice */}
                {transaction.status === 'EXPIRED' && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-gray-800">Payment Deadline Expired</h3>
                        <p className="text-sm text-gray-700 mt-1">
                          The payment deadline for this order has passed. If you still want to attend
                          this event, please create a new ticket order.
                        </p>
                        <Button className="mt-3 bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-500/20" asChild>
                          <a href={`/events/${transaction.event.id}`}>
                            Buy New Tickets
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Tickets Tab (only for PAID transactions) */}
            <TabsContent value="tickets" className="pt-4 pb-2 focus:outline-none">
              {hasETickets ? (
                <div className="space-y-6">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
                    <div className="flex items-start">
                      <Ticket className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-green-800">Your E-Tickets are Ready</h3>
                        <p className="text-sm text-green-700 mt-1">
                          Present these tickets at the venue entrance. Each ticket has a unique code
                          and can only be used once.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    {transaction.tickets.map((ticket, index) => (
                      <div 
                        key={ticket.serialCode} 
                        className={`rounded-lg border ${activeTicket === ticket.serialCode ? 'border-primary-400 shadow-md' : 'border-gray-200 shadow-sm'} p-4 transition-all duration-300 hover:shadow-md relative overflow-hidden`}
                        onClick={() => setActiveTicket(ticket.serialCode)}
                      >
                        {/* Decorative side indicator */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600"></div>
                        
                        <div className="flex justify-between items-start">
                          <div className="pl-3">
                            <h3 className="font-medium text-gray-900 flex items-center">
                              <span className="text-primary-700">Ticket #{index + 1}</span>
                              {ticket.isUsed && (
                                <span className="ml-2 bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">
                                  Used
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">Type: {transaction.tierType}</p>
                            <p className="font-mono text-xs text-gray-800 mt-2 bg-gray-100 p-1.5 rounded border border-gray-200 select-all">
                              {ticket.serialCode}
                            </p>
                            <div className="mt-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-primary-300 text-primary-600 hover:bg-primary-50 hover:border-primary-400 transition-all group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadTicket(ticket.id);
                                }}
                              >
                                <Download className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
                                Download Ticket
                              </Button>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <QRCodeSVG
                              value={ticket.serialCode}
                              size={100}
                              level="H"
                              className="rounded"
                            />
                          </div>
                        </div>
                        
                        {ticket.isUsed && (
                          <div className="mt-3 flex items-center bg-gray-100 text-gray-800 rounded px-3 py-1.5 text-xs ml-3">
                            <UserCheck className="h-3.5 w-3.5 mr-1.5 text-gray-600" />
                            This ticket has been used on {format(new Date(), 'PPP')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Event Information Card */}
                  <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-medium text-primary-700 flex items-center">
                        <Info className="mr-2 h-4 w-4 text-primary-600" />
                        Event Information
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="mr-2 h-4 w-4 text-primary-500" />
                          <span className="font-medium">{formatDateTime(transaction.event.startDate)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="mr-2 h-4 w-4 text-primary-500" />
                          <span className="font-medium">{formatTime(transaction.event.startDate)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="mr-2 h-4 w-4 text-primary-500" />
                          <span className="font-medium">{transaction.event.location}</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-primary-300 text-primary-600 hover:bg-primary-50 group transition-all"
                          asChild
                        >
                          <a href={`/events/${transaction.event.id}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            View Event Page
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Support Card */}
                  <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-medium text-primary-700">Need Help?</h3>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600">
                        If you have any questions about your tickets or need assistance,
                        please contact our support team.
                      </p>
                      <Button 
                        className="mt-3 bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-500/20 group"
                      >
                        Contact Support
                        <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 p-6 text-center bg-gray-50">
                  <Ticket className="mb-3 h-14 w-14 text-gray-400" />
                  <h3 className="text-black mb-2 text-lg font-medium">No Tickets Available</h3>
                  <p className="text-gray-600 max-w-sm">Tickets will be available once your payment is confirmed.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TicketDetailsModal;
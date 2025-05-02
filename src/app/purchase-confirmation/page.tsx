'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  CreditCard, 
  Ticket, 
  CheckCircle, 
  LoaderCircle,
  MapPin,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

// Purchase data type
interface PurchaseData {
  eventId: number;
  tier: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  eventDate: string;
  eventTime: string;
  currency: string;
  hasDiscount: boolean;
  originalPrice: number | null;
  eventTitle: string;
}

// Transaction data type
interface TransactionData {
  userId: string;
  eventId: number;
  ticketQuantity: number;
  finalPrice: number;
  basePrice: number;
  paymentDeadline: string;
  tierType: string;
  couponDiscount?: number;
  pointsUsed?: number;
}

export default function PurchaseConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  const { data: session } = useSession();
  
  const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: purchaseData?.currency || 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate payment deadline (2 hours from now)
  const getPaymentDeadline = () => {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 2);
    return deadline.toISOString();
  };

  // Load purchase data from localStorage
  useEffect(() => {
    const storedPurchaseData = localStorage.getItem('pendingPurchase');
    
    if (storedPurchaseData) {
      try {
        const parsedData = JSON.parse(storedPurchaseData);
        if (parsedData.eventId.toString() === eventId) {
          setPurchaseData(parsedData);
        } else {
          setError('Purchase data mismatch. Please try again.');
        }
      } catch (err) {
        setError('Failed to load purchase data. Please try again.');
      }
    } else {
      setError('No purchase data found. Please select tickets again.');
    }
    
    // If eventId is available, fetch event details
    if (eventId) {
      fetchEventDetails();
    } else {
      setIsLoading(false);
    }
  }, [eventId]);

  // Fetch event details
  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch event details');
      }
      const data = await response.json();
      setEventData(data);
    } catch (err) {
      setError('Failed to load event details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle purchase confirmation
  const handleConfirmPurchase = async () => {
    if (!session?.user?.id || !purchaseData) {
      setError('You must be logged in to purchase tickets');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const transactionData: TransactionData = {
        userId: session.user.id,
        eventId: purchaseData.eventId,
        ticketQuantity: purchaseData.quantity,
        finalPrice: purchaseData.totalPrice,
        basePrice: purchaseData.unitPrice,
        paymentDeadline: getPaymentDeadline(),
        tierType: purchaseData.tier,
        couponDiscount: purchaseData.hasDiscount ? 
          purchaseData.originalPrice && purchaseData.originalPrice > purchaseData.unitPrice ? 
          (purchaseData.originalPrice - purchaseData.unitPrice) * purchaseData.quantity : 0 : 0,
        pointsUsed: 0, // Default to 0 points used
      };

      // Call the transactions API to create transaction
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      const responseData = await response.json(); // Parse the response body

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create transaction');
      }

      // --- Get the transaction ID from the response ---
      const newTransactionId = responseData.id; 
      if (!newTransactionId) {
         throw new Error('Transaction created, but failed to get transaction ID.');
      }
     
      localStorage.removeItem('pendingPurchase');
      setSuccess(true);

      setTimeout(() => {
        router.push(`/payment-pending?transactionId=${newTransactionId}`);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process transaction');
      setSuccess(false); // Ensure success is false on error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel purchase
  const handleCancelPurchase = () => {
    localStorage.removeItem('pendingPurchase');
    router.back();
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-800">
        <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 border border-slate-200">
          <LoaderCircle className="animate-spin h-8 w-8 text-primary-600" />
          <span className="ml-2 font-medium">Loading purchase details...</span>
        </div>
      </div>
    );
  }

  if (error && !purchaseData) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8 bg-slate-50 min-h-screen text-slate-800">
        <Card className="border border-red-200 shadow-lg">
          <CardHeader className="bg-red-50 border-b border-red-200">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-center text-red-700 text-2xl">Unable to Process</CardTitle>
            <CardDescription className="text-center text-red-600 text-lg">{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center p-6 bg-white">
            <Link href="/events" passHref>
              <Button variant="default" className="flex items-center bg-primary-600 hover:bg-primary-700 text-white">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8 bg-slate-50 min-h-screen text-slate-800">
        <Card className="border border-green-200 shadow-lg">
          <CardHeader className="bg-green-50 border-b border-green-200 py-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-20 w-20 text-green-600" />
            </div>
            <CardTitle className="text-center text-green-700 text-2xl">Purchase Successful!</CardTitle>
            <CardDescription className="text-center text-green-600 text-lg">
              Your transaction has been processed successfully. Redirecting to payment page...
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 text-center text-slate-700 bg-white">
            <LoaderCircle className="inline-block animate-spin h-5 w-5 text-primary-600 mr-2" />
            <span>Redirecting you to the payment page...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header with Back Button */}
        <div className="mb-6 flex items-center">
          <Button 
            variant="outline" 
            onClick={handleCancelPurchase}
            className="flex items-center border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Event
          </Button>
        </div>

        {/* Main Card */}
        <Card className="border border-slate-200 shadow-lg overflow-hidden">
          {/* Header - Gradient  */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5">
            <div className="flex items-center">
              <div className="bg-white/20 rounded-lg p-2 mr-3 shadow-lg">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Purchase Confirmation</h2>
                <p className="text-sm text-white/80">Please review your ticket selection</p>
              </div>
            </div>
          </div>
          
          <CardContent className="p-0">
            {purchaseData && (
              <div className="divide-y divide-slate-200">
                {/* Event Details Section */}
                <div className="p-6 bg-white">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center">
                    <div className="bg-primary-100 p-1.5 rounded-md mr-2">
                      <Calendar className="h-5 w-5 text-primary-600" />
                    </div>
                    Event Details
                  </h3>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="text-lg font-semibold mb-2 text-slate-800">{eventData?.title || purchaseData.eventTitle}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-primary-600" />
                          <span>{formatDate(purchaseData.eventDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-primary-600" />
                          <span>{purchaseData.eventTime}</span>
                        </div>
                      </div>
                      
                      {eventData?.location && (
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary-600 flex-shrink-0" />
                          <span>{eventData.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ticket Details Section */}
                <div className="p-6 bg-white">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center">
                    <div className="bg-primary-100 p-1.5 rounded-md mr-2">
                      <Ticket className="h-5 w-5 text-primary-600" />
                    </div>
                    Ticket Details
                  </h3>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center">
                        <div className="bg-primary-600/10 p-1.5 rounded-md mr-2">
                          <Ticket className="h-4 w-4 text-primary-600" />
                        </div>
                        <span className="font-medium text-slate-800">{purchaseData.tier}</span>
                      </div>
                      <div className="text-slate-700 font-medium">
                        {formatCurrency(purchaseData.unitPrice)} × {purchaseData.quantity}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-slate-700">
                      {purchaseData.hasDiscount && purchaseData.originalPrice && (
                        <div className="flex justify-between items-center">
                          <span>Original Price:</span>
                          <span className="line-through text-slate-500">
                            {formatCurrency(purchaseData.originalPrice * purchaseData.quantity)}
                          </span>
                        </div>
                      )}
                      
                      {purchaseData.hasDiscount && purchaseData.originalPrice && (
                        <div className="flex justify-between items-center">
                          <span>Discount:</span>
                          <span className="text-green-600 font-medium">
                            -{formatCurrency((purchaseData.originalPrice - purchaseData.unitPrice) * purchaseData.quantity)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center border-t border-slate-200 mt-3 pt-3">
                        <span className="font-medium text-slate-800">Total Amount:</span>
                        <span className="text-xl font-bold text-primary-700">
                          {formatCurrency(purchaseData.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Info Section */}
                <div className="p-6 bg-white">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center">
                    <div className="bg-primary-100 p-1.5 rounded-md mr-2">
                      <CreditCard className="h-5 w-5 text-primary-600" />
                    </div>
                    Payment Information
                  </h3>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-start space-x-3 mb-3 pb-3 border-b border-slate-200">
                      <div className="bg-amber-100 p-1.5 rounded-md flex-shrink-0 mt-0.5">
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="text-slate-700">
                        <p className="font-medium mb-1 text-slate-800">Payment Deadline</p>
                        <p className="text-sm">
                          Payment must be completed within <span className="font-semibold text-tertiary-700">2 hours</span> of purchase to secure your tickets.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-1.5 rounded-md flex-shrink-0 mt-0.5">
                        <CreditCard className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-slate-700 text-sm">
                        <p>After confirming your purchase, you'll be redirected to the payment page where you can complete your transaction.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 mx-6 my-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                    {error}
                  </div>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between p-6 bg-slate-50 border-t border-slate-200">
            <Button 
              variant="outline" 
              onClick={handleCancelPurchase}
              disabled={isSubmitting}
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmPurchase}
              disabled={isSubmitting || !purchaseData}
              className="cursor-pointer bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20"
            >
              {isSubmitting ? (
                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                <>Confirm Purchase</>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Security Badge */}
        <div className="mt-6 flex justify-center">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center text-slate-700">
            <ShieldCheck className="h-5 w-5 mr-2 text-green-600" />
            <span className="font-medium">Secure payment • 100% guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}
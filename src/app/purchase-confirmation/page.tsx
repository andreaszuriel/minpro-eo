'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, ChevronLeft, CreditCard, Ticket, CheckCircle, LoaderCircle, MapPin, ShieldCheck, AlertCircle, Tag, Coins } from 'lucide-react';

// --- Purchase data type ---
interface PendingPurchaseData {
    eventId: number;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    currency: string;
    tier: string;
    quantity: number;
    unitPrice: number;
    basePrice: number;
    couponId?: number;
    couponCode?: string;
    couponDiscountAmount: number;
    pointsUsed: number;
    pointsDiscountAmount: number;
    promotionCode?: string;
    promotionDiscountAmount: number;
    finalPrice: number;
    userId?: string;
}

// Transaction data type SENT TO API
interface TransactionApiPayload {
    userId: string;
    eventId: number;
    ticketQuantity: number;
    basePrice: number;
    paymentDeadline: string;
    tierType: string;
    couponId?: number;
    pointsToUse?: number;
    promotionCode?: string;
}

// Loading component for Suspense fallback
function LoadingUI() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-800">
            <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 border border-slate-200">
                <LoaderCircle className="animate-spin h-8 w-8 text-primary-600" />
                <span className="ml-2 font-medium">Loading purchase details...</span>
            </div>
        </div>
    );
}

// Main component that uses params
function PurchaseConfirmationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const eventIdQuery = searchParams.get('eventId');
    const { data: session } = useSession();

    const [purchaseData, setPurchaseData] = useState<PendingPurchaseData | null>(null);
    const [eventData, setEventData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: purchaseData?.currency || 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getPaymentDeadline = () => {
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + 2);
        return deadline.toISOString();
    };

    useEffect(() => {
        const storedPurchaseData = localStorage.getItem('pendingPurchase');
        let parsedData: PendingPurchaseData | null = null;

        if (storedPurchaseData) {
            try {
                parsedData = JSON.parse(storedPurchaseData);
                if (!parsedData || typeof parsedData.eventId !== 'number' || typeof parsedData.finalPrice !== 'number') {
                    throw new Error("Incomplete purchase data structure.");
                }
                if (parsedData.eventId.toString() === eventIdQuery) {
                    setPurchaseData(parsedData);
                    console.log("Loaded Purchase Data:", parsedData);
                } else {
                    setError('Purchase data does not match the current event. Please start over.');
                    setIsLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Error parsing purchase data:", err);
                setError('Failed to load purchase data. Please try selecting tickets again.');
                setIsLoading(false);
                return;
            }
        } else {
            setError('No purchase data found. Please select tickets again.');
            setIsLoading(false);
            return;
        }

        if (parsedData?.eventId) fetchEventDetails(parsedData.eventId);
    }, [eventIdQuery]);

    const fetchEventDetails = async (id: number) => {
        try {
            const response = await fetch(`/api/events/${id}`);
            if (!response.ok) {
                console.warn(`Failed to fetch extra event details (Status: ${response.status}). Proceeding with data from purchase.`);
                setEventData(null);
            } else {
                const data = await response.json();
                setEventData(data);
            }
        } catch (err) {
            console.warn("Error fetching event details:", err);
            setEventData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmPurchase = async () => {
        if (!session?.user?.id) {
            setError('You must be logged in to purchase tickets. Please log in and try again.');
            router.push('/api/auth/signin');
            return;
        }
        if (!purchaseData) {
            setError('Purchase details are missing. Please go back and select tickets.');
            return;
        }
        if (typeof purchaseData.basePrice !== 'number' || typeof purchaseData.finalPrice !== 'number') {
            setError('Invalid price data loaded. Please try selecting tickets again.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const transactionPayload: TransactionApiPayload = {
                userId: session.user.id,
                eventId: purchaseData.eventId,
                ticketQuantity: purchaseData.quantity,
                basePrice: purchaseData.basePrice,
                paymentDeadline: getPaymentDeadline(),
                tierType: purchaseData.tier,
                ...(purchaseData.couponId && { couponId: purchaseData.couponId }),
                ...(purchaseData.pointsUsed > 0 && { pointsToUse: purchaseData.pointsUsed }),
                ...(purchaseData.promotionCode && { promotionCode: purchaseData.promotionCode }),
            };

            console.log("Sending Transaction Payload to API:", transactionPayload);

            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionPayload),
            });

            const responseData = await response.json();
            if (!response.ok) throw new Error(responseData?.error || `Failed to create transaction (Status: ${response.status})`);

            const newTransactionId = responseData?.id;
            if (!newTransactionId) {
                console.error("API Response missing transaction ID:", responseData);
                throw new Error('Transaction created, but failed to get transaction ID from response.');
            }

            console.log("Transaction created successfully. ID:", newTransactionId);
            localStorage.removeItem('pendingPurchase');
            setSuccess(true);

            setTimeout(() => router.push(`/payment-pending?transactionId=${newTransactionId}`), 2000);
        } catch (err) {
            console.error("Transaction creation failed:", err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred while processing your transaction.');
            setSuccess(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelPurchase = () => {
        localStorage.removeItem('pendingPurchase');
        if (purchaseData?.eventId) router.push(`/events/${purchaseData.eventId}`);
        else router.back();
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "N/A";
        try {
            return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
        } catch {
            return "Invalid Date";
        }
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
                        <CardTitle className="text-center text-red-700 text-2xl">Unable to Proceed</CardTitle>
                        <CardDescription className="text-center text-red-600 text-lg">{error}</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center p-6 bg-white">
                        <Link href="/events" passHref>
                            <Button variant="default" className="flex items-center bg-primary-600 hover:bg-primary-700 text-white">
                                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Events
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
                        <CardTitle className="text-center text-green-700 text-2xl">Purchase Confirmed!</CardTitle>
                        <CardDescription className="text-center text-green-600 text-lg">Your transaction is ready for payment. Redirecting...</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 text-center text-slate-700 bg-white">
                        <LoaderCircle className="inline-block animate-spin h-5 w-5 text-primary-600 mr-2" />
                        <span>Redirecting you to the payment page...</span>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!purchaseData) {
        return (
            <div className="container max-w-4xl mx-auto px-4 py-8 bg-slate-50 min-h-screen text-slate-800">
                <p>Loading or invalid data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 py-8">
            <div className="container max-w-4xl mx-auto px-4">
                <div className="mb-6 flex items-center">
                    <Button variant="outline" onClick={handleCancelPurchase} className="flex items-center border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
                        <ChevronLeft className="mr-2 h-4 w-4" /> Cancel & Back to Event
                    </Button>
                </div>

                <Card className="border border-slate-200 shadow-lg overflow-hidden">
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
                                <div className="p-6 bg-white">
                                    <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center">
                                        <div className="bg-primary-100 p-1.5 rounded-md mr-2"><Calendar className="h-5 w-5 text-primary-600" /></div>
                                        Event Details
                                    </h3>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <h4 className="text-lg font-semibold mb-2 text-slate-800">{eventData?.title || purchaseData.eventTitle}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                                            <div className="space-y-2">
                                                <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-primary-600" /><span>{formatDate(purchaseData.eventDate)}</span></div>
                                                <div className="flex items-center"><Clock className="h-4 w-4 mr-2 text-primary-600" /><span>{purchaseData.eventTime || 'N/A'}</span></div>
                                            </div>
                                            {eventData?.location && (
                                                <div className="flex items-start"><MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary-600 flex-shrink-0" /><span>{eventData.location}</span></div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-white">
                                    <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center">
                                        <div className="bg-primary-100 p-1.5 rounded-md mr-2"><Ticket className="h-5 w-5 text-primary-600" /></div>
                                        Your Order
                                    </h3>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                                            <div className="flex items-center">
                                                <div className="bg-primary-600/10 p-1.5 rounded-md mr-2"><Ticket className="h-4 w-4 text-primary-600" /></div>
                                                <span className="font-medium text-slate-800">{purchaseData.tier} ({purchaseData.quantity}x)</span>
                                            </div>
                                            <div className="text-slate-700">{formatCurrency(purchaseData.unitPrice)} each</div>
                                        </div>
                                        <div className="space-y-1 text-sm text-slate-700">
                                            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(purchaseData.basePrice)}</span></div>
                                            {purchaseData.couponDiscountAmount > 0 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span className="flex items-center"><Tag className="w-3.5 h-3.5 mr-1" />Coupon Discount {purchaseData.couponCode ? `(${purchaseData.couponCode})` : ''}</span>
                                                    <span>-{formatCurrency(purchaseData.couponDiscountAmount)}</span>
                                                </div>
                                            )}
                                            {purchaseData.promotionDiscountAmount > 0 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span className="flex items-center"><Tag className="w-3.5 h-3.5 mr-1" />Promotion Discount ({purchaseData.promotionCode})</span>
                                                    <span>-{formatCurrency(purchaseData.promotionDiscountAmount)}</span>
                                                </div>
                                            )}
                                            {purchaseData.pointsDiscountAmount > 0 && (
                                                <div className="flex justify-between text-tertiary-600">
                                                    <span className="flex items-center"><Coins className="w-3.5 h-3.5 mr-1" />Points Redeemed ({purchaseData.pointsUsed.toLocaleString()})</span>
                                                    <span>-{formatCurrency(purchaseData.pointsDiscountAmount)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                                            <span className="text-lg font-semibold text-slate-800">Total Amount</span>
                                            <span className="text-2xl font-bold text-primary-700">{formatCurrency(purchaseData.finalPrice)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-white">
                                    <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center">
                                        <div className="bg-primary-100 p-1.5 rounded-md mr-2"><CreditCard className="h-5 w-5 text-primary-600" /></div>
                                        Payment Information
                                    </h3>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div className="flex items-start space-x-3 mb-3 pb-3 border-b border-slate-200">
                                            <div className="bg-amber-100 p-1.5 rounded-md flex-shrink-0 mt-0.5"><Clock className="h-4 w-4 text-amber-600" /></div>
                                            <div className="text-slate-700">
                                                <p className="font-medium mb-1 text-slate-800">Payment Deadline</p>
                                                <p className="text-sm">Payment must be completed within <span className="font-semibold text-tertiary-700">2 hours</span> of confirming purchase to secure your tickets.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                            <div className="bg-green-100 p-1.5 rounded-md flex-shrink-0 mt-0.5"><CreditCard className="h-4 w-4 text-green-600" /></div>
                                            <div className="text-slate-700 text-sm">
                                                <p>After confirming, you'll be redirected to the payment page to choose your payment method and complete the transaction.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 mx-6 my-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
                                        <AlertCircle className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" /><span>{error}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-between p-6 bg-slate-50 border-t border-slate-200">
                        <Button variant="outline" onClick={handleCancelPurchase} disabled={isSubmitting} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100">Cancel</Button>
                        <Button
                            onClick={handleConfirmPurchase}
                            disabled={isSubmitting || !purchaseData || success}
                            className="cursor-pointer bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <>Confirm & Proceed to Payment</>}
                        </Button>
                    </CardFooter>
                </Card>

                <div className="mt-6 flex justify-center">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center text-slate-700">
                        <ShieldCheck className="h-5 w-5 mr-2 text-green-600" /><span className="font-medium">Secure payment • 100% guarantee</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main component export
export default function PurchaseConfirmationPage() {
    return (
        <Suspense fallback={<LoadingUI />}>
            <PurchaseConfirmationContent />
        </Suspense>
    );
}
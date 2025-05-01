'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format, differenceInSeconds } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, Info, LoaderCircle, UploadCloud, X } from 'lucide-react';
import Image from 'next/image';

interface TransactionDetails {
    id: number;
    status: 'PENDING' | 'WAITING_ADMIN' | 'PAID' | 'EXPIRED' | 'CANCELED';
    paymentDeadline: string;
    finalPrice: number;
    event: {
        id: string; 
        title: string;
    }
    // Add other fields 
}

// --- Constants ---
const COUNTDOWN_INTERVAL = 1000; 

// --- Helper Functions ---
const formatTimeLeft = (seconds: number): string => {
    if (seconds <= 0) return "00:00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

export default function PaymentPendingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const transactionId = searchParams.get('transactionId');

    const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>("Calculating...");
    const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Fetch Transaction Details ---
    const fetchTransaction = useCallback(async () => {
        if (!transactionId) {
            setFetchError("Transaction ID not found in URL.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setFetchError(null);
        try {
            const response = await fetch(`/api/transactions/${transactionId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to fetch transaction (${response.status})`);
            }
            const data: TransactionDetails = await response.json(); 
            setTransaction(data); 

        } catch (err) {
            setFetchError(err instanceof Error ? err.message : "An unknown error occurred.");
            setTransaction(null);
        } finally {
            setIsLoading(false);
        }
    }, [transactionId]);

    useEffect(() => {
        fetchTransaction();
    }, [fetchTransaction]);


    // --- Countdown Timer ---
    useEffect(() => {
        // Clear existing interval if transaction changes or unmounts
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (transaction?.paymentDeadline && transaction.status === 'PENDING') {
            const deadline = new Date(transaction.paymentDeadline);

            const updateCountdown = () => {
                const now = new Date();
                const seconds = differenceInSeconds(deadline, now);
                setSecondsRemaining(seconds);

                if (seconds <= 0) {
                    setTimeLeft("Expired");
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    // TODO: trigger a refetch to confirm status if needed
                    // fetchTransaction();
                } else {
                    setTimeLeft(formatTimeLeft(seconds));
                }
            };

            updateCountdown(); // Initial update
            intervalRef.current = setInterval(updateCountdown, COUNTDOWN_INTERVAL);
        } else if (transaction && transaction.status !== 'PENDING') {
            // Handle states other than PENDING 
             if (transaction.status === 'EXPIRED' || transaction.status === 'CANCELED') {
                 setTimeLeft("Expired");
             } else if (transaction.status === 'WAITING_ADMIN') {
                 setTimeLeft("Awaiting Confirmation");
             } else if (transaction.status === 'PAID') {
                 setTimeLeft("Payment Confirmed");
             }
            setSecondsRemaining(0); // Set to 0 if not pending
        }

        // Cleanup interval on component unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [transaction]); // Rerun when transaction data changes


    // --- File Handling ---
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                 setUploadError("Please select an image file.");
                 setSelectedFile(null);
                 setFilePreview(null);
                 return;
            }
            setSelectedFile(file);
            setUploadError(null);
            setUploadSuccess(false); // Reset success message

            // Generate preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setSelectedFile(null);
            setFilePreview(null);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const clearFileSelection = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
    };

    // --- Upload Payment Proof ---
    const handleUploadProof = async () => {
        if (!selectedFile || !transactionId || isUploading || transaction?.status !== 'PENDING' || (secondsRemaining !== null && secondsRemaining <= 0) ) {
            if(!selectedFile) setUploadError("Please select a payment proof image first.");
            else if(transaction?.status !== 'PENDING') setUploadError("This transaction is no longer pending payment.");
            else if (secondsRemaining !== null && secondsRemaining <= 0) setUploadError("The payment deadline has passed.");
            return;
        }

        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(false);

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            // 1. Upload to Cloudinary 
            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const uploadResult = await uploadResponse.json();

            if (!uploadResponse.ok || !uploadResult.url) {
                throw new Error(uploadResult.error || "Failed to upload image to server.");
            }

            const paymentProofUrl = uploadResult.url;

            // 2. Update Transaction Status and Proof URL
            const updateResponse = await fetch(`/api/transactions/${transactionId}`, {
                method: 'PATCH', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'WAITING_ADMIN',
                    paymentProof: paymentProofUrl,
                }),
            });

            const updateResult = await updateResponse.json();

            if (!updateResponse.ok) {
                throw new Error(updateResult.error || "Failed to update transaction status.");
            }

            // Success!
            setUploadSuccess(true);
            setSelectedFile(null); 
            setFilePreview(null);
            await fetchTransaction();

        } catch (err) {
            setUploadError(err instanceof Error ? err.message : "An unknown upload error occurred.");
        } finally {
            setIsUploading(false);
        }
    };

    // --- Render Logic ---

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <LoaderCircle className="animate-spin h-10 w-10 text-primary-600" />
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="container max-w-2xl mx-auto px-4 py-12 bg-slate-50 min-h-screen">
                <Card className="border-red-200 shadow-lg">
                  <CardHeader className="bg-red-50 border-b border-red-200 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                    <CardTitle className="text-red-700">Error Loading Transaction</CardTitle>
                    <CardDescription className="text-red-600">{fetchError}</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-6 flex justify-center">
                     <Link href="/events">
                        <Button variant="outline">Back to Events</Button>
                     </Link>
                  </CardFooter>
                </Card>
            </div>
        );
    }

    if (!transaction) {
         return (
             <div className="container max-w-2xl mx-auto px-4 py-12 text-center">
                 Could not load transaction details.
             </div>
         );
    }

    const isExpired = (secondsRemaining !== null && secondsRemaining <= 0) || transaction.status === 'EXPIRED' || transaction.status === 'CANCELED';
    const canUpload = transaction.status === 'PENDING' && !isExpired;


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
            <div className="container max-w-2xl mx-auto">
                <Card className="border border-slate-200 shadow-xl overflow-hidden bg-white">
                    <CardHeader className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 text-center">
                        <Clock className="h-10 w-10 mx-auto mb-3" />
                        <CardTitle className="text-2xl font-bold">Payment Pending</CardTitle>
                        <CardDescription className="text-white/80">
                            Complete your payment for {transaction.event?.title || 'your event'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6">
                        {/* Countdown Timer */}
                        <div className={`text-center p-4 rounded-lg ${isExpired ? 'bg-red-100 border border-red-200' : 'bg-amber-100 border border-amber-200'}`}>
                            <p className={`text-sm font-medium ${isExpired ? 'text-red-700' : 'text-amber-800'} mb-1`}>
                                {isExpired ? "Payment Deadline Passed" : "Time Remaining to Pay"}
                            </p>
                            <p className={`text-3xl font-bold tracking-tight ${isExpired ? 'text-red-600' : 'text-amber-700'}`}>
                                {timeLeft}
                            </p>
                        </div>

                        {/* Payment Instructions */}
                         <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg space-y-3">
                            <div className="flex items-center text-blue-800">
                               <Info className="h-5 w-5 mr-2 flex-shrink-0" />
                               <h3 className="text-lg font-semibold">Payment Instructions</h3>
                            </div>
                            <p className="text-sm text-blue-700">
                                Please transfer the exact amount of <strong className="font-semibold">{formatCurrency(transaction.finalPrice)}</strong> to the following bank account:
                            </p>
                            {/* --- REPLACE WITH ACTUAL BANK DETAIL  --- */}
                            <ul className="text-sm text-primary-500 list-disc list-inside pl-2 space-y-1 bg-white/50 p-3 rounded border border-blue-100">
                                <li><strong>Bank Name:</strong> Example Bank Indonesia</li>
                                <li><strong>Account Number:</strong> 123-456-7890</li>
                                <li><strong>Account Holder:</strong> Your Company Name</li>
                                <li><strong>Reference/Note:</strong> Transaction #{transaction.id}</li>
                            </ul>
                            <p className="text-xs text-blue-600 pt-2">
                                After making the payment, please upload a clear photo or screenshot of your transfer receipt below. Your tickets will be issued once payment is confirmed by our team (usually within 1-2 business hours).
                            </p>
                         </div>


                        {/* Upload Section */}
                        {transaction.status === 'PENDING' && !isExpired && (
                            <div className="space-y-4 pt-4 border-t border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-800 text-center">Upload Payment Proof</h3>
                                 {/* File Input Trigger */}
                                <div className="flex justify-center">
                                    <Button
                                        variant="outline"
                                        onClick={triggerFileSelect}
                                        disabled={isUploading}
                                        className="border-primary-500 text-primary-600 hover:bg-primary-50"
                                    >
                                        <UploadCloud className="mr-2 h-4 w-4" />
                                        {selectedFile ? "Change Proof Image" : "Select Proof Image"}
                                    </Button>
                                     <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden" // Hide default input
                                    />
                                </div>

                                {/* File Preview */}
                                {filePreview && (
                                     <div className="mt-4 text-center relative w-48 mx-auto border border-slate-300 p-2 rounded-md shadow-sm bg-slate-50">
                                        <p className="text-xs text-slate-500 mb-2">Image Preview:</p>
                                        <Image
                                            src={filePreview}
                                            alt="Payment proof preview"
                                            width={180}
                                            height={180}
                                            className="object-contain rounded"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                                            onClick={clearFileSelection}
                                            disabled={isUploading}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                {/* Upload Button */}
                                {selectedFile && (
                                    <div className="text-center mt-4">
                                        <Button
                                            onClick={handleUploadProof}
                                            disabled={!selectedFile || isUploading || uploadSuccess}
                                            className="w-full max-w-xs bg-secondary-600 hover:bg-secondary-500 text-white shadow-md"
                                        >
                                            {isUploading ? (
                                                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                                            ) : (
                                                <>Submit Payment Proof</>
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {/* Upload Status Messages */}
                                {uploadError && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center justify-center">
                                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0"/> {uploadError}
                                    </div>
                                )}
                            </div>
                        )}

                         {/* Post-Upload / Non-Pending Status */}
                         {uploadSuccess && (
                             <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center space-y-2">
                                 <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                 <p className="font-semibold text-green-800">Payment Proof Submitted!</p>
                                 <p className="text-sm text-green-700">Your proof has been uploaded successfully. We will review it shortly. Your transaction status is now "Awaiting Confirmation".</p>
                                  <Link href="/my-orders"> {/* Adjust link if needed */}
                                      <Button variant="link" className="text-sm text-primary-600 h-auto p-0">View My Orders</Button>
                                  </Link>
                             </div>
                         )}

                         {transaction.status === 'WAITING_ADMIN' && !uploadSuccess && ( // Show if page loaded when already waiting
                             <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center space-y-2">
                                 <LoaderCircle className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-spin" />
                                 <p className="font-semibold text-blue-800">Awaiting Confirmation</p>
                                 <p className="text-sm text-blue-700">We have received your payment proof and are currently reviewing it. You will be notified once confirmed.</p>
                                 <Link href="/my-orders"> 
                                      <Button variant="link" className="text-sm text-primary-600 h-auto p-0">View My Orders</Button>
                                  </Link>
                             </div>
                         )}

                         {transaction.status === 'PAID' && (
                             <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center space-y-2">
                                 <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                 <p className="font-semibold text-green-800">Payment Confirmed!</p>
                                 <p className="text-sm text-green-700">Your payment has been confirmed and your tickets have been issued.</p>
                                 <Link href="/my-tickets"> 
                                      <Button variant="link" className="text-sm text-primary-600 h-auto p-0">View My Tickets</Button>
                                  </Link>
                             </div>
                         )}

                         {(transaction.status === 'EXPIRED' || transaction.status === 'CANCELED' || isExpired) && !uploadSuccess && transaction.status !== 'WAITING_ADMIN' && (
                              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center space-y-2">
                                 <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                                 <p className="font-semibold text-red-700">Transaction Expired</p>
                                 <p className="text-sm text-red-600">The payment deadline for this transaction has passed. Please start a new purchase if you still wish to buy tickets.</p>
                                 <Link href={`/events/${transaction.event?.id || ''}`}> 
                                      <Button variant="link" className="text-sm text-primary-600 h-auto p-0">Back to Event</Button>
                                  </Link>
                             </div>
                         )}

                    </CardContent>

                    <CardFooter className="bg-slate-50 p-4 border-t border-slate-200 text-center">
                         <p className="text-xs text-slate-500">
                            Need help? <Link href="/contact" className="text-primary-600 hover:underline">Contact Support</Link>
                         </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
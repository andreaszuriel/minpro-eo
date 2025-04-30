"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, notFound } from 'next/navigation'; 
import Image from 'next/image';
import ConcertDescription from '@/components/molecules/ConcertDesc';
import TicketPurchaseBox from '@/components/molecules/TicketPurchaseBox';
import { ConcertDetailSkeleton } from '@/components/skeletons/ConcertDetailSkeleton'; 

// --- Define the expected API response structure ---
export interface FetchedConcertData {
  id: number;
  title: string;
  artist: string;
  genre: { name: string };
  startDate: string; 
  endDate: string;   
  location: string;
  country: { name: string };
  seats: number;
  tiers: string[]; 
  image: string | null;
  description: string | null;
  organizer: {
    id: string;
    name: string | null;
  };
  price: Record<string, number>; 
  currency: string; 
}


// --- Main Page Component ---
export default function ConcertDetailPage() {
  const params = useParams();
  const idParam = params.id;
  const id = typeof idParam === 'string' ? parseInt(idParam, 10) : NaN;

  const [concert, setConcert] = useState<FetchedConcertData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTier, setSelectedTier] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // --- Data Fetching ---
  useEffect(() => {
    // Validate ID early
    if (isNaN(id)) {
      // Use Next.js notFound() for clear 404 handling
      notFound();
      return;
    }

    const fetchConcert = async () => {
      setIsLoading(true);
      setError(null);
      setConcert(null);
      setSelectedTier(''); 
      setQuantity(1);     
      setTotalPrice(0);   

      try {
        const response = await fetch(`/api/events/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            notFound(); // Trigger Next.js 404 page
            return;
          }
          const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
          throw new Error(errorData.message || `Failed to fetch concert data (Status: ${response.status})`);
        }

        const data: FetchedConcertData = await response.json();

        // Basic validation
        if (!data || typeof data !== 'object' || !data.id || !data.price || !Array.isArray(data.tiers) || !data.currency) {
            console.error("Received incomplete/invalid data format:", data);
            throw new Error("Received invalid data format from API.");
        }

        setConcert(data);

        // Set default selected tier from fetched data
        if (data.tiers.length > 0) {
          setSelectedTier(data.tiers[0]);
        } else {
          console.warn(`Concert ${data.id} fetched but has no tiers defined.`);
          // No tiers available, keep selectedTier empty
        }

      } catch (err) {
        console.error("Error fetching concert:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConcert();
  }, [id]); // Re-run effect if id changes

  // --- Price Calculation ---
  useEffect(() => {
    if (concert && selectedTier && concert.price && concert.price[selectedTier] !== undefined) {
        setTotalPrice(concert.price[selectedTier] * quantity);
    } else {
        setTotalPrice(0);
    }
  }, [concert, selectedTier, quantity]);

  // --- Formatting Functions (Memoized) ---
  const formatCurrency = useCallback((amount: number): string => {
    // Rely on currency fetched with the concert data
    const currencyCode = concert?.currency;
    if (!currencyCode) return String(amount); 

    try {
      const options: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currencyCode,
      };
      // Handle IDR specific formatting
      if (currencyCode.toUpperCase() === 'IDR') {
        options.minimumFractionDigits = 0;
        options.maximumFractionDigits = 0;
      }

      return new Intl.NumberFormat(currencyCode.toUpperCase() === 'IDR' ? 'id-ID' : 'en-US', options).format(amount);
    } catch (e) {
        console.error("Error formatting currency:", e, "Amount:", amount, "Currency:", currencyCode);
        return `${currencyCode || '?'} ${amount}`; // Fallback display
    }
  }, [concert?.currency]);

  const getFormattedDate = useCallback((): string => {
    if (!concert?.startDate) return '';
    try {
      return new Date(concert.startDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
    } catch { return "Invalid Date"; }
  }, [concert?.startDate]);

  const getFormattedTime = useCallback((): string => {
    if (!concert?.startDate) return '';
    try {
      return new Date(concert.startDate).toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch { return ""; }
  }, [concert?.startDate]);

  // --- Render Logic ---
  if (isLoading) {
    return <ConcertDetailSkeleton />; 
  }

  if (error) {
    // Display a user-friendly error message
    return (
      <div className="container mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong.</h1>
          <p className="text-gray-700">We couldn't load the concert details.</p>
          <p className="text-sm text-gray-500 mt-2">Error details: {error}</p>
          {/* TODO: Add a retry button */}
      </div>
    );
  }

  if (!concert) {
     return <div className="container mx-auto p-8 text-center">Concert details are currently unavailable.</div>;
  }


  // Prepare props for children using fetched data
  const genres = concert.genre?.name ? [concert.genre.name] : [];
  const time = getFormattedTime();

  // Props for ConcertDescription 
  const concertDescProps = {
    id: concert.id,
      title: concert.title,
      artist: concert.artist,
      startDate: concert.startDate,
      time: time,
      location: concert.location,
      description: concert.description,
      organizer: concert.organizer?.name ?? 'Unknown Organizer',
      organizerId: concert.organizer?.id // Pass ID if link needs it
  };

  // Props for TicketPurchaseBox 
   const ticketBoxProps = {
        id: concert.id, // Pass event ID if needed for purchase action
        startDate: concert.startDate,
        time: time,
        seats: concert.seats,
        tiers: concert.tiers ?? [], 
        price: concert.price ?? {}, 
        currency: concert.currency
    };


  return (
    <main className="bg-slate-100 flex flex-col min-h-screen">
      {/* Hero Image Section */}
      <div className="relative w-full h-[50vh]">
        {concert.image ? (
          <Image
            src={concert.image} 
            alt={concert.title}
            fill
            className="object-cover"
            priority
            // TODO: Add error handling for images
            // onError={(e) => e.currentTarget.style.display = 'none'}
          />
        ) : (
          <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-500">
             Image Not Available
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:gap-8">
          <ConcertDescription
            concert={concertDescProps} // Pass simplified props
            genres={genres}
            getFormattedDate={getFormattedDate}
          />
          <TicketPurchaseBox
            concert={ticketBoxProps} // Pass simplified props
            selectedTier={selectedTier}
            setSelectedTier={setSelectedTier}
            quantity={quantity}
            setQuantity={setQuantity}
            totalPrice={totalPrice}
            formatCurrency={formatCurrency}
            // TODO: Pass the function to handle the actual purchase action
            // onPurchase={handlePurchase}
          />
        </div>
      </div>
    </main>
  );
}
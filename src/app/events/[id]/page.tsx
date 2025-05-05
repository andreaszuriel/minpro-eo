"use client";

import React, { useState, useEffect, useCallback } from 'react'; 
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import ConcertDescription from '@/components/molecules/ConcertDesc';
import TicketPurchaseBox from '@/components/molecules/TicketPurchaseBox';
import { ConcertDetailSkeleton } from '@/components/skeletons/ConcertDetailSkeleton';
import { ConcertInfo } from '@/components/contexts/TicketPurchaseContext';

// Define the expected API response structure
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
  averageRating: number | null;
}


// --- Main Page Component ---
export default function ConcertDetailPage() {
  const params = useParams();
  const idParam = params.id;
  const id = typeof idParam === 'string' ? parseInt(idParam, 10) : NaN;

  // State only for fetched data, loading, and error
  const [concert, setConcert] = useState<FetchedConcertData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    if (isNaN(id)) {
      notFound();
      return;
    }

    const fetchConcert = async () => {
      setIsLoading(true);
      setError(null);
      setConcert(null);
 
      try {
        const response = await fetch(`/api/events/${id}`);

        if (!response.ok) {
            if (response.status === 404) {
                notFound();
                return;
            }
            const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            throw new Error(errorData.message || `Failed to fetch concert data (Status: ${response.status})`);
        }

        const data: FetchedConcertData = await response.json();

        if (!data || typeof data !== 'object' || !data.id || !data.price || !Array.isArray(data.tiers) || !data.currency) {
            console.error("Received incomplete/invalid data format:", data);
            throw new Error("Received invalid data format from API.");
        }

        console.log("Received concert data with averageRating:", data.averageRating);
        setConcert(data);

      } catch (err) {
        console.error("Error fetching concert:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConcert();
  }, [id]);

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
    return (
      <div className="container mx-auto p-8 text-center">
          {/* ... error display ... */}
      </div>
    );
  }

  if (!concert) {
     return <div className="container mx-auto p-8 text-center">Concert details are currently unavailable.</div>;
  }

  // Prepare props for children
  const genres = concert.genre?.name ? [concert.genre.name] : [];
  const time = getFormattedTime();

  // Props for ConcertDescription
  const concertDescProps = {
    id: concert.id,
    title: concert.title,
    artist: concert.artist,
    startDate: concert.startDate,
    time: time, // Pass formatted time
    location: concert.location,
    description: concert.description,
    organizer: concert.organizer?.name ?? 'Unknown Organizer',
    organizerId: concert.organizer?.id,
    averageRating: concert.averageRating
  };

  // Props for TicketPurchaseBox
   const ticketBoxProps: ConcertInfo = { // Explicitly use ConcertInfo type
        id: concert.id,
        title: concert.title, // Add title if available and needed by context
        startDate: concert.startDate,
        time: time, // Pass formatted time
        seats: concert.seats,
        tiers: concert.tiers ?? [],
        price: concert.price ?? {},
        currency: concert.currency,
        // Ensure all fields required by ConcertInfo are present
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
            {/* Pass only the concert prop */}
            <TicketPurchaseBox
              concert={ticketBoxProps}
            />
        </div>
      </div>
    </main>
  );
}
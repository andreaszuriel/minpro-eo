"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { concertList, type ConcertEvent } from '@/components/data/concertlist';
import ConcertDescription from '@/components/molecules/ConcertDesc';
import TicketPurchaseBox from '@/components/molecules/TicketPurchaseBox';

export default function ConcertDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? parseInt(params.id) :
             Array.isArray(params.id) ? parseInt(params.id[0]) : 1;

  // State for concert data
  const [concert, setConcert] = useState<ConcertEvent | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  useEffect(() => {
    // Find the concert by ID
    const foundConcert = concertList.find((c) => c.id === id) || concertList[0];
    setConcert(foundConcert);

    // Set default selected tier
    if (foundConcert && foundConcert.tiers.length > 0) {
      setSelectedTier(foundConcert.tiers[0]);
    }
  }, [id]);

  useEffect(() => {
    // Calculate total price when tier or quantity changes
    if (concert && selectedTier) {
      setTotalPrice(concert.price[selectedTier] * quantity);
    }
  }, [concert, selectedTier, quantity]);

  // Format currency
  const formatCurrency = (amount: number) => {
    if (!concert) return '';

    if (concert.currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: concert.currency,
    }).format(amount);
  };

  // Format date for display
  const getFormattedDate = () => {
    if (!concert) return '';

    const eventDate = new Date(concert.startDate);
    return eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!concert) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  // Compute genres after concert is defined
  const genres = concert.genre.split('/').map((genre) => genre.trim());

  return (
    <main className="bg-slate-100 flex flex-col min-h-screen">
      {/* Hero Image Section - 50% of viewport */}
      <div className="relative w-full h-[50vh]">
        <Image
          src={concert.image}
          alt={concert.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0"></div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:gap-8">
          <ConcertDescription concert={concert} genres={genres} getFormattedDate={getFormattedDate} />
          <TicketPurchaseBox
            concert={concert}
            selectedTier={selectedTier}
            setSelectedTier={setSelectedTier}
            quantity={quantity}
            setQuantity={setQuantity}
            totalPrice={totalPrice}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </main>
  );
}
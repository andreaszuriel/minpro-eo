"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MapPin, 
  Calendar, 
  User, 
  ExternalLink 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { concertList, type ConcertEvent } from '@/components/data/concertlist';

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
    const foundConcert = concertList.find(c => c.id === id) || concertList[0];
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
    
    if (concert.currency === "IDR") {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
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
      year: 'numeric'
    });
  };
  
  if (!concert) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  // Compute genres after concert is defined
  const genres = concert.genre.split('/').map(genre => genre.trim());
  
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
          {/* Main Content - 2/3 width on desktop */}
          <div className="w-full md:w-2/3 mb-8 md:mb-0 order-2 md:order-1">
            {/* Concert Details */}
            <h1 className="text-primary-700 text-3xl md:text-4xl font-bold mb-2">{concert.title}</h1>
            <h2 className="text-xl md:text-2xl font-semibold text-primary-600 mb-4">{concert.artist}</h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {genres.map((genre, index) => (
                <div 
                  key={index} 
                  className="bg-tertiary-500 text-black px-2 py-0.5 rounded-full text-xs font-medium"
                >
                  {genre}
                </div>
              ))}
            </div>
            <div className="space-y-3 mb-6">
              <div className="text-black flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-primary-600" />
                <span>{getFormattedDate()} | {concert.time}</span>
              </div>
              
              <div className="flex items-center text-black">
                <MapPin className="h-5 w-5 mr-3 text-primary-600" />
                <span>{concert.location}</span>
              </div>
            </div>
            
            <div className="border-t-2 border-gray-300 my-6"></div>
            
            {/* Description */}
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">{concert.description}</p>
            </div>
            
            <div className="border-t border-gray-300 my-6"></div>
            
            {/* Organizer */}
            <h3 className="text-2xl text-black font-bold mb-4">Organizer</h3>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center mr-3">
                <User className="text-white" />
              </div>
              <div>
                <p className="font-bol text-black">{concert.organizer}</p>
                <Link 
                  href={`/organizers/${concert.organizer.toLowerCase().replace(/\s+/g, '-')}`} 
                  className="text-primary-600 hover:text-secondary-600 flex items-center"
                >
                  View Profile <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
          
          {/* Sidebar - 1/3 width on desktop */}
          <div className="w-full md:w-1/3 bg-slate-100 shadow-2xl p-6 rounded-lg order-1 md:order-2">
            {/* Availability */}
            <div className="text-center mb-8">
              {concert.seats > 0 ? (
                <div className="text-green-600 font-bold text-4xl">Available</div>
              ) : (
                <div className="text-red-600 font-bold text-4xl">Sold Out</div>
              )}
            </div>
            
            {concert.seats > 0 ? (
              /* Ticket Selection */
              <div className="space-y-6">
                <div>
                  <label htmlFor="ticket-type" className="text-black block text-sm font-medium mb-1">Type</label>
                  <Select
                    value={selectedTier}
                    onValueChange={setSelectedTier}
                  >
                    <SelectTrigger id="ticket-type" className="w-full text-black bg-slate-300">
                      <SelectValue placeholder="Select ticket type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-black border border-gray-300">
                      {concert.tiers.map((tier) => (
                        <SelectItem key={tier} value={tier} className="text-black hover:bg-slate-100">
                          {tier} - {formatCurrency(concert.price[tier])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label htmlFor="ticket-quantity" className="text-black block text-sm font-medium mb-1">Quantity</label>
                  <Select
                    value={quantity.toString()}
                    onValueChange={(value) => setQuantity(parseInt(value))}
                  >
                    <SelectTrigger id="ticket-quantity" className="text-black w-full bg-slate-300">
                      <SelectValue placeholder="Select quantity" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-black border border-gray-300">
                      {Array.from({length: 10}, (_, i) => i + 1).map((qty) => (
                        <SelectItem key={qty} value={qty.toString()} className="text-black hover:bg-slate-100">
                          {qty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-black text-center text-2xl font-bold my-6">
                  {formatCurrency(totalPrice)}
                </div>
                
                <Button className="w-full bg-primary-600 hover:bg-primary-700">BUY TICKETS</Button>
              </div>
            ) : (
              <div className="text-center text-gray-600 italic">
                Sorry, this event is sold out.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
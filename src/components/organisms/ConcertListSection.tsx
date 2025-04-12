'use client'

import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { concertList, ConcertEvent } from '@/components/data/concertlist';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ConcertListSection() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const totalPages = Math.ceil(concertList.length / itemsPerPage);
  
  // Reference to the concert section
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Get current concerts
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentConcerts = concertList.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // Scroll to the section instead of the top of the page
      if (sectionRef.current) {
        sectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      // Scroll to the section instead of the top of the page
      if (sectionRef.current) {
        sectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section ref={sectionRef} className="py-16 px-4 md:px-8 lg:px-12 bg-slate-200 dark:bg-slate-200">
      <div className="container mx-auto">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-12 text-primary-600 dark:text-primary-400">
          UPCOMING EVENTS
        </h2>
        
        {/* Concert Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentConcerts.map((concert) => (
            <ConcertCard key={concert.id} concert={concert} />
          ))}
        </div>
        
        {/* Pagination */}
        <div className="flex justify-center items-center mt-16">
          <Button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            variant="outline"
            size="icon"
            className={`mr-4 border-primary-400 hover:bg-primary-100 focus:ring-primary-400 ${
              currentPage === 1 
                ? 'text-gray-400 border-gray-300 cursor-not-allowed hover:bg-transparent' 
                : 'text-primary-600 hover:text-primary-700'
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <span className="text-lg font-medium mx-4 text-primary-700 dark:text-primary-400">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            variant="outline"
            size="icon"
            className={`ml-4 border-primary-400 hover:bg-primary-100 focus:ring-primary-400 ${
              currentPage === totalPages 
                ? 'text-gray-400 border-gray-300 cursor-not-allowed hover:bg-transparent' 
                : 'text-primary-600 hover:text-primary-700'
            }`}
            aria-label="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

// Concert Card Component
function ConcertCard({ concert }: { concert: ConcertEvent }) {
  // Format currency
  const formatCurrency = (amount: number) => {
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

  // Split genres and limit to showing max 3
  const genres = concert.genre.split('/').map(genre => genre.trim());
  const displayGenres = genres.slice(0, 2);
  const hasMoreGenres = genres.length > 2;

  // Get the lowest price from all tiers
  const lowestPrice = Math.min(...Object.values(concert.price));
  
  // Format date for display
  const eventDate = new Date(concert.startDate);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Format date for badge
  const shortMonth = eventDate.toLocaleDateString('en-US', { month: 'short' });
  const day = eventDate.getDate();

  return (
    <Link href={`/concerts/${concert.id}`}>
      <div className="group rounded-lg overflow-hidden bg-white dark:bg-white shadow-md hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
        <div className="relative aspect-[3/2] w-full overflow-hidden">
          <img
            src={concert.image}
            alt={concert.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Date badge - top left */}
          <div className="absolute top-2 left-2 bg-secondary-500 dark:bg-secondary-600 text-white rounded-full w-12 h-12 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold">{shortMonth}</span>
            <span className="text-lg font-bold leading-tight">{day}</span>
          </div>
          
          {/* Stacked genre badges - bottom right */}
          <div className="absolute bottom-2 right-2 flex flex-col gap-1">
            {displayGenres.map((genre, index) => (
              <div 
                key={index} 
                className="bg-tertiary-500 text-black px-2 py-0.5 rounded-full text-xs font-medium"
              >
                {genre}
              </div>
            ))}
            {/* {hasMoreGenres && (
              <div className="bg-tertiary-300 text-black px-2 py-0.5 rounded-full text-xs font-medium">
                +{genres.length - 2} more
              </div>
            )} */}
          </div>
        </div>
        
        <div className="p-4 flex flex-col flex-grow">
        <h3 className="transition-colors duration-300 ease-in-out hover:text-secondary-600 text-lg font-display font-bold mb-1 line-clamp-2 text-primary-700 dark:text-primary-300">
  {concert.title}
</h3>
          
          <p className="text-base font-semibold mb-2 text-black dark:text-black">
            {concert.artist}
          </p>
          
          <div className="text-sm text-gray-800 dark:text-gray-800 mb-2">
            <p className="mb-1">{concert.location}</p>
            <p className="font-medium">
              {formattedDate} | {concert.time}
            </p>
          </div>
          
          <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">
              From {formatCurrency(lowestPrice)}
            </span>
            <span className="text-sm rounded-full bg-secondary-800 dark:bg-secondary-800 text-white dark:text-white px-3 py-1">
              {concert.seats} seats
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
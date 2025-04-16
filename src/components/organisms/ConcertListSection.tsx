'use client'

import { useRef, useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { concertList, ConcertEvent } from '@/components/data/concertlist';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { useFilters } from '@/lib/FilterContext';

export default function ConcertListSection() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Get filter context
  const { searchQuery, selectedCountry, selectedGenre } = useFilters();
  
  // Reference to the concert section
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Filter concerts based on search query, country, and genre
  const filteredConcerts = useMemo(() => {
    return concertList.filter(concert => {
      // Extract country from location
      const locationParts = concert.location.split(',');
      const country = locationParts[locationParts.length - 1].trim();
      
      // Check if the concert title or artist matches search query
      const matchesSearch = searchQuery === '' || 
        concert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concert.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concert.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Check if concert country matches selected country
      const matchesCountry = selectedCountry === '' || country === selectedCountry;
      
      // Check if concert genre includes selected genre
      const matchesGenre = selectedGenre === '' || 
        concert.genre.toLowerCase().includes(selectedGenre.toLowerCase());
      
      return matchesSearch && matchesCountry && matchesGenre;
    });
  }, [searchQuery, selectedCountry, selectedGenre]);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCountry, selectedGenre]);
  
  // Calculate total pages based on filtered results
  const totalPages = Math.max(1, Math.ceil(filteredConcerts.length / itemsPerPage));
  
  // Get current concerts for current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentConcerts = filteredConcerts.slice(indexOfFirstItem, indexOfLastItem);

  // Change page and scroll to section
  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      sectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      ref={sectionRef} 
      className="bg-slate-200 py-16 px-4 md:px-8 lg:px-12" 
      aria-labelledby="upcoming-events-heading"
    >
      <div className="container mx-auto">
        <h2 
          id="upcoming-events-heading" 
          className="mb-12 text-center text-4xl font-bold text-primary-600 md:text-5xl"
        >
          UPCOMING EVENTS
        </h2>
        
        {/* Show filter information if any filters are active */}
        {(searchQuery || selectedCountry || selectedGenre) && (
          <div className="mb-8 text-center">
            <p className="text-lg text-primary-600">
              Showing results for
              {searchQuery && <span className="font-medium"> "{searchQuery}"</span>}
              {selectedCountry && <span className="font-medium"> in {selectedCountry}</span>}
              {selectedGenre && <span className="font-medium"> | Genre: {selectedGenre}</span>}
            </p>
            <p className="text-gray-600 mt-2">
              Found {filteredConcerts.length} events
            </p>
          </div>
        )}
        
        {/* Concert Grid */}
        {currentConcerts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {currentConcerts.map((concert) => (
              <ConcertCard key={concert.id} concert={concert} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-2xl text-gray-500">No concerts found matching your criteria.</p>
            <p className="mt-2 text-gray-500">Try adjusting your filters.</p>
          </div>
        )}
        
        {/* Pagination - only show if we have results */}
        {currentConcerts.length > 0 && (
          <nav 
            className="mt-16 flex items-center justify-center" 
            aria-label="Pagination"
          >
            <Button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              size="icon"
              className={`mr-4 border-primary-400 focus:ring-primary-400 ${
                currentPage === 1 
                  ? 'cursor-not-allowed border-gray-300 text-gray-400 hover:bg-transparent' 
                  : 'text-primary-600 hover:bg-primary-100 hover:text-primary-700'
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <span className="mx-4 text-lg font-medium text-primary-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="icon"
              className={`ml-4 border-primary-400 focus:ring-primary-400 ${
                currentPage === totalPages 
                  ? 'cursor-not-allowed border-gray-300 text-gray-400 hover:bg-transparent' 
                  : 'text-primary-600 hover:bg-primary-100 hover:text-primary-700'
              }`}
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </nav>
        )}
      </div>
    </section>
  );
}

// Concert Card Component
function ConcertCard({ concert }: { concert: ConcertEvent }) {
  // Split genres and limit to showing max 2
  const genres = concert.genre.split('/').map(genre => genre.trim());
  const displayGenres = genres.slice(0, 2);
  
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
    <Link 
      href={`/concerts/${concert.id}`}
      className="h-full"
    >
      <div className="group flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-md transition-shadow duration-300 hover:shadow-xl">
        <div className="relative aspect-[3/2] w-full overflow-hidden">
          <Image
            src={concert.image}
            alt={concert.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Date badge - top left */}
          <div className="absolute left-2 top-2 flex h-12 w-12 flex-col items-center justify-center rounded-full bg-secondary-500 text-center text-white">
            <span className="text-xs font-bold">{shortMonth}</span>
            <span className="text-lg font-bold leading-tight">{day}</span>
          </div>
          
          {/* Stacked genre badges - bottom right */}
          <div className="absolute bottom-2 right-2 flex flex-col gap-1">
            {displayGenres.map((genre, index) => (
              <div 
                key={index} 
                className="rounded-full bg-tertiary-500 px-2 py-0.5 text-xs font-medium text-black"
              >
                {genre}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-grow flex-col p-4">
          <h3 className="mb-1 line-clamp-2 font-bold text-lg text-primary-700 transition-colors duration-300 ease-in-out hover:text-secondary-600">
            {concert.title}
          </h3>
          
          <p className="mb-2 text-base font-semibold text-black">
            {concert.artist}
          </p>
          
          <div className="mb-2 text-sm text-gray-800">
            <p className="mb-1">{concert.location}</p>
            <p className="font-medium">
              {formattedDate} | {concert.time}
            </p>
          </div>
          
          <div className="mt-auto flex items-center justify-between border-t border-gray-200 pt-3">
            <span className="text-sm font-semibold text-secondary-600">
              From {formatCurrency(lowestPrice, concert.currency)}
            </span>
            <span className="text-center rounded-full bg-secondary-800 px-3 py-1 text-xs text-white">
              {concert.seats} seats
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils'; 
import { useFilters } from '@/lib/FilterContext';
import { Skeleton } from '@/components/ui/skeleton'; 

import type { FetchedEventListItem, PaginatedEventsResponse } from '@/types'; 

// --- Skeleton Card ---
function ConcertCardSkeleton() {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-md">
        <Skeleton className="aspect-[3/2] w-full bg-gray-300" />
        <div className="flex flex-grow flex-col p-4 space-y-3">
          <Skeleton className="h-5 w-3/4 bg-gray-300" />
          <Skeleton className="h-4 w-1/2 bg-gray-300" />
          <Skeleton className="h-4 w-full bg-gray-200" />
          <Skeleton className="h-4 w-2/3 bg-gray-200" />
          <div className="mt-auto flex items-center justify-between border-t border-gray-200 pt-3">
            <Skeleton className="h-4 w-1/3 bg-gray-300" />
            <Skeleton className="h-6 w-16 rounded-full bg-gray-300" />
          </div>
        </div>
      </div>
    );
}


export default function ConcertListSection() {
  // State for fetched data, loading, error, pagination
  const [events, setEvents] = useState<FetchedEventListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  const itemsPerPage = 12; 

  const { searchQuery, selectedCountry, selectedGenre } = useFilters();
  const sectionRef = useRef<HTMLDivElement>(null);

  // --- Data Fetching Logic ---
  const fetchEvents = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);

    // Construct query parameters
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(itemsPerPage));
    if (searchQuery) params.append('q', searchQuery);
    // Pass Genre Name and Country Code to the API
    if (selectedGenre) params.append('genreName', selectedGenre);
    if (selectedCountry) params.append('countryCode', selectedCountry); 

    try {
      // Fetch from the updated API endpoint
      const response = await fetch(`/api/events?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch events (Status: ${response.status})`);
      }

      const data: PaginatedEventsResponse = await response.json();

      // Basic validation of received data
      if (!data || !Array.isArray(data.events) || typeof data.totalCount !== 'number' || typeof data.totalPages !== 'number') {
        console.error("Invalid API response structure:", data);
        throw new Error("Received invalid data from server.");
      }

      setEvents(data.events);
      setTotalEvents(data.totalCount);
      setTotalPages(data.totalPages > 0 ? data.totalPages : 1); // Ensure totalPages is at least 1
      setCurrentPage(data.currentPage); // Sync current page with API response

    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setEvents([]); // Clear events on error
      setTotalPages(1);
      setTotalEvents(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCountry, selectedGenre, itemsPerPage]); // Dependencies for fetch function

  // --- Effect to fetch data on filter/page change ---
  useEffect(() => {
    // When filters change, always fetch page 1
    fetchEvents(1);
  }, [searchQuery, selectedCountry, selectedGenre, fetchEvents]); // fetchEvents is memoized by useCallback

  // Function to change page and trigger fetch
  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage); // Set desired page
      fetchEvents(newPage); // Fetch the new page's data
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="bg-slate-200 py-16 px-4 md:px-8 lg:px-12"
      aria-labelledby="upcoming-events-heading"
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-center mb-20">
          <div className="w-full flex flex-col items-center">
            <div className="border-t-2 border-tertiary-600 w-1/2 mb-4"></div>
            <h2
              id="upcoming-events-heading"
              className="text-center text-4xl font-bold text-primary-600 md:text-5xl"
            >
              UPCOMING EVENTS
            </h2>
            <div className="border-b-2 border-tertiary-600 w-1/2 mt-4"></div>
          </div>
        </div>

        {/* Filter Info - Now reflects server-side filtering */}
        {(searchQuery || selectedCountry || selectedGenre) && !isLoading && !error && (
          <div className="mb-8 text-center">
            <p className="text-lg text-primary-600">
              Showing results for
              {searchQuery && <span className="font-medium"> "{searchQuery}"</span>}
              {selectedCountry && <span className="font-medium"> in {selectedCountry}</span>}
              {selectedGenre && <span className="font-medium"> | Genre: {selectedGenre}</span>}
            </p>
            <p className="text-gray-600 mt-2">
              Found {totalEvents} events
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: itemsPerPage }).map((_, index) => (
              <ConcertCardSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
            <div className="py-16 text-center text-red-600">
                <p className="text-2xl font-semibold">Could not load events.</p>
                <p className="mt-2">{error}</p>
                {/* Optional: Add a retry button */}
                <Button onClick={() => fetchEvents(currentPage)} className="mt-4">
                    Try Again
                </Button>
            </div>
        )}

        {/* Concert Grid - Render fetched events */}
        {!isLoading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {events.map((event) => (
              <ConcertCard key={event.id} concert={event} /> // Pass fetched event data
            ))}
          </div>
        )}

        {/* No Results State */}
        {!isLoading && !error && events.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-2xl text-gray-500">No concerts found matching your criteria.</p>
            <p className="mt-2 text-gray-500">Try adjusting your filters or check back later.</p>
          </div>
        )}

        {/* Pagination - Show only if there are results and more than one page */}
        {!isLoading && !error && events.length > 0 && totalPages > 1 && (
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

// --- Concert Card Component ---
function ConcertCard({ concert }: { concert: FetchedEventListItem }) { 
  // Genre: Use the genre name from the included relation
  const displayGenres = concert.genre?.name ? [concert.genre.name] : []; 

  // Price: Use the lowestPrice from the fetched data (or recalculate if preferred)
  // const lowestPrice = concert.lowestPrice; // If API provides it
  const lowestPrice = useMemo(() => { // Or calculate here
     const prices = Object.values(concert.price ?? {});
     return prices.length > 0 ? Math.min(...prices) : 0;
  }, [concert.price]);


  // Date/Time Formatting
  let formattedDate = "Invalid Date";
  let shortMonth = "";
  let day = "";
  let time = "";
  try {
      const eventDate = new Date(concert.startDate); // Parse ISO string
      formattedDate = eventDate.toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric'
      });
      shortMonth = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      day = String(eventDate.getDate());
      time = eventDate.toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', hour12: true
      });
  } catch (e) {
      console.error("Error parsing date for concert card:", concert.startDate, e);
  }


  return (
    <Link
    href={`/events/${concert.id}`}
    className="h-full"
    aria-label={`View details for ${concert.title}`}
  >
    <div className="group flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-md transition-shadow duration-300 hover:shadow-xl">
      <div className="relative aspect-[3/2] w-full overflow-hidden">
        {concert.image ? (
            <Image
              src={concert.image}
              alt={concert.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjZTVlN2ViIi8+Cjwvc3ZnPg=="
              onError={(e) => {
                e.currentTarget.src = "https://i.pinimg.com/1200x/2a/86/a5/2a86a560f0559704310d98fc32bd3d32.jpg";
              }}
            />
        ) : (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <Image
                src="https://i.pinimg.com/1200x/2a/86/a5/2a86a560f0559704310d98fc32bd3d32.jpg"
                alt="Concert placeholder"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover"
                loading="lazy"
              />
            </div>
        )}


          {/* Date badge */}
          <div className="absolute left-2 top-2 flex h-12 w-12 flex-col items-center justify-center rounded-full bg-secondary-500 text-center text-white shadow">
            <span className="text-xs font-bold">{shortMonth}</span>
            <span className="text-lg font-bold leading-tight">{day}</span>
          </div>

          {/* Genre badge */}
          {displayGenres.length > 0 && (
              <div className="absolute bottom-2 right-2 flex flex-col gap-1">
                  {displayGenres.map((genre, index) => (
                  <div
                      key={index}
                      className="rounded-full bg-tertiary-500 px-2 py-0.5 text-xs font-medium text-black shadow"
                  >
                      {genre}
                  </div>
                  ))}
              </div>
          )}
        </div>

        <div className="flex flex-grow flex-col p-4">
          <h3 className="mb-1 line-clamp-2 text-lg font-bold text-primary-700 transition-colors duration-300 ease-in-out group-hover:text-secondary-600">
            {concert.title}
          </h3>

          <p className="mb-2 text-base font-semibold text-black">
            {concert.artist}
          </p>

          <div className="mb-2 text-sm text-gray-800">
            {/* Location: Use fetched location */}
            <p className="mb-1 line-clamp-1">{concert.location}</p>
            <p className="font-medium">
              {/* Date/Time: Use formatted values */}
              {formattedDate} | {time}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-gray-200 pt-3">
            <span className="text-sm font-semibold text-secondary-600">
              {/* Price: Use formatCurrency with fetched lowest price and currency */}
              {lowestPrice > 0
                ? `From ${formatCurrency(lowestPrice, concert.currency)}`
                : 'Price TBD'
              }
            </span>
            {/* Seats: Use fetched seats */}
            <span className="text-center rounded-full bg-secondary-800 px-3 py-1 text-xs text-white">
              {concert.seats > 0 ? `${concert.seats} seats left` : 'Sold Out'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
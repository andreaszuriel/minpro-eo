'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, AlertTriangle, MapPin, CalendarDays, Ticket, RadioTower, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { FetchedEventListItem } from '@/types'; 
import type { Genre, Country } from '@/types'; 

// ---Event Card for the Archive Page ---
interface EventArchiveCardProps {
  event: FetchedEventListItem;
}

function EventArchiveCard({ event }: EventArchiveCardProps) {
  const lowestPrice = event.lowestPrice; // Use pre-calculated lowestPrice from API

  let displayDate = "Date TBC";
  let shortMonth = "";
  let day = "";

  try {
    if (event.startDate) {
      const eventDate = new Date(event.startDate);
      displayDate = formatDate(event.startDate); // Using your existing formatDate
      shortMonth = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      day = String(eventDate.getDate());
    }
  } catch (e) {
    console.error("Error parsing date for event card:", event.startDate, e);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group flex h-full flex-col overflow-hidden rounded-none border-2 border-gray-700 bg-gray-800 shadow-lg transition-all duration-300 hover:border-yellow-400 hover:shadow-pink-500/30"
    >
      <Link href={`/events/${event.id}`} className="flex h-full flex-col">
        <div className="relative aspect-[3/2] w-full overflow-hidden">
          {event.image ? (
            <Image
              src={event.image}
              alt={`Poster for ${event.title}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
              onError={(e) => { e.currentTarget.src = "https://i.pinimg.com/1200x/2a/86/a5/2a86a560f0559704310d98fc32bd3d32.jpg"; }}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-700">
              <RadioTower className="h-16 w-16 text-gray-500" />
            </div>
          )}
          {/*  Date Badge */}
          {shortMonth && day && (
            <div className="absolute left-0 top-4 bg-yellow-400 px-3 py-1 text-black shadow-md">
              <span className="block text-xs font-bold uppercase">{shortMonth}</span>
              <span className="block text-2xl font-black leading-none">{day}</span>
            </div>
          )}
          {/* Genre Tag */}
          {event.genre?.name && (
            <div className="absolute bottom-2 right-2 bg-pink-500 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white">
              {event.genre.name}
            </div>
          )}
        </div>

        <div className="flex flex-grow flex-col p-4">
          <h3 className="mb-1 line-clamp-2 text-xl font-black uppercase text-yellow-400 transition-colors duration-300 group-hover:text-pink-500">
            {event.title}
          </h3>
          <p className="mb-2 text-lg font-semibold text-gray-100">{event.artist}</p>

          <div className="mb-3 mt-auto space-y-1 text-sm text-gray-400">
            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4 flex-shrink-0 text-pink-500" />
              <span className="truncate">{event.location}{event.country?.name ? `, ${event.country.name}` : ''}</span>
            </div>
            <div className="flex items-center">
              <CalendarDays className="mr-2 h-4 w-4 flex-shrink-0 text-pink-500" />
              <span>{displayDate}</span>
            </div>
          </div>

          <div className="mt-3 border-t-2 border-dashed border-gray-700 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-yellow-400">
                {lowestPrice > 0
                  ? `From ${formatCurrency(lowestPrice, event.currency || 'USD')}`
                  : 'INFO SOON'}
              </span>
              <span className="rounded-sm border-2 border-current px-3 py-1 text-xs font-bold uppercase text-yellow-400 transition-colors group-hover:bg-yellow-400 group-hover:text-black">
                View Event
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}


// --- Main Page Component ---
export default function EventsArchivePage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [allEvents, setAllEvents] = useState<FetchedEventListItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const eventsApiUrl = `/api/events?limit=500`; // fetch up to 500 events

        const [genresRes, countriesRes, eventsRes] = await Promise.all([
          fetch('/api/genres'),
          fetch('/api/countries'),
          fetch(eventsApiUrl)
        ]);

        if (!genresRes.ok) throw new Error(`Failed to fetch genres: ${genresRes.status} ${genresRes.statusText}`);
        if (!countriesRes.ok) throw new Error(`Failed to fetch countries: ${countriesRes.status} ${countriesRes.statusText}`);
        if (!eventsRes.ok) throw new Error(`Failed to fetch events: ${eventsRes.status} ${eventsRes.statusText}`);

        // Adjust parsing based on your actual API response structure
        const genresData = await genresRes.json();
        const countriesData = await countriesRes.json();
        const eventsData = await eventsRes.json();

        setGenres(genresData.genres || genresData); 
        setCountries(countriesData.countries || countriesData);
        setAllEvents(eventsData.events || eventsData); 

      } catch (e) {
        console.error("Error fetching archive data:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred during data fetching.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const eventsByGenreName = useMemo(() => {
    return allEvents.reduce((acc, event) => {
      const genreName = event.genre?.name || 'Uncategorized';
      if (!acc[genreName]) acc[genreName] = [];
      acc[genreName].push(event);
      return acc;
    }, {} as Record<string, FetchedEventListItem[]>);
  }, [allEvents]);

  const eventsByCountryName = useMemo(() => {
    return allEvents.reduce((acc, event) => {
      const countryName = event.country?.name || 'Various Locations';
      if (!acc[countryName]) acc[countryName] = [];
      acc[countryName].push(event);
      return acc;
    }, {} as Record<string, FetchedEventListItem[]>);
  }, [allEvents]);

  const sortedActiveGenreNames = useMemo(() => 
    genres
      .filter(g => eventsByGenreName[g.name]?.length > 0)
      .map(g => g.name)
      .sort((a, b) => a.localeCompare(b))
  , [genres, eventsByGenreName]);

  const sortedActiveCountryNames = useMemo(() => 
    countries
      .filter(c => eventsByCountryName[c.name]?.length > 0)
      .map(c => c.name)
      .sort((a, b) => a.localeCompare(b))
  , [countries, eventsByCountryName]);


  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center bg-black text-white p-8">
        <Loader2 className="h-16 w-16 animate-spin text-yellow-400" />
        <p className="mt-4 text-2xl font-black uppercase tracking-wider">Loading The Mosh Pit...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center bg-black p-8 text-center text-white">
        <AlertTriangle className="h-20 w-20 text-red-600" />
        <h1 className="mt-6 text-4xl font-black uppercase text-red-500">ERROR: STAGE DIVE FAILED!</h1>
        <p className="mt-3 max-w-lg text-xl text-gray-300">
          Something went wrong loading the event archive. The gremlins might be at it again.
        </p>
        <p className="mt-2 text-sm text-gray-500">Details: {error}</p>
        <Button
            onClick={() => window.location.reload()}
            className="mt-8 bg-yellow-400 px-8 py-3 text-lg font-bold text-black transition-transform hover:scale-105 hover:bg-yellow-300"
        >
            RELOAD THE SETLIST
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 px-4 py-24 sm:px-6 lg:px-8">
      {/* Header  */}
      <header className="relative mb-16 text-center md:mb-24">
        <div className="absolute -left-4 -top-4 -z-0 h-20 w-20 animate-pulse text-pink-900/50 opacity-30 md:h-32 md:w-32">
             <GripVertical size="100%" />
        </div>
        <div className="absolute -right-4 -bottom-8 -z-0 h-16 w-16 animate-pulse text-yellow-900/50 opacity-30 md:h-24 md:w-24">
             <RadioTower size="100%" />
        </div>
        <h1 className="text-5xl font-black uppercase tracking-tighter text-white sm:text-6xl md:text-8xl">
          <span className="text-shadow-hard block text-yellow-400">Event</span>
          <span className="text-shadow-hard-pink -mt-2 block text-pink-500 sm:-mt-3 md:-mt-5">Archive</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400 md:text-xl">
          Every show, every memory. Dive into the chaos of past, present, and future gigs.
        </p>
         <div className="mt-6 h-1 w-2/3 max-w-xs mx-auto bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-600"></div>
      </header>
      
      {/* Main Content: No events overall */}
       {!isLoading && !error && allEvents.length === 0 && (
        <div className="py-20 text-center">
            <Ticket className="mx-auto h-24 w-24 text-gray-700" />
            <h2 className="mt-8 text-3xl font-bold uppercase text-gray-500">The Archive is Empty!</h2>
            <p className="mt-3 text-lg text-gray-600">No gigs in the record. Time to make some noise!</p>
        </div>
      )}


      {/* Browse By Genre Section */}
      {allEvents.length > 0 && sortedActiveGenreNames.length > 0 && (
        <section id="browse-by-genre" className="mb-16 md:mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center md:mb-12"
          >
            <h2 className="inline-block transform bg-yellow-400 px-6 py-3 text-3xl font-black uppercase tracking-wider text-black shadow-lg md:text-4xl lg:text-5xl -skew-x-6">
              Browse By Genre
            </h2>
          </motion.div>

          {sortedActiveGenreNames.map((genreName) => (
            <div key={genreName} className="mb-12">
              <h3 className="mb-6 border-b-4 border-double border-pink-500 pb-2 text-3xl font-bold uppercase tracking-tight text-pink-500 md:mb-8 md:text-4xl">
                {genreName}
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-8">
                {(eventsByGenreName[genreName] || []).map((event) => (
                  <EventArchiveCard key={`${genreName}-${event.id}`} event={event} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Browse By Country Section */}
      {allEvents.length > 0 && sortedActiveCountryNames.length > 0 && (
        <section id="browse-by-country">
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center md:mb-12"
          >
            <h2 className="inline-block transform bg-pink-500 px-6 py-3 text-3xl font-black uppercase tracking-wider text-black shadow-lg md:text-4xl lg:text-5xl skew-x-6">
              Browse By Country
            </h2>
          </motion.div>

          {sortedActiveCountryNames.map((countryName) => (
            <div key={countryName} className="mb-12">
              <h3 className="mb-6 border-b-4 border-double border-yellow-400 pb-2 text-3xl font-bold uppercase tracking-tight text-yellow-400 md:mb-8 md:text-4xl">
                {countryName}
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-8">
                {(eventsByCountryName[countryName] || []).map((event) => (
                  <EventArchiveCard key={`${countryName}-${event.id}`} event={event} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
      
      {/* Global Styles*/}
      <style jsx global>{`
        .text-shadow-hard {
          text-shadow: 2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000;
        }
        .text-shadow-hard-pink {
           text-shadow: 2px 2px 0px #4a044e, -2px -2px 0px #4a044e, 2px -2px 0px #4a044e, -2px 2px 0px #4a044e; /* Darker pink for shadow */
        }
      `}</style>
    </div>
  );
}
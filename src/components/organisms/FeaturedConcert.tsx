'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowUpRight, Star } from "lucide-react";
import { ConcertEvent, concertList } from "../data/concertlist";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function FeaturedConcertsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const featuredConcerts = concertList.slice(0, 3);
  
  // Auto-rotate featured concerts every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % featuredConcerts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredConcerts.length]);

  return (
    <section className="relative overflow-hidden bg-slate-200 py-16 md:py-24">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      <div className="container relative mx-auto px-4">
        {/* Section Header */}
        <div className="mb-12 flex flex-col items-center md:mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-2 flex items-center space-x-2"
          >
            <Star className="h-6 w-6 text-tertiary-700" fill="currentColor" />
            <h2 className="text-4xl font-bold text-primary-700 md:text-5xl">
              FEATURED CONCERTS
            </h2>
            <Star className="h-6 w-6 text-tertiary-700" fill="currentColor" />
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center text-lg text-gray-800"
          >
            Don't miss out on this week's hottest performances
          </motion.p>
        </div>

        {/* Featured Concerts Display */}
        <div className="grid gap-8 md:grid-cols-7 md:gap-6 lg:gap-8">
          {/* Main Featured Concert (Large) */}
          <div className="md:col-span-3">
            <FeaturedMainCard 
              concert={featuredConcerts[activeIndex]} 
              isActive={true}
            />
          </div>
          
          {/* Secondary Featured Concerts (Smaller) */}
          <div className="grid grid-cols-2 gap-4 md:col-span-4 md:grid-cols-2">
            {featuredConcerts.map((concert, index) => (
              index !== activeIndex && (
                <SecondaryCard 
                  key={concert.id} 
                  concert={concert}
                  onClick={() => setActiveIndex(index)}
                />
              )
            ))}
          </div>
        </div>
        
        {/* Indicator Dots */}
        <div className="mt-8 flex justify-center space-x-2">
          {featuredConcerts.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`h-2 w-2 rounded-full transition-all ${
                index === activeIndex 
                  ? "w-8 bg-tertiary-500" 
                  : "bg-gray-600 hover:bg-gray-400"
              }`}
              aria-label={`View featured concert ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FeaturedMainCardProps {
  concert: ConcertEvent;
  isActive: boolean;
}

function FeaturedMainCard({ concert, isActive }: FeaturedMainCardProps) {
  const displayDate = formatDate(concert.startDate);
  const genreList = concert.genre.split('/').map(g => g.trim())[0];
  
  // Format day and month
  const eventDate = new Date(concert.startDate);
  const day = eventDate.getDate();
  const month = eventDate.toLocaleString('default', { month: 'short' });
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="group relative h-full overflow-hidden rounded-xl"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src={concert.image}
          alt={concert.title}
          fill
          sizes="(max-width: 768px) 100vw, 40vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
      </div>
      
      {/* Date Badge */}
      <div className="absolute right-4 top-4 flex h-16 w-16 flex-col items-center justify-center rounded-lg bg-tertiary-500 text-center shadow-lg">
        <span className="text-sm font-bold uppercase text-gray-900">{month}</span>
        <span className="text-2xl font-bold leading-none text-black">{day}</span>
      </div>
      
      {/* Content */}
      <Link 
        href={`/concerts/${concert.id}`}
        className="relative flex h-full min-h-[400px] flex-col justify-end p-6 md:p-8"
      >
        <div className="mb-2 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white w-fit">
          {genreList}
        </div>
        
        <h3 className="mb-1 text-2xl font-bold text-white md:text-3xl">
          {concert.title}
        </h3>
        
        <p className="mb-4 text-xl font-semibold text-white">
          {concert.artist}
        </p>
        
        <div className="mb-6 flex items-center text-sm text-gray-300">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{displayDate} | {concert.time}</span>
        </div>
        
        <Button 
          className="group flex w-full items-center justify-center space-x-2 rounded-lg bg-primary-600 py-3 text-white transition-transform hover:bg-primary-400 md:w-1/2"
        >
          <span>Get Tickets</span>
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Button>
      </Link>
    </motion.div>
  );
}

interface SecondaryCardProps {
  concert: ConcertEvent;
  onClick: () => void;
}

function SecondaryCard({ concert, onClick }: SecondaryCardProps) {
  const displayDate = formatDate(concert.startDate);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-lg bg-gray-800 shadow-md transition-all hover:shadow-xl"
    >
      {/* Image Container */}
      <div className="relative h-36 w-full overflow-hidden">
        <Image
          src={concert.image}
          alt={concert.title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent"></div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="mb-1 line-clamp-1 text-base font-bold text-white group-hover:text-tertiary-400">
          {concert.title}
        </h3>
        <p className="mb-2 line-clamp-1 text-sm font-medium text-gray-400">
          {concert.artist}
        </p>
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="mr-1 h-3 w-3" />
          <span className="truncate">{displayDate}</span>
        </div>
      </div>
    </motion.div>
  );
}
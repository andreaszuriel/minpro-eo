import React from "react";
import Image from "next/image";
import { Calendar, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { featuredConcerts } from "../data/featured";

interface ConcertCardProps {
  title: string;
  artist: string;
  date: string;
  time: string;
  location: string;
  imageUrl: string;
  genre: string;
}

const ConcertCard: React.FC<ConcertCardProps> = ({
  title,
  artist,
  date,
  time,
  location,
  imageUrl,
  genre,
}) => {
  return (
    <div className="relative bg-gray-900 dark:bg-gray-900 overflow-hidden shadow-lg transition-shadow duration-300 hover:shadow-xl w-full h-full flex flex-col group">
      {/* Image Container */}
      <div className="relative w-full h-3/5 md:h-2/3 flex-shrink-0 overflow-hidden">
        <div className="relative w-full h-full transition-transform duration-300 group-hover:scale-105">
          <Image
            src={imageUrl}
            alt={`${title} by ${artist}`}
            layout="fill"
            objectFit="cover"
          />
          {/* Gradient overlay - adds the dimming effect with smooth transition */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/40 to-transparent"></div>
        </div>
        <Badge className="absolute top-3 right-4 bg-tertiary-500 text-black z-10">
          {genre}
        </Badge>
      </div>
      {/* Content Container - takes remaining vertical space */}
      <div className="p-4 md:p-6 flex flex-col justify-center flex-grow overflow-hidden">
        <h3 className="text-white text-lg md:text-xl font-bold mb-1 md:mb-2 truncate">
          {title}
        </h3>
        <p className="text-base md:text-lg font-medium text-primary-600 mb-2 md:mb-3 truncate">
          {artist}
        </p>
        {/* Details - ensure they fit */}
        <div className="space-y-1 mt-auto pt-2">
          <div className="flex items-center text-xs md:text-sm text-gray-400 dark:text-gray-400">
            <Calendar size={14} className="mr-2 flex-shrink-0" />
            <span className="truncate">{date}</span>
          </div>
          <div className="flex items-center text-xs md:text-sm text-gray-400 dark:text-gray-400">
            <Clock size={14} className="mr-2 flex-shrink-0" />
            <span className="truncate">{time}</span>
          </div>
          <div className="flex items-center text-xs md:text-sm text-gray-400 dark:text-gray-400">
            <MapPin size={14} className="mr-2 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FeaturedConcertsSection() {
  return (
    <div className="bg-slate-200 min-h-screen flex items-center justify-center py-[10vh]">
      <section className="w-full max-w-7xl mx-auto h-full flex flex-col">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 md:mb-8 lg:mb-12 text-primary-600 px-4 flex-shrink-0">
          THIS WEEK'S TOP CONCERTS
        </h2>

        <div className="w-full h-144 md:grid md:grid-cols-[5fr_6fr_5fr]">
          {featuredConcerts.map((concert, index) => (
            <div key={index} className="mb-8 md:mb-0 h-full md:h-full">
              <ConcertCard {...concert} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
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
    <div className="relative bg-gray-900 dark:bg-gray-900 overflow-hidden shadow-lg transition-shadow duration-300 hover:shadow-2xl w-full h-full flex flex-col group">
      {/* Image Container */}
      <div className="relative pt-[60%] w-full overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105">
          <Image
            src={imageUrl}
            alt={`${title} by ${artist}`}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/40 to-transparent"></div>
        </div>

        <Badge className="absolute top-3 right-4 bg-tertiary-500 text-black z-10">
          {genre}
        </Badge>
      </div>
      {/* Content Container */}
      <div className="p-4 md:p-6 flex flex-col flex-grow">
        <h3 className="text-white text-lg md:text-xl font-bold mb-1 md:mb-2 truncate">
          {title}
        </h3>
        <p className="text-base md:text-lg font-medium text-primary-600 mb-2 md:mb-3 truncate">
          {artist}
        </p>
        {/* Details */}
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
    <section className="bg-slate-200 py-16 md:py-20">
      <div className="w-full">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-primary-600">
          THIS WEEK'S TOP CONCERTS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3">
          {featuredConcerts.map((concert, index) => (
            <div key={index} className="h-full">
              <ConcertCard {...concert} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, User, ExternalLink } from 'lucide-react';
import { ConcertEvent } from '@/components/data/concertlist';

interface ConcertDescriptionProps {
  concert: ConcertEvent;
  genres: string[];
  getFormattedDate: () => string;
}

export default function ConcertDescription({ concert, genres, getFormattedDate }: ConcertDescriptionProps) {
  return (
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
          <span>
            {getFormattedDate()} | {concert.time}
          </span>
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
          <p className="font-bold text-black">{concert.organizer}</p>
          <Link
            href={`/organizers/${concert.organizer.toLowerCase().replace(/\s+/g, '-')}`}
            className="text-primary-600 hover:text-secondary-600 flex items-center"
          >
            View Profile <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
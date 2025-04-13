import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConcertEvent, concertList } from "../data/concertlist";
import { formatDate } from "@/lib/utils";

interface ConcertCardProps {
  concert: ConcertEvent;
}

const ConcertCard = ({ concert }: ConcertCardProps) => {
  const {
    id,
    title,
    artist,
    genre,
    startDate,
    time,
    location,
    image
  } = concert;

  const displayDate = formatDate(startDate);

  return (
    <Link 
      href={`/concerts/${id}`} 
      className="relative flex h-full w-full flex-col overflow-hidden bg-gray-900 transition-shadow duration-300 hover:shadow-2xl group"
    >
      {/* Image Container */}
      <div className="relative w-full overflow-hidden pt-[60%]">
        <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105">
          <Image
            src={image}
            alt={`${title} concert by ${artist}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/40 to-transparent"></div>
        </div>

        <Badge className="absolute right-4 top-3 z-10 bg-tertiary-500 text-black">
          {genre}
        </Badge>
      </div>
      
      {/* Content Container */}
      <div className="flex flex-grow flex-col p-4 md:p-6">
        <h3 className="mb-1 truncate text-lg font-bold text-white md:mb-2 md:text-xl">
          {title}
        </h3>
        <p className="mb-2 truncate text-base font-medium text-primary-600 md:mb-3 md:text-lg">
          {artist}
        </p>
        
        {/* Details */}
        <div className="mt-auto space-y-1 pt-2">
          <div className="flex items-center text-xs text-gray-400 md:text-sm">
            <Calendar size={14} className="mr-2 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{displayDate}</span>
          </div>
          <div className="flex items-center text-xs text-gray-400 md:text-sm">
            <Clock size={14} className="mr-2 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{time}</span>
          </div>
          <div className="flex items-center text-xs text-gray-400 md:text-sm">
            <MapPin size={14} className="mr-2 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{location.split(',')[0]}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function FeaturedConcertsSection() {
  // Get only the first 3 concerts for the featured section
  const featuredConcerts = concertList.slice(0, 3);

  return (
    <section className="bg-slate-200 py-16 md:py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-3xl font-bold text-primary-600 md:mb-12 md:text-4xl">
          THIS WEEK&apos;S TOP CONCERTS
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featuredConcerts.map((concert) => (
            <ConcertCard key={concert.id} concert={concert} />
          ))}
        </div>
      </div>
    </section>
  );
}
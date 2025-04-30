import type { Event as PrismaEvent, Genre, Country, User } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library'; 

// Type for the data returned by GET /api/events/[id]
export type DetailedEvent = Omit<PrismaEvent, 'genreId' | 'countryId' | 'organizerId' | 'tiers' | 'price'> & {
  genre: Genre;
  country: Country;
  organizer: Pick<User, 'id' | 'name'>;
  soldSeats: number; 
  tiers: JsonValue; 
  price: JsonValue; 
};

// Define the specific structures expected within the JSON fields
export type PriceMap = Record<string, number>;
export type TierData = string[]; 

export interface FetchedEventListItem {
    id: number;
    title: string;
    artist: string;
    startDate: string; // ISO string
    // endDate: string; // Maybe not needed for list card
    location: string;
    seats: number;
    image: string | null;
    // description: string | null; // Maybe not needed for list card
    genre: { name: string };
    country: { name: string };
    price: Record<string, number>; // Price map { "Tier": price }
    currency: string; // e.g., "IDR", "USD"
    // Derived/added by API or frontend:
    lowestPrice: number;
}

// Type for the overall API response structure
export interface PaginatedEventsResponse {
    events: FetchedEventListItem[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
}

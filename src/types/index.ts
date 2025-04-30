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

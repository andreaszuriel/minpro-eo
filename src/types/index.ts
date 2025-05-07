// types/index.ts

import type {
  Event   as PrismaEvent,
  Genre   as PrismaGenre,
  Country as PrismaCountry,
  User
} from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for any JSON fields in your Prisma schema
// ─────────────────────────────────────────────────────────────────────────────
export type PriceMap = Record<string, number>;
export type TierData = string[];

// ─────────────────────────────────────────────────────────────────────────────
// Full “detailed” event returned by GET /api/events/[id]
// ─────────────────────────────────────────────────────────────────────────────
export type DetailedEvent = Omit<
  PrismaEvent,
  'genreId' | 'countryId' | 'organizerId' | 'tiers' | 'price'
> & {
  genre: PrismaGenre;
  country: PrismaCountry;
  organizer: Pick<User, 'id' | 'name'>;
  soldSeats: number;
  tiers: TierData;       // JsonValue but we know it's TierData
  price: PriceMap;       // JsonValue but we know it's PriceMap
};

// ─────────────────────────────────────────────────────────────────────────────
// Simplified “list‐card” version your frontend uses
// ─────────────────────────────────────────────────────────────────────────────
export interface FetchedEventListItem {
  id: number;
  title: string;
  artist: string;
  startDate: string;      // ISO string
  location: string;
  seats: number;
  image: string | null;
  genre: Genre;           // our own Genre interface, see below
  country: Country;       // our own Country interface, see below
  price: PriceMap;        // { "TierName": price }
  currency: string;       // e.g. "IDR", "USD"
  lowestPrice: number;    // derived client/API side
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination wrapper (if you need paging in your list‐API)
// ─────────────────────────────────────────────────────────────────────────────
export interface PaginatedEventsResponse {
  events: FetchedEventListItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Genre & Country shapes for your frontend/API
// ─────────────────────────────────────────────────────────────────────────────
export interface Genre {
  id: number;
  name: string;
}

export interface Country {
  id: number;
  name: string;
  code: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API responses for fetching lookup data
// ─────────────────────────────────────────────────────────────────────────────
export interface GenresApiResponse {
  genres: Genre[];
}

export interface CountriesApiResponse {
  countries: Country[];
}

export interface EventsApiResponse {
  events: FetchedEventListItem[];
  totalCount?: number;     // optional if you’re not paginating
  currentPage?: number;    // optional pagination info
  totalPages?: number;     // optional pagination info
}

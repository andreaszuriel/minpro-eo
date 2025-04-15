// src/models/interface.ts

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  referralCode?: string;
}

export interface UserPayload {
  id: number;
  email: string;
  role: 'customer' | 'organizer';
  name: string;
}

// Interface for Transaction (matches Prisma model Transaction)
export interface Transaction {
  id: number;
  userId: number;
  eventId: number;
  ticketQuantity: number;
  finalPrice: number;
  status: string;
  paymentProof: string | null;
  createdAt: Date;
}

// Interface for input when creating/updating an Event
export interface EventInput {
  title: string;
  genre: string;
  startDate: Date | string;
  endDate: Date | string;
  location: string;
  seats: number;
  tiers: any;       // You might refine this type based on your JSON structure
  price: number | any; // If stored as JSON, adjust accordingly
  image?: string;    // Optional; could be undefined
  description?: string;
}

// Interface for the response/payload for an Event
export interface EventPayload {
  id: number;
  title: string;
  genre: string;
  startDate: Date;
  endDate: Date;
  location: string;
  seats: number;
  tiers: any;
  price: number | any;
  image?: string | null;
  description?: string | null;  // Allow description to be string, null, or undefined
  organizerId: number;
  createdAt: Date;
  updatedAt: Date;
}


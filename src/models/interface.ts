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

export interface EventInput {
  title: string;
  genre: string;
  startDate: Date | string;
  endDate: Date | string;
  location: string;
  seats: number;
  tiers: any;      
  price: number | any; 
  image?: string;    
  description?: string;
}


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
  description?: string | null;  
  organizerId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionInput {
  eventId: number;
  ticketQuantity: number;
}


export interface TransactionPayload {
  id: number;
  userId: number;
  eventId: number;
  ticketQuantity: number;
  finalPrice: number;
  status: string;
  paymentProof: string | null;
  createdAt: Date;
}


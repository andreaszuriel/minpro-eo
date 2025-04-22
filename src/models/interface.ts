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
  tierType: string;
  ticketQuantity: number;
  couponCode?: string;   // optional
  usePoints?: boolean;   // whether to redeem points
}

export interface TransactionPayload {
  id: number;
  userId: number;
  eventId: number;
  tierType: string;
  ticketQuantity: number;
  basePrice: number;
  couponDiscount: number;
  pointsUsed: number;
  finalPrice: number;
  status: 'PENDING'|'WAITING_ADMIN'|'PAID'|'EXPIRED'|'CANCELED';
  paymentProof?: string;
  paymentDeadline: Date;
  voucherUrl?: string;
  ticketUrl?: string;
  createdAt: Date;
}


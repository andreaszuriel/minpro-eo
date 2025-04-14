// src/models/interface.ts
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'organizer';
  referralCode?: string;
}

export interface UserPayload {
  id: number;
  email: string;
  role: 'customer' | 'organizer';
  name: string;
}

// Interface transaksi sesuai dengan Prisma model Transaction
export interface Transaction {
  id: number;
  userId: number;
  eventId: number;
  ticketQuantity: number;
  finalPrice: number;
  status: string;
  paymentProof: string | null;  // Now allows string or null
  createdAt: Date;
}


// Interface profile user lengkap, termasuk history transaksi
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'organizer';
  points: number;
  referralCode: string;
  createdAt: Date;
  transactions: Transaction[];
}

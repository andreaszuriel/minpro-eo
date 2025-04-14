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

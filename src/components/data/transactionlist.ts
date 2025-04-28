import { TransactionStatus } from '@prisma/client';

export interface TransactionItem {
  id: number;
  userId: string;
  eventId: number;
  ticketQuantity: number;
  finalPrice: number;
  basePrice: number;
  couponDiscount: number;
  paymentDeadline: string;
  pointsUsed: number;
  tierType: string;
  status: TransactionStatus;
  paymentProof?: string;
  ticketUrl?: string;
  voucherUrl?: string;
}

export const transactionList: TransactionItem[] = [
  // Customer 1 - Event 1 - VIP - PAID
  {
    id: 1,
    userId: 'cust1',
    eventId: 1,
    ticketQuantity: 1,
    basePrice: 1500000,
    finalPrice: 1500000,
    couponDiscount: 0,
    paymentDeadline: '2025-05-14T00:00:00Z',
    pointsUsed: 0,
    tierType: 'VIP',
    status: 'PAID',
    paymentProof: 'https://example.com/proof1.jpg',
    ticketUrl: 'https://example.com/ticket1.pdf'
  },
  
  // Customer 1 - Event 1 - General Admission - PAID
  {
    id: 2,
    userId: 'cust1',
    eventId: 1,
    ticketQuantity: 1,
    basePrice: 1000000,
    finalPrice: 900000,
    couponDiscount: 0,
    paymentDeadline: '2025-05-14T00:00:00Z',
    pointsUsed: 100,  // Using 100 points for 100,000 discount
    tierType: 'General Admission',
    status: 'PAID',
    paymentProof: 'https://example.com/proof2.jpg',
    ticketUrl: 'https://example.com/ticket2.pdf'
  },
  
  // Customer 2 - Event 2 - Premium - PAID
  {
    id: 3,
    userId: 'cust2',
    eventId: 2,
    ticketQuantity: 1,
    basePrice: 1200000,
    finalPrice: 1150000,
    couponDiscount: 50000,
    paymentDeadline: '2025-03-18T00:00:00Z',
    pointsUsed: 0,
    tierType: 'Premium',
    status: 'PAID',
    paymentProof: 'https://example.com/proof3.jpg',
    ticketUrl: 'https://example.com/ticket3.pdf'
  },
  
  // Customer 2 - Event 3 - Floor - WAITING_ADMIN
  {
    id: 4,
    userId: 'cust2',
    eventId: 3,
    ticketQuantity: 1,
    basePrice: 1000000,
    finalPrice: 975000,
    couponDiscount: 0,
    paymentDeadline: '2025-03-19T00:00:00Z',
    pointsUsed: 25,  // Using 25 points for 25,000 discount
    tierType: 'Floor',
    status: 'WAITING_ADMIN',
    paymentProof: 'https://example.com/proof4.jpg'
  },
  
  // Customer 2 - Event 3 - Lower Bowl - WAITING_ADMIN
  {
    id: 5,
    userId: 'cust2',
    eventId: 3,
    ticketQuantity: 1,
    basePrice: 700000,
    finalPrice: 675000,
    couponDiscount: 0,
    paymentDeadline: '2025-03-19T00:00:00Z',
    pointsUsed: 25,  // Using 25 points for 25,000 discount
    tierType: 'Lower Bowl',
    status: 'WAITING_ADMIN',
    paymentProof: 'https://example.com/proof5.jpg'
  }
];

export interface TicketItem {
  id: string;
  serialCode: string;
  userId: string;
  eventId: number;
  transactionId: number;
  tierType: string;
  isUsed: boolean;
}

export const ticketList: TicketItem[] = [
  // Customer 1 - Transaction 1 - VIP
  {
    id: 'ticket1',
    serialCode: 'VIP-EVT1-CUST1-001',
    userId: 'cust1',
    eventId: 1,
    transactionId: 1,
    tierType: 'VIP',
    isUsed: false
  },
  
  // Customer 1 - Transaction 2 - General Admission
  {
    id: 'ticket2',
    serialCode: 'GA-EVT1-CUST1-001',
    userId: 'cust1',
    eventId: 1,
    transactionId: 2,
    tierType: 'General Admission',
    isUsed: false
  },
  
  // Customer 2 - Transaction 3 - Premium
  {
    id: 'ticket3',
    serialCode: 'PREM-EVT2-CUST2-001',
    userId: 'cust2',
    eventId: 2,
    transactionId: 3,
    tierType: 'Premium',
    isUsed: false
  },
  
  // No tickets for Transaction 4 and 5 since they're still WAITING_ADMIN
];
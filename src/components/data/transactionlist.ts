import { TransactionStatus } from '@prisma/client';

export interface TransactionItem {
  id: number;
  userId: string;
  eventId: number;
  ticketQuantity: number;
  finalPrice: number;
  basePrice: number;
  couponDiscount: number;
  paymentDeadline: string; // ISO 8601 DateTime string
  pointsUsed: number;
  tierType: string;
  status: TransactionStatus;
  paymentProof?: string;
  ticketUrl?: string;
  voucherUrl?: string;
  createdAt?: string; // Optional: Set specific creation time
  updatedAt?: string; // Optional: Set specific update time
}

export interface TicketItem {
  id: string; // Should be unique (like CUID)
  serialCode: string; // Must be unique
  userId: string;
  eventId: number;
  transactionId: number;
  tierType: string;
  isUsed: boolean;
  createdAt?: string; // Optional
  updatedAt?: string; // Optional
}

// Helper function to calculate deadline (e.g., 1 hour from now)
const createDeadline = (hours = 1): string => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
};

// Assuming 1 point = 1000 currency unit discount for calculations
const calculateFinalPrice = (base: number, points: number, coupon: number): number => {
    return base - (points * 1000) - coupon;
}

export const transactionList: TransactionItem[] = [
  // 1. cust1 buys 1 VIP ticket for event 1 (PAID)
  {
    id: 1,
    userId: 'cust1',
    eventId: 1,
    ticketQuantity: 1,
    basePrice: 1500000, // concertList[0].price.VIP
    finalPrice: 1500000,
    couponDiscount: 0,
    paymentDeadline: "2025-05-14T12:00:00Z", // Past deadline, but PAID
    pointsUsed: 0,
    tierType: 'VIP',
    status: 'PAID',
    paymentProof: 'https://example.com/proof/proof_tx1.jpg',
    ticketUrl: 'https://example.com/tickets/ticket_tx1.pdf',
    createdAt: "2025-05-13T11:00:00Z",
    updatedAt: "2025-05-13T11:30:00Z",
  },
  // 2. cust1 buys 2 General Admission tickets for event 1 (PAID, used 100 points)
  {
    id: 2,
    userId: 'cust1',
    eventId: 1,
    ticketQuantity: 2,
    basePrice: 2000000, // concertList[0].price["General Admission"] * 2
    pointsUsed: 100,
    couponDiscount: 0,
    finalPrice: calculateFinalPrice(2000000, 100, 0), // 2,000,000 - 100*1000 = 1,900,000
    paymentDeadline: "2025-05-15T10:00:00Z", // Past deadline, but PAID
    tierType: 'General Admission',
    status: 'PAID',
    paymentProof: 'https://example.com/proof/proof_tx2.jpg',
    ticketUrl: 'https://example.com/tickets/ticket_tx2.pdf',
    createdAt: "2025-05-14T09:00:00Z",
    updatedAt: "2025-05-14T09:45:00Z",
  },
  // 3. cust2 buys 1 Premium ticket for event 2 (PAID, used 50k coupon)
  {
    id: 3,
    userId: 'cust2',
    eventId: 2,
    ticketQuantity: 1,
    basePrice: 1200000, // concertList[1].price.Premium
    pointsUsed: 0,
    couponDiscount: 50000,
    finalPrice: calculateFinalPrice(1200000, 0, 50000), // 1,150,000
    paymentDeadline: "2025-03-18T19:00:00Z", // Past deadline, but PAID
    tierType: 'Premium',
    status: 'PAID',
    paymentProof: 'https://example.com/proof/proof_tx3.jpg',
    ticketUrl: 'https://example.com/tickets/ticket_tx3.pdf',
    createdAt: "2025-03-17T18:00:00Z",
    updatedAt: "2025-03-17T18:20:00Z",
  },
  // 4. cust4 buys 1 Floor ticket for event 3 (WAITING_ADMIN, used 25 points)
  {
    id: 4,
    userId: 'cust4',
    eventId: 3,
    ticketQuantity: 1,
    basePrice: 1000000, // concertList[2].price.Floor
    pointsUsed: 25,
    couponDiscount: 0,
    finalPrice: calculateFinalPrice(1000000, 25, 0), // 975,000
    paymentDeadline: createDeadline(24), // Deadline in 24 hours
    tierType: 'Floor',
    status: 'WAITING_ADMIN',
    paymentProof: 'https://example.com/proof/proof_tx4_pending.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // 5. cust2 buys 1 Lower Bowl ticket for event 3 (CANCELED)
  {
    id: 5,
    userId: 'cust2',
    eventId: 3,
    ticketQuantity: 1,
    basePrice: 700000, // concertList[2].price["Lower Bowl"]
    pointsUsed: 0,
    couponDiscount: 0,
    finalPrice: calculateFinalPrice(700000, 0, 0), // 700,000
    paymentDeadline: "2025-03-20T12:00:00Z", // Past deadline
    tierType: 'Lower Bowl',
    status: 'CANCELED', // Manually canceled by user or admin
    createdAt: "2025-03-19T11:00:00Z",
    updatedAt: "2025-03-21T10:00:00Z", // Updated when canceled
  },
  // 6. cust3 buys 1 Floor GA ticket for event 4 (PAID)
  {
    id: 6,
    userId: 'cust3',
    eventId: 4,
    ticketQuantity: 1,
    basePrice: 1100000, // concertList[3].price["Floor GA"]
    pointsUsed: 0,
    couponDiscount: 0,
    finalPrice: calculateFinalPrice(1100000, 0, 0),
    paymentDeadline: "2025-06-20T12:00:00Z",
    tierType: 'Floor GA',
    status: 'PAID',
    paymentProof: 'https://example.com/proof/proof_tx6.jpg',
    ticketUrl: 'https://example.com/tickets/ticket_tx6.pdf',
    createdAt: "2025-06-19T10:00:00Z",
    updatedAt: "2025-06-19T10:15:00Z",
  },
  // 7. cust3 buys 2 Arena Standing tickets for event 5 (PAID, used 150 points)
  {
    id: 7,
    userId: 'cust3',
    eventId: 5,
    ticketQuantity: 2,
    basePrice: 2600000, // concertList[4].price["Arena Standing"] * 2
    pointsUsed: 150,
    couponDiscount: 0,
    finalPrice: calculateFinalPrice(2600000, 150, 0), // 2,600,000 - 150,000 = 2,450,000
    paymentDeadline: "2025-08-05T18:00:00Z",
    tierType: 'Arena Standing',
    status: 'PAID',
    paymentProof: 'https://example.com/proof/proof_tx7.jpg',
    ticketUrl: 'https://example.com/tickets/ticket_tx7.pdf',
    createdAt: "2025-08-04T17:00:00Z",
    updatedAt: "2025-08-04T17:30:00Z",
  },
  // 8. cust1 buys 1 Pit ticket for event 6 (WAITING_ADMIN)
  {
    id: 8,
    userId: 'cust1',
    eventId: 6,
    ticketQuantity: 1,
    basePrice: 1250000, // concertList[5].price.Pit
    pointsUsed: 0,
    couponDiscount: 0,
    finalPrice: calculateFinalPrice(1250000, 0, 0),
    paymentDeadline: createDeadline(24), // Deadline in 24 hours
    tierType: 'Pit',
    status: 'WAITING_ADMIN',
    paymentProof: 'https://example.com/proof/proof_tx8_pending.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // 9. cust4 buys 1 Standard Seated ticket for event 7 (PAID, used 25 points + 20k coupon)
  {
    id: 9,
    userId: 'cust4',
    eventId: 7,
    ticketQuantity: 1,
    basePrice: 700000, // concertList[6].price["Standard Seated"]
    pointsUsed: 25, // User only had 25 points
    couponDiscount: 20000,
    finalPrice: calculateFinalPrice(700000, 25, 20000), // 700,000 - 25,000 - 20,000 = 655,000
    paymentDeadline: "2025-07-15T20:00:00Z",
    tierType: 'Standard Seated',
    status: 'PAID',
    paymentProof: 'https://example.com/proof/proof_tx9.jpg',
    ticketUrl: 'https://example.com/tickets/ticket_tx9.pdf',
    createdAt: "2025-07-14T19:00:00Z",
    updatedAt: "2025-07-14T19:30:00Z",
  },
  // 10. cust2 buys 1 MOSH'SH PIT ticket for event 8 (EXPIRED)
  {
    id: 10,
    userId: 'cust2',
    eventId: 8,
    ticketQuantity: 1,
    basePrice: 1500000, // concertList[7].price["MOSH'SH PIT"]
    pointsUsed: 0,
    couponDiscount: 0,
    finalPrice: calculateFinalPrice(1500000, 0, 0),
    paymentDeadline: "2025-10-20T10:00:00Z", // Deadline passed
    tierType: "MOSH'SH PIT",
    status: 'EXPIRED',
    createdAt: "2025-10-19T09:00:00Z",
    updatedAt: "2025-10-20T10:00:01Z", // Updated when expired
  },
   // 11. cust1 buys 1 GA Floor for event 9 (PAID)
  {
    id: 11,
    userId: 'cust1',
    eventId: 9,
    ticketQuantity: 1,
    basePrice: 1300000, // concertList[8].price["GA Floor"]
    pointsUsed: 50, // Used remaining points
    couponDiscount: 0,
    finalPrice: calculateFinalPrice(1300000, 50, 0), // 1,300,000 - 50,000 = 1,250,000
    paymentDeadline: "2025-04-25T19:00:00Z",
    tierType: 'GA Floor',
    status: 'PAID',
    paymentProof: 'https://example.com/proof/proof_tx11.jpg',
    ticketUrl: 'https://example.com/tickets/ticket_tx11.pdf',
    createdAt: "2025-04-24T18:00:00Z",
    updatedAt: "2025-04-24T18:15:00Z",
  },
   // 12. cust3 buys 1 GA Rows 1-25 for event 10 (WAITING_ADMIN)
   {
    id: 12,
    userId: 'cust3',
    eventId: 10,
    ticketQuantity: 1,
    basePrice: 950000, // concertList[9].price["General Admission Rows 1-25"]
    pointsUsed: 50, // User has points left after tx 7
    couponDiscount: 0,
    finalPrice: calculateFinalPrice(950000, 50, 0), // 950,000 - 50,000 = 900,000
    paymentDeadline: createDeadline(12), // Deadline in 12 hours
    tierType: 'General Admission Rows 1-25',
    status: 'WAITING_ADMIN',
    paymentProof: 'https://example.com/proof/proof_tx12_pending.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
   // 13. cust2 buys 1 Balcony ticket for event 2 (PAID - buying again after previous cancellation)
  {
    id: 13,
    userId: 'cust2',
    eventId: 2,
    ticketQuantity: 1,
    basePrice: 500000, // concertList[1].price.Balcony
    pointsUsed: 0,
    couponDiscount: 0,
    finalPrice: calculateFinalPrice(500000, 0, 0),
    paymentDeadline: "2025-03-25T10:00:00Z",
    tierType: 'Balcony',
    status: 'PAID',
    paymentProof: 'https://example.com/proof/proof_tx13.jpg',
    ticketUrl: 'https://example.com/tickets/ticket_tx13.pdf',
    createdAt: "2025-03-24T09:00:00Z",
    updatedAt: "2025-03-24T09:10:00Z",
  },
   // 14. cust1 buys 1 Lower Tier Seated for event 4 (CANCELED)
  {
    id: 14,
    userId: 'cust1',
    eventId: 4,
    ticketQuantity: 1,
    basePrice: 900000, // concertList[3].price["Lower Tier Seated"]
    pointsUsed: 0,
    couponDiscount: 0,
    finalPrice: calculateFinalPrice(900000, 0, 0),
    paymentDeadline: "2025-07-01T12:00:00Z",
    tierType: 'Lower Tier Seated',
    status: 'CANCELED',
    createdAt: "2025-06-30T11:00:00Z",
    updatedAt: "2025-07-02T08:00:00Z",
  },
   // 15. cust4 buys 1 Upper Bowl ticket for event 6 (PAID)
   {
    id: 15,
    userId: 'cust4',
    eventId: 6,
    ticketQuantity: 1,
    basePrice: 550000, // concertList[5].price["Upper Bowl"]
    pointsUsed: 0, // No points left after tx 9
    couponDiscount: 0,
    finalPrice: calculateFinalPrice(550000, 0, 0),
    paymentDeadline: "2025-09-10T19:00:00Z",
    tierType: 'Upper Bowl',
    status: 'PAID',
    paymentProof: 'https://example.com/proof/proof_tx15.jpg',
    ticketUrl: 'https://example.com/tickets/ticket_tx15.pdf',
    createdAt: "2025-09-09T18:00:00Z",
    updatedAt: "2025-09-09T18:05:00Z",
  },
  {
    id: 16,
    userId: 'cust2',
    eventId: 13, // Wacken Open Air 2025
    ticketQuantity: 1,
    basePrice: 4000000, // concertList[12].price.VIP
    pointsUsed: 0,
    couponDiscount: 200000, // Special promotion coupon
    finalPrice: calculateFinalPrice(4000000, 0, 200000), // 3,800,000
    paymentDeadline: "2025-06-30T12:00:00Z",
    tierType: 'VIP',
    status: 'PAID',
    paymentProof: 'https://example.com/proof/proof_tx16.jpg',
    ticketUrl: 'https://example.com/tickets/ticket_tx16.pdf',
    createdAt: "2025-06-29T10:00:00Z",
    updatedAt: "2025-06-29T10:45:00Z",
  },
  {
    id: 17,
    userId: 'cust2',
    eventId: 14, // Hellfest Open Air 2025
    ticketQuantity: 1,
    basePrice: 3500000, // concertList[13].price["4-Day Pass"]
    pointsUsed: 100, // Using accumulated points
    couponDiscount: 0,
    finalPrice: calculateFinalPrice(3500000, 100, 0), // 3,400,000
    paymentDeadline: "2025-06-10T12:00:00Z",
    tierType: '4-Day Pass',
    status: 'PAID',
    paymentProof: 'https://example.com/proof/proof_tx17.jpg',
    ticketUrl: 'https://example.com/tickets/ticket_tx17.pdf',
    createdAt: "2025-06-09T09:00:00Z",
    updatedAt: "2025-06-09T09:30:00Z",
  },
  
  // 18. cust3 buys 1 normal ticket and 1 VIP ticket for a single event (16) - PAID
  {
    id: 18,
    userId: 'cust3',
    eventId: 16, // Sonic Temple Art & Music Festival
    ticketQuantity: 1,
    basePrice: 1500000, // concertList[15].price["General Admission"]
    pointsUsed: 0,
    couponDiscount: 0,
    finalPrice: calculateFinalPrice(1500000, 0, 0), // 1,500,000
    paymentDeadline: "2025-04-15T10:00:00Z",
    tierType: 'General Admission',
    status: 'CANCELED',
    paymentProof: 'https://example.com/proof/proof_tx18.jpg',
    ticketUrl: 'https://example.com/tickets/ticket_tx18.pdf',
    createdAt: "2025-06-14T09:00:00Z",
    updatedAt: "2025-06-14T09:15:00Z",
  },
  {
    id: 19,
    userId: 'cust3',
    eventId: 16, // Sonic Temple Art & Music Festival
    ticketQuantity: 1,
    basePrice: 3000000, // concertList[15].price.VIP
    pointsUsed: 200, // Using accumulated points
    couponDiscount: 100000, // Special coupon
    finalPrice: calculateFinalPrice(3000000, 200, 100000), // 2,700,000
    paymentDeadline: "2025-04-15T10:00:00Z",
    tierType: 'VIP',
    status: 'CANCELED',
    paymentProof: 'https://example.com/proof/proof_tx19.jpg',
    ticketUrl: 'https://example.com/tickets/ticket_tx19.pdf',
    createdAt: "2025-06-14T09:05:00Z",
    updatedAt: "2025-06-14T09:20:00Z",
  },
  
  // 20. cust4 buys 3 General Admission tickets for event 20 - WAITING_PAYMENT
  {
    id: 20,
    userId: 'cust4',
    eventId: 20, // Riot Fest 2025
    ticketQuantity: 3,
    basePrice: 4800000, // concertList[19].price["General Admission"] * 3
    pointsUsed: 150, // Using points for discount
    couponDiscount: 250000, // Group discount
    finalPrice: calculateFinalPrice(4800000, 150, 250000), // 4,400,000
    paymentDeadline: createDeadline(48), // Deadline in 48 hours
    tierType: 'General Admission',
    status: 'WAITING_ADMIN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Generate Ticket List based on PAID transactions
export const ticketList: TicketItem[] = transactionList
  .filter(tx => tx.status === 'PAID')
  .flatMap(tx => {
    const tickets: TicketItem[] = [];
    for (let i = 0; i < tx.ticketQuantity; i++) {
      // Generate a unique ID (e.g., using transaction and index)
      const ticketId = `tkt-${tx.id}-${i + 1}`;
      // Generate a unique serial code
      const serialCode = `${tx.tierType.substring(0, 3).toUpperCase()}-EVT${tx.eventId}-${tx.userId.toUpperCase()}-TX${tx.id}-${String(i + 1).padStart(3, '0')}`;
      tickets.push({
        id: ticketId,
        serialCode: serialCode,
        userId: tx.userId,
        eventId: tx.eventId,
        transactionId: tx.id,
        tierType: tx.tierType,
        isUsed: false,
        createdAt: tx.updatedAt, // Assume ticket created when transaction marked PAID
        updatedAt: tx.updatedAt,
      });
    }
    return tickets;
  });

// Example: Log the generated tickets count to verify
// console.log(`Generated ${ticketList.length} tickets.`);
// console.log(ticketList);
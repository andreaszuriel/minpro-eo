export interface ConcertEvent {
    id: number;
    title: string;
    artist: string;
    genre: string;
    startDate: string;
    endDate: string;
    time: string;
    location: string;
    seats: number;
    tiers: string[];
    price: {
      [tier: string]: number;
    };
    image: string;
    description: string;
    currency: string;
    organizerId: string; 
}

export const concertList: ConcertEvent[] = [
  {
    id: 1,
    title: "Vans Warped Tour 2025 – Washington, D.C.",
    artist: "Variety",
    genre: "Alternative Rock",
    startDate: "2025-06-14",
    endDate: "2025-06-15",
    time: "4:00 PM",
    location: "Festival Grounds at RFK Stadium, Washington, D.C, USA",
    seats: 20000,
    tiers: ["VIP", "General Admission", "Lawn"],
    price: {
      VIP: 1500000,
      "General Admission": 1000000,
      Lawn: 600000
    },
    currency: "IDR",
    image: "https://i.pinimg.com/1200x/33/9c/20/339c207729a108fa0402c3d9c73f7f75.jpg",
    description: "Celebrate the 30th anniversary of the iconic Vans Warped Tour...",
    organizerId: "e3c8fd91-6d8e-471c-93a2-95c9515d4942" 
  },
  {
    id: 2,
    title: "BAND-MAID – WORLD DOMINATION Tour",
    artist: "BAND-MAID",
    genre: "Rock",
    startDate: "2025-04-18",
    endDate: "2025-04-18",
    time: "8:00 PM",
    location: "LINE CUBE SHIBUYA, Tokyo, Japan",
    seats: 2000,
    tiers: ["Premium", "Standard", "Balcony"],
    price: {
      Premium: 1200000,
      Standard: 800000,
      Balcony: 500000
    },
    currency: "IDR",
    image: "https://i.pinimg.com/736x/77/9e/fd/779efdd7ffe4e58169ef71a6b5739855.jpg",
    description: "Experience the powerful performance of BAND-MAID...",
    organizerId: "273a526a-7e06-461f-bfbc-0316d36964cd"
  },
  {
    id: 3,
    title: "Falling In Reverse – Popular MonsTOUR II",
    artist: "Falling In Reverse",
    genre: "Post-Hardcore",
    startDate: "2025-04-19",
    endDate: "2025-04-19",
    time: "7:30 PM",
    location: "United Center, Chicago, IL, USA",
    seats: 23000,
    tiers: ["Floor", "Lower Bowl", "Upper Bowl"],
    price: {
      Floor: 1000000,
      "Lower Bowl": 700000,
      "Upper Bowl": 400000
    },
    currency: "IDR",
    image: "https://i.pinimg.com/1200x/45/73/6f/45736fa59bce05d445a1eda03a28e008.jpg",
    description: "Join Falling In Reverse for their Popular MonsTOUR II...",
    organizerId: "e89012d7-24ff-47f5-8e7f-b70706d5e8fd"
  },
];
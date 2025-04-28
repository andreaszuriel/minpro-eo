export interface ConcertEvent {
  id: number;
  title: string;
  artist: string;
  genreId: number;
  countryId: number;
  startDate: string;
  endDate: string;
  location: string;
  seats: number;
  tiers: string[];
  price: { [tier: string]: number };
  image?: string;
  description?: string;
  organizerId: string;
}

export const concertList: ConcertEvent[] = [
  {
    id: 1,
    title: "Vans Warped Tour 2025 – Washington, D.C.",
    artist: "Variety",
    genreId: 1,       // Alternative Rock
    countryId: 1,     // United States
    startDate: "2025-06-14",
    endDate:   "2025-06-15",
    location:  "Festival Grounds at RFK Stadium, Washington, D.C, USA",
    seats: 20000,
    tiers: ["VIP", "General Admission", "Lawn"],
    price: { VIP: 1500000, "General Admission": 1000000, Lawn: 600000 },
    image: "https://i.pinimg.com/1200x/33/9c/20/339c207729a108fa0402c3d9c73f7f75.jpg",
    description: "Celebrate the 30th anniversary of the iconic Vans Warped Tour...",
    organizerId: "org1",
  },
  {
    id: 2,
    title: "BAND-MAID – WORLD DOMINATION Tour",
    artist: "BAND-MAID",
    genreId: 2,       // Rock
    countryId: 2,     // Japan
    startDate: "2025-04-18",
    endDate:   "2025-04-18",
    location:  "LINE CUBE SHIBUYA, Tokyo, Japan",
    seats: 2000,
    tiers: ["Premium", "Standard", "Balcony"],
    price: { Premium: 1200000, Standard: 800000, Balcony: 500000 },
    image: "https://i.pinimg.com/736x/77/9e/fd/779efdd7ffe4e58169ef71a6b5739855.jpg",
    description: "Experience the powerful performance of BAND-MAID...",
    organizerId: "org2",
  },
  {
    id: 3,
    title: "Falling In Reverse – Popular MonsTOUR II",
    artist: "Falling In Reverse",
    genreId: 3,       // Post-Hardcore
    countryId: 1,     // United States
    startDate: "2025-04-19",
    endDate:   "2025-04-19",
    location:  "United Center, Chicago, IL, USA",
    seats: 23000,
    tiers: ["Floor", "Lower Bowl", "Upper Bowl"],
    price: { Floor: 1000000, "Lower Bowl": 700000, "Upper Bowl": 400000 },
    image: "https://i.pinimg.com/1200x/45/73/6f/45736fa59bce05d445a1eda03a28e008.jpg",
    description: "Join Falling In Reverse for their Popular MonsTOUR II...",
    organizerId: "org1",
  },
];
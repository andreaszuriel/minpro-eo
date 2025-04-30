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
    startDate: "2025-06-14T12:00:00Z",
    endDate:   "2025-06-15T23:00:00Z",
    location:  "Festival Grounds at RFK Stadium, Washington, D.C, USA",
    seats: 20000,
    tiers: ["VIP", "General Admission", "Lawn"],
    price: { "VIP": 1500000, "General Admission": 1000000, "Lawn": 600000 },
    image: "https://i.pinimg.com/1200x/33/9c/20/339c207729a108fa0402c3d9c73f7f75.jpg",
    description: "Celebrate the 30th anniversary of the iconic Vans Warped Tour with a massive lineup across multiple stages. Rock, punk, emo, and more!",
    organizerId: "org1",
  },
  {
    id: 2,
    title: "BAND-MAID – WORLD DOMINATION Tour",
    artist: "BAND-MAID",
    genreId: 2,       // Rock
    countryId: 2,     // Japan
    startDate: "2025-06-18T19:00:00Z",
    endDate:   "2025-06-18T22:00:00Z",
    location:  "LINE CUBE SHIBUYA, Tokyo, Japan",
    seats: 2000,
    tiers: ["Premium", "Standard", "Balcony"],
    price: { "Premium": 1200000, "Standard": 800000, "Balcony": 500000 },
    image: "https://i.pinimg.com/736x/77/9e/fd/779efdd7ffe4e58169ef71a6b5739855.jpg",
    description: "Experience the powerful performance and intricate musicianship of BAND-MAID live in Tokyo. Don't miss their signature 'maid' hard rock sound.",
    organizerId: "org2",
  },
  {
    id: 3,
    title: "Falling In Reverse – Popular MonsTOUR II",
    artist: "Falling In Reverse",
    genreId: 3,       // Post-Hardcore
    countryId: 1,     // United States
    startDate: "2025-06-19T20:00:00Z",
    endDate:   "2025-06-19T23:00:00Z",
    location:  "United Center, Chicago, IL, USA",
    seats: 23000,
    tiers: ["Floor", "Lower Bowl", "Upper Bowl"],
    price: { "Floor": 1000000, "Lower Bowl": 700000, "Upper Bowl": 400000 },
    image: "https://i.pinimg.com/1200x/45/73/6f/45736fa59bce05d445a1eda03a28e008.jpg",
    description: "Join Falling In Reverse for their explosive Popular MonsTOUR II, featuring hits old and new. Special guests to be announced.",
    organizerId: "org1",
  },
  {
    id: 4,
    title: "Arctic Monkeys - Tranquility Base Hotel & Casino Live",
    artist: "Arctic Monkeys",
    genreId: 1,       // Alternative Rock
    countryId: 1,     // United States
    startDate: "2025-07-20T20:00:00Z",
    endDate:   "2025-07-20T23:00:00Z",
    location:  "Madison Square Garden, New York, NY, USA",
    seats: 18000,
    tiers: ["Floor GA", "Lower Tier Seated", "Upper Tier Seated"],
    price: { "Floor GA": 1100000, "Lower Tier Seated": 900000, "Upper Tier Seated": 650000 },
    image: "https://picsum.photos/seed/arcticmonkeys/800/600",
    description: "An immersive experience celebrating the iconic album Tranquility Base Hotel & Casino, alongside classic hits.",
    organizerId: "org3",
  },
  {
    id: 5,
    title: "ONE OK ROCK - Eye of the Storm Japan Tour",
    artist: "ONE OK ROCK",
    genreId: 2,       // Rock
    countryId: 2,     // Japan
    startDate: "2025-09-05T18:30:00Z",
    endDate:   "2025-09-06T21:30:00Z",
    location:  "Tokyo Dome, Tokyo, Japan",
    seats: 55000,
    tiers: ["Arena Standing", "Stand S", "Stand A"],
    price: { "Arena Standing": 1300000, "Stand S": 1000000, "Stand A": 750000 },
    image: "https://picsum.photos/seed/oneokrock/800/600",
    description: "Japan's rock giants return to the legendary Tokyo Dome for two nights of high-energy performance.",
    organizerId: "org4",
  },
  {
    id: 6,
    title: "Bring Me The Horizon - Post Human: UK Arena Tour",
    artist: "Bring Me The Horizon",
    genreId: 3,       // Post-Hardcore (often Metalcore/Alt Metal too)
    countryId: 1,     // United States (Let's place a fictional US leg)
    startDate: "2025-10-10T19:30:00Z",
    endDate:   "2025-10-10T22:30:00Z",
    location:  "Crypto.com Arena, Los Angeles, CA, USA",
    seats: 19000,
    tiers: ["Pit", "Lower Bowl", "Upper Bowl"],
    price: { "Pit": 1250000, "Lower Bowl": 950000, "Upper Bowl": 550000 },
    image: "https://picsum.photos/seed/bmth/800/600",
    description: "Experience the genre-bending sounds of Bring Me The Horizon live, featuring tracks from their Post Human saga.",
    organizerId: "org5",
  },
  {
    id: 7,
    title: "Billie Eilish - Happier Than Ever, The World Tour Encore",
    artist: "Billie Eilish",
    genreId: 1, // More Pop/Alt Pop, but fits Alt Rock category broadly for seeding
    countryId: 1,     // United States
    startDate: "2025-08-15T20:00:00Z",
    endDate:   "2025-08-15T22:30:00Z",
    location:  "Barclays Center, Brooklyn, NY, USA",
    seats: 17000,
    tiers: ["Floor GA", "Premium Seated", "Standard Seated"],
    price: { "Floor GA": 1400000, "Premium Seated": 1100000, "Standard Seated": 700000 },
    image: "https://picsum.photos/seed/billie/800/600",
    description: "An encore performance leg of the critically acclaimed Happier Than Ever tour.",
    organizerId: "org6",
  },
  {
    id: 8,
    title: "BABYMETAL - METAL GALAXY RETURNS",
    artist: "BABYMETAL",
    genreId: 2, // J-Pop/Metal Fusion, fits Rock broadly
    countryId: 2,     // Japan
    startDate: "2025-11-20T19:00:00Z",
    endDate:   "2025-11-20T21:30:00Z",
    location:  "Makuhari Messe International Exhibition Hall, Chiba, Japan",
    seats: 15000,
    tiers: ["THE ONE VIP", "MOSH'SH PIT", "Reserved Seat"],
    price: { "THE ONE VIP": 2000000, "MOSH'SH PIT": 1500000, "Reserved Seat": 1000000 },
    image: "https://picsum.photos/seed/babymetal/800/600",
    description: "The Fox God descends once more! Witness the unique Kawaii Metal phenomenon live.",
    organizerId: "org2",
  },
  {
    id: 9,
    title: "My Chemical Romance - Reunion Tour Leg 3",
    artist: "My Chemical Romance",
    genreId: 1,       // Alternative Rock / Emo
    countryId: 1,     // United States
    startDate: "2025-05-25T19:30:00Z",
    endDate:   "2025-05-25T22:30:00Z",
    location:  "TD Garden, Boston, MA, USA",
    seats: 17800,
    tiers: ["GA Floor", "Loge", "Balcony"],
    price: { "GA Floor": 1300000, "Loge": 1000000, "Balcony": 700000 },
    image: "https://picsum.photos/seed/mcr/800/600",
    description: "The celebrated reunion continues. Sing along to the anthems that defined a generation.",
    organizerId: "org3",
  },
  {
    id: 10,
    title: "A Day To Remember - Re-Entry Tour",
    artist: "A Day To Remember",
    genreId: 3,       // Post-Hardcore / Pop Punk
    countryId: 1,     // United States
    startDate: "2025-06-01T19:00:00Z",
    endDate:   "2025-06-01T22:00:00Z",
    location:  "Red Rocks Amphitheatre, Morrison, CO, USA",
    seats: 9500,
    tiers: ["General Admission Rows 1-25", "General Admission Rows 26-69"],
    price: { "General Admission Rows 1-25": 950000, "General Admission Rows 26-69": 750000 },
    image: "https://picsum.photos/seed/adtr/800/600",
    description: "ADTR brings their blend of heavy riffs and catchy choruses to the iconic Red Rocks.",
    organizerId: "org5",
  },
  {
    id: 11,
    title: "Rock am Ring 2025",
    artist: "Various Artists",
    genreId: 1, // Alternative Rock
    countryId: 4, // Germany
    startDate: "2025-06-06T12:00:00Z",
    endDate:   "2025-06-08T23:00:00Z",
    location:  "Nürburgring, Nürburg, Germany",
    seats: 90000,
    tiers: ["General Admission"],
    price: { "General Admission": 3000000 },
    image: "https://picsum.photos/seed/rockamring/800/600",
    description: "Celebrating 40 years of Rock am Ring with headliners like Slipknot, Bring Me The Horizon, Korn, and more.", 
    organizerId: "org2",
  },
  {
    id: 12,
    title: "Download Festival 2025",
    artist: "Various Artists",
    genreId: 1, // Alternative Rock
    countryId: 3, // United Kingdom
    startDate: "2025-06-13T10:00:00Z",
    endDate:   "2025-06-15T23:00:00Z",
    location:  "Donington Park, Leicestershire, UK",
    seats: 100000,
    tiers: ["Weekend Ticket"],
    price: { "Weekend Ticket": 2700000 },
    image: "https://picsum.photos/seed/downloadfestival/800/600",
    description: "The UK's premier rock festival featuring Green Day, Sleep Token, Korn, Rise Against, and over 90 bands.", 
    organizerId: "org3",
  },
  {
    id: 13,
    title: "Wacken Open Air 2025",
    artist: "Various Artists",
    genreId: 3, // Post-Hardcore / Metal
    countryId: 4, // Germany
    startDate: "2025-07-30T12:00:00Z",
    endDate:   "2025-08-02T23:00:00Z",
    location:  "Wacken Festivalplatz, Wacken, Germany",
    seats: 85000,
    tiers: ["General Admission", "VIP"],
    price: { "General Admission": 2000000, "VIP": 4000000 },
    image: "https://picsum.photos/seed/wacken/800/600",
    description: "The world’s biggest metal festival with headliners Machine Head, Papa Roach, and Saltatio Mortis.", 
    organizerId: "org4",
  },
  {
    id: 14,
    title: "Hellfest Open Air 2025",
    artist: "Various Artists",
    genreId: 3, // Post-Hardcore / Metal
    countryId: 5, // France
    startDate: "2025-06-19T10:00:00Z",
    endDate:   "2025-06-22T23:00:00Z",
    location:  "Hellfest Grounds, Clisson, France",
    seats: 100000,
    tiers: ["4-Day Pass"],
    price: { "4-Day Pass": 3500000 },
    image: "https://picsum.photos/seed/hellfest/800/600",
    description: "Four days of extreme music featuring Muse, Linkin Park, Korn, Joe Satriani, and Scorpions.", 
    organizerId: "org5",
  },
  {
    id: 15,
    title: "Punk Rock Bowling Music Festival",
    artist: "Various Artists",
    genreId: 2, // Rock (Punk)
    countryId: 1, // United States
    startDate: "2025-05-24T18:00:00Z",
    endDate:   "2025-05-26T23:00:00Z",
    location:  "Fremont Street, Las Vegas, NV, USA",
    seats: 20000,
    tiers: ["General Admission"],
    price: { "General Admission": 1200000 },
    image: "https://picsum.photos/seed/punkbowling/800/600",
    description: "Three days of punk rock featuring Social Distortion, Cock Sparrer, Peter Hook & the Light, and more.", 
    organizerId: "org1",
  },
  {
    id: 16,
    title: "Sonic Temple Art & Music Festival",
    artist: "Various Artists",
    genreId: 1, // Alternative Rock
    countryId: 1, // United States
    startDate: "2025-05-08T12:00:00Z",
    endDate:   "2025-05-11T23:00:00Z",
    location:  "Mapfre Stadium, Columbus, OH, USA",
    seats: 35000,
    tiers: ["General Admission", "VIP"],
    price: { "General Admission": 1500000, "VIP": 3000000 },
    image: "https://picsum.photos/seed/sonictemple/800/600",
    description: "Headlined by Linkin Park, Metallica, and Korn, with over 30 bands across multiple stages.", 
    organizerId: "org6",
  },
  {
    id: 17,
    title: "Welcome to Rockville 2025",
    artist: "Various Artists",
    genreId: 1, // Alternative Rock
    countryId: 1, // United States
    startDate: "2025-05-15T12:00:00Z",
    endDate:   "2025-05-18T23:00:00Z",
    location:  "Daytona International Speedway, FL, USA",
    seats: 30000,
    tiers: ["General Admission", "VIP"],
    price: { "General Admission": 1400000, "VIP": 2800000 },
    image: "https://picsum.photos/seed/rockville/800/600",
    description: "Featuring Green Day, Linkin Park, Korn, Shinedown, and special guests across four days.", 
    organizerId: "org2",
  },
  {
    id: 18,
    title: "Slam Dunk Festival 2025",
    artist: "Various Artists",
    genreId: 2, // Rock / Pop Punk
    countryId: 3, // United Kingdom
    startDate: "2025-05-24T09:00:00Z",
    endDate:   "2025-05-25T22:00:00Z",
    location:  "Hatfield Park, UK",
    seats: 25000,
    tiers: ["General Admission"],
    price: { "General Admission": 1100000 },
    image: "https://picsum.photos/seed/slamdunk/800/600",
    description: "Two days of punk, emo, and alternative rock with Neck Deep, A Day to Remember, and Buffalo.", 
    organizerId: "org3",
  },
  {
    id: 19,
    title: "Louder Than Life 2025",
    artist: "Various Artists",
    genreId: 3, // Post-Hardcore / Metal
    countryId: 1, // United States
    startDate: "2025-09-18T12:00:00Z",
    endDate:   "2025-09-21T23:00:00Z",
    location:  "Highlands Festival Grounds, Louisville, KY, USA",
    seats: 40000,
    tiers: ["General Admission", "VIP"],
    price: { "General Admission": 1800000, "VIP": 3500000 },
    image: "https://picsum.photos/seed/louderthanlife/800/600",
    description: "Featuring Slayer, Avenged Sevenfold, Deftones, and Bring Me The Horizon.", 
    organizerId: "org4",
  },
  {
    id: 20,
    title: "Riot Fest 2025",
    artist: "Various Artists",
    genreId: 2, // Rock / Punk
    countryId: 1, // United States
    startDate: "2025-09-19T12:00:00Z",
    endDate:   "2025-09-21T22:00:00Z",
    location:  "Douglas Park, Chicago, IL, USA",
    seats: 40000,
    tiers: ["General Admission", "VIP"],
    price: { "General Admission": 1600000, "VIP": 3000000 },
    image: "https://picsum.photos/seed/riotfest/800/600",
    description: "Headliners blink-182, Green Day, Weezer, My Chemical Romance, and more.", 
    organizerId: "org5",
  },
];

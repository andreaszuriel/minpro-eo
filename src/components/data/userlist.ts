import { UserRole } from '@prisma/client';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  password: string; // Pre-hashed password needed in final implementation
  role: UserRole;
  points: number;
  referralCode: string;
  isAdmin: boolean;
  image?: string;
  emailVerified?: Date; // Optional: Mark as verified for seeding
}

export const userList: UserItem[] = [
  // Organizers (org1 - org6)
  {
    id: 'org1',
    name: 'Event Organizer One',
    email: 'organizer1@example.com',
    password: 'securepassword', // HASH THIS!
    role: 'organizer',
    points: 0,
    referralCode: 'ORG1CODE',
    image: 'https://i.pinimg.com/736x/b7/2d/d1/b72dd14f9dd742dbb03c72e2a3c13f3e.jpg',
    emailVerified: new Date(),
    isAdmin: false
  },
  {
    id: 'org2',
    name: 'Event Organizer Two',
    email: 'organizer2@example.com',
    password: 'securepassword', // HASH THIS!
    role: 'organizer',
    points: 0,
    referralCode: 'ORG2CODE',
    image: 'https://i.pinimg.com/736x/b7/2d/d1/b72dd14f9dd742dbb03c72e2a3c13f3e.jpg',
    emailVerified: new Date(),
    isAdmin: false
  },
  {
    id: 'org3',
    name: 'Event Organizer Three',
    email: 'organizer3@example.com',
    password: 'securepassword', // HASH THIS!
    role: 'organizer',
    points: 0,
    referralCode: 'ORG3CODE',
    image: 'https://i.pinimg.com/736x/b7/2d/d1/b72dd14f9dd742dbb03c72e2a3c13f3e.jpg',
    emailVerified: new Date(),
    isAdmin: false
  },
  {
    id: 'org4',
    name: 'Event Organizer Four',
    email: 'organizer4@example.com',
    password: 'securepassword', // HASH THIS!
    role: 'organizer',
    points: 0,
    referralCode: 'ORG4CODE',
    image: 'https://i.pinimg.com/736x/b7/2d/d1/b72dd14f9dd742dbb03c72e2a3c13f3e.jpg',
    emailVerified: new Date(),
    isAdmin: false
  },
  {
    id: 'org5',
    name: 'Event Organizer Five',
    email: 'organizer5@example.com',
    password: 'securepassword', // HASH THIS!
    role: 'organizer',
    points: 0,
    referralCode: 'ORG5CODE',
    image: 'https://i.pinimg.com/736x/b7/2d/d1/b72dd14f9dd742dbb03c72e2a3c13f3e.jpg',
    emailVerified: new Date(),
    isAdmin: false
  },
  {
    id: 'org6',
    name: 'Event Organizer Six',
    email: 'organizer6@example.com',
    password: 'securepassword', // HASH THIS!
    role: 'organizer',
    points: 0,
    referralCode: 'ORG6CODE',
    image: 'https://i.pinimg.com/736x/b7/2d/d1/b72dd14f9dd742dbb03c72e2a3c13f3e.jpg',
    emailVerified: new Date(),
    isAdmin: false
  },

  // Customers (cust1 - cust4)
  {
    id: 'cust1',
    name: 'Customer User One',
    email: 'customer1@example.com',
    password: 'securepassword', // HASH THIS!
    role: 'customer',
    points: 150,
    referralCode: 'CUST1CODE',
    image: 'https://i.pinimg.com/1200x/b3/4b/6d/b34b6d100330dae14061e943387c49ba.jpg',
    emailVerified: new Date(),
    isAdmin: false
  },
  {
    id: 'cust2',
    name: 'Customer User Two',
    email: 'customer2@example.com',
    password: 'securepassword',
    role: 'customer',
    points: 75,
    referralCode: 'CUST2CODE',
    image: 'https://i.pinimg.com/1200x/b3/4b/6d/b34b6d100330dae14061e943387c49ba.jpg',
    emailVerified: new Date(),
    isAdmin: false
  },
  {
    id: 'cust3',
    name: 'Customer User Three',
    email: 'customer3@example.com',
    password: 'securepassword', // HASH THIS!
    role: 'customer',
    points: 200,
    referralCode: 'CUST3CODE',
    image: 'https://i.pinimg.com/1200x/b3/4b/6d/b34b6d100330dae14061e943387c49ba.jpg',
    emailVerified: new Date(),
    isAdmin: false
  },
  {
    id: 'cust4',
    name: 'Customer User Four',
    email: 'customer4@example.com',
    password: 'securepassword',
    role: 'customer',
    points: 25,
    referralCode: 'CUST4CODE',
    image: 'https://i.pinimg.com/1200x/b3/4b/6d/b34b6d100330dae14061e943387c49ba.jpg',
    emailVerified: new Date(),
    isAdmin: false
  },

  {
    id: 'admin',
    name: 'Test Admin',
    email: 'testadmin@example.com',
    password: 'securepassword', 
    role: 'organizer',
    points: 0, 
    referralCode: 'admin123',
    image: 'https://i.pinimg.com/1200x/6e/59/95/6e599501252c23bcf02658617b29c894.jpg',
    emailVerified: new Date(),
    isAdmin: true
  }
];

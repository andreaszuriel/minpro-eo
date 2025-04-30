import { UserRole } from '@prisma/client';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  password: string; // Pre-hashed password needed in final implementation
  role: UserRole;
  points: number;
  referralCode: string;
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
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=organizer1',
    emailVerified: new Date(),
  },
  {
    id: 'org2',
    name: 'Event Organizer Two',
    email: 'organizer2@example.com',
    password: 'securepassword', // HASH THIS!
    role: 'organizer',
    points: 0,
    referralCode: 'ORG2CODE',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=organizer2',
    emailVerified: new Date(),
  },
  {
    id: 'org3',
    name: 'Event Organizer Three',
    email: 'organizer3@example.com',
    password: 'securepassword', // HASH THIS!
    role: 'organizer',
    points: 0,
    referralCode: 'ORG3CODE',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=organizer3',
    emailVerified: new Date(),
  },
  {
    id: 'org4',
    name: 'Event Organizer Four',
    email: 'organizer4@example.com',
    password: 'securepassword', // HASH THIS!
    role: 'organizer',
    points: 0,
    referralCode: 'ORG4CODE',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=organizer4',
    emailVerified: new Date(),
  },
  {
    id: 'org5',
    name: 'Event Organizer Five',
    email: 'organizer5@example.com',
    password: 'securepassword', // HASH THIS!
    role: 'organizer',
    points: 0,
    referralCode: 'ORG5CODE',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=organizer5',
    emailVerified: new Date(),
  },
  {
    id: 'org6',
    name: 'Event Organizer Six',
    email: 'organizer6@example.com',
    password: 'securepassword', // HASH THIS!
    role: 'organizer',
    points: 0,
    referralCode: 'ORG6CODE',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=organizer6',
    emailVerified: new Date(),
  },

  // Customers (cust1 - cust4)
  {
    id: 'cust1',
    name: 'Customer User One',
    email: 'customer1@example.com',
    password: 'securepassword', // HASH THIS!
    role: 'customer',
    points: 150, // Initial points
    referralCode: 'CUST1CODE',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=customer1',
    emailVerified: new Date(),
  },
  {
    id: 'cust2',
    name: 'Customer User Two',
    email: 'customer2@example.com',
    password: 'securepassword', // 'securepassword'
    role: 'customer',
    points: 75, // Initial points
    referralCode: 'CUST2CODE',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=customer2',
    emailVerified: new Date(),
  },
  {
    id: 'cust3',
    name: 'Customer User Three',
    email: 'customer3@example.com',
    password: 'securepassword', // HASH THIS!
    role: 'customer',
    points: 200, // Initial points
    referralCode: 'CUST3CODE',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=customer3',
    emailVerified: new Date(),
  },
  {
    id: 'cust4',
    name: 'Customer User Four',
    email: 'customer4@example.com',
    password: 'securepassword', // HASH THIS!
    role: 'customer',
    points: 25, // Initial points
    referralCode: 'CUST4CODE',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=customer4',
    emailVerified: new Date(),
  }
];
import { UserRole } from '@prisma/client';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  password: string; // Pre-hashed password in the final implementation
  role: UserRole;
  points: number;
  referralCode: string;
  image?: string;
}

export const userList: UserItem[] = [
  {
    id: 'org1',
    name: 'Event Organizer One',
    email: 'organizer1@example.com',
    password: 'securepassword', // 'securepassword'
    role: 'organizer',
    points: 0,
    referralCode: 'ORG1CODE',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=organizer1'
  },
  {
    id: 'org2',
    name: 'Event Organizer Two',
    email: 'organizer2@example.com',
    password: 'securepassword', // 'securepassword'
    role: 'organizer',
    points: 0,
    referralCode: 'ORG2CODE',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=organizer2'
  },
  {
    id: 'cust1',
    name: 'Customer User One',
    email: 'customer1@example.com',
    password: 'securepassword', // 'securepassword'
    role: 'customer',
    points: 100,
    referralCode: 'CUST1CODE',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=customer1'
  },
  {
    id: 'cust2',
    name: 'Customer User Two',
    email: 'customer2@example.com',
    password: '$2b$10$VGOmZaWOPkzJm8hX3cQqHupLpkZZTl3MsTWPSGE66.aSKfOhW49Pq', // 'securepassword'
    role: 'customer',
    points: 50,
    referralCode: 'CUST2CODE',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=customer2'
  }
];
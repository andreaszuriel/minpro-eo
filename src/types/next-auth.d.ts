import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole; // Matches the UserRole enum from Prisma (customer | organizer)
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
  }
}
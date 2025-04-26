import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      image: any;
      id: string;
      email: string;
      name?: string | null;
      role: UserRole; 
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    image?: string | null;
  }
}
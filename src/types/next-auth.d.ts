import { UserRole } from '@prisma/client';
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      image: any;
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
      isAdmin: boolean; 
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    image?: string | null;
    isAdmin: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    role?: UserRole;
    isAdmin?: boolean;
    iat?: number;
  }
}
// models/interface.ts

export interface RegisterInput {
    name: string;
    email: string;
    password: string;
    role: 'customer' | 'organizer';  
    referralCode?: string;
  }
  
  export interface UserPayload {
    id: number;
    email: string;
    role: 'customer' | 'organizer';
    name: string;
  }
  
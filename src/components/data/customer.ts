// customer.ts
export interface Customer {
    name: string;
    email: string;
    password: string;
    role: "customer";
    referralCode: string;
    referredBy?: string;
  }
  
  export const customers: Customer[] = [
    {
      name: "Luna Ardianto",
      email: "luna@example.com",
      password: "luna456",
      role: "customer",
      referralCode: "LUNA2025"
    },
    {
      name: "Rafi Wijaya",
      email: "rafi@example.com",
      password: "rafi789",
      role: "customer",
      referralCode: "RAFI2025",
      referredBy: "LUNA2025"
    },
    {
      name: "Sinta Mahesa",
      email: "sinta@example.com",
      password: "sinta321",
      role: "customer",
      referralCode: "SINTA2025"
    }
  ];
  
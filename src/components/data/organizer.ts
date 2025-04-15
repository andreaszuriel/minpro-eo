// organizer.ts
export interface Organizer {
    name: string;
    email: string;
    password: string;
    role: "organizer";
    referralCode: string;
  }
  
  export const organizers: Organizer[] = [
    {
      name: "Aurora Live",
      email: "aurora@events.com",
      password: "aurora123", // You can hash these in production
      role: "organizer",
      referralCode: "AURORA2025"
    },
    {
      name: "Echo Sound Agency",
      email: "echo@soundagency.com",
      password: "echo321",
      role: "organizer",
      referralCode: "ECHO2025"
    },
    {
      name: "Nova Entertainment",
      email: "nova@entertainment.com",
      password: "nova999",
      role: "organizer",
      referralCode: "NOVA2025"
    }
  ];
  
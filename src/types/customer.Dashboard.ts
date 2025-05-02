import type { Event as PrismaEvent } from '@prisma/client';

// Define and export CouponData if not already done elsewhere
export type CouponData = {
  id: string;
  code: string;
  discount: number;
  expiresAt: string;
  isReferral: boolean;
};

// Define and export DashboardUser
export interface DashboardUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  role: 'customer' | 'organizer';
  referralCode?: string | null;
  image?: string | null;
  points?: number | null;
  coupons?: CouponData[] | null; 
  isAdmin?: boolean;
}

// Simplified Event structure for customer's upcoming list
export type CustomerUpcomingEvent = {
    id: number; 
    title: string;
    startDate: string; 
    image: string | null;
    location: string;
  };
  
// Stats relevant to the customer
export type CustomerStats = {
  upcomingEventsCount: number; // Count of distinct future events they have PAID tickets for
  eventsAttendedCount: number; // Count of distinct past events they had PAID tickets for
  reviewsWrittenCount: number; // Count of reviews submitted by the user
  favoriteGenre: string | null; // Name of the most frequently attended genre, or null
};

// Props for the Customer Overview component (Keep if needed, or define in the component itself)
// interface CustomerDashboardOverviewProps { ... } // You might define this directly in the Overview component instead
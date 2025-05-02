import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth'; 

// Define the structure matching the Frontend's UserEvent type (as much as possible)
type ApiUserEvent = {
  id: number;
  title: string;
  artist: string;
  startDate: string; // Use ISO strings
  endDate: string;
  location: string;
  image: string | null;
  description: string | null;
  genre: { name: string };
  country: { name: string };
  seats: number;
  review?: { // Include necessary review fields
    id: number;
    rating: number;
    comment: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  tickets?: { tierType: string; isUsed: boolean }[]; // User's tickets for THIS event
  // averageRating?: number | null; // Could include overall average rating if needed
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is missing in the path' }, { status: 400 });
  }

  // --- Authorization (Optional but Recommended) ---
  // Check if the logged-in user is requesting their own events or if they are an admin
  const session = await auth();
  if (!session?.user || (session.user.id !== userId && !session.user.isAdmin)) {
     console.warn(`Unauthorized attempt to access events for user ${userId} by user ${session?.user?.id}`);
     return new NextResponse('Unauthorized', { status: 401 });
  }
  // --- End Authorization ---

  try {
    // Find all unique events for which the user has tickets
    const events = await prisma.event.findMany({
      where: {
        // Filter events where there's at least one ticket belonging to the user
        tickets: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        genre: { select: { name: true } }, // Include genre name
        country: { select: { name: true } }, // Include country name
        // Include ONLY the review submitted by THIS user for THIS event
        reviews: {
          where: {
            userId: userId, // Filter reviews by the user ID
          },
          select: { // Select only the fields needed for the frontend
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        // Include ONLY the tickets belonging to THIS user for THIS event
        tickets: {
          where: {
            userId: userId, // Filter tickets by the user ID
          },
          select: {
            tierType: true,
            isUsed: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc', // Or 'asc', depending on desired default sort
      },
    });

    // Map the Prisma results to the desired API response structure (ApiUserEvent)
    const userEvents: ApiUserEvent[] = events.map((event) => {
      const userReview = event.reviews.length > 0 ? event.reviews[0] : null;
      const userTickets = event.tickets; 

      return {
        id: event.id,
        title: event.title,
        artist: event.artist,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        location: event.location,
        image: event.image,
        description: event.description,
        genre: { name: event.genre?.name ?? 'Unknown' },
        country: { name: event.country?.name ?? 'Unknown' },
        seats: event.seats, // Included from Event model
        review: userReview ? {
          ...userReview,
          createdAt: userReview.createdAt.toISOString(),
          updatedAt: userReview.updatedAt.toISOString(),
        } : null,
        tickets: userTickets,
        // averageRating: event.averageRating, // Add if needed
      };
    });

    // Return the structured list of events
    return NextResponse.json({ events: userEvents }, { status: 200 });

  } catch (error) {
    console.error(`Error fetching events for user ${userId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error fetching user events' }, { status: 500 });
  }
}
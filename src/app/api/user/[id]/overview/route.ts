import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Match the types expected by the frontend component
interface CustomerStats {
  upcomingEventsCount: number;
  eventsAttendedCount: number;
  reviewsWrittenCount: number;
  favoriteGenre: string | null;
}

interface CustomerUpcomingEvent {
  id: number;
  title: string;
  startDate: string;
  location: string;
  image: string | null;
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const session = await auth();
    
    // Check permissions - user should only access their own dashboard data
    const isOwner = session?.user?.id === id;
    const isAdmin = session?.user?.isAdmin === true;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Get upcoming events with tickets (via the Ticket model)
    const now = new Date();
    const upcomingTickets = await prisma.ticket.findMany({
      where: {
        userId: id,
        isUsed: false,
        event: {
          startDate: {
            gte: now
          }
        }
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            location: true,
            image: true,
            genre: true,
          }
        }
      },
      orderBy: {
        event: {
          startDate: 'asc'
        }
      }
    });

    // Extract unique upcoming events (user might have multiple tickets for same event)
    const eventMap = new Map();
    upcomingTickets.forEach(ticket => {
      if (!eventMap.has(ticket.event.id)) {
        eventMap.set(ticket.event.id, ticket.event);
      }
    });
    
    const upcomingEvents: CustomerUpcomingEvent[] = Array.from(eventMap.values()).map(event => ({
      id: event.id,
      title: event.title,
      startDate: event.startDate.toISOString(),
      location: event.location,
      image: event.image
    }));

    // 2. Count past events the user has attended (used tickets)
    const pastEventsCount = await prisma.ticket.count({
      where: {
        userId: id,
        isUsed: true
      }
    });

    // 3. Count reviews written by the user
    const reviewsCount = await prisma.review.count({
      where: {
        userId: id
      }
    });

    // 4. Find favorite genre based on most attended events/tickets
    const genreCounts = await prisma.ticket.groupBy({
      by: ['eventId'],
      where: {
        userId: id,
      },
      _count: {
        eventId: true
      }
    });

    // If there are genres, find the most common one
    let favoriteGenre = null;
    if (genreCounts.length > 0) {
      // Get events for the tickets to count genres
      const eventIds = genreCounts.map(g => g.eventId);
      const events = await prisma.event.findMany({
        where: {
          id: {
            in: eventIds
          }
        },
        include: {
          genre: true
        }
      });

      // Count occurrences of each genre
      const genreMap = new Map();
      events.forEach(event => {
        const count = genreMap.get(event.genre.name) || 0;
        genreMap.set(event.genre.name, count + 1);
      });

      // Find the most common genre
      let maxCount = 0;
      genreMap.forEach((count, genre) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteGenre = genre;
        }
      });
    }

    // Prepare the stats object
    const stats: CustomerStats = {
      upcomingEventsCount: upcomingEvents.length,
      eventsAttendedCount: pastEventsCount,
      reviewsWrittenCount: reviewsCount,
      favoriteGenre: favoriteGenre
    };

    // Return the dashboard data in the expected format
    return NextResponse.json({
      stats,
      upcomingEvents
    });

  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
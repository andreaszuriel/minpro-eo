import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    // Check authentication and admin status using Auth.js v5
    const session = await auth();
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const includeAll = searchParams.get("includeAll") === "true";

    // Fetch all events or only active ones depending on the includeAll parameter
    const whereClause = includeAll 
      ? {} 
      : { startDate: { gte: new Date() } };

    const events = await prisma.event.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        artist: true,
        location: true,
        startDate: true,
        image: true,
        featured: true,
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    // Format the data for the response
    const formattedEvents = events.map(event => ({
      ...event,
      startDate: event.startDate.toISOString(),
      // Add featured: false if it's not present (for backward compatibility)
      featured: event.featured ?? false
    }));

    return NextResponse.json({ 
      events: formattedEvents,
      totalCount: formattedEvents.length
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching admin events:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
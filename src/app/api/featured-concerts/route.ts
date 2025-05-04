import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define types for response
type PriceObject = Record<string, number>;

export async function GET(req: NextRequest) {
  try {
    // Fetch featured events (max 3)
    const featuredEvents = await prisma.event.findMany({
      where: {
        featured: true,
        startDate: { gte: new Date() } // Only future events
      },
      include: {
        genre: { select: { name: true } },
        country: { select: { name: true } },
      },
      orderBy: {
        startDate: 'asc',
      },
      take: 3, // Ensure we only get max 3 events
    });

    // If we don't have any featured events, get upcoming events as fallback
    let events = featuredEvents;
    if (events.length === 0) {
      events = await prisma.event.findMany({
        where: {
          startDate: { gte: new Date() }
        },
        include: {
          genre: { select: { name: true } },
          country: { select: { name: true } },
        },
        orderBy: {
          startDate: 'asc',
        },
        take: 3,
      });
    }

    // Format the data for the response
    const formattedEvents = events.map(event => {
      const priceData = event.price as PriceObject | null;
      const lowestPrice = priceData ? Math.min(...Object.values(priceData)) : 0;

      return {
        id: event.id,
        title: event.title,
        artist: event.artist,
        genre: event.genre?.name || "Unknown",
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        time: new Date(event.startDate).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit'
        }),
        location: event.location,
        image: event.image || "/images/default-concert.jpg",
        lowestPrice: lowestPrice,
        currency: "IDR", // Default currency, update as needed
        featured: event.featured || false
      };
    });

    return NextResponse.json({ concerts: formattedEvents }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching featured concerts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
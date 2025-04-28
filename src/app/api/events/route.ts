import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const events = await prisma.event.findMany({
      where: {
        organizerId: userId,
      },
      // --- Include the related Genre and Country ---
      include: {
        genre: true,   
        country: true, 
      },
      orderBy: {
        startDate: 'desc', // Optional: Keep events sorted
      }
    });

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Internal Server Error fetching events" }, { status: 500 });
  }
}

// --- POST Handler needs significant changes ---
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // --- Input Validation (Basic Example - Add more robust validation) ---
    if (!data.title || !data.artist || !data.genreName || !data.startDate || !data.endDate || !data.location || !data.countryCode || !data.seats || !data.organizerId || !data.tiers || !data.price) {
        return NextResponse.json({ error: "Missing required event fields" }, { status: 400 });
    }
    if (isNaN(parseInt(data.seats, 10)) || parseInt(data.seats, 10) <= 0) {
        return NextResponse.json({ error: "Invalid number of seats" }, { status: 400 });
    }
    // Add validation for dates, JSON structure of tiers/price etc.

    // --- Find Genre ID based on name ---
    const genre = await prisma.genre.findUnique({
      where: { name: data.genreName }, 
    });

    if (!genre) {
      // Option 1: Return error if genre must exist
      return NextResponse.json({ error: `Genre '${data.genreName}' not found.` }, { status: 400 });
      // Option 2: Create the genre if it doesn't exist (Use with caution)
      // const newGenre = await prisma.genre.create({ data: { name: data.genreName } });
      // genre = newGenre;
    }

    // --- Find Country ID based on code ---
    const country = await prisma.country.findUnique({
        where: { code: data.countryCode },
    });

    if (!country) {
        return NextResponse.json({ error: `Country with code '${data.countryCode}' not found.` }, { status: 400 });
    }


    // --- Create the Event using IDs ---
    const event = await prisma.event.create({
      data: {
        title: data.title,
        artist: data.artist,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        location: data.location,
        seats: parseInt(data.seats, 10), 
        description: data.description,
        image: data.image || null,
        organizerId: data.organizerId,
        genreId: genre.id, 
        countryId: country.id, 
        tiers: data.tiers, 
        price: data.price, 
      },
       // --- Include related data in the response if needed ---
      include: {
        genre: true,
        country: true,
      }
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating event:", error);
    // Handle potential JSON parsing errors or Prisma errors specifically
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON format in request body" }, { status: 400 });
    }
   
    return NextResponse.json({ error: "Internal Server Error creating event" }, { status: 500 });
  }
}
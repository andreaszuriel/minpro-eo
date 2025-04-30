import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from '@prisma/client'; 

type PriceObject = Record<string, number>;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // --- Get Filters & Pagination Params ---
  const userId = searchParams.get("userId");
  const searchQuery = searchParams.get("q") || "";
  const genreName = searchParams.get("genreName"); 
  const countryCode = searchParams.get("countryCode"); 
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10); 

  const skip = (page - 1) * limit;

  // --- Build Prisma Where Clause ---
  let whereClause: Prisma.EventWhereInput = {};

  if (userId) {
    // Fetching for a specific organizer
    whereClause.organizerId = userId;
  } else {
    // Fetching public list - TODO: add conditions like upcoming events only
    whereClause.startDate = {
        gte: new Date(), // Only show events starting from today onwards
    };

    // Add search query filter (searching title, artist, location)
    if (searchQuery) {
      whereClause.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { artist: { contains: searchQuery, mode: 'insensitive' } },
        { location: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Add genre filter
    if (genreName) {
      whereClause.genre = {
        name: { equals: genreName, mode: 'insensitive' },
      };
    }

    // Add country filter
    if (countryCode) {
      whereClause.country = {
        code: { equals: countryCode, mode: 'insensitive' },
      };
    }
  }

  try {
    // --- Fetch Events with Filters & Pagination ---
    const events = await prisma.event.findMany({
      where: whereClause,
      include: { // Include necessary relations
        genre: true,
        country: true,
      },
      orderBy: {
        startDate: 'asc', 
      },
      skip: skip,
      take: limit,
    });

    // --- Get Total Count for Pagination  ---
    const totalEvents = await prisma.event.count({
      where: whereClause,
    });

    // --- Prepare response data) ---
    const eventsWithDetails = events.map(event => {
        const priceData = event.price as PriceObject | null;
        const lowestPrice = priceData ? Math.min(...Object.values(priceData)) : 0;
        const currency = "IDR"; 

        return {
            ...event,
            startDate: event.startDate.toISOString(),
            endDate: event.endDate.toISOString(),
            price: priceData ?? {},
            // Include derived/formatted fields needed by the card
            genre: { name: event.genre?.name ?? 'Unknown' },
            country: { name: event.country?.name ?? 'Unknown' },
            lowestPrice: lowestPrice, // TODO: Calculate on frontend too
            currency: currency,
        };
    });

    // --- Return Paginated Result ---
    return NextResponse.json(
        {
            events: eventsWithDetails,
            totalCount: totalEvents,
            currentPage: page,
            totalPages: Math.ceil(totalEvents / limit),
        },
        { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching events:", error);
    // Return a generic error for the list endpoint
    return NextResponse.json({ error: "Internal Server Error fetching events list" }, { status: 500 });
  }
}


// --- POST Handler ---
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // --- Validation ---
    
    if (!data.title || !data.artist || !data.genreName || !data.startDate || !data.endDate || !data.location || !data.countryCode || !data.seats || !data.organizerId || !data.tiers || !data.price ) { 
        return NextResponse.json({ error: "Missing required event fields" }, { status: 400 });
    }

    // --- Find Genre/Country IDs ---
    
    const genre = await prisma.genre.findUnique({ where: { name: data.genreName }});
    if (!genre) return NextResponse.json({ error: `Genre '${data.genreName}' not found.` }, { status: 400 });
    const country = await prisma.country.findUnique({ where: { code: data.countryCode }});
    if (!country) return NextResponse.json({ error: `Country with code '${data.countryCode}' not found.` }, { status: 400 });

    // --- Create Event ---
    const event = await prisma.event.create({
      data: {
        // ... (other fields)
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
        tiers: data.tiers, // Ensure this is valid JSON
        price: data.price, // Ensure this is valid JSON
      },
      include: { // Include relations in response
        genre: true,
        country: true,
      }
    });

     // Prepare response 
    const priceData = event.price as PriceObject | null;
    const lowestPrice = priceData ? Math.min(...Object.values(priceData)) : 0;

    const responseEvent = {
        ...event,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        price: priceData ?? {},
        genre: { name: event.genre?.name ?? 'Unknown' },
        country: { name: event.country?.name ?? 'Unknown' },
        lowestPrice: lowestPrice,
    };


    // Return the created event directly (un-nested)
    return NextResponse.json(responseEvent, { status: 201 });

  } catch (error: any) {
    console.error("Error creating event:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON format in request body" }, { status: 400 });
    }
    // Add more specific Prisma error handling if needed
    return NextResponse.json({ error: "Internal Server Error creating event" }, { status: 500 });
  }
}
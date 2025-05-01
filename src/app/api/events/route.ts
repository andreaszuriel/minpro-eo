import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from '@prisma/client'; 

type PriceObject = Record<string, number>;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // --- Filters & Pagination ---
  const userId = searchParams.get("userId");
  const searchQuery = searchParams.get("q") || "";
  const genreName = searchParams.get("genreName");
  const countryCode = searchParams.get("countryCode");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);
  const skip = (page - 1) * limit;

  // --- Build Prisma Where Clause ---
  const whereClause: Prisma.EventWhereInput = {};

  if (userId) {
    // Fetching for a specific organizer's dashboard
    whereClause.organizerId = userId;
  } else {
    // Fetching for public lists (apply public filters)
    whereClause.startDate = { gte: new Date() }; 

    if (searchQuery) {
      whereClause.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { artist: { contains: searchQuery, mode: 'insensitive' } },
        { location: { contains: searchQuery, mode: 'insensitive' } },
        { genre: { name: { contains: searchQuery, mode: 'insensitive' } } },
      ];
    }
    if (genreName) {
      whereClause.genre = { name: { equals: genreName, mode: 'insensitive' } };
    }
    if (countryCode) {
      whereClause.country = { code: { equals: countryCode, mode: 'insensitive' } };
    }
  }

  try {
    // --- Fetch Events & Total Count in Parallel ---
    const [events, totalEvents] = await prisma.$transaction([
      prisma.event.findMany({
        where: whereClause,
        include: { // Include only necessary relations
          genre: { select: { name: true } }, // Select only the name
          country: { select: { name: true } }, // Select only the name
        },
        orderBy: {
          // Order based on context (e.g., organizer view might want different order)
          startDate: userId ? 'desc' : 'asc',
        },
        skip: skip,
        take: limit,
      }),
      prisma.event.count({
        where: whereClause,
      }),
    ]);

    // --- Prepare response data) ---
    const eventsWithDetails = events.map(event => {
      const priceData = event.price as PriceObject | null;
      const lowestPrice = priceData ? Math.min(...Object.values(priceData)) : 0;
      const currency = "IDR";

      // --- Log here to check if averageRating is present before mapping ---
    console.log(`Event ${event.id} fetched from DB, averageRating:`, event.averageRating);

      return {
          ...event, 
          startDate: event.startDate.toISOString(), 
          endDate: event.endDate.toISOString(),   
          price: priceData ?? {},                
          genre: { name: event.genre?.name ?? 'Unknown' }, 
          country: { name: event.country?.name ?? 'Unknown' }, 
          lowestPrice: lowestPrice,               
          currency: currency,                  
          averageRating: event.averageRating,
      };
  });

  // --- Log here to check the final data being sent ---
  console.log("Prepared eventsWithDetails:", eventsWithDetails.map(e => ({ id: e.id, title: e.title, avgRating: e.averageRating })));

  // --- Return Paginated Result ---
 return NextResponse.json({
        events: eventsWithDetails,
        totalCount: totalEvents,
        currentPage: page,
        totalPages: Math.ceil(totalEvents / limit),
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching events:", error);
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
    include: { // Include relations needed for immediate response
        genre: { select: { name: true } },
        country: { select: { name: true } },
    }
    });

    // --- Prepare response ---
    const responseEvent = {
        ...event,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        price: event.price ?? {},
    };

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
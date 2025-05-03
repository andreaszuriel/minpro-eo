import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from '@prisma/client';
import { eventFormSchema, eventSearchSchema } from "@/lib/validation/event.schema";
import { z } from "zod";

type PriceObject = Record<string, number>;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Parse and validate search parameters using Zod
  try {
    const validatedParams = eventSearchSchema.parse({
      q: searchParams.get("q") || undefined,
      genreName: searchParams.get("genreName") || undefined,
      countryCode: searchParams.get("countryCode") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page") || "1", 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit") || "12", 10) : 12,
      userId: searchParams.get("userId") || undefined,
    });

    const { q: searchQuery, genreName, countryCode, page, limit, userId } = validatedParams;
    const skip = (page - 1) * limit;

    // Build Prisma Where Clause
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

    // Fetch Events & Total Count in Parallel
    const [events, totalEvents] = await prisma.$transaction([
      prisma.event.findMany({
        where: whereClause,
        include: {
          genre: { select: { name: true } },
          country: { select: { name: true } },
        },
        orderBy: {
          startDate: userId ? 'desc' : 'asc',
        },
        skip: skip,
        take: limit,
      }),
      prisma.event.count({
        where: whereClause,
      }),
    ]);

    // Prepare response data
    const eventsWithDetails = events.map(event => {
      const priceData = event.price as PriceObject | null;
      const lowestPrice = priceData ? Math.min(...Object.values(priceData)) : 0;
      const currency = "IDR";

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

    // Return Paginated Result
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
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid search parameters", 
        details: error.format() 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal Server Error fetching events list" }, { status: 500 });
  }
}

// POST Handler
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate request body against Zod schema
    const validatedData = eventFormSchema.parse(data);
    
    // Find Genre/Country IDs
    const genre = await prisma.genre.findUnique({ 
      where: { name: validatedData.genreName }
    });
    
    if (!genre) {
      return NextResponse.json(
        { error: `Genre '${validatedData.genreName}' not found.` }, 
        { status: 400 }
      );
    }
    
    const country = await prisma.country.findUnique({ 
      where: { code: validatedData.countryCode }
    });
    
    if (!country) {
      return NextResponse.json(
        { error: `Country with code '${validatedData.countryCode}' not found.` }, 
        { status: 400 }
      );
    }

    // Create Event with validated data
    const event = await prisma.event.create({
      data: {
        title: validatedData.title,
        artist: validatedData.artist,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        location: validatedData.location,
        seats: validatedData.seats,
        description: validatedData.description || "",
        image: validatedData.image || null,
        organizerId: validatedData.organizerId,
        genreId: genre.id,
        countryId: country.id,
        tiers: validatedData.tiers,
        // Convert tiers to price object for backward compatibility
        price: validatedData.tiers.reduce((obj, tier) => {
          obj[tier.name] = tier.price;
          return obj;
        }, {} as Record<string, number>),
      },
      include: {
        genre: { select: { name: true } },
        country: { select: { name: true } },
      }
    });

    // Prepare response
    const responseEvent = {
      ...event,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      price: event.price ?? {},
    };

    return NextResponse.json(responseEvent, { status: 201 });

  } catch (error) {
    console.error("Error creating event:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.format() 
      }, { status: 400 });
    }
    
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON format in request body" }, { status: 400 });
    }
    
    // Handle Prisma-specific errors with better messages
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: "A unique constraint would be violated." }, { status: 400 });
      }
      if (error.code === 'P2003') {
        return NextResponse.json({ error: "Foreign key constraint failed." }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: "Internal Server Error creating event" }, { status: 500 });
  }
}
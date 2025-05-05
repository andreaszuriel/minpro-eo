import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth"; 
import { DiscountType } from "@prisma/client"; 

interface ApiPromotionData {
    id: string;
    code: string;
    discount: number;
    discountType: DiscountType;
    startDate: string; // ISO string
    endDate: string;   // ISO string
}

// GET: List promotions for an event
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } } // 'id' is the eventId from the route
  ) {
    const eventId = parseInt(params.id, 10);
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code'); // Read the code from query param
  
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 });
    }
  
    // --- If a code is provided, find the specific promotion ---
    if (code) {
      try {
        const now = new Date();
        const promotion = await prisma.promotion.findFirst({
          where: {
            eventId: eventId,       // Use eventId from route param
            code: code,             // Use code from query param
            isActive: true,         // Must be active
            startDate: { lte: now }, // Start date must be now or in the past
            endDate: { gte: now },   // End date must be now or in the future
            AND: [ { OR: [ { usageLimit: null }, { usageCount: { lt: prisma.promotion.fields.usageLimit } } ] } ]
          },
          select: { // Select only fields needed by the frontend apply logic
            id: true,
            code: true,
            discount: true,
            discountType: true,
            startDate: true,
            endDate: true,
          }
        });
  
        if (!promotion) {
          // Use a specific error message the frontend might check for
          return NextResponse.json({ error: 'Invalid or expired promotional code' }, { status: 404 });
        }
  
        // --- Verify 'discount' is a number ---
        if (typeof promotion.discount !== 'number' || isNaN(promotion.discount)) {
            console.error(`API Error: Promotion ${promotion.id} (Event ${eventId}) has invalid discount value: ${promotion.discount}`);
            // Return an error instead of sending bad data back to frontend
            return NextResponse.json({ error: 'Internal error: Invalid promotion data' }, { status: 500 });
        }
  
        // Prepare the single object response matching frontend expectations
        const responseData: ApiPromotionData = {
          ...promotion,
          discount: promotion.discount, // Ensure it's included
          startDate: promotion.startDate.toISOString(),
          endDate: promotion.endDate.toISOString(),
        };
  
        // Return the SINGLE promotion object
        return NextResponse.json(responseData, { status: 200 });
  
      } catch (error) {
        console.error(`Error fetching promotion code '${code}' for event ${eventId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error fetching promotion' }, { status: 500 });
      }
    }
    // --- If no code is provided, list all promotions for the event ---
    else {
      try {
        const promotions = await prisma.promotion.findMany({
          where: { eventId },
          // Select fields needed for listing 
          select: {
            id: true,
            code: true,
            discount: true,
            discountType: true,
            startDate: true,
            endDate: true,
            usageLimit: true,
            usageCount: true,
            isActive: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { // Orrder the list
              createdAt: 'desc'
          }
        });
  
        // Return the ARRAY of promotions
        return NextResponse.json(
          promotions.map((promo) => ({
            ...promo,
            startDate: promo.startDate.toISOString(),
            endDate: promo.endDate.toISOString(),
            createdAt: promo.createdAt.toISOString(),
            updatedAt: promo.updatedAt.toISOString(),
          })),
          { status: 200 }
        );
      } catch (error) {
        console.error(`Error fetching all promotions for event ${eventId}:`, error);
        return NextResponse.json({ error: "Internal Server Error fetching promotions" }, { status: 500 });
      }
    }
  }
  
// POST: Create a new promotion
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = parseInt(params.id, 10);
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isNaN(eventId)) {
    return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 });
  }

  try {
    const data = await req.json();

    // Validate input
    if (
      !data.code ||
      !data.discount ||
      !data.discountType ||
      !data.startDate ||
      !data.endDate
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify organizer owns the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized or event not found" }, { status: 403 });
    }

    // Create promotion
    const promotion = await prisma.promotion.create({
      data: {
        code: data.code,
        eventId,
        organizerId: session.user.id,
        discount: parseInt(data.discount, 10),
        discountType: data.discountType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        usageLimit: data.usageLimit ? parseInt(data.usageLimit, 10) : null,
        description: data.description || null,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        ...promotion,
        startDate: promotion.startDate.toISOString(),
        endDate: promotion.endDate.toISOString(),
        createdAt: promotion.createdAt.toISOString(),
        updatedAt: promotion.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating promotion:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Promotion code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Update an existing promotion
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = parseInt(params.id, 10);
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isNaN(eventId)) {
    return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 });
  }

  try {
    const data = await req.json();

    if (!data.id) {
      return NextResponse.json({ error: "Promotion ID is required" }, { status: 400 });
    }

    // Verify organizer owns the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized or event not found" }, { status: 403 });
    }

    // Update promotion
    const updateData: any = {};
    if (data.code) updateData.code = data.code;
    if (data.discount) updateData.discount = parseInt(data.discount, 10);
    if (data.discountType) updateData.discountType = data.discountType;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit ? parseInt(data.usageLimit, 10) : null;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const promotion = await prisma.promotion.update({
      where: { id: data.id },
      data: updateData,
    });

    return NextResponse.json(
      {
        ...promotion,
        startDate: promotion.startDate.toISOString(),
        endDate: promotion.endDate.toISOString(),
        createdAt: promotion.createdAt.toISOString(),
        updatedAt: promotion.updatedAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating promotion:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Promotion code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Delete a promotion
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = parseInt(params.id, 10);
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isNaN(eventId)) {
    return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 });
  }

  try {
    const { id: promotionId } = await req.json();

    if (!promotionId) {
      return NextResponse.json({ error: "Promotion ID is required" }, { status: 400 });
    }

    // Verify organizer owns the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized or event not found" }, { status: 403 });
    }

    await prisma.promotion.delete({
      where: { id: promotionId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("Error deleting promotion:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// --- GET Single Event ---
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10); 

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      // --- Include related data ---
      include: {
        genre: true,   
        country: true, 
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // The event object now contains nested 'genre' and 'country' objects
    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Internal Server Error fetching event" }, { status: 500 });
  }
}

// --- PUT (Update) Event ---
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 });
  }

  try {
    const data = await req.json();

    // --- Input Validation (Basic Add more) ---
    if (!data.title || !data.artist || !data.genreName || !data.countryCode /* other required fields */) {
      return NextResponse.json({ error: "Missing required fields for update" }, { status: 400 });
    }

    // --- Find Genre ID ---
    let genreId: number | undefined = undefined;
    if (data.genreName) {
      const genre = await prisma.genre.findUnique({
        where: { name: data.genreName },
      });
      if (!genre) {
        return NextResponse.json({ error: `Genre '${data.genreName}' not found.` }, { status: 400 });
      }
      genreId = genre.id;
    }

    // --- Find Country ID ---
    let countryId: number | undefined = undefined;
     if (data.countryCode) {
       const country = await prisma.country.findUnique({
         where: { code: data.countryCode },
       });
       if (!country) {
         return NextResponse.json({ error: `Country with code '${data.countryCode}' not found.` }, { status: 400 });
       }
       countryId = country.id;
     }

    // --- Prepare update data ---
    const updateData: any = {}; // Use 'any' or create a specific update type
    if (data.title) updateData.title = data.title;
    if (data.artist) updateData.artist = data.artist;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.location) updateData.location = data.location;
    if (data.seats !== undefined) updateData.seats = parseInt(data.seats, 10); 
    if (data.description !== undefined) updateData.description = data.description; 
    if (data.image !== undefined) updateData.image = data.image || null; 
    if (data.tiers) updateData.tiers = data.tiers; 
    if (data.price) updateData.price = data.price; 
    if (genreId !== undefined) updateData.genreId = genreId; 
    if (countryId !== undefined) updateData.countryId = countryId; 


    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: "No update data provided" }, { status: 400 });
    }

    // --- Perform Update ---
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
       // --- Include related data in the response ---
      include: {
        genre: true,
        country: true,
      },
    });

    return NextResponse.json({ event: updatedEvent }, { status: 200 });

  } catch (error: any) {
    console.error("Error updating event:", error);
     if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON format in request body" }, { status: 400 });
    }
    // Handle specific Prisma errors, e.g., P2025 (Record to update not found)
    if (error.code === 'P2025') {
         return NextResponse.json({ error: "Event not found for update" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error updating event" }, { status: 500 });
  }
}

// --- DELETE Event ---
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 });
  }

  try {
    // Prisma handles cascading deletes based on schema relations (e.g., deleting related tickets, reviews)
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Event deleted successfully" }, { status: 200 }); // Use 200 or 204 (No Content)
  } catch (error: any) {
    console.error("Error deleting event:", error);
    // Handle specific Prisma errors, e.g., P2025 (Record to delete not found)
     if (error.code === 'P2025') {
         return NextResponse.json({ error: "Event not found for deletion" }, { status: 404 });
     }
    return NextResponse.json({ error: "Internal Server Error deleting event" }, { status: 500 });
  }
}
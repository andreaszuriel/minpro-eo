import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define the expected structure of the price JSON
type PriceObject = Record<string, number>;

// --- GET Single Event (MODIFIED) ---
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
      // --- Include ALL required related data ---
      include: {
        genre: true,
        country: true,
        organizer: { 
          select: {
            id: true,
            name: true,
          }
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // --- Prepare the response data ---
    // 1. Derive 'tiers' array
    const priceData = event.price as PriceObject | null;
    const tiers = priceData ? Object.keys(priceData) : [];

    // 2. Determine Currency (!! IMPORTANT: Add 'currency' field to Prisma schema !!)
    //    Using placeholder - replace with actual logic/schema field
    const currency = "IDR"; // <<--- TODO: Replace with dynamic currency

    // 3. Construct the final *direct* response object
    const responseData = {
      ...event,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      price: priceData ?? {},
      tiers: tiers,           
      currency: currency,    
      // Ensure nested objects have the correct structure
      genre: { name: event.genre?.name ?? 'Unknown Genre' },
      country: { name: event.country?.name ?? 'Unknown Country' },
      organizer: { 
        id: event.organizer?.id ?? 'unknown',
        name: event.organizer?.name ?? 'Unknown Organizer',
      }
    };

    // --- Return the data DIRECTLY, not nested under 'event' ---
    return NextResponse.json(responseData, { status: 200 }); 

  } catch (error) {
    console.error(`Error fetching event with ID ${id}:`, error);
    return NextResponse.json({ error: "Internal Server Error fetching event details" }, { status: 500 });
  }
}


// --- PUT (Update) Event (Keep your existing logic) ---
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
    // ... (keep your validation)
     if (!data.title && !data.artist && !data.genreName && !data.countryCode /* ... other fields ... */ && !data.price && !data.tiers && data.seats === undefined && data.description === undefined && data.image === undefined) {
      return NextResponse.json({ error: "No update data provided" }, { status: 400 });
     }

    // --- Find Genre ID ---
    let genreId: number | undefined = undefined;
    if (data.genreName) {
       const genre = await prisma.genre.findUnique({ where: { name: data.genreName } });
       if (!genre) return NextResponse.json({ error: `Genre '${data.genreName}' not found.` }, { status: 400 });
       genreId = genre.id;
    }

    // --- Find Country ID ---
    let countryId: number | undefined = undefined;
     if (data.countryCode) {
       const country = await prisma.country.findUnique({ where: { code: data.countryCode } });
       if (!country) return NextResponse.json({ error: `Country with code '${data.countryCode}' not found.` }, { status: 400 });
       countryId = country.id;
     }

    // --- Prepare update data ---
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.artist !== undefined) updateData.artist = data.artist;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.location !== undefined) updateData.location = data.location;
    if (data.seats !== undefined) updateData.seats = parseInt(data.seats, 10);
    if (data.description !== undefined) updateData.description = data.description;
    if (data.image !== undefined) updateData.image = data.image || null;
    if (data.tiers !== undefined) updateData.tiers = data.tiers; // Assuming tiers is JSON/structured correctly
    if (data.price !== undefined) updateData.price = data.price; // Assuming price is JSON/structured correctly
    if (genreId !== undefined) updateData.genreId = genreId;
    if (countryId !== undefined) updateData.countryId = countryId;


    if (Object.keys(updateData).length === 0) {
        // This check might be redundant if the initial one is comprehensive
        return NextResponse.json({ error: "No valid update fields provided" }, { status: 400 });
    }

    // --- Perform Update ---
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
      include: { // Keep includes for the response
        genre: true,
        country: true,
        organizer: { select: { id: true, name: true } } // Include organizer in PUT response too
      },
    });

    // Prepare response similar to GET (un-nested, with derived fields if needed)
    const updatedPriceData = updatedEvent.price as PriceObject | null;
    const updatedTiers = updatedPriceData ? Object.keys(updatedPriceData) : [];
    const updatedCurrency = "IDR"; // TODO: Use actual currency

     const putResponseData = {
       ...updatedEvent,
       startDate: updatedEvent.startDate.toISOString(),
       endDate: updatedEvent.endDate.toISOString(),
       price: updatedPriceData ?? {},
       tiers: updatedTiers,
       currency: updatedCurrency,
       genre: { name: updatedEvent.genre?.name ?? 'Unknown Genre' },
       country: { name: updatedEvent.country?.name ?? 'Unknown Country' },
       organizer: {
         id: updatedEvent.organizer?.id ?? 'unknown',
         name: updatedEvent.organizer?.name ?? 'Unknown Organizer',
       }
     };


    return NextResponse.json(putResponseData, { status: 200 }); // Return updated data directly

  } catch (error: any) {
    console.error("Error updating event:", error);
     if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON format in request body" }, { status: 400 });
    }
    if (error.code === 'P2025') {
         return NextResponse.json({ error: "Event not found for update" }, { status: 404 });
    }
    // Add more specific error handling if needed (e.g., validation errors from Prisma)
    return NextResponse.json({ error: "Internal Server Error updating event" }, { status: 500 });
  }
}


// --- DELETE Event (Keep your existing logic) ---
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
   const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 });
  }

  try {
    await prisma.event.delete({
      where: { id },
    });

    // Return 204 No Content for successful deletions is common REST practice
    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error("Error deleting event:", error);
     if (error.code === 'P2025') { // Record to delete not found
         return NextResponse.json({ error: "Event not found for deletion" }, { status: 404 });
     }
     // Handle other potential errors (e.g., foreign key constraints if cascading delete isn't set up)
    return NextResponse.json({ error: "Internal Server Error deleting event" }, { status: 500 });
  }
}
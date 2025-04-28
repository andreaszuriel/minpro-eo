import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: "Invalid event ID" }), { status: 400 });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ event }), { status: 200 });
  } catch (error) {
    console.error("Error fetching event:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: "Invalid event ID" }), { status: 400 });
  }

  try {
    const data = await req.json();
    
    const event = await prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        artist: data.artist,
        genre: data.genre,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        location: data.location,
        seats: data.seats,
        description: data.description,
        image: data.image || null,
        tiers: data.tiers,
        price: data.price,
      },
    });

    return new Response(JSON.stringify({ event }), { status: 200 });
  } catch (error) {
    console.error("Error updating event:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: "Invalid event ID" }), { status: 400 });
  }

  try {
    await prisma.event.delete({
      where: { id },
    });

    return new Response(JSON.stringify({ message: "Event deleted successfully" }), { status: 200 });
  } catch (error) {
    console.error("Error deleting event:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
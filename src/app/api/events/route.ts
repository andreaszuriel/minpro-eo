import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
  }

  try {
    const events = await prisma.event.findMany({
      where: {
        organizerId: userId,
      },
    });

    return new Response(JSON.stringify({ events }), { status: 200 });
  } catch (error) {
    console.error("Error fetching events:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const event = await prisma.event.create({
      data: {
        title: data.title,
        genre: data.genre,
        artist: data.artist,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        location: data.location,
        seats: data.seats,
        description: data.description,
        image: data.image || null,
        organizerId: data.organizerId,
        tiers: JSON.parse(JSON.stringify([{ name: "General", price: 0 }])), 
        price: JSON.parse(JSON.stringify([{ name: "General", price: 0 }])), 
      },
    });

    return new Response(JSON.stringify({ event }), { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
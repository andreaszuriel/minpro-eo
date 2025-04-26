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
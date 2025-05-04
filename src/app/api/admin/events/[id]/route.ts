import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin status using Auth.js v5
    const session = await auth();
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 });
    }

    const { featured } = await req.json();

    // Check if we're trying to add a featured event and if we've reached the limit
    if (featured) {
      const featuredEventsCount = await prisma.event.count({
        where: {
          featured: true,
          id: {
            not: id // Exclude the current event
          }
        }
      });

      if (featuredEventsCount >= 3) {
        return NextResponse.json({ 
          error: "Maximum number of featured events (3) reached" 
        }, { status: 400 });
      }
    }

    // Update the event's featured status
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        featured: featured
      },
      select: {
        id: true,
        title: true,
        featured: true
      }
    });

    return NextResponse.json(updatedEvent, { status: 200 });

  } catch (error) {
    console.error("Error updating event featured status:", error);
    
    // Handle specific Prisma errors
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
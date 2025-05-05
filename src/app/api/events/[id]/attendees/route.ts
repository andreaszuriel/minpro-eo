import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id, 10);

    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 });
    }

    // Check if the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, organizerId: true }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Authentication check - only event organizer or admin can view attendees
    const session = await auth();
    const isAdmin = session?.user?.isAdmin === true;
    const isOrganizer = session?.user?.id === event.organizerId;

    if (!isAdmin && !isOrganizer) {
      return NextResponse.json({ error: "Unauthorized - Only event organizers or admins can view attendee information" }, { status: 403 });
    }

    // Get all completed transactions for this event
    const transactions = await prisma.transaction.findMany({
      where: { 
        eventId: eventId,
        status: "PAID" // Only include paid transactions
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tickets: {
          select: { id: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the data for the response
    const attendees = transactions.map(transaction => ({
      userId: transaction.user.id,
      name: transaction.user.name || "Unnamed User",
      email: transaction.user.email,
      ticketQuantity: transaction.ticketQuantity,
      tierType: transaction.tierType,
      totalPaid: transaction.finalPrice,
      purchaseDate: transaction.createdAt.toISOString(),
      ticketCount: transaction.tickets.length,
      transactionId: transaction.id
    }));

    return NextResponse.json({
      eventId: event.id,
      eventTitle: event.title,
      totalAttendees: attendees.length,
      attendees: attendees
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching event attendees:", error);
    return NextResponse.json({ error: "Internal Server Error fetching attendee information" }, { status: 500 });
  }
}
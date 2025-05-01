import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma'; 
import { auth } from '@/auth'; 
import { updateEventAverageRating } from '@/lib/utils';

// --- GET  ---
// Query params for filtering: userId, eventId
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const eventIdParam = searchParams.get('eventId');
  let eventId: number | undefined = undefined;

  if (eventIdParam) {
    const parsedEventId = parseInt(eventIdParam, 10);
    if (!isNaN(parsedEventId)) {
      eventId = parsedEventId;
    } else {
       return NextResponse.json({ message: 'Invalid eventId format' }, { status: 400 });
       console.warn("Invalid eventId query parameter provided:", eventIdParam);
    }
  }

  try {
    const reviews = await prisma.review.findMany({
      where: {
        ...(userId && { userId }),
        ...(eventId && { eventId: eventId }),
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        event: {
          select: { id: true, title: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('[REVIEWS_GET] Error fetching reviews:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// --- POST  ---
export async function POST(request: NextRequest) {
  // --- Authentication Check ---
  const session = await auth(); // Get session using NextAuth v5
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const userId = session.user.id;
  // --- End Authentication Check ---

  try {
    const body = await request.json();

    // --- Manual Input Validation ---
    const { eventId, rating, comment } = body;

    if (typeof eventId !== 'number' || !Number.isInteger(eventId) || eventId <= 0) {
        return NextResponse.json({ message: 'Invalid or missing eventId' }, { status: 400 });
    }
    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ message: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }
    if (comment && typeof comment !== 'string') {
        return NextResponse.json({ message: 'Comment must be a string' }, { status: 400 });
    }
     // Add length check for comment
     if (comment && comment.length > 1000) { 
         return NextResponse.json({ message: 'Comment cannot exceed 1000 characters' }, { status: 400 });
     }
    // --- End Manual Input Validation ---


    // Check if the user has already reviewed this event
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_eventId: { // Use the compound unique index
          userId: userId,
          eventId: eventId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { message: 'You have already reviewed this event.' },
        { status: 409 } // 409 Conflict
      );
    }

    // Check if event exists
    const eventExists = await prisma.event.findUnique({ where: { id: eventId }});
    if (!eventExists) {
        return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    // Check if user attended/bought ticket (add your logic here)

    const newReview = await prisma.review.create({
      data: {
        userId: userId,
        eventId: eventId,
        rating: rating,
        comment: comment || null, // Store null if comment is empty or undefined
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        event: { select: { id: true, title: true } },
      },
    });

    await updateEventAverageRating(newReview.eventId);

    return NextResponse.json(newReview, { status: 201 }); // 201 Created

  } catch (error: any) {
    console.error('[REVIEWS_POST] Error creating review:', error);
    // Handle potential Prisma unique constraint errors if the check above somehow failed
    if (error?.code === 'P2002') {
       return NextResponse.json({ message: 'You have already reviewed this event.' }, { status: 409 });
    }
    // Handle foreign key constraint error if eventId doesn't exist
    if (error?.code === 'P2003' && error?.meta?.field_name?.includes('eventId')) {
         return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
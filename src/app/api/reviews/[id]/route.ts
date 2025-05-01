import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { updateEventAverageRating } from '@/lib/utils';

interface RouteParams {
  params: { reviewId: string };
}

// --- GET  ---
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { reviewId } = params;
  const id = parseInt(reviewId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid review ID format' }, { status: 400 });
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id: id },
      include: {
        user: { select: { id: true, name: true, image: true } },
        event: { select: { id: true, title: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ message: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error(`[REVIEWS_GET_SINGLE] Error fetching review ${id}:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// --- PATCH  ---
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { reviewId } = params;
  const id = parseInt(reviewId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid review ID format' }, { status: 400 });
  }

  // --- Authentication & Authorization Check ---
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const userId = session.user.id;

  try {
     // Fetch the existing review to check ownership *before* attempting update
    const existingReview = await prisma.review.findUnique({
      where: { id: id },
      select: { userId: true }, // Only need userId for the check
    });

    if (!existingReview) {
      return NextResponse.json({ message: 'Review not found' }, { status: 404 });
    }

    if (existingReview.userId !== userId) {
      return new NextResponse('Forbidden: You do not own this review', { status: 403 });
    }
   // --- End Authentication & Authorization Check ---

    const body = await request.json();
    const { rating, comment } = body;
    const dataToUpdate: { rating?: number; comment?: string | null } = {};

    // --- Manual Input Validation ---
    let fieldProvidedForUpdate = false;
    if (rating !== undefined) {
        if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
             return NextResponse.json({ message: 'Rating must be an integer between 1 and 5' }, { status: 400 });
        }
        dataToUpdate.rating = rating;
        fieldProvidedForUpdate = true;
    }

    if (comment !== undefined) { // Allows setting comment to null or empty string
        if (comment !== null && typeof comment !== 'string') {
             return NextResponse.json({ message: 'Comment must be a string or null' }, { status: 400 });
        }
         // Add length check for comment
        if (comment && comment.length > 1000) { 
            return NextResponse.json({ message: 'Comment cannot exceed 1000 characters' }, { status: 400 });
        }
        dataToUpdate.comment = comment;
        fieldProvidedForUpdate = true;
    }
    // --- End Manual Input Validation ---

     if (!fieldProvidedForUpdate) {
       return NextResponse.json(
         { message: 'No valid fields provided for update (rating or comment)' },
         { status: 400 }
       );
     }

    const updatedReview = await prisma.review.update({
      where: { id: id }, // Ownership already checked
      data: dataToUpdate,
      include: {
        user: { select: { id: true, name: true, image: true } },
        event: { select: { id: true, title: true } },
      },
    });

    await updateEventAverageRating(updatedReview.eventId);

    return NextResponse.json(updatedReview);

  } catch (error) {
    console.error(`[REVIEWS_PATCH] Error updating review ${id}:`, error);
     // In case the review was deleted between the check and the update
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return NextResponse.json({ message: 'Review not found' }, { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// --- DELETE  ---
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { reviewId } = params;
    const id = parseInt(reviewId, 10);

    if (isNaN(id)) {
        return NextResponse.json({ message: 'Invalid review ID format' }, { status: 400 });
    }

    // --- Authentication & Authorization Check ---
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;

    try {
        // Fetch the existing review to check ownership *before* attempting delete
        const existingReview = await prisma.review.findUnique({
            where: { id: id },
            select: { userId: true, eventId: true }, 
        });

        if (!existingReview) {
            // Review already gone, arguably a success for DELETE, or return 404
            return NextResponse.json({ message: 'Review not found' }, { status: 404 });
        }

        if (existingReview.userId !== userId) {
            // User doesn't own this review
            return new NextResponse('Forbidden: You do not own this review', { status: 403 });
        }
        // --- End Authentication & Authorization Check ---
        const eventIdToDeleteFrom = existingReview.eventId;
        // Perform the delete operation
        await prisma.review.delete({
            where: { id: id }, // Ownership already checked
        });

       
        await updateEventAverageRating(eventIdToDeleteFrom);

        // Return No Content on successful deletion
        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error(`[REVIEWS_DELETE] Error deleting review ${id}:`, error);
         // Handle case where review is somehow deleted between check and delete command
         if (error instanceof Error && 'code' in error && error.code === 'P2025') {
            // Record to delete not found - can treat as success or return 404
             return NextResponse.json({ message: 'Review not found' }, { status: 404 });
         }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
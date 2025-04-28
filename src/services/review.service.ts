// src/services/review.service.ts
import { prisma } from '../prisma/client';

export class ReviewService {
  /** 
   * Only allow if user has at least one PAID txn for this event.
   * Then create the review and recalc + update event.averageRating.
   */
  public async createReview(
    userId: string,
    eventId: number,
    rating: number,
    comment?: string
  ) {
    const attended = await prisma.transaction.findFirst({
      where: { userId, eventId, status: 'PAID' }
    });
    if (!attended) {
      throw new Error('You can only review events you’ve attended');
    }

    // Create the review (unique constraint prevents duplicates)
    const review = await prisma.review.create({
      data: { userId, eventId, rating, comment }
    });

    // Recalculate average rating
    const { _avg } = await prisma.review.aggregate({
      where: { eventId },
      _avg: { rating: true }
    });
    const avg = _avg.rating ?? 0;

    // Update event.averageRating
    await prisma.event.update({
      where: { id: eventId },
      data: { averageRating: avg }
    });

    return review;
  }

  /** List all reviews for an event, newest first, including reviewer name */
  public async getReviewsByEvent(eventId: number) {
    return prisma.review.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

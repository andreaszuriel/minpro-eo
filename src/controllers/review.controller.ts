import { Request, Response } from 'express';
import { ReviewService } from '../services/review.service';

const service = new ReviewService();

export class ReviewController {
  /** POST /api/event/:id/review */
  public async create(req: Request, res: Response) {
    try {
      const userId  = (req as any).user.id;
      const eventId = parseInt(req.params.id, 10);
      const { rating, comment } = req.body;
      const review = await service.createReview(userId, eventId, rating, comment);
      res.status(201).json(review);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  /** GET /api/event/:id/reviews */
  public async getByEvent(req: Request, res: Response) {
    try {
      const eventId = parseInt(req.params.id, 10);
      const reviews = await service.getReviewsByEvent(eventId);
      res.json(reviews);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}

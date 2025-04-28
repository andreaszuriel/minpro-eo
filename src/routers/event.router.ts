// src/routers/event.router.ts
import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { ReviewController } from '../controllers/review.controller';
import { AuthenticationMiddleware } from '../middlewares/authentication.middleware';
import { AuthorizationMiddleware } from '../middlewares/authorization.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { z } from 'zod';

export class EventRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    const eventController = new EventController();
    const reviewController = new ReviewController();

    // Schema for event validation
    const eventSchema = z.object({
      title: z.string().min(1),
      genre: z.string().min(1),
      startDate: z.string(),
      endDate: z.string(),
      location: z.string().min(1),
      seats: z.number(),
      tiers: z.any(),
      price: z.any(),
      image: z.string().optional(),
      description: z.string().optional(),
    });

    // Schema for review validation
    const reviewSchema = z.object({
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
    });

    // Event routes
    this.router.get('/', eventController.getEvents.bind(eventController));
    this.router.get('/:id', eventController.getEventById.bind(eventController));
    this.router.post(
      '/',
      AuthenticationMiddleware.verifyToken,
      AuthorizationMiddleware.allowRoles('organizer'),
      ValidationMiddleware.validate({ body: eventSchema }),
      eventController.createEvent.bind(eventController)
    );
    this.router.put(
      '/:id',
      AuthenticationMiddleware.verifyToken,
      AuthorizationMiddleware.allowRoles('organizer'),
      ValidationMiddleware.validate({ body: eventSchema }),
      eventController.updateEvent.bind(eventController)
    );
    this.router.delete(
      '/:id',
      AuthenticationMiddleware.verifyToken,
      AuthorizationMiddleware.allowRoles('organizer'),
      eventController.deleteEvent.bind(eventController)
    );

    // Review routes
    this.router.post(
      '/:id/review',
      AuthenticationMiddleware.verifyToken,
      AuthorizationMiddleware.allowRoles('customer'),
      ValidationMiddleware.validate({ body: reviewSchema }),
      reviewController.create.bind(reviewController)
    );
    this.router.get(
      '/:id/reviews',
      reviewController.getByEvent.bind(reviewController)
    );
  }
}

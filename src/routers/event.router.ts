import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { AuthenticationMiddleware } from '../middlewares/authentication.middleware';
import { AuthorizationMiddleware } from '../middlewares/authorization.middleware';
import { z } from 'zod';
import { ValidationMiddleware } from '../middlewares/validation.middleware';

// Schema validasi untuk create/update event
const eventSchema = z.object({
  title: z.string().min(1),
  genre: z.string().min(1),
  startDate: z.string(), // Alternatively, use z.date() if appropriate; we convert in service
  endDate: z.string(),
  location: z.string().min(1),
  seats: z.number(),
  tiers: z.any(), // You could refine this if needed
  price: z.any(), // Adjust this according to the JSON structure of pricing
  image: z.string().optional(), // May be undefined if not provided
  description: z.string().optional(),
});

const router = Router();
const eventController = new EventController();

// Public endpoints
router.get('/', eventController.getEvents.bind(eventController));
router.get('/:id', eventController.getEventById.bind(eventController));

// Protected endpoints (only for organizer)
router.post(
  '/', 
  AuthenticationMiddleware.verifyToken, 
  AuthorizationMiddleware.allowRoles('organizer'), 
  ValidationMiddleware.validate({ body: eventSchema }), 
  eventController.createEvent.bind(eventController)
);

router.put(
  '/:id', 
  AuthenticationMiddleware.verifyToken, 
  AuthorizationMiddleware.allowRoles('organizer'), 
  ValidationMiddleware.validate({ body: eventSchema }), 
  eventController.updateEvent.bind(eventController)
);

router.delete(
  '/:id', 
  AuthenticationMiddleware.verifyToken, 
  AuthorizationMiddleware.allowRoles('organizer'), 
  eventController.deleteEvent.bind(eventController)
);

export class EventRouter {
  public router: Router;
  constructor() {
    this.router = router;
  }
}

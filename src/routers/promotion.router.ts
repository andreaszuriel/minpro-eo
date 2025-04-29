// src/routers/promotion.router.ts
import { Router } from 'express';
import { PromotionController } from '../controllers/promotion.controller';
import { AuthenticationMiddleware } from '../middlewares/authentication.middleware';
import { AuthorizationMiddleware } from '../middlewares/authorization.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { z } from 'zod';

const router = Router();
const ctrl = new PromotionController();

// Validation schema for creating a promotion
const promoSchema = z.object({
  discount: z.number().min(0),
  startsAt: z.string(),   // ISO date string
  endsAt:   z.string(),
});

/**
 * POST /api/events/:id/promotion
 * Create a new promotion for the specified event (organizer only)
 */
router.post(
  '/:id/promotion',
  AuthenticationMiddleware.verifyToken,
  AuthorizationMiddleware.allowRoles('organizer'),
  ValidationMiddleware.validate({ body: promoSchema }),
  ctrl.create.bind(ctrl)
);

/**
 * GET /api/events/:id/promotions
 * Retrieve all promotions for the specified event
 */
router.get(
  '/:id/promotions',
  ctrl.getByEvent.bind(ctrl)
);

export { router as PromotionRouter };

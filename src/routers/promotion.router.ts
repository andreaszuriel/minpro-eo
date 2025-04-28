import { Router } from 'express';
import { PromotionController } from '../controllers/promotion.controller';
import { AuthenticationMiddleware } from '../middlewares/authentication.middleware';
import { AuthorizationMiddleware } from '../middlewares/authorization.middleware';

const router = Router();
const ctrl = new PromotionController();

router.post('/:id/promotion',
  AuthenticationMiddleware.verifyToken,
  AuthorizationMiddleware.allowRoles('organizer'),
  ctrl.create
);

router.get('/:id/promotions', ctrl.getByEvent);

export { router as PromotionRouter };

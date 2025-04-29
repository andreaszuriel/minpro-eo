// src/routers/dashboard.router.ts
import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { AuthenticationMiddleware } from '../middlewares/authentication.middleware';
import { AuthorizationMiddleware } from '../middlewares/authorization.middleware';

const router = Router();
const ctrl   = new DashboardController();

// All routes are organizer-only
router.use(
  AuthenticationMiddleware.verifyToken,
  AuthorizationMiddleware.allowRoles('organizer')
);

// Summary
router.get('/stats/summary', ctrl.summary.bind(ctrl));

// Time‐series
router.get('/stats/daily',   ctrl.daily.bind(ctrl));
router.get('/stats/monthly', ctrl.monthly.bind(ctrl));
router.get('/stats/yearly',  ctrl.yearly.bind(ctrl));

// Attendee list for a given event
router.get('/event/:id/attendees', ctrl.attendees.bind(ctrl));

export class DashboardRouter {
  public router = router;
}

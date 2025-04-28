// src/routers/transactions.router.ts
import { Router } from 'express';
import { TransactionController } from '../controllers/transactions.controller';
import { AuthenticationMiddleware } from '../middlewares/authentication.middleware';
import { AuthorizationMiddleware } from '../middlewares/authorization.middleware';
import { upload } from '../middlewares/upload.middleware';

const ctrl = new TransactionController();

export class TransactionRouter {
  public router = Router()
    /** Create a new transaction */
    .post('/', 
      AuthenticationMiddleware.verifyToken, 
      ctrl.create
    )

    /** Upload proof of transaction */
    .post('/:id/proof',
      AuthenticationMiddleware.verifyToken,
      upload.single('file'),
      ctrl.uploadProof
    )

    /** Approve a transaction (organizer/admin only) */
    .post('/:id/approve',
      AuthenticationMiddleware.verifyToken,
      AuthorizationMiddleware.allowRoles('organizer'), 
      ctrl.approve
    )

    /** Reject a transaction (organizer/admin only) */
    .post('/:id/reject',
      AuthenticationMiddleware.verifyToken,
      AuthorizationMiddleware.allowRoles('organizer'),
      ctrl.reject
    )

    /** Get a transaction by id */
    .get('/:id', 
      AuthenticationMiddleware.verifyToken, 
      ctrl.get
    );
}

import { Router } from 'express';
import { TransactionController } from '../controllers/transactions.controller';
import { AuthenticationMiddleware } from '../middlewares/authentication.middleware';
import { upload } from '../middlewares/upload.middleware';

const ctrl = new TransactionController();
export class TransactionRouter {
  public router = Router()
    .post('/', AuthenticationMiddleware.verifyToken, ctrl.create)
    .post('/:id/proof',
      AuthenticationMiddleware.verifyToken,
      upload.single('file'),
      ctrl.uploadProof
    )
    .post('/:id/approve', /* admin only: add AuthorizationMiddleware */ ctrl.approve)
    .get('/:id', AuthenticationMiddleware.verifyToken, ctrl.get);
}

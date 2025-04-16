import { Router } from 'express';
import { AuthenticationMiddleware } from '../middlewares/authentication.middleware';
import { TransactionController } from '../controllers/transactions.controller';

export class TransactionRouter {
  public router: Router;
  private transactionController: TransactionController;

  constructor() {
    this.router = Router();
    this.transactionController = new TransactionController();
    this.routes();
  }

  private routes(): void {
    this.router.post('/', AuthenticationMiddleware.verifyToken, this.transactionController.createTransaction);
    this.router.get('/:id', AuthenticationMiddleware.verifyToken, this.transactionController.getTransactionById);
    this.router.put('/:id/status', AuthenticationMiddleware.verifyToken, this.transactionController.updateTransactionStatus);
  }
}

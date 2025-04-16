import { Request, Response } from 'express';
import { TransactionService } from '../services/transactions.services';
import { TransactionInput } from '../models/interface';

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  public createTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      // @ts-ignore - pastikan middleware auth sudah menyuntikkan property user ke req
      const userId: number = req.user.id;
      const data: TransactionInput = req.body;
      const result = await this.transactionService.createTransaction(data, userId);
      res.status(201).json(result);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  };

  public getTransactionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id: number = parseInt(req.params.id);
      const transaction = await this.transactionService.getTransactionById(id);
      if (!transaction) {
        res.status(404).json({ message: "Transaction not found" });
      } else {
        res.status(200).json(transaction);
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  };

  public updateTransactionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id: number = parseInt(req.params.id);
      const { status, paymentProof } = req.body;
      const result = await this.transactionService.updateTransactionStatus(id, status, paymentProof);
      res.status(200).json(result);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  };
}

// src/controllers/transactions.controller.ts
import { Request, Response } from 'express';
import { TransactionService } from '../services/transactions.service';

const svc = new TransactionService();

export class TransactionController {
  /** POST /api/transaction */
  public create = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const payload = await svc.createTransaction(req.body, userId);
      res.status(201).json(payload);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };

  /** POST /api/transaction/:id/upload-proof */
  public uploadProof = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const proofUrl = (req as any).fileUrl as string; // assume multer sets fileUrl
      const updated = await svc.uploadProof(id, proofUrl);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };

  /** POST /api/transaction/:id/approve */
  public approve = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const paid = await svc.updateStatusToPaid(id);
      res.json(paid);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };

  /** POST /api/transaction/:id/reject */
  public reject = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const updatedTxn = await svc.rejectTransaction(id);
      res.json(updatedTxn);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };

  /** GET /api/transaction/:id */
  public get = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const txn = await svc.getById(id);
      res.json(txn);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  };
}

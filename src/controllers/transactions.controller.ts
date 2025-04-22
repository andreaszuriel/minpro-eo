// src/controllers/transaction.controller.ts
import { Request, Response } from 'express';
import { TransactionService } from '../services/transactions.services';
const svc = new TransactionService();

export class TransactionController {
  public create = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const payload = await svc.createTransaction(req.body, userId);
      res.status(201).json(payload);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };

  public uploadProof = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      // assume multer gave us req.file.path or URL
      const proofUrl = (req as any).fileUrl as string;
      const updated = await svc.uploadProof(id, proofUrl);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };

  public approve = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const paid = await svc.updateStatusToPaid(id);
      res.json(paid);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };

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

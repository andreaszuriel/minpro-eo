import { Request, Response } from 'express';
import { PromotionService } from '../services/promotion.service';

const service = new PromotionService();

export class PromotionController {
  async create(req: Request, res: Response) {
    try {
      const organizerId = (req as any).user.id;
      const eventId = parseInt(req.params.id);
      const { discount, startsAt, endsAt } = req.body;
      const promo = await service.createPromotion({ eventId, discount, startsAt, endsAt, organizerId });
      res.status(201).json(promo);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async getByEvent(req: Request, res: Response) {
    try {
      const eventId = parseInt(req.params.id);
      const promos = await service.getPromotionsByEvent(eventId);
      res.json(promos);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}

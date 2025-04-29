import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';

const service = new DashboardService();

export class DashboardController {
  public async summary(req: Request, res: Response) {
    try {
      const organizerId = (req as any).user.id;
      const data = await service.getSummary(organizerId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  public async daily(req: Request, res: Response) {
    try {
      const organizerId = (req as any).user.id;
      const days = req.query.days ? Number(req.query.days) : undefined;
      const data = await service.getDailyStats(organizerId, days);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  public async monthly(req: Request, res: Response) {
    try {
      const organizerId = (req as any).user.id;
      const months = req.query.months ? Number(req.query.months) : undefined;
      const data = await service.getMonthlyStats(organizerId, months);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  public async yearly(req: Request, res: Response) {
    try {
      const organizerId = (req as any).user.id;
      const years = req.query.years ? Number(req.query.years) : undefined;
      const data = await service.getYearlyStats(organizerId, years);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  public async attendees(req: Request, res: Response) {
    try {
      const organizerId = (req as any).user.id;
      const eventId = Number(req.params.id);
      const list = await service.getAttendees(eventId, organizerId);
      res.json(list);
    } catch (err: any) {
      res.status(err.message.includes('Unauthorized') ? 403 : 400)
         .json({ message: err.message });
    }
  }
}

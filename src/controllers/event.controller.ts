import { Request, Response } from 'express';
import { EventService } from '../services/event.service';

export class EventController {
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService();
  }

  public async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const events = await this.eventService.getEvents();
      res.status(200).json(events);
      return; // Explicitly return void
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
      return;
    }
  }

  public async getEventById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const event = await this.eventService.getEventById(id);
      if (!event) {
        res.status(404).json({ message: "Event not found" });
        return;
      }
      res.status(200).json(event);
      return;
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
      return;
    }
  }

  public async createEvent(req: Request, res: Response): Promise<void> {
    try {
      // @ts-ignore: assume middleware auth adds req.user with id
      const organizerId = req.user.id;
      const event = await this.eventService.createEvent(req.body, organizerId);
      res.status(201).json(event);
      return;
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
      return;
    }
  }

  public async updateEvent(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      // @ts-ignore: assume middleware auth adds req.user with id
      const userId = req.user.id;
      const updatedEvent = await this.eventService.updateEvent(id, req.body, userId);
      res.status(200).json(updatedEvent);
      return;
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
      return;
    }
  }

  public async deleteEvent(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      // @ts-ignore: assume req.user is available from middleware
      const userId = req.user.id;
      const deletedEvent = await this.eventService.deleteEvent(id, userId);
      res.status(200).json({ message: "Event deleted successfully", event: deletedEvent });
      return;
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
      return;
    }
  }
}
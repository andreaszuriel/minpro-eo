// src/controllers/event.controller.ts
import { Request, Response } from 'express';
import { EventService } from '../services/event.service';

export class EventController {
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService();
  }

  /**
   * GET /api/event
   */
  public async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        q: req.query.q as string | undefined,
        genre: req.query.genre as string | undefined,
        location: req.query.location as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };

      const events = await this.eventService.getEvents(filters);
      res.status(200).json(events);
    } catch (err: any) {
      console.error('Error fetching events with filters:', err);
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  }

  /**
   * GET /api/event/:id
   */
  public async getEventById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const event = await this.eventService.getEventById(id);

      if (!event) {
        res.status(404).json({ message: 'Event not found' });
        return;
      }

      res.status(200).json(event);
    } catch (err: any) {
      console.error('Error fetching event by id:', err);
      res.status(500).json({ message: 'Failed to fetch event' });
    }
  }

  /**
   * POST /api/event
   */
  public async createEvent(req: Request, res: Response): Promise<void> {
    try {
      // @ts-ignore Assume auth middleware sets req.user
      const organizerId = req.user.id;
      const event = await this.eventService.createEvent(req.body, organizerId);
      res.status(201).json(event);
    } catch (err: any) {
      console.error('Error creating event:', err);
      res.status(500).json({ message: 'Failed to create event' });
    }
  }

  /**
   * PUT /api/event/:id
   */
  public async updateEvent(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      // @ts-ignore
      const userId = req.user.id;
      const updatedEvent = await this.eventService.updateEvent(id, req.body, userId);
      res.status(200).json(updatedEvent);
    } catch (err: any) {
      console.error('Error updating event:', err);
      res.status(500).json({ message: 'Failed to update event' });
    }
  }

  /**
   * DELETE /api/event/:id
   */
  public async deleteEvent(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      // @ts-ignore
      const userId = req.user.id;
      const deletedEvent = await this.eventService.deleteEvent(id, userId);
      res.status(200).json({ message: 'Event deleted successfully', event: deletedEvent });
    } catch (err: any) {
      console.error('Error deleting event:', err);
      res.status(500).json({ message: 'Failed to delete event' });
    }
  }
}

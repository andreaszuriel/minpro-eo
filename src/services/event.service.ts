// src/services/event.service.ts
import { PrismaClient } from '@prisma/client';
import { EventInput, EventPayload } from '../models/interface';

const prisma = new PrismaClient();

interface EventFilters {
  q?: string;
  genre?: string;
  location?: string;
  startDate?: string;  // ISO string
  endDate?: string;    // ISO string
}

export class EventService {
  /**
   * Fetch events with optional filters.
   */
  public async getEvents(filters: EventFilters = {}): Promise<EventPayload[]> {
    const { q, genre, location, startDate, endDate } = filters;

    const andClauses: any[] = [];

    if (q) {
      andClauses.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ]
      });
    }

    if (genre) {
      andClauses.push({ genre });
    }

    if (location) {
      andClauses.push({ location: { contains: location, mode: 'insensitive' } });
    }

    if (startDate) {
      andClauses.push({ startDate: { gte: new Date(startDate) } });
    }

    if (endDate) {
      andClauses.push({ endDate: { lte: new Date(endDate) } });
    }

    const where = andClauses.length > 0 ? { AND: andClauses } : undefined;

    return await prisma.event.findMany({
      where,
      include: {
        organizer: { select: { name: true, email: true } }
      },
      orderBy: { startDate: 'asc' }
    });
  }

  /**
   * Fetch single event by ID
   */
  public async getEventById(id: number): Promise<EventPayload | null> {
    return await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { name: true, email: true } },
        reviews: true
      }
    });
  }

  /**
   * Create new event
   */
  public async createEvent(data: EventInput, organizerId: number): Promise<EventPayload> {
    return await prisma.event.create({
      data: {
        title: data.title,
        genre: data.genre,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        location: data.location,
        seats: data.seats,
        tiers: data.tiers,
        price: data.price,
        image: data.image,
        description: data.description,
        organizer: { connect: { id: organizerId } }
      },
      include: {
        organizer: { select: { name: true, email: true } }
      }
    });
  }

  /**
   * Update event
   */
  public async updateEvent(id: number, data: Partial<EventInput>, userId: number): Promise<EventPayload> {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found');
    if (event.organizerId !== userId) throw new Error('Unauthorized');

    return await prisma.event.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : event.startDate,
        endDate: data.endDate ? new Date(data.endDate) : event.endDate
      },
      include: {
        organizer: { select: { name: true, email: true } }
      }
    });
  }

  /**
   * Delete event
   */
  public async deleteEvent(id: number, userId: number): Promise<EventPayload> {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found');
    if (event.organizerId !== userId) throw new Error('Unauthorized');

    return await prisma.event.delete({ where: { id } });
  }
}

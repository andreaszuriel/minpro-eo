import { PrismaClient } from '@prisma/client';
import { EventInput, EventPayload } from '../models/interface';

const prisma = new PrismaClient();

export class EventService {
  public async getEvents(): Promise<EventPayload[]> {
    return await prisma.event.findMany({
      include: {
        // Include organizer data if needed (here only name and email)
        organizer: { select: { name: true, email: true } }
      }
    });
  }

  public async getEventById(id: number): Promise<EventPayload | null> {
    return await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { name: true, email: true } },
        reviews: true  // Include reviews if needed
      }
    });
  }

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
        image: data.image, // Can be undefined, which is acceptable now
        description: data.description,
        organizer: { connect: { id: organizerId } }
      }
    });
  }

  public async updateEvent(id: number, data: Partial<EventInput>, userId: number): Promise<EventPayload> {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error("Event not found");
    if (event.organizerId !== userId) throw new Error("Unauthorized");

    return await prisma.event.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : event.startDate,
        endDate: data.endDate ? new Date(data.endDate) : event.endDate
      }
    });
  }

  public async deleteEvent(id: number, userId: number): Promise<EventPayload> {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error("Event not found");
    if (event.organizerId !== userId) throw new Error("Unauthorized");
    return await prisma.event.delete({ where: { id } });
  }
}
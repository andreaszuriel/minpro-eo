import { prisma } from '../prisma/client';

export class PromotionService {
  async createPromotion(data: { eventId: number; discount: number; startsAt: Date; endsAt: Date; organizerId: string; }) {
    return prisma.promotion.create({
      data: {
        code: `PROMO-${Math.random().toString(36).substring(2,8).toUpperCase()}`,
        eventId: data.eventId,
        discount: data.discount,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        organizerId: data.organizerId,
      }
    });
  }

  async getPromotionsByEvent(eventId: number) {
    return prisma.promotion.findMany({ where: { eventId } });
  }
}

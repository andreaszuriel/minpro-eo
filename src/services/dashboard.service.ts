// src/services/dashboard.service.ts
import { prisma } from '../prisma/client';

export class DashboardService {
  /** Basic summary: total events, total tickets sold, total revenue */
  public async getSummary(organizerId: string) {
    // 1) Count events
    const totalEvents = await prisma.event.count({
      where: { organizerId }
    });

    // 2) Sum tickets & revenue for all PAID transactions on organizer’s events
    const stats = await prisma.transaction.aggregate({
      where: {
        status: 'PAID',
        event: { organizerId }
      },
      _sum: {
        ticketQuantity: true,
        finalPrice: true
      }
    });

    return {
      totalEvents,
      totalTicketsSold: stats._sum.ticketQuantity ?? 0,
      totalRevenue:      stats._sum.finalPrice      ?? 0
    };
  }

  /** Daily stats for the last N days (default 30) */
  public async getDailyStats(organizerId: string, days = 30) {
    return prisma.$queryRaw<
      { date: string; tickets: number; revenue: number }[]
    >`
      SELECT
        to_char(tx."createdAt"::date, 'YYYY-MM-DD') AS date,
        SUM(tx."ticketQuantity") AS tickets,
        SUM(tx."finalPrice")       AS revenue
      FROM "Transaction" tx
      JOIN "Event" ev ON tx."eventId" = ev.id
      WHERE ev."organizerId" = ${organizerId}
        AND tx.status = 'PAID'
        AND tx."createdAt" >= now() - interval '${days} days'
      GROUP BY date
      ORDER BY date ASC
    `;
  }

  /** Monthly stats for the last N months (default 12) */
  public async getMonthlyStats(organizerId: string, months = 12) {
    return prisma.$queryRaw<
      { month: string; tickets: number; revenue: number }[]
    >`
      SELECT
        to_char(date_trunc('month', tx."createdAt"), 'YYYY-MM') AS month,
        SUM(tx."ticketQuantity") AS tickets,
        SUM(tx."finalPrice")       AS revenue
      FROM "Transaction" tx
      JOIN "Event" ev ON tx."eventId" = ev.id
      WHERE ev."organizerId" = ${organizerId}
        AND tx.status = 'PAID'
        AND tx."createdAt" >= now() - interval '${months} months'
      GROUP BY month
      ORDER BY month ASC
    `;
  }

  /** Yearly stats for the last N years (default 5) */
  public async getYearlyStats(organizerId: string, years = 5) {
    return prisma.$queryRaw<
      { year: string; tickets: number; revenue: number }[]
    >`
      SELECT
        to_char(date_trunc('year', tx."createdAt"), 'YYYY') AS year,
        SUM(tx."ticketQuantity") AS tickets,
        SUM(tx."finalPrice")       AS revenue
      FROM "Transaction" tx
      JOIN "Event" ev ON tx."eventId" = ev.id
      WHERE ev."organizerId" = ${organizerId}
        AND tx.status = 'PAID'
        AND tx."createdAt" >= now() - interval '${years} years'
      GROUP BY year
      ORDER BY year ASC
    `;
  }

  /** Attendee list for one event */
  public async getAttendees(eventId: number, organizerId: string) {
    // Verify organizer owns this event
    const ev = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });
    if (!ev || ev.organizerId !== organizerId) {
      throw new Error('Unauthorized or event not found');
    }

    // Fetch all PAID transactions with user info
    return prisma.transaction.findMany({
      where: {
        eventId,
        status: 'PAID'
      },
      select: {
        id: true,
        ticketQuantity: true,
        finalPrice: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}

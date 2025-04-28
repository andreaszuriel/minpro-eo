// src/services/transactions.service.ts
import { PrismaClient, TransactionStatus } from '@prisma/client';
import { TransactionInput, TransactionPayload } from '../models/interface';
import { generateVoucher } from '../utils/generateVouceher';
import { generateTicket } from '../utils/generateTicket';
import { EmailService } from './email.service';

const prisma = new PrismaClient();
const POINT_VALUE = 100; // 1 point = 100 IDR

export class TransactionService {
  private emailService = new EmailService();

  public async createTransaction(
    data: TransactionInput,
    userId: number
  ): Promise<TransactionPayload> {
    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new Error('Event not found');

    const tiers: { type: string; price: number; available: number }[] = event.tiers as any;
    const tier = tiers.find(t => t.type === data.tierType);
    if (!tier) throw new Error('Tier not found');
    if (tier.available < data.ticketQuantity) throw new Error('Not enough seats in tier');

    const basePrice = tier.price;
    let couponDiscount = 0;
    if (data.couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: { code: data.couponCode, userId, expiresAt: { gt: new Date() } }
      });
      if (coupon) couponDiscount = coupon.discount;
    }

    let pointsUsed = 0;
    if (data.usePoints) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.points > 0) {
        pointsUsed = Math.min(user.points, Math.floor((basePrice * data.ticketQuantity - couponDiscount) / POINT_VALUE));
      }
    }

    const finalPrice = Math.max(0,
      basePrice * data.ticketQuantity - couponDiscount - pointsUsed * POINT_VALUE
    );

    const txn = await prisma.$transaction(async (tx) => {
      const updatedTiers = tiers.map(t =>
        t.type === data.tierType
          ? { ...t, available: t.available - data.ticketQuantity }
          : t
      );

      await tx.event.update({
        where: { id: event.id },
        data: { tiers: updatedTiers }
      });

      if (pointsUsed > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { points: { decrement: pointsUsed } }
        });
      }

      if (couponDiscount > 0) {
        await tx.coupon.deleteMany({
          where: { code: data.couponCode }
        });
      }

      return tx.transaction.create({
        data: {
          userId,
          eventId: event.id,
          tierType: data.tierType,
          ticketQuantity: data.ticketQuantity,
          basePrice,
          couponDiscount,
          pointsUsed,
          finalPrice,
          status: TransactionStatus.PENDING,
          paymentDeadline: new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 hours
        }
      });
    });

    return txn as TransactionPayload;
  }

  public async uploadProof(id: number, proofUrl: string): Promise<TransactionPayload> {
    const txn = await prisma.transaction.update({
      where: { id },
      data: {
        paymentProof: proofUrl,
        status: TransactionStatus.WAITING_ADMIN
      }
    });
    return txn as TransactionPayload;
  }

  public async updateStatusToPaid(id: number): Promise<TransactionPayload> {
    const txn = await prisma.transaction.findUnique({ where: { id } });
    if (!txn) throw new Error('Transaction not found');
    if (txn.status !== TransactionStatus.WAITING_ADMIN) throw new Error('Bad status');

    const [user, event] = await Promise.all([
      prisma.user.findUnique({ where: { id: txn.userId } }),
      prisma.event.findUnique({ where: { id: txn.eventId } })
    ]);
    if (!user || !event) throw new Error('Data missing');

    const voucherUrl = await generateVoucher({
      userName: user.name,
      eventTitle: event.title,
      tierType: txn.tierType,
      quantity: txn.ticketQuantity,
      total: txn.finalPrice,
      date: txn.createdAt
    });

    const ticketUrl = await generateTicket({
      userName: user.name,
      eventTitle: event.title,
      tierType: txn.tierType,
      quantity: txn.ticketQuantity,
      eventDate: event.startDate
    });

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        status: TransactionStatus.PAID,
        voucherUrl,
        ticketUrl
      }
    });

    // Send email notification
    if (user.email && updated.ticketUrl) {
      await this.emailService.sendTransactionAccepted(
        user.email,
        updated.id,
        updated.ticketUrl
      );
    }

    return updated as TransactionPayload;
  }

  public async rejectTransaction(id: number): Promise<TransactionPayload> {
    const txn = await prisma.transaction.findUnique({ where: { id } });
    if (!txn) throw new Error('Transaction not found');
    if (txn.status !== TransactionStatus.WAITING_ADMIN) {
      throw new Error('Cannot reject transaction in its current status');
    }

    const result = await prisma.$transaction(async tx => {
      const ev = await tx.event.findUnique({ where: { id: txn.eventId } });
      if (ev) {
        const tiers = ev.tiers as { type: string; price: number; available: number }[];
        const updatedTiers = tiers.map(t =>
          t.type === txn.tierType
            ? { ...t, available: t.available + txn.ticketQuantity }
            : t
        );
        await tx.event.update({ where: { id: ev.id }, data: { tiers: updatedTiers } });
      }

      if (txn.pointsUsed > 0) {
        await tx.user.update({
          where: { id: txn.userId },
          data: { points: { increment: txn.pointsUsed } }
        });
      }

      if (txn.couponDiscount > 0) {
        await tx.coupon.create({
          data: {
            code: `REFUND-${Date.now()}`,
            userId: txn.userId,
            discount: txn.couponDiscount,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          }
        });
      }

      return tx.transaction.update({
        where: { id },
        data: { status: TransactionStatus.REJECTED }
      });
    });

    const user = await prisma.user.findUnique({ where: { id: result.userId } });
    if (user?.email) {
      await this.emailService.sendTransactionRejected(user.email, result.id);
    }

    return result as TransactionPayload;
  }

  public async getById(id: number): Promise<TransactionPayload> {
    const t = await prisma.transaction.findUnique({ where: { id } });
    if (!t) throw new Error('Transaction not found');
    return t as TransactionPayload;
  }
}

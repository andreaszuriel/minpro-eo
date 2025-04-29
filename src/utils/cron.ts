import { prisma } from '../prisma/client';
import { EmailService } from '../services/email.service';

const emailService = new EmailService();

/**
 * Starts a cron job that periodically:
 * 1) Expires PENDING transactions older than 2 hours
 * 2) Auto-rejects WAITING_ADMIN transactions older than 3 days
 * 3) Expires unused coupons past their expiry date
 * 4) Expires point histories older than now
 */
export function startExpirationCron(): void {
  // run every 15 minutes
  setInterval(async () => {
    const now = new Date();

    // 1) Expire PENDING transactions >2h old
    const expiredTxns = await prisma.transaction.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
      },
    });
    for (const txn of expiredTxns) {
      await rollbackAndCancel(txn.id, 'EXPIRED');
    }

    // 2) Auto-reject WAITING_ADMIN >3d old
    const staleAdminTxns = await prisma.transaction.findMany({
      where: {
        status: 'WAITING_ADMIN',
        updatedAt: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
      },
    });
    for (const txn of staleAdminTxns) {
      await rollbackAndCancel(txn.id, 'REJECTED');
    }

    // 3) Expire coupons past their expiry date
    await prisma.coupon.updateMany({
      where: { expiresAt: { lt: now }, used: false },
      data: { used: true },
    });

    // 4) Expire point histories older than now
    const expiredHistories = await prisma.pointHistory.findMany({
      where: { expiresAt: { lt: now }, expired: false }
    });
    for (const hist of expiredHistories) {
      await prisma.$transaction(async tx => {
        // decrement user.points
        await tx.user.update({
          where: { id: hist.userId },
          data: { points: { decrement: hist.points } }
        });
        // mark history expired
        await tx.pointHistory.update({
          where: { id: hist.id },
          data: { expired: true }
        });
      });
    }
  }, 15 * 60 * 1000);
}

/**
 * Rolls back side-effects of a transaction and cancels it with the given status.
 * Restores seats, points, coupons, updates txn status, and notifies the user via email.
 */
async function rollbackAndCancel(
  txnId: number,
  status: 'EXPIRED' | 'REJECTED'
): Promise<void> {
  await prisma.$transaction(async tx => {
    const txn = await tx.transaction.findUnique({ where: { id: txnId } });
    if (!txn) return;

    // 1) Restore seats
    const ev = await tx.event.findUnique({ where: { id: txn.eventId } });
    if (ev) {
      const tiers = ev.tiers as any[];
      const updatedTiers = tiers.map(t =>
        t.type === txn.tierType
          ? { ...t, available: t.available + txn.ticketQuantity }
          : t
      );
      await tx.event.update({ where: { id: ev.id }, data: { tiers: updatedTiers } });
    }

    // 2) Restore points
    if (txn.pointsUsed > 0) {
      await tx.user.update({
        where: { id: txn.userId },
        data: { points: { increment: txn.pointsUsed } },
      });
    }

    // 3) Restore coupon
    if (txn.couponDiscount > 0) {
      await tx.coupon.create({
        data: {
          code: `REFUND-${Date.now()}`,
          userId: txn.userId,
          discount: txn.couponDiscount,
          expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // 4) Update transaction status
    const updatedTxn = await tx.transaction.update({
      where: { id: txnId },
      data: { status },
    });

    // 5) Send notification email
    const user = await tx.user.findUnique({ where: { id: updatedTxn.userId } });
    if (user?.email) {
      if (status === 'EXPIRED') {
        await emailService.sendTransactionExpired(user.email, txnId);
      } else {
        await emailService.sendTransactionRejected(user.email, txnId);
      }
    }
  });
}

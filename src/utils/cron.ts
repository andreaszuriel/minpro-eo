import { prisma } from '../prisma/client';

export async function startExpirationCron() {
  // run every 15 minutes
  setInterval(async () => {
    const now = new Date();

    // 1) Expire PENDING txns older than 2 hours
    const expiredTxns = await prisma.transaction.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: new Date(now.getTime() - 2 * 60 * 60 * 1000) }
      }
    });
    for (const txn of expiredTxns) {
      await rollbackAndCancel(txn.id, 'EXPIRED');
    }

    // 2) Auto-reject WAITING_ADMIN older than 3 days
    const stale = await prisma.transaction.findMany({
      where: {
        status: 'WAITING_ADMIN',
        updatedAt: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) }
      }
    });
    for (const txn of stale) {
      await rollbackAndCancel(txn.id, 'REJECTED');
    }

    // 3) Expire coupons and points > 3 months
    await prisma.coupon.updateMany({
      where: { expiresAt: { lt: now }, used: false },
      data: { used: true }
    });
    // For points, you’ll need a history table to track when points were added.
    // Query that and decrement user.points accordingly.
  }, 15 * 60 * 1000);
}

async function rollbackAndCancel(txnId: number, status: 'EXPIRED' | 'REJECTED') {
  await prisma.$transaction(async tx => {
    const txn = await tx.transaction.findUnique({ where: { id: txnId } });
    if (!txn) return;

    // 1) restore seats
    const ev = await tx.event.findUnique({ where: { id: txn.eventId } });
    const tiers = ev!.tiers as any[];
    const updated = tiers.map(t =>
      t.type === txn.tierType
        ? { ...t, available: t.available + txn.ticketQuantity }
        : t
    );
    await tx.event.update({ where: { id: ev!.id }, data: { tiers: updated } });

    // 2) restore points
    if (txn.pointsUsed > 0) {
      await tx.user.update({
        where: { id: txn.userId },
        data: { points: { increment: txn.pointsUsed } }
      });
    }

    // 3) restore coupon
    if (txn.couponDiscount > 0) {
      await tx.coupon.create({
        data: {
          code: txn.voucherUrl!, // or store original code somewhere
          userId: txn.userId,
          discount: txn.couponDiscount,
          expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
        }
      });
    }

    // 4) update status
    await tx.transaction.update({
      where: { id: txnId },
      data: { status }
    });

    // 5) send notification email (use EmailService)
  });
}

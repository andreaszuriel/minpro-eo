// lib/jobs/expirePendingTransactions.ts
import { prisma } from '@/lib/prisma';
import { TransactionStatus } from '@prisma/client';

export async function expirePendingTransactions(): Promise<void> {
  const now = new Date();
  console.log(`[${now.toISOString()}] Running job: Expire Pending Transactions`);

  try {
    const overdueTransactions = await prisma.transaction.findMany({
      where: {
        status: TransactionStatus.PENDING,
        paymentDeadline: {
          lt: now,
        },
      },
      select: {
        id: true,
      },
    });

    if (overdueTransactions.length === 0) {
      console.log(`[${now.toISOString()}] No pending transactions found past their deadline.`);
      return;
    }

    const idsToExpire = overdueTransactions.map((tx) => tx.id);
    console.log(`[${now.toISOString()}] Found ${idsToExpire.length} transactions to expire: IDs ${idsToExpire.join(', ')}`);

    const updateResult = await prisma.transaction.updateMany({
      where: {
        id: { in: idsToExpire },
      },
      data: {
        status: TransactionStatus.EXPIRED,
        updatedAt: now,
      },
    });

    console.log(`[${now.toISOString()}] Successfully updated ${updateResult.count} transactions to EXPIRED status.`);
  } catch (error) {
    console.error(`[${now.toISOString()}] Error running Expire Pending Transactions job:`, error);
  } finally {
    console.log(`[${now.toISOString()}] Finished job: Expire Pending Transactions`);
  }
}

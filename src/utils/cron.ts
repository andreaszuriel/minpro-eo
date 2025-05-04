import cron from 'node-cron';
import { prisma } from '@/lib/prisma'; 
import { TransactionStatus } from '@prisma/client';

// Only run cron jobs in development environment
if (process.env.NODE_ENV === 'development') {
  console.log("Development cron job service starting...");

  const expirePendingTransactionsTask = cron.schedule(
    '*/5 * * * *',
    async () => {
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
            id: {
              in: idsToExpire,
            },
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
    },
    {
      scheduled: true, 
      timezone: "Asia/Jakarta", 
    }
  );

  console.log("Cron job 'expirePendingTransactionsTask' scheduled.");
} else {
  console.log("Skipping cron job initialization in production environment.");
}
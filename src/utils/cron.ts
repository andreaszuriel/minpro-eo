import cron from 'node-cron';
import { PrismaClient, TransactionStatus } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Every 5 minutes, find all transactions that:
 *  - are still PENDING or WAITING_ADMIN
 *  - have paymentDeadline < now
 * and mark them EXPIRED.
 */
export function startExpirationCron() {
  cron.schedule('*/5 * * * *', async () => {
    const now = new Date();
    try {
      const expired = await prisma.transaction.updateMany({
        where: {
          status: { in: [TransactionStatus.PENDING, TransactionStatus.WAITING_ADMIN] },
          paymentDeadline: { lt: now }
        },
        data: { status: TransactionStatus.EXPIRED }
      });
      if (expired.count > 0) {
        console.log(`Cron: marked ${expired.count} transactions as EXPIRED`);
      }
    } catch (err) {
      console.error('Cron error expiring transactions:', err);
    }
  });
}

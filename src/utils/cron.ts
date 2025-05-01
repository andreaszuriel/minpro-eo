import cron from 'node-cron';
import { prisma } from '@/lib/prisma'; 
import { TransactionStatus } from '@prisma/client';

console.log("Cron job service starting...");


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
                        lt: now, // 'lt' means less than (deadline is in the past)
                    },
                },
                select: {
                    id: true, // Only select the ID, which is needed for the update
                },
            });

            if (overdueTransactions.length === 0) {
                console.log(`[${now.toISOString()}] No pending transactions found past their deadline.`);
                return; // Nothing to do
            }

            const idsToExpire = overdueTransactions.map((tx) => tx.id);
            console.log(`[${now.toISOString()}] Found ${idsToExpire.length} transactions to expire: IDs ${idsToExpire.join(', ')}`);

            // Update the status of these transactions to EXPIRED
            const updateResult = await prisma.transaction.updateMany({
                where: {
                    id: {
                        in: idsToExpire,
                    },
                },
                data: {
                    status: TransactionStatus.EXPIRED, // Set status to EXPIRED
                    updatedAt: now, // Optionally update the updatedAt timestamp
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

// Optional: Add more cron jobs here if needed


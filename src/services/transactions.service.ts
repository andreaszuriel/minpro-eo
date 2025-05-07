import { prisma } from "@/lib/prisma";
import { Prisma, TransactionStatus, PrismaClient, Ticket, Coupon, User, PointTransaction } from "@prisma/client";
import { generateUniqueSerialCode } from "@/lib/utils";
import { EmailService } from "./email.service"; 

type TransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export class TransactionService {
  static async resendTickets(id: number) {
    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: { tickets: true, user: true, event: true },
    });
  
    if (!tx) {
      throw new Error('Transaction not found');
    }
  
    // Use the EmailService to send tickets
    await EmailService.sendTickets(tx.user.email, tx.tickets, tx.event);
  
    console.log(`Resending ${tx.tickets.length} tickets for transaction #${id}`);
  
    return;
  }

  static async getCustomerTransactions(userId: string) {
    return prisma.transaction.findMany({
      where: {
        userId: userId,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            image: true,
            startDate: true,
            location: true,
          },
        },
        tickets: {
          select: {
            id: true,
            serialCode: true,
            isUsed: true,
            tierType: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          }
        },
        promotion: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getTransactionById(id: number) {
    return prisma.transaction.findUnique({
      where: { id },
      include: {
        event: true,
        user: true,
        tickets: true,
        promotion: true, // Added promotion inclusion
      },
    });
  }
   
  static async getOrganizerTransactions(organizerId: string) {
    return prisma.transaction.findMany({
      where: {
        event: {
          organizerId,
        },
      },
      include: {
        event: true,
        user: true,
        tickets: true,
        promotion: true, // Added promotion inclusion
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async createTransaction(data: Prisma.TransactionCreateInput) {

    return prisma.$transaction(async (tx) => {
        // --- Re-verify event existence and seats within the transaction ---
        const eventId = (data.event?.connect?.id) as number | undefined;
        if (!eventId) throw new Error("Event ID missing in transaction data");

        const event = await tx.event.findUnique({ where: { id: eventId } });
        if (!event) throw new Error("Event not found");

        const ticketQuantity = data.ticketQuantity as number;
        const soldTickets = await tx.ticket.count({ where: { eventId: event.id } });
        if (soldTickets + ticketQuantity > event.seats) {
            throw new Error("Not enough tickets available (concurrent booking check)");
        }
        // --- End Re-verification ---

        console.log("Creating Transaction with data:", JSON.stringify(data));

        // Ensure not passing an ID if it accidentally exists in `data`
        const dataToUse = { ...data };
        if ((dataToUse as any).id) delete (dataToUse as any).id;

        // Create the transaction
        const transaction = await tx.transaction.create({
            data: dataToUse, // Use the prepared data from the API route
            include: {
                event: true,
                user: true, // Include user for email later
                coupon: true, // Include coupon if connected
                promotion: true // Include promotion if connected
            },
        });

        // If promotion is used, increment its usage count
        if (transaction.promotionId) {
            await tx.promotion.update({
                where: { id: transaction.promotionId },
                data: { usageCount: { increment: 1 } }
            });
            console.log(`Incremented usage count for promotion ${transaction.promotionId}`);
        }

        // If transaction is created directly as PAID (e.g., free event), create tickets
        // AND deduct points/mark coupon used immediately.
        if (transaction.status === TransactionStatus.PAID) {
             console.log(`Tx #${transaction.id} created as PAID. Handling deductions and tickets.`);
             await this.handlePaidTransactionSideEffects(transaction.id, tx);
        }

        // Send notification email for transaction creation
        if (transaction.user && transaction.event) {
            await EmailService.sendTransactionStatusUpdate(
                transaction.user,
                transaction.event,
                transaction.id,
                transaction.status,
                transaction.ticketQuantity
            );
        }

        return transaction; // Return the created transaction object
    });
  }

  static async updateTransactionStatus(
    id: number,
    newStatus: TransactionStatus,
    updateData: Partial<Prisma.TransactionUpdateInput> = {}
  ) {
    // Fetch current transaction state *before* starting the DB transaction
    const currentTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: true, // Needed for email and point deduction
        event: true, // Needed for email
        coupon: true, // Needed for coupon marking
        promotion: true, // Added promotion inclusion
      }
    });

    if (!currentTransaction) {
      throw new Error("Transaction not found");
    }

    const oldStatus = currentTransaction.status;
    const statusIsChanging = oldStatus !== newStatus;
    const isBecomingPaid = newStatus === TransactionStatus.PAID && oldStatus !== TransactionStatus.PAID;

    // Prevent updating status to PAID if deadline passed (unless already PAID)
    if (isBecomingPaid && currentTransaction.paymentDeadline < new Date()) {
        console.warn(`Tx #${id}: Attempt to mark as PAID after deadline. Current Status: ${oldStatus}`);
         await prisma.transaction.update({ where: { id }, data: { status: TransactionStatus.EXPIRED } });
         throw new Error(`Payment deadline has passed. Transaction automatically marked as EXPIRED.`);

    }

    let createdTickets: Ticket[] = []; // To hold created tickets if status becomes PAID

    // --- Perform database operations within a transaction ---
    try {
      const updatedTransactionResult = await prisma.$transaction(async (tx) => {
        // 1. Update transaction status and other data
        const updatedTx = await tx.transaction.update({
          where: { id },
          data: {
            ...updateData,
            status: newStatus, // Apply the new status
          },
           include: { // Include necessary relations for subsequent steps
               user: true,
               coupon: true,
               promotion: true, // Added promotion inclusion
           }
        });

        // 2. Handle side effects if status becomes PAID
        if (isBecomingPaid) {
             console.log(`Tx #${id} status changing to PAID. Handling deductions and tickets.`);
             createdTickets = await this.handlePaidTransactionSideEffects(id, tx, updatedTx); // Pass updatedTx
        }

        return updatedTx; // Return the result of the update from the transaction block
      });
      // --- Transaction successful ---

      if (statusIsChanging && currentTransaction.user && currentTransaction.event) {
          const shouldSendStatusUpdate =
              (oldStatus === "WAITING_ADMIN" && newStatus === "PAID") ||
              (oldStatus === "WAITING_ADMIN" && newStatus === "CANCELED") || // Or EXPIRED
              (oldStatus === "PENDING" && newStatus === "WAITING_ADMIN") ||
              (oldStatus === "PENDING" && newStatus === "PAID"); // Direct PENDING -> PAID

          if (shouldSendStatusUpdate) {
              console.log(`Sending status update email for Tx #${id} - New Status: ${newStatus}`);
              await EmailService.sendTransactionStatusUpdate(
                  currentTransaction.user,
                  currentTransaction.event,
                  currentTransaction.id,
                  newStatus, // Send the NEW status
                  currentTransaction.ticketQuantity
              );

              // If approved (became PAID), also send tickets email
              if (isBecomingPaid) {
                  if (createdTickets.length > 0) {
                       console.log(`Sending tickets email for Tx #${id}`);
                       await EmailService.sendTickets(
                          currentTransaction.user.email,
                          createdTickets,
                          currentTransaction.event
                      );
                  } else {
                      // Fallback: If createdTickets is empty maybe they existed before? Fetch them.
                      const existingTickets = await prisma.ticket.findMany({ where: { transactionId: id } });
                      if (existingTickets.length > 0) {
                           console.log(`Sending existing tickets email for Tx #${id}`);
                           await EmailService.sendTickets(currentTransaction.user.email, existingTickets, currentTransaction.event);
                      } else {
                           console.warn(`Tx #${id} is PAID but no tickets found/created to send.`);
                      }
                  }
              }
          }
      }

      // Return the final state fetched *after* commit if needed, or the result from tx
      // Fetching again ensures consistency if other processes modified it between commit and fetch
       const finalUpdatedTransaction = await prisma.transaction.findUnique({
            where: { id: id },
            include: { event: true, user: true, tickets: true, coupon: true, promotion: true },
       });
       return finalUpdatedTransaction;


    } catch (error) {
       console.error(`Error during transaction update or side effects for Tx #${id}:`, error);
       // Re-throw the error to be caught by the API handler
       throw error; // This ensures the handleApiRoute catches it
    }
  }


  /**
   * Handles side effects when a transaction becomes PAID:
   * - Deducts points from user balance.
   * - Creates a PointTransaction log for the deduction.
   * - Marks the used coupon as isUsed=true.
   * - Creates tickets for the transaction.
   */
  private static async handlePaidTransactionSideEffects(
      transactionId: number,
      txClient: TransactionClient,
      transaction?: Prisma.TransactionGetPayload<{ include: { user: true, coupon: true, promotion: true } }> // Updated to include promotion
  ): Promise<Ticket[]> {

      // Fetch transaction details if not passed in (ensure we have pointsUsed, couponId, userId)
      const txDetails = transaction ?? await txClient.transaction.findUnique({
          where: { id: transactionId },
          include: { user: true, coupon: true, promotion: true } // Added promotion inclusion
      });

      if (!txDetails || !txDetails.user) {
          throw new Error(`Transaction ${transactionId} or its user not found during PAID processing.`);
      }

      const { userId, pointsUsed, couponId, coupon, promotionId } = txDetails;

      // --- 1. Deduct Points ---
      if (pointsUsed > 0) {
          console.log(`Tx #${transactionId}: Deducting ${pointsUsed} points from user ${userId}`);
          // Fetch user within TX to lock row and check current points
          const userBeforeUpdate = await txClient.user.findUnique({ where: { id: userId } });
          if (!userBeforeUpdate || userBeforeUpdate.points < pointsUsed) {
               throw new Error(`Insufficient points for user ${userId} at time of confirmation (Needed: ${pointsUsed}, Have: ${userBeforeUpdate?.points ?? 0}). Rolling back.`);
          }

          // Decrement points on User model
          await txClient.user.update({
              where: { id: userId },
              data: { points: { decrement: pointsUsed } }
          });

          // Create PointTransaction log for deduction
          await txClient.pointTransaction.create({
              data: {
                  userId: userId,
                  points: -pointsUsed, // Log deduction as negative value
                  description: `Points used for transaction #${transactionId}`,
                  // Points used don't typically expire, but schema requires it. Set far future or null if schema allows.
                  expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 100)), // Or handle differently
                  isExpired: false, // Default is false
              }
          });
          console.log(`Tx #${transactionId}: Points deducted and log created.`);
      }

      // --- 2. Mark Coupon Used ---
      if (couponId && coupon) { // Check if couponId exists and coupon was successfully included
          console.log(`Tx #${transactionId}: Marking coupon ${couponId} as used for user ${userId}`);
          // Verify coupon isn't already used (another safety check)
          if (coupon.isUsed) {
              // Should ideally not happen if validation was correct at creation and it's linked, but good failsafe.
               console.warn(`Tx #${transactionId}: Coupon ${couponId} was already marked as used. Proceeding, but check logic.`);
          }
          // Update the coupon status
          await txClient.coupon.update({
              where: { id: couponId },
              data: { isUsed: true }
          });
          console.log(`Tx #${transactionId}: Coupon ${couponId} marked as used.`);
      } else if (couponId && !coupon) {
           console.error(`Tx #${transactionId}: Transaction has couponId ${couponId} but coupon data could not be fetched/linked within transaction. Coupon not marked as used.`);
           throw new Error(`Coupon data mismatch for Tx #${transactionId}. Rolling back.`);
      }

      // --- 3. Create Tickets ---
      console.log(`Tx #${transactionId}: Creating tickets.`);
      const createdTickets = await this.createTicketsForTransaction(transactionId, txClient); // Already handles existing check

      return createdTickets;
  }
  private static async createTicketsForTransaction(
    transactionId: number,
    txClient: TransactionClient // Ensure it accepts the transaction client
  ): Promise<Ticket[]> {
    const existingTicketsCount = await txClient.ticket.count({
      where: { transactionId }
    });

    if (existingTicketsCount > 0) {
       console.log(`Tickets already exist for Tx #${transactionId}. Skipping creation.`);
       // Return existing tickets
       return txClient.ticket.findMany({ where: { transactionId } });
    }

    const transaction = await txClient.transaction.findUnique({
      where: { id: transactionId },
      // No includes needed here, just basic data
    });

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found during ticket creation within transaction.`);
    }
    if (transaction.ticketQuantity <= 0) {
        console.warn(`Tx #${transactionId} has ticketQuantity <= 0. No tickets created.`);
        return [];
    }

    const ticketsToCreateData = Array.from({ length: transaction.ticketQuantity }).map(() => ({
      serialCode: generateUniqueSerialCode(),
      userId: transaction.userId,
      eventId: transaction.eventId,
      transactionId: transaction.id,
      tierType: transaction.tierType,
      isUsed: false,
    }));

    console.log(`Creating ${ticketsToCreateData.length} tickets for Tx #${transactionId}`);
    await txClient.ticket.createMany({
      data: ticketsToCreateData
    });

    // Fetch the tickets that were just created to return them
    const createdTickets = await txClient.ticket.findMany({
        where: { transactionId: transactionId }
    });
    console.log(`Successfully created and fetched ${createdTickets.length} tickets for Tx #${transactionId}`);
    return createdTickets;
  }
}
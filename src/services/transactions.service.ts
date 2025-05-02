import { prisma } from "@/lib/prisma";
import { Prisma, TransactionStatus, PrismaClient, Ticket } from "@prisma/client";
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async createTransaction(data: Prisma.TransactionCreateInput) {
    return prisma.$transaction(async (tx) => {  
      // Verify event exists and has enough seats
      const event = await tx.event.findUnique({
        where: { id: data.event.connect?.id as number },
      });
      
      if (!event) {
        throw new Error("Event not found");
      }
      
      // Check if tickets are available
      const soldTickets = await tx.ticket.count({
        where: { eventId: event.id }
      });
      
      if (soldTickets + (data.ticketQuantity as number) > event.seats) {
        throw new Error("Not enough tickets available");
      }
   
      console.log("Transaction data:", JSON.stringify(data));

      // Make sure we're not passing an ID
      const dataToUse = { ...data };
      if ((dataToUse as any).id) {
        delete (dataToUse as any).id;
      }
    
      // Create the transaction
      const transaction = await tx.transaction.create({
        data: dataToUse,
        include: {
          event: true,
          user: true,
        },
      });
      
      // If transaction is already PAID, create tickets immediately
      if (transaction.status === "PAID") {
        await this.createTicketsForTransaction(transaction.id, tx);
      }
      
      // Get the complete transaction with tickets
      const result = await tx.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          event: true,
          user: true,
          tickets: true,
        },
      });

      // Send notification email for transaction creation
      if (result && result.user && result.event) {
        await EmailService.sendTransactionStatusUpdate(
          result.user,
          result.event,
          result.id,
          result.status,
          result.ticketQuantity
        );
      }
      
      return result;
    });
  }

  static async updateTransactionStatus(
    id: number,
    status: TransactionStatus,
    updateData: Partial<Prisma.TransactionUpdateInput> = {}
  ) {
    // --- Step 1: Fetch necessary data BEFORE the transaction ---
    const currentTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: true, // Need user for email
        event: true, // Need event for email
      }
    });

    if (!currentTransaction) {
      throw new Error("Transaction not found");
    }

    // Check if payment deadline has passed (can be done outside tx)
    if (status === "PAID" &&
        currentTransaction.paymentDeadline < new Date() &&
        currentTransaction.status !== "PAID") {
      throw new Error("Payment deadline has passed");
    }

    const oldStatus = currentTransaction.status;
    const statusIsChanging = oldStatus !== status;

    // Variables to hold data needed for email after transaction
    let createdTickets: Ticket[] = []; // To store created tickets if status becomes PAID

    // --- Step 2: Perform database operations within a transaction ---
    try {
      await prisma.$transaction(async (tx) => {
        // Update transaction status and other data
        await tx.transaction.update({
          where: { id },
          data: {
            ...updateData,
            status,
          },
          // No need to include user/event again here unless strictly needed by subsequent steps IN the transaction
        });

        // Handle ticket creation if status becomes PAID
        if (status === "PAID" && oldStatus !== "PAID") {
           // Pass the transaction client 'tx' to the creation method
           createdTickets = await this.createTicketsForTransaction(id, tx);
        }
      });
      // --- Transaction successful ---

    } catch (error) {
       console.error("Error during database transaction:", error);
       // Re-throw the error to be caught by the API handler
       throw error;
    }

    // --- Step 3: Send emails AFTER the transaction has committed ---
    let finalUpdatedTransaction; // To store the final state to return

    try {
        if (statusIsChanging && currentTransaction.user && currentTransaction.event) {
            const shouldSendStatusUpdate =
                (oldStatus === "WAITING_ADMIN" && status === "PAID") ||
                (oldStatus === "WAITING_ADMIN" && status === "CANCELED") ||
                (oldStatus === "PENDING" && status === "WAITING_ADMIN") ||
                (oldStatus === "PENDING" && status === "PAID");

            if (shouldSendStatusUpdate) {
                console.log(`Sending status update email for Tx #${id} - Status: ${status}`);
                // Use data fetched *before* the transaction
                await EmailService.sendTransactionStatusUpdate(
                    currentTransaction.user,
                    currentTransaction.event,
                    currentTransaction.id,
                    status, // Send the NEW status
                    currentTransaction.ticketQuantity
                );

                // If approved, also send tickets email
                if (status === "PAID") {
                    if (createdTickets.length > 0) {
                         console.log(`Sending tickets email for Tx #${id}`);
                         await EmailService.sendTickets(
                            currentTransaction.user.email,
                            createdTickets, // Use the tickets returned from createTicketsForTransaction
                            currentTransaction.event
                        );
                    } else {
                        // If createTickets didn't run or returned empty, fetch existing tickets
                        const existingTickets = await prisma.ticket.findMany({ where: { transactionId: id } });
                        if (existingTickets.length > 0) {
                             console.log(`Sending existing tickets email for Tx #${id}`);
                             await EmailService.sendTickets(
                                currentTransaction.user.email,
                                existingTickets,
                                currentTransaction.event
                            );
                        } else {
                             console.warn(`Tx #${id} is PAID but no tickets found to send.`);
                        }
                    }
                }
            }
        }
    } catch (emailError) {
        console.error(`Failed to send email for Tx #${id} after status update:`, emailError);
    }


    // --- Step 4: Fetch the final state to return to the API ---
    finalUpdatedTransaction = await prisma.transaction.findUnique({
        where: { id: id },
        include: {
            event: true,
            user: true,
            tickets: true, // Include tickets in the final result
        },
    });

    return finalUpdatedTransaction;
  }

  private static async createTicketsForTransaction(
    transactionId: number,
    txClient: TransactionClient
  ): Promise<Ticket[]> { // Return created tickets
    const existingTicketsCount = await txClient.ticket.count({
      where: { transactionId }
    });

    if (existingTicketsCount > 0) {
       console.log(`Tickets already exist for Tx #${transactionId}`);
      // Return existing tickets if needed, or empty if only new ones matter
      return txClient.ticket.findMany({ where: { transactionId } });
    }

    const transaction = await txClient.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found during ticket creation`);
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

    // After createMany, fetch the tickets that were just created to return them
    const createdTickets = await txClient.ticket.findMany({
        where: {
            transactionId: transactionId,
            // TODO add serialCode filter 
            // serialCode: { in: ticketsToCreateData.map(t => t.serialCode) }
        }
    });
    console.log(`Successfully created and fetched ${createdTickets.length} tickets for Tx #${transactionId}`);
    return createdTickets;
  }
}
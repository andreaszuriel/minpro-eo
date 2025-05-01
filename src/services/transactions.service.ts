import { prisma } from "@/lib/prisma";
import { Prisma, TransactionStatus, PrismaClient } from "@prisma/client";
import { generateUniqueSerialCode } from "@/lib/utils";

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
  
    // TODO: hook to real email-sending logic here.
    // e.g. await EmailService.sendTickets(tx.user.email, tx.tickets);
  
    // For mocks just console log
    console.log(`Resending ${tx.tickets.length} tickets for transaction #${id}`);
  
    return;
  }
    // Get a transaction by ID with related data
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
   
  // Get transactions by organizer ID
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
   // Create a new transaction
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
      
      return result;
    });
  }
 // Update a transaction status and handle related logic 
  static async updateTransactionStatus(
    id: number, 
    status: TransactionStatus, 
    updateData: Partial<Prisma.TransactionUpdateInput> = {}
  ) {
    return prisma.$transaction(async (tx) => {
      // Get current transaction
      const currentTransaction = await tx.transaction.findUnique({
        where: { id },
      });
      
      if (!currentTransaction) {
        throw new Error("Transaction not found");
      }
      
      // Check if payment deadline has passed
      if (status === "PAID" && 
          currentTransaction.paymentDeadline < new Date() && 
          currentTransaction.status !== "PAID") {
        throw new Error("Payment deadline has passed");
      }
      
      // Update transaction
      const transaction = await tx.transaction.update({
        where: { id },
        data: {
          ...updateData,
          status,
        },
      });
      
      // Handle status-specific logic
      if (status === "PAID" && currentTransaction.status !== "PAID") {
        await this.createTicketsForTransaction(id, tx);
      }
      
      // Get the complete updated transaction with tickets
      const result = await tx.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          event: true,
          user: true,
          tickets: true,
        },
      });
      
      return result;
    });
  }
 
  // Create tickets for a transaction
 private static async createTicketsForTransaction(
    transactionId: number, 
    txClient: TransactionClient
  ) {
    // Check if tickets already exist
    const existingTickets = await txClient.ticket.count({
      where: { transactionId }
    });
    
    if (existingTickets > 0) {
      return; // Tickets already created
    }
    
    const transaction = await txClient.transaction.findUnique({
      where: { id: transactionId },
    });
    
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    
    // Create tickets
    const ticketsToCreate = Array.from({ length: transaction.ticketQuantity }).map(() => ({
      serialCode: generateUniqueSerialCode(),
      userId: transaction.userId,
      eventId: transaction.eventId,
      transactionId: transaction.id,
      tierType: transaction.tierType,
      isUsed: false,
    }));
    
    await txClient.ticket.createMany({
      data: ticketsToCreate
    });
  }
}
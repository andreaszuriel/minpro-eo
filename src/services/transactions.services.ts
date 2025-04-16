import { PrismaClient, Transaction } from '@prisma/client';
import { TransactionInput } from '../models/interface';

const prisma = new PrismaClient();

export class TransactionService {
  public async createTransaction(data: TransactionInput, userId: number): Promise<Transaction> {
    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new Error("Event not found");
    if (event.seats < data.ticketQuantity) throw new Error("Not enough seats available");

// (ex) finalPrice is calculated by multiplying the base price by the number of tickets
// Note: The Event model in Prisma now has a price field that is JSON, 
// for simplicity, let's assume it's a number (adjust according to your needs)
    const finalPrice = Number(event.price) * data.ticketQuantity;

    const transaction = await prisma.$transaction(async (prisma) => {
      const txn = await prisma.transaction.create({
        data: {
          user: { connect: { id: userId } },
          event: { connect: { id: data.eventId } },
          ticketQuantity: data.ticketQuantity,
          finalPrice: finalPrice,
          status: "waiting for payment"
        }
      });
      await prisma.event.update({
        where: { id: data.eventId },
        data: { seats: event.seats - data.ticketQuantity }
      });
      return txn;
    });
    return transaction;
  }

  public async getTransactionById(id: number) {
    return await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        event: true
      }
    });
  }

  public async updateTransactionStatus(id: number, status: string, paymentProof?: string) {
    return await prisma.transaction.update({
      where: { id },
      data: {
        status,
        paymentProof: paymentProof || undefined
      }
    });
  }
}

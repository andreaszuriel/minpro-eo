import { NextRequest } from "next/server";
import { TransactionService } from "@/services/transactions.service";
import { ApiError, isValidStatus } from "@/lib/utils";
import { Prisma } from "@prisma/client";

// Error handling wrapper for API routes
 
const handleApiRoute = async (req: NextRequest, handler: () => Promise<Response>) => {
  try {
    return await handler();
  } catch (error) {
    console.error("API Error:", error);
    
    if (error instanceof ApiError) {
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: error.statusCode }
      );
    } else if (error instanceof Error) {
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 400 }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }), 
      { status: 500 }
    );
  }
};

export async function GET(req: NextRequest) {
  return handleApiRoute(req, async () => {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      throw new ApiError("Missing userId", 400);
    }

    const transactions = await TransactionService.getOrganizerTransactions(userId);

    return new Response(JSON.stringify({ transactions }), { status: 200 });
  });
}

export async function POST(req: NextRequest) {
  return handleApiRoute(req, async () => {
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = [
      'userId', 'eventId', 'ticketQuantity', 
      'finalPrice', 'basePrice', 'paymentDeadline', 'tierType'
    ];
    
    for (const field of requiredFields) {
      if (data[field] === undefined) {
        throw new ApiError(`Missing required field: ${field}`, 400);
      }
    }
    
    // Validate status if provided
    if (data.status && !isValidStatus(data.status)) {
      throw new ApiError("Invalid transaction status", 400);
    }
    
    // Prepare transaction data
    const transactionData: Prisma.TransactionCreateInput = {
      ticketQuantity: data.ticketQuantity,
      finalPrice: data.finalPrice,
      basePrice: data.basePrice,
      couponDiscount: data.couponDiscount || 0,
      paymentDeadline: new Date(data.paymentDeadline),
      pointsUsed: data.pointsUsed || 0,
      tierType: data.tierType,
      status: (data.status || 'PENDING') as any,
      user: { connect: { id: data.userId } },
      event: { connect: { id: data.eventId } },
    };
    
    // Optional fields
    if (data.paymentProof) transactionData.paymentProof = data.paymentProof;
    if (data.ticketUrl) transactionData.ticketUrl = data.ticketUrl;
    if (data.voucherUrl) transactionData.voucherUrl = data.voucherUrl;
    
    const transaction = await TransactionService.createTransaction(transactionData);

    return new Response(JSON.stringify({ transaction }), { status: 201 });
  });
}
import { NextRequest } from "next/server";
import { TransactionService } from "@/services/transactions.service";
import { ApiError, isValidStatus } from "@/lib/utils";
import { TransactionStatus } from "@prisma/client";

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
    }
    
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }), 
      { status: 500 }
    );
  }
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiRoute(req, async () => {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      throw new ApiError("Invalid transaction ID", 400);
    }

    const transaction = await TransactionService.getTransactionById(id);

    if (!transaction) {
      throw new ApiError("Transaction not found", 404);
    }

    return new Response(JSON.stringify({ transaction }), { status: 200 });
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiRoute(req, async () => {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      throw new ApiError("Invalid transaction ID", 400);
    }

    const data = await req.json();
    
    // Validate status
    if (!isValidStatus(data.status)) {
      throw new ApiError("Invalid transaction status", 400);
    }
    
    // Update data object with optional fields
    const updateData: Record<string, any> = {};
    
    if (data.paymentProof) updateData.paymentProof = data.paymentProof;
    if (data.ticketUrl) updateData.ticketUrl = data.ticketUrl;
    if (data.voucherUrl) updateData.voucherUrl = data.voucherUrl;
    
    const transaction = await TransactionService.updateTransactionStatus(
      id, 
      data.status as TransactionStatus,
      updateData
    );

    return new Response(JSON.stringify({ transaction }), { status: 200 });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiRoute(req, async () => {
    const id = parseInt((await params).id);
    if (isNaN(id)) throw new ApiError("Invalid transaction ID", 400);

    const { status, ...updateData } = await req.json();
    if (!isValidStatus(status)) throw new ApiError("Invalid status", 400);

    const transaction = await TransactionService.updateTransactionStatus(
      id,
      status,
      updateData
    );
    return new Response(JSON.stringify({ transaction }), { status: 200 });
  });
}
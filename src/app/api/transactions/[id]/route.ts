import { NextRequest } from "next/server";
import { TransactionService } from "@/services/transactions.service";
import { ApiError, isValidStatus } from "@/lib/utils";
import { TransactionStatus, Prisma } from "@prisma/client"; 

// Error handling wrapper 
const handleApiRoute = async (req: NextRequest, handler: () => Promise<Response>) => {
  try {
    return await handler();
  } catch (error) {
    console.error("API Error in transaction/[id]:", error); 

    if (error instanceof ApiError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.statusCode }
      );
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      // Handle specific Prisma error for record not found
      return new Response(
        JSON.stringify({ error: "Transaction not found" }),
        { status: 404 }
      );
    } else if (error instanceof Error) {
       return new Response(
         JSON.stringify({ error: "Invalid request or data." }),
         { status: 400 }
       );
    }

    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
};

// --- GET Handler ---
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } } 
) {
  const transactionIdStr = params.id;

  return handleApiRoute(req, async () => {
    const id = parseInt(transactionIdStr);
   
    if (isNaN(id)) {
      throw new ApiError("Invalid transaction ID format", 400);
    }

    console.log(`GET /api/transactions/${id} - Fetching transaction`); 
    const transaction = await TransactionService.getTransactionById(id);

    if (!transaction) {
      console.log(`GET /api/transactions/${id} - Transaction not found`); 
      throw new ApiError("Transaction not found", 404);
    }
    console.log(`GET /api/transactions/${id} - Found transaction:`, transaction.status, transaction.paymentDeadline);

    return new Response(JSON.stringify(transaction), { status: 200 });
  });
}

// --- PUT Handler ---
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } } 
) {
  const transactionIdStr = params.id;

  return handleApiRoute(req, async () => {
    const data = await req.json();
    const id = parseInt(transactionIdStr);
    if (isNaN(id)) {
      throw new ApiError("Invalid transaction ID format", 400);
    }

    // Validate status if present
    if (data.status && !isValidStatus(data.status)) {
      throw new ApiError("Invalid transaction status provided", 400);
    }

    // Prepare update data 
    const updateData: Partial<Prisma.TransactionUpdateInput> = {};
    if (data.paymentProof) updateData.paymentProof = data.paymentProof;
    if (data.ticketUrl) updateData.ticketUrl = data.ticketUrl;
    if (data.voucherUrl) updateData.voucherUrl = data.voucherUrl;
    // Add other updatable fields as needed

    if(!data.status) {
        throw new ApiError("Status is required for PUT operation", 400);
    }

    console.log(`PUT /api/transactions/${id} - Updating status to ${data.status} with data:`, updateData);

    const transaction = await TransactionService.updateTransactionStatus(
      id,
      data.status as TransactionStatus, 
      updateData
    );

    return new Response(JSON.stringify(transaction), { status: 200 });
  });
}

// --- PATCH Handler  ---
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } } 
) {
  const transactionIdStr = params.id;

  return handleApiRoute(req, async () => {
    const data = await req.json();
    const id = parseInt(transactionIdStr);

    if (isNaN(id)) {
      throw new ApiError("Invalid transaction ID format", 400);
    }

    // Validate status if provided
    if (data.status && !isValidStatus(data.status)) {
        throw new ApiError("Invalid transaction status provided", 400);
    }

    // Prepare update data - only include fields provided in the request
    const updateData: Partial<Prisma.TransactionUpdateInput> = {};
    if (data.paymentProof !== undefined) updateData.paymentProof = data.paymentProof;
    if (data.ticketUrl !== undefined) updateData.ticketUrl = data.ticketUrl;
    if (data.voucherUrl !== undefined) updateData.voucherUrl = data.voucherUrl;
    // Add other fields 

    // Determine the status to update TO 
    const newStatus = data.status as TransactionStatus | undefined;

    let statusToUpdate: TransactionStatus | undefined = undefined;
    if (newStatus) {
        statusToUpdate = newStatus;
    } else {
        if (Object.keys(updateData).length === 0 && !newStatus) {
            throw new ApiError("No fields provided to update.", 400);
        }
        
        if (!newStatus) {
            throw new ApiError("Status update is required for PATCH via this method.", 400);
        }
        statusToUpdate = newStatus;
    }

    console.log(`PATCH /api/transactions/${id} - Patching status to ${statusToUpdate} with data:`, updateData);
   
    const transaction = await TransactionService.updateTransactionStatus(
        id,
        statusToUpdate, 
        updateData      
    );

    return new Response(JSON.stringify(transaction), { status: 200 });
  });
}

// --- POST Handler - endpoint to resend tickets
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const transactionIdStr = params.id;

  return handleApiRoute(req, async () => {
    const id = parseInt(transactionIdStr);
    if (isNaN(id)) {
      throw new ApiError("Invalid transaction ID format", 400);
    }

    const data = await req.json();
    const { action } = data;

    // Only support the resend_tickets action for now
    if (action === 'resend_tickets') {
      await TransactionService.resendTickets(id);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    throw new ApiError("Unsupported action", 400);
  });
}
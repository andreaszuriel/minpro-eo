import { NextRequest, NextResponse } from "next/server"; // NextResponse for more structured responses
import { TransactionService } from "@/services/transactions.service";
import { ApiError, isValidStatus } from "@/lib/utils";
import { TransactionStatus, Prisma, Transaction } from "@prisma/client"; // Import Transaction type
import { auth } from '@/auth'; // Make sure this path is correct for your auth setup

// Error handling wrapper (no changes needed here if it works for you)
const handleApiRoute = async (req: NextRequest, handler: () => Promise<Response>) => {
  try {
    return await handler();
  } catch (error) {
    console.error("API Error in transaction/[id]:", error);

    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    } else if (error instanceof Error && (error.message.includes("Invalid") || error.message.includes("required"))) {
       return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

// Helper to fetch transaction and check ownership
// Ensures Transaction type is returned which includes userId
async function getTransactionAndVerifyOwnership(transactionId: number, currentUserId: string): Promise<Transaction> {
    const transaction = await TransactionService.getTransactionById(transactionId);
    if (!transaction) {
        console.log(`API /transactions/${transactionId} - Transaction not found for ownership check.`);
        throw new ApiError("Transaction not found", 404);
    }
    if (transaction.userId !== currentUserId) {
        console.warn(`API /transactions/${transactionId} - Forbidden access attempt by user ${currentUserId}. Transaction owned by ${transaction.userId}`);
        throw new ApiError("Forbidden. You do not have permission to access this transaction.", 403);
    }
    return transaction; // transaction here is of type Transaction | null, but we've checked null
}


// --- GET Handler ---
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const transactionIdStr = params.id;

  return handleApiRoute(req, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError("Unauthorized. Please sign in.", 401);
    }
    const currentUserId = session.user.id;

    const id = parseInt(transactionIdStr);
    if (isNaN(id)) {
      throw new ApiError("Invalid transaction ID format", 400);
    }

    console.log(`GET /api/transactions/${id} - Attempting to fetch for user ${currentUserId}`);
    // getTransactionAndVerifyOwnership will fetch and check ownership
    const transaction = await getTransactionAndVerifyOwnership(id, currentUserId);

    console.log(`GET /api/transactions/${id} - Successfully fetched for user ${currentUserId}:`, transaction.status, transaction.paymentDeadline);
    return NextResponse.json(transaction, { status: 200 });
  });
}

// --- PUT Handler ---
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const transactionIdStr = params.id;

  return handleApiRoute(req, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError("Unauthorized. Please sign in.", 401);
    }
    const currentUserId = session.user.id;

    const data = await req.json();
    const id = parseInt(transactionIdStr);
    if (isNaN(id)) {
      throw new ApiError("Invalid transaction ID format", 400);
    }

    // Fetch and verify ownership BEFORE proceeding with the update
    await getTransactionAndVerifyOwnership(id, currentUserId);

    if (data.status && !isValidStatus(data.status)) {
      throw new ApiError("Invalid transaction status provided", 400);
    }

    const updateData: Partial<Prisma.TransactionUpdateInput> = {};
    if (data.paymentProof) updateData.paymentProof = data.paymentProof;
    if (data.ticketUrl) updateData.ticketUrl = data.ticketUrl;
    if (data.voucherUrl) updateData.voucherUrl = data.voucherUrl;

    if(!data.status) {
        throw new ApiError("Status is required for PUT operation", 400);
    }

    console.log(`PUT /api/transactions/${id} - User ${currentUserId} updating status to ${data.status} with data:`, updateData);
    const updatedTransaction = await TransactionService.updateTransactionStatus(
      id,
      data.status as TransactionStatus,
      updateData
    );

    return NextResponse.json(updatedTransaction, { status: 200 });
  });
}

// --- PATCH Handler  ---
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const transactionIdStr = params.id;

  return handleApiRoute(req, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError("Unauthorized. Please sign in.", 401);
    }
    const currentUserId = session.user.id;

    const data = await req.json();
    const id = parseInt(transactionIdStr);
    if (isNaN(id)) {
      throw new ApiError("Invalid transaction ID format", 400);
    }

    // Fetch and verify ownership BEFORE proceeding with the patch
    const existingTransaction = await getTransactionAndVerifyOwnership(id, currentUserId);

    if (data.status && !isValidStatus(data.status)) {
        throw new ApiError("Invalid transaction status provided", 400);
    }

    const updateData: Partial<Prisma.TransactionUpdateInput> = {};
    if (data.paymentProof !== undefined) updateData.paymentProof = data.paymentProof;
    if (data.ticketUrl !== undefined) updateData.ticketUrl = data.ticketUrl;
    if (data.voucherUrl !== undefined) updateData.voucherUrl = data.voucherUrl;

    const newStatus = data.status as TransactionStatus | undefined;

    if (Object.keys(updateData).length === 0 && !newStatus) {
        throw new ApiError("No fields or status provided to update.", 400);
    }

    if (!newStatus) {
        throw new ApiError("Status is required for this PATCH operation.", 400);
    }
    const statusToUpdate = newStatus;


    console.log(`PATCH /api/transactions/${id} - User ${currentUserId} patching status to ${statusToUpdate} with data:`, updateData);
    const updatedTransaction = await TransactionService.updateTransactionStatus(
        id,
        statusToUpdate, // statusToUpdate is now guaranteed TransactionStatus
        updateData
    );

    return NextResponse.json(updatedTransaction, { status: 200 });
  });
}

// --- POST Handler - endpoint to resend tickets
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const transactionIdStr = params.id;

  return handleApiRoute(req, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError("Unauthorized. Please sign in.", 401);
    }
    const currentUserId = session.user.id;

    const id = parseInt(transactionIdStr);
    if (isNaN(id)) {
      throw new ApiError("Invalid transaction ID format", 400);
    }

    const data = await req.json();
    const { action } = data;

    // Fetch and verify ownership BEFORE resending tickets
    const transaction = await getTransactionAndVerifyOwnership(id, currentUserId);

    if (action === 'resend_tickets') {
      // TODO: Add further checks like if transaction.status === 'PAID'
      if (transaction.status !== 'PAID') {
          throw new ApiError("Cannot resend tickets for transactions not in PAID status.", 400);
      }
      console.log(`POST /api/transactions/${id} - User ${currentUserId} resending tickets`);
      await TransactionService.resendTickets(id);
      return NextResponse.json({ success: true, message: "Ticket resend request processed." }, { status: 200 });
    }

    throw new ApiError("Unsupported action", 400);
  });
}
import { NextRequest, NextResponse } from "next/server";
import { TransactionService } from "@/services/transactions.service";
import { ApiError, isValidStatus } from "@/lib/utils";
import { TransactionStatus, Prisma, UserRole } from "@prisma/client"; 
import { auth } from '@/auth';

// Define the expected shape of the transaction when fully loaded with relations
type TransactionWithDetails = Prisma.TransactionGetPayload<{
  include: {
    event: true;
    user: true;
    tickets: true;
    promotion: true;
  };
}>;

// Define the shape of the current user object we expect from the session
interface CurrentUser {
  id: string;
  role: UserRole;
  isAdmin: boolean; 
}

// Error handling wrapper 
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
async function getTransactionAndVerifyOwnership(
  transactionId: number,
  currentUser: CurrentUser 
): Promise<TransactionWithDetails> {
  const transaction = await TransactionService.getTransactionById(transactionId);

  if (!transaction) {
    console.log(`API /transactions/${transactionId} - Transaction not found for ownership check.`);
    throw new ApiError("Transaction not found", 404);
  }

  if (currentUser.isAdmin) {
    console.log(`API /transactions/${transactionId} - Admin access granted for user ${currentUser.id}.`);
    return transaction;
  }

  if (transaction.userId === currentUser.id) {
    console.log(`API /transactions/${transactionId} - Buyer access granted for user ${currentUser.id}.`);
    return transaction;
  }

  if (
    transaction.event &&
    currentUser.role === UserRole.organizer &&
    transaction.event.organizerId === currentUser.id
  ) {
    console.log(`API /transactions/${transactionId} - Organizer access granted for user ${currentUser.id}. Event organizer: ${transaction.event.organizerId}`);
    return transaction;
  }

  console.warn(
    `API /transactions/${transactionId} - Forbidden access attempt by user ${currentUser.id} (Role: ${currentUser.role}). Transaction owned by (buyer) ${transaction.userId}, Event organized by ${transaction.event?.organizerId || 'N/A'}`
  );
  throw new ApiError(
    "Forbidden. You do not have permission to access this transaction.",
    403
  );
}

// Helper to get and validate current user from session
async function getCurrentUserFromSession(): Promise<CurrentUser> {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.role) {
    throw new ApiError("Unauthorized. User ID or role missing in session.", 401);
  }
  return {
    id: session.user.id,
    role: session.user.role as UserRole, // Cast if necessary, ensure it's UserRole type in session
    isAdmin: session.user.isAdmin || false, // Default isAdmin to false if not present
  };
}

// --- GET Handler ---
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const transactionIdStr = params.id;

  return handleApiRoute(req, async () => {
    const currentUser = await getCurrentUserFromSession();

    const id = parseInt(transactionIdStr);
    if (isNaN(id)) {
      throw new ApiError("Invalid transaction ID format", 400);
    }

    console.log(`GET /api/transactions/${id} - Attempting to fetch for user ${currentUser.id} (Role: ${currentUser.role})`);
    const transaction = await getTransactionAndVerifyOwnership(id, currentUser);

    console.log(`GET /api/transactions/${id} - Successfully fetched for user ${currentUser.id}: Status ${transaction.status}, Deadline ${transaction.paymentDeadline}`);
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
    const currentUser = await getCurrentUserFromSession();
    const data = await req.json();

    const id = parseInt(transactionIdStr);
    if (isNaN(id)) {
      throw new ApiError("Invalid transaction ID format", 400);
    }

    // Fetch and verify ownership BEFORE proceeding with the update
    await getTransactionAndVerifyOwnership(id, currentUser);

    if (data.status && !isValidStatus(data.status)) {
      throw new ApiError("Invalid transaction status provided", 400);
    }

    const updateData: Partial<Prisma.TransactionUpdateInput> = {};
    if (data.paymentProof) updateData.paymentProof = data.paymentProof;
    if (data.ticketUrl) updateData.ticketUrl = data.ticketUrl;
    if (data.voucherUrl) updateData.voucherUrl = data.voucherUrl;

    if (!data.status) { 
        throw new ApiError("Status is required for PUT operation", 400);
    }

    console.log(`PUT /api/transactions/${id} - User ${currentUser.id} (Role: ${currentUser.role}) updating status to ${data.status} with data:`, updateData);
    const updatedTransaction = await TransactionService.updateTransactionStatus(
      id,
      data.status as TransactionStatus,
      updateData
    );

    return NextResponse.json(updatedTransaction, { status: 200 });
  });
}

// --- PATCH Handler ---
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const transactionIdStr = params.id;

  return handleApiRoute(req, async () => {
    const currentUser = await getCurrentUserFromSession();
    const data = await req.json();

    const id = parseInt(transactionIdStr);
    if (isNaN(id)) {
      throw new ApiError("Invalid transaction ID format", 400);
    }

    const existingTransaction = await getTransactionAndVerifyOwnership(id, currentUser);

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

    console.log(`PATCH /api/transactions/${id} - User ${currentUser.id} (Role: ${currentUser.role}) patching status to ${statusToUpdate} with data:`, updateData);
    const updatedTransaction = await TransactionService.updateTransactionStatus(
        id,
        statusToUpdate,
        updateData
    );

    return NextResponse.json(updatedTransaction, { status: 200 });
  });
}

// --- POST Handler - endpoint to resend tickets ---
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const transactionIdStr = params.id;

  return handleApiRoute(req, async () => {
    const currentUser = await getCurrentUserFromSession();
    const data = await req.json();
    const { action } = data;

    const id = parseInt(transactionIdStr);
    if (isNaN(id)) {
      throw new ApiError("Invalid transaction ID format", 400);
    }

    const transaction = await getTransactionAndVerifyOwnership(id, currentUser);

    if (action === 'resend_tickets') {
      if (transaction.status !== TransactionStatus.PAID) { // Use enum for status check
          throw new ApiError("Cannot resend tickets for transactions not in PAID status.", 400);
      }

      console.log(`POST /api/transactions/${id} - User ${currentUser.id} (Role: ${currentUser.role}) resending tickets`);
      await TransactionService.resendTickets(id);
      return NextResponse.json({ success: true, message: "Ticket resend request processed." }, { status: 200 });
    }

    throw new ApiError("Unsupported action", 400);
  });
}
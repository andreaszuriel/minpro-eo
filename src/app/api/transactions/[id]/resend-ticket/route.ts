import { NextRequest } from "next/server";
import { TransactionService } from "@/services/transactions.service";
import { ApiError } from "@/lib/utils";
import { auth } from "@/auth"; 

// Admin-only actions for transactions
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session using the auth() function instead of getServerSession
    const session = await auth();
    
    // Check if user exists and has required permissions
    if (!session || !session.user || (!session.user.isAdmin && session.user.role !== 'organizer')) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403 }
      );
    }

    const transactionId = parseInt(params.id);
    if (isNaN(transactionId)) {
      throw new ApiError("Invalid transaction ID format", 400);
    }

    // Parse request body
    const data = await req.json();
    const { action } = data;

    if (!action) {
      throw new ApiError("Missing action parameter", 400);
    }

    // Handle different actions
    switch (action) {
      case "resend_tickets":
        await TransactionService.resendTickets(transactionId);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Ticket emails have been resent" 
          }),
          { status: 200 }
        );

      // Add other admin actions as needed
      
      default:
        throw new ApiError(`Unsupported action: ${action}`, 400);
    }
  } catch (error) {
    console.error("Admin transaction action error:", error);
    
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
}
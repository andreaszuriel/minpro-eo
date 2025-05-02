import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/services/transactions.service'; 
import { ApiError } from '@/lib/utils'; 

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id; 


  if (!userId) {
    console.error("API route error: User ID (derived from params.id) is missing. Params received:", params);
    return NextResponse.json({ error: 'Missing user ID parameter in URL' }, { status: 400 });
  }

  try {
    console.log(`GET /api/user/${userId}/tickets - Fetching transactions for user`);
    const transactions = await TransactionService.getCustomerTransactions(userId);
    console.log(`GET /api/user/${userId}/tickets - Found ${transactions.length} transactions for user ${userId}`);
    return NextResponse.json({ transactions }, { status: 200 });

  } catch (error) {
    console.error(`Error fetching tickets for user ${userId}:`, error);

    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    } else if (error instanceof Error) {
      return NextResponse.json({ error: "Failed to fetch tickets." }, { status: 500 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
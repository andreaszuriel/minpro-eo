import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/services/transactions.service';
import { ApiError } from '@/lib/utils';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      throw new ApiError('Invalid transaction ID', 400);
    }

    // Service method you’ll implement to re-send the tickets
    await TransactionService.resendTickets(id);

    return NextResponse.json(
      { message: `Ticket for transaction #${id} has been resent.` },
      { status: 200 }
    );
  } catch (err) {
    console.error('Resend Ticket Error:', err);

    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    return NextResponse.json(
      { error: 'Failed to resend ticket' },
      { status: 500 }
    );
  }
}

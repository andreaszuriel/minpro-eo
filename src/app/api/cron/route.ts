import { NextRequest, NextResponse } from 'next/server';
import { expirePendingTransactions } from '@/lib/jobs/expirePendingTransactions';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  await expirePendingTransactions();
  return NextResponse.json({ ok: true });
}

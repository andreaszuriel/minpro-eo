import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth'; // Corrected: Use auth from Auth.js v5

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await auth(); // Corrected

  // @ts-ignore
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { userId } = params;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: user.emailVerified ? null : new Date(),
      },
    });
    return NextResponse.json({ message: `User email ${updatedUser.emailVerified ? 'verified' : 'unverified'}`, user: updatedUser });
  } catch (error) {
    console.error(`Error toggling verification for user ${userId}:`, error);
    return NextResponse.json({ error: 'Failed to toggle email verification' }, { status: 500 });
  }
}
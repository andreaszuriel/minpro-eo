import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserRole } from '@prisma/client';
import { auth } from '@/auth'; 

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth(); 

  // @ts-ignore
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id: userId } = params;
  const body = await req.json();
  const { points, description, expiresInDays } = body;

  if (typeof points !== 'number' || points === 0) {
    return NextResponse.json({ error: 'Invalid points amount' }, { status: 400 });
  }
  if (!description || typeof description !== 'string' || description.trim() === '') {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }
  if (expiresInDays !== undefined && (typeof expiresInDays !== 'number' || expiresInDays <= 0)) {
      return NextResponse.json({ error: 'Invalid expiresInDays value' }, { status: 400 });
  }
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 365));


  try {
    const [_, newPointTransaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          points: {
            increment: points,
          },
        },
      }),
      prisma.pointTransaction.create({
        data: {
          userId,
          points,
          description,
          expiresAt,
        },
      }),
    ]);

    return NextResponse.json({ message: 'Points updated successfully', transaction: newPointTransaction }, { status: 201 });
  } catch (error) {
    console.error(`Error updating points for user ${userId}:`, error);
    return NextResponse.json({ error: 'Failed to update points' }, { status: 500 });
  }
}
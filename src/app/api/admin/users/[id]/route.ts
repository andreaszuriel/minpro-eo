import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserRole } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) { // Changed userId to id here
  const session = await auth();

  // @ts-ignore
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id: userId } = params; 

  if (!userId) { 
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        pointTransactions: { orderBy: { createdAt: 'desc' }, take: 20 },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            event: { select: { id: true, title: true, startDate: true } },
          },
        },
        _count: {
          select: { events: true }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    let referredUsersList: { id: string; name: string | null; email: string; createdAt: Date; }[] = [];
    if (user.referralCode) {
        referredUsersList = await prisma.user.findMany({
            where: { referredBy: user.referralCode },
            select: { id: true, name: true, email: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
    }
    
    let referrerInfo = null;
    if (user.referredBy) {
        referrerInfo = await prisma.user.findFirst({
            where: { referralCode: user.referredBy },
            select: { id: true, name: true, email: true, referralCode: true }
        });
    }

    return NextResponse.json({ ...user, referredUsers: referredUsersList, referrerInfo });
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) { 
    const session = await auth();
  
    // @ts-ignore
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  
    const { id: userId } = params; 
    const body = await req.json();
    const { name, role, isAdmin } = body;
  
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : undefined,
        role: role as UserRole,
        isAdmin: isAdmin,
      },
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
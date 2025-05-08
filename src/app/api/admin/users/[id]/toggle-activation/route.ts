import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserRole } from '@prisma/client';
import { auth } from '@/auth'; 

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth(); 

  // @ts-ignore
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id: userId } = params;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // @ts-ignore isActive may not be on Prisma.User type if not added
    const newIsActiveState = !user.isActive; 

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: newIsActiveState,
        ...(newIsActiveState === false && user.isAdmin ? { isAdmin: false } : {})
      },
    });
    // @ts-ignore
    return NextResponse.json({ message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'}`, user: updatedUser });
  } catch (error) {
    console.error(`Error toggling activation for user ${userId}:`, error);
    // @ts-ignore
    if (error.message.includes("Invalid `prisma.user.update()` invocation") && error.message.includes("isActive")) {
        return NextResponse.json({ error: "Failed to toggle activation. The 'isActive' field might be missing from the User model in your Prisma schema." }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to toggle user activation' }, { status: 500 });
  }
}
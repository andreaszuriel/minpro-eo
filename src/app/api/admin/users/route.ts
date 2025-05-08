import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client'; 
import { auth } from '@/auth';

const prisma = new PrismaClient();
const ITEMS_PER_PAGE = 10;

export async function GET(req: NextRequest) {
  const session = await auth();

  // @ts-ignore next-auth User type might not have isAdmin by default
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const searchQuery = searchParams.get('search') || '';

  const skip = (page - 1) * ITEMS_PER_PAGE;

  try {
    const whereCondition: Prisma.UserWhereInput = {}; // Start with an empty object

    if (searchQuery) {
      whereCondition.OR = [ // Add OR condition if searchQuery exists
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
        { referralCode: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined, // Pass undefined if no conditions
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isAdmin: true,
        points: true,
        createdAt: true,
        emailVerified: true,
        referralCode: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: ITEMS_PER_PAGE,
    });

    const totalUsers = await prisma.user.count({ 
        where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined 
    });
    const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

    return NextResponse.json({
      users,
      totalPages,
      currentPage: page,
      totalUsers,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
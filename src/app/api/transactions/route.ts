 
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        event: {
          organizerId: userId,
        },
      },
      include: {
        event: true,
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return new Response(JSON.stringify({ transactions }), { status: 200 });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
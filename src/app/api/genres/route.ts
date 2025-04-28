import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ genres }, { status: 200 });
  } catch (error) {
    console.error("Error fetching genres:", error);
    return NextResponse.json({ error: "Internal Server Error fetching genres" }, { status: 500 });
  }
}
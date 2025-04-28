import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ countries }, { status: 200 });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json({ error: "Internal Server Error fetching countries" }, { status: 500 });
  }
}
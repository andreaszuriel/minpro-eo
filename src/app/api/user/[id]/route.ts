import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the specific user by ID from the database via Prisma
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        referralCode: true,
        role: true, // Include the role field
        image: true, // Optionally include image if needed
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
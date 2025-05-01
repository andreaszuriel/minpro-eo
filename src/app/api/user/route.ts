
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth"; // Assuming this is your NextAuth setup

export async function GET(request: NextRequest) {
  try {
    // 1. Check if user is authenticated (adjust logic if needed, maybe only admins can list all users?)
    // const session = await auth();
    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // 2. Fetch all users from the database
    const users = await prisma.user.findMany({
      select: { // Select only the necessary fields, similar to your [id] route
        id: true,
        name: true,
        email: true,
        createdAt: true,
        referralCode: true,
        role: true,
        image: true,
      },

    });

    // 3. Return the list of users
    return NextResponse.json(users);

  } catch (error) {
    // 4. Handle potential errors
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
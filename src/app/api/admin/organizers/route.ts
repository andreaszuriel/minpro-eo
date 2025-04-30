import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { saltAndHashPassword } from "@/utils/password"; 
import { UserRole } from "@prisma/client"; 

// Helper function for admin check
async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return !!session?.user?.isAdmin;
}

// GET all organizers
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const organizers = await prisma.user.findMany({
      where: { role: UserRole.organizer }, 
      select: {
        id: true,
        name: true,
        email: true,
        image: true, // Include image for Avatar
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(organizers);
  } catch (error) {
    console.error("Error fetching organizers:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizers" },
      { status: 500 }
    );
  }
}

// POST a new organizer
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 } // Conflict
      );
    }

    const hashedPassword = await saltAndHashPassword(password);

    const newOrganizer = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: UserRole.organizer, // Set role to organizer
        isAdmin: false, // Organizers are not admins by default
        // TODO: SetemailVerified to be false initially, or true if admin creates it
        emailVerified: new Date(), 
      },
       select: { // Select only non-sensitive data to return
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newOrganizer, { status: 201 });
  } catch (error) {
    console.error("Error creating organizer:", error);
    // Add more specific error handling (e.g., Prisma validation errors) if needed
    return NextResponse.json(
      { error: "Failed to create organizer" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth"; // Import auth

// Helper function for admin check 
async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return !!session?.user?.isAdmin;
}

// GET all genres
export async function GET(request: NextRequest) {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: {
        name: 'asc',
      },
      select: { // Select only necessary fields
        id: true,
        name: true,
      }
    });

    // Return the array directly, not nested under a { genres: ... } object
    return NextResponse.json(genres, { status: 200 });
  } catch (error) {
    console.error("Error fetching genres:", error);
    return NextResponse.json({ error: "Internal Server Error fetching genres" }, { status: 500 });
  }
}

// POST a new genre (protected)
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
  }

  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: "Genre name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check if genre name already exists (case-insensitive check recommended)
    const existingGenre = await prisma.genre.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive' // Case-insensitive comparison
        }
      },
    });

    if (existingGenre) {
      return NextResponse.json(
        { error: `Genre "${trimmedName}" already exists` },
        { status: 409 } // Conflict
      );
    }

    // Create the new genre
    const newGenre = await prisma.genre.create({
      data: {
        name: trimmedName, // Store the trimmed name
      },
      select: { // Return the created object
        id: true,
        name: true,
      }
    });

    return NextResponse.json(newGenre, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("Error creating genre:", error);
    // Handle potential Prisma unique constraint errors just in case the check missed something (race condition?)
     if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('name')) {
         return NextResponse.json({ error: "Genre name already exists." }, { status: 409 });
     }
    return NextResponse.json(
      { error: "Failed to create genre" },
      { status: 500 }
    );
  }
}
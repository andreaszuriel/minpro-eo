import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth"; // Import auth

// Helper function for admin check
async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return !!session?.user?.isAdmin;
}

// GET all countries (public)
export async function GET(request: NextRequest) {
  // Keeping GET public as users might need this list
  try {
    const countries = await prisma.country.findMany({
      orderBy: {
        name: 'asc',
      },
      select: { // Select necessary fields
        id: true,
        name: true,
        code: true, // Include country code
      }
    });
    // Return the array directly
    return NextResponse.json(countries, { status: 200 });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json({ error: "Internal Server Error fetching countries" }, { status: 500 });
  }
}

// POST a new country (protected)
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
  }

  try {
    const { name, code } = await request.json();

    // Validate input
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: "Country name is required" }, { status: 400 });
    }
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json({ error: "Country code is required" }, { status: 400 });
    }
    // Basic validation for country code format (e.g., 2 uppercase letters)
     if (!/^[A-Z]{2}$/.test(code.trim())) {
       return NextResponse.json({ error: "Country code must be 2 uppercase letters (e.g., US, GB)" }, { status: 400 });
     }


    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase(); // Standardize to uppercase

    // Check if country name or code already exists 
    const existingCountry = await prisma.country.findFirst({
      where: {
        OR: [
          { name: { equals: trimmedName, mode: 'insensitive' } },
          { code: trimmedCode } 
        ]
      },
    });

    if (existingCountry) {
       const conflictField = existingCountry.code === trimmedCode ? 'code' : 'name';
       const conflictValue = existingCountry.code === trimmedCode ? trimmedCode : trimmedName;
      return NextResponse.json(
        { error: `Country ${conflictField} "${conflictValue}" already exists` },
        { status: 409 } // Conflict
      );
    }

    // Create the new country
    const newCountry = await prisma.country.create({
      data: {
        name: trimmedName,
        code: trimmedCode,
      },
       select: { // Return the created object
        id: true,
        name: true,
        code: true,
      }
    });

    return NextResponse.json(newCountry, { status: 201 }); 
  } catch (error) {
    console.error("Error creating country:", error);
     if ((error as any).code === 'P2002') { // Unique constraint violation
         // Determine which field caused the violation based on the target
         const target = (error as any).meta?.target as string[] | undefined;
         let message = "Country name or code already exists.";
         if (target?.includes('name')) message = "Country name already exists.";
         else if (target?.includes('code')) message = "Country code already exists.";
         return NextResponse.json({ error: message }, { status: 409 });
     }
    return NextResponse.json(
      { error: "Failed to create country" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth"; 

// Helper function for admin check
async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return !!session?.user?.isAdmin;
}

// PUT (Update) a country (protected)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
  }

  const id = parseInt(params.id, 10); // Country ID is Int
  if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid Country ID" }, { status: 400 });
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
     if (!/^[A-Z]{2}$/.test(code.trim())) {
       return NextResponse.json({ error: "Country code must be 2 uppercase letters (e.g., US, GB)" }, { status: 400 });
     }

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase(); // Standardize

    // Check if the country exists
    const existingCountry = await prisma.country.findUnique({
      where: { id },
    });
    if (!existingCountry) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }

    // Check if the *new* name or code already exists for a *different* country
    const conflictingCountry = await prisma.country.findFirst({
        where: {
             AND: [ // Must not be the current country
                 { id: { not: id } }
             ],
             OR: [ // Check for conflicts on name or code
                 { name: { equals: trimmedName, mode: 'insensitive' } },
                 { code: trimmedCode }
             ]
        }
    });

    if (conflictingCountry) {
       const conflictField = conflictingCountry.code === trimmedCode ? 'code' : 'name';
       const conflictValue = conflictingCountry.code === trimmedCode ? trimmedCode : trimmedName;
       return NextResponse.json({ error: `Another country with ${conflictField} "${conflictValue}" already exists` }, { status: 409 });
    }

    // Update the country
    const updatedCountry = await prisma.country.update({
      where: { id },
      data: {
          name: trimmedName,
          code: trimmedCode
      },
       select: { // Return the updated object
        id: true,
        name: true,
        code: true,
      }
    });

    return NextResponse.json(updatedCountry);
  } catch (error) {
    console.error(`Error updating country ${id}:`, error);
     if ((error as any).code === 'P2002') { // Unique constraint violation
         const target = (error as any).meta?.target as string[] | undefined;
         let message = "Country name or code already exists.";
         if (target?.includes('name')) message = "Country name already exists.";
         else if (target?.includes('code')) message = "Country code already exists.";
         return NextResponse.json({ error: message }, { status: 409 });
     }
     if ((error as any).code === 'P2025') { // Record to update not found
        return NextResponse.json({ error: "Country not found" }, { status: 404 });
     }
    return NextResponse.json(
      { error: "Failed to update country" },
      { status: 500 }
    );
  }
}

// DELETE a country (protected)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
  }

  const id = parseInt(params.id, 10); // Country ID is Int
   if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid Country ID" }, { status: 400 });
  }

  try {
    // 1. Check if the country exists
    const country = await prisma.country.findUnique({ where: { id } });
    if (!country) {
        return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }

    // 2. Check if any events are using this country
    const eventsCount = await prisma.event.count({
        where: { countryId: id }
    });

    if (eventsCount > 0) {
        return NextResponse.json(
            { error: `Cannot delete country "${country.name} (${country.code})" because it is associated with ${eventsCount} event(s). Please update or remove the events first.` },
            { status: 400 } // Bad Request - cannot fulfill due to dependencies
        );
    }

    // 3. Delete the country
    await prisma.country.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Country deleted successfully" }, { status: 200 }); // Or 204 No Content
  } catch (error) {
    console.error(`Error deleting country ${id}:`, error);
     if ((error as any).code === 'P2025') { // Record to delete not found
        return NextResponse.json({ error: "Country not found" }, { status: 404 });
     }
     if ((error as any).code === 'P2003') { // Foreign key constraint violation
         return NextResponse.json({ error: "Cannot delete country as it is still referenced by other records." }, { status: 409 });
     }
    return NextResponse.json(
      { error: "Failed to delete country" },
      { status: 500 }
    );
  }
}
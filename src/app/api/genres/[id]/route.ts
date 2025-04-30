import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth"; // Import auth

// Helper function for admin check
async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return !!session?.user?.isAdmin;
}

// PUT (Update) a genre (protected)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
  }

  const id = parseInt(params.id, 10); // Genre ID is Int in schema
  if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid Genre ID" }, { status: 400 });
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

    // Check if the genre exists
    const existingGenre = await prisma.genre.findUnique({
      where: { id },
    });
    if (!existingGenre) {
      return NextResponse.json({ error: "Genre not found" }, { status: 404 });
    }

    // Check if the *new* name already exists for a *different* genre (case-insensitive)
    const conflictingGenre = await prisma.genre.findFirst({
        where: {
            name: {
              equals: trimmedName,
              mode: 'insensitive'
            },
            id: {
                not: id // Exclude the current genre being updated
            }
        }
    });

    if (conflictingGenre) {
        return NextResponse.json({ error: `Genre name "${trimmedName}" already exists` }, { status: 409 });
    }


    // Update the genre
    const updatedGenre = await prisma.genre.update({
      where: { id },
      data: { name: trimmedName },
       select: { // Return the updated object
        id: true,
        name: true,
      }
    });

    return NextResponse.json(updatedGenre);
  } catch (error) {
    console.error(`Error updating genre ${id}:`, error);
     if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('name')) {
         return NextResponse.json({ error: "Genre name already exists." }, { status: 409 });
     }
     if ((error as any).code === 'P2025') { // Record to update not found
        return NextResponse.json({ error: "Genre not found" }, { status: 404 });
     }
    return NextResponse.json(
      { error: "Failed to update genre" },
      { status: 500 }
    );
  }
}

// DELETE a genre (protected)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
  }

  const id = parseInt(params.id, 10); // Genre ID is Int
   if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid Genre ID" }, { status: 400 });
  }

  try {
    // 1. Check if the genre exists
    const genre = await prisma.genre.findUnique({ where: { id } });
    if (!genre) {
        return NextResponse.json({ error: "Genre not found" }, { status: 404 });
    }

    // 2. Check if any events are using this genre
    const eventsCount = await prisma.event.count({
        where: { genreId: id }
    });

    if (eventsCount > 0) {
        return NextResponse.json(
            { error: `Cannot delete genre "${genre.name}" because it is associated with ${eventsCount} event(s). Please update or remove the events first.` },
            { status: 400 } // Bad Request - cannot fulfill due to dependencies
        );
    }

    // 3. Delete the genre
    await prisma.genre.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Genre deleted successfully" }, { status: 200 }); // Or 204 No Content
  } catch (error) {
    console.error(`Error deleting genre ${id}:`, error);
     // Handle potential Prisma errors, e.g., record not found if deleted between check and delete
     if ((error as any).code === 'P2025') { // Record to delete not found
        return NextResponse.json({ error: "Genre not found" }, { status: 404 });
     }
     // Catch potential foreign key issues if the check somehow failed (though unlikely with the explicit check)
     if ((error as any).code === 'P2003') {
         return NextResponse.json({ error: "Cannot delete genre as it is still referenced by other records." }, { status: 409 });
     }
    return NextResponse.json(
      { error: "Failed to delete genre" },
      { status: 500 }
    );
  }
}
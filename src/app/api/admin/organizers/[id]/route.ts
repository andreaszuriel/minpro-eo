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

// PUT (Update) an organizer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = params;
  if (!id) {
      return NextResponse.json({ error: "Organizer ID missing" }, { status: 400 });
  }

  try {
    const { name, email, password } = await request.json();

    // Fetch the organizer to ensure they exist and are an organizer
    const organizer = await prisma.user.findUnique({
      where: { id, role: UserRole.organizer },
    });

    if (!organizer) {
      return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
    }

    const updateData: { name?: string; email?: string; password?: string } = {};
    if (name) updateData.name = name;
    if (email && email !== organizer.email) {
        // Check if the new email is already taken by someone else
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.id !== id) {
            return NextResponse.json({ error: "Email already in use by another user" }, { status: 409 });
        }
        updateData.email = email;
    }
    if (password) {
        // Only hash and update if a new password is provided
        updateData.password = await saltAndHashPassword(password);
    }

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: "No changes provided" }, { status: 400 });
    }

    const updatedOrganizer = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { // Select only non-sensitive data to return
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedOrganizer);
  } catch (error) {
    console.error(`Error updating organizer ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to update organizer" },
      { status: 500 }
    );
  }
}

// DELETE an organizer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = params;
   if (!id) {
      return NextResponse.json({ error: "Organizer ID missing" }, { status: 400 });
  }

  try {
    // Fetch the organizer to ensure they exist and are an organizer before deleting
     const organizer = await prisma.user.findUnique({
      where: { id, role: UserRole.organizer },
    });

     if (!organizer) {
      return NextResponse.json({ error: "Organizer not found or user is not an organizer" }, { status: 404 });
    }

    const eventsCount = await prisma.event.count({ where: { organizerId: id } });
    if (eventsCount > 0) {
        return NextResponse.json({ error: "Cannot delete organizer with existing events. Reassign events first." }, { status: 400 });
    }


    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Organizer deleted successfully" }, { status: 200 }); // Or 204 No Content
  } catch (error) {
    console.error(`Error deleting organizer ${id}:`, error);
     // Check for specific Prisma errors, e.g., foreign key constraints
     if ((error as any).code === 'P2003' || (error as any).code === 'P2014') { // Foreign key constraint
        return NextResponse.json({ error: "Cannot delete organizer due to related records (e.g., events, transactions). Please reassign or delete them first." }, { status: 409 });
     }
    return NextResponse.json(
      { error: "Failed to delete organizer" },
      { status: 500 }
    );
  }
}
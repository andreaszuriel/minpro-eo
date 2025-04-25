import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { verifyPassword, saltAndHashPassword } from "@/utils/password";

export async function PUT(request: NextRequest) {
  try {
    // 1) Authenticate
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2) Parse & validate user ID
    const userId = Number(session.user.id);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    // 3) Parse request body
    const { name, currentPassword, newPassword } = await request.json();

    // 4) Load current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, password: true },
    });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 5) Build update payload
    const updateData: { name?: string; password?: string } = {};

    if (name && name !== user.name) {
      updateData.name = name;
    }

    if (newPassword && currentPassword) {
      if (!user.password) {
        return NextResponse.json(
          { message: "Cannot update password for this account" },
          { status: 400 }
        );
      }
      const valid = await verifyPassword(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json(
          { message: "Current password is incorrect" },
          { status: 400 }
        );
      }
      updateData.password = await saltAndHashPassword(newPassword);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No changes to update" });
    }

    // 6) Perform update
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user:    updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}

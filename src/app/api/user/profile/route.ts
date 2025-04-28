import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { verifyPassword, saltAndHashPassword } from "@/utils/password";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      referralCode: true,
      image: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ user });
}

export async function PUT(request: NextRequest) {
  try {
    // 1) Check if user is authenticated
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { name, currentPassword, newPassword, image } = await request.json();

    // 2) Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, password: true, image: true },
    });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 3) Build update payload
    const updateData: { name?: string; password?: string; image?: string } = {};

    if (name && name !== user.name) {
      updateData.name = name;
    }

    if (image && image !== user.image) {
      updateData.image = image;
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

    // 4) Perform update
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, image: true },
    });

    // 5) Generate a new JWT with updated user data
    const response = NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
      sessionUpdated: true
    });

    return response;
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
"use server";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saltAndHashPassword } from "@/utils/password";

export async function handleMagicLinkLogin(formData: FormData) {
  const email = formData.get("email");

  if (!email || typeof email !== 'string') {
    throw new Error("Email is required and must be a string.");
  }

  try {
    await signIn("nodemailer", { email, redirectTo: "/" });
  } catch (error) {
    console.error("Magic Link Sign-In Error:", error);
    throw error;
  }
}

export async function handleCredentialsLogin(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    throw new Error("Email and password are required.");
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    console.error("Credentials Sign-In Error:", error);
    throw error;
  }
}

export async function handleSignup(formData: FormData) {
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !confirmPassword ||
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof confirmPassword !== 'string'
  ) {
    throw new Error("All fields are required.");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists.");
  }

  const hashedPassword = await saltAndHashPassword(password);
  const user = await prisma.user.create({
    data: {
      name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    console.error("Auto Sign-In Error after Signup:", error);
    throw error;
  }
}
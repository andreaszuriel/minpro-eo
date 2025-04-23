// lib/actions.ts (Corrected)
"use server";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saltAndHashPassword } from "@/utils/password";
// Import AuthError if available/needed for more specific checks (V5+)
// import { AuthError } from "next-auth";

export async function handleMagicLinkLogin(formData: FormData) {
  const email = formData.get("email");

  if (!email || typeof email !== 'string') {
    return { error: "Email is required and must be a string." }; // Return error object
  }

  try {
    // Let redirects propagate
    await signIn("nodemailer", { email, redirectTo: "/" });
  } catch (error) {
    // Check if it's the redirect error specifically
    // Using digest is a common way for NEXT_REDIRECT
    if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
       throw error; // Re-throw NEXT_REDIRECT errors immediately
    }
    // Handle other errors (like network issues, config errors)
    console.error("Magic Link Sign-In Error:", error);
    return { error: "Could not send magic link. Please try again." }; // Return error object
  }
  // signIn should redirect or throw, so this point might not be reached
}

export async function handleCredentialsLogin(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
     return { error: "Email and password are required." }; // Return error object
  }

  try {
     // Let redirects propagate
    await signIn("credentials", { email, password, redirectTo: "/" });
    // If signIn *doesn't* throw/redirect (unlikely with redirectTo),
    // you might need a return here, but usually not needed.
  } catch (error) {
     // Check if it's the redirect error specifically
     if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
       throw error; // Re-throw NEXT_REDIRECT errors immediately
     }

    // If it's not a redirect, it's likely an AuthError (CredentialsSignin, etc.)
    // Or a custom error thrown from your authorize function
    console.error("Credentials Sign-In Caught Error:", error); // Log the actual error

    // You can check specific AuthError types if using v5+
    // if (error instanceof AuthError && error.type === 'CredentialsSignin') {
    //   return { error: 'Invalid email or password.' };
    // }

    // Return a generic error message or the specific one if safe
    // Be careful about exposing too much detail from error.message
    return { error: "Invalid email or password." }; // Return error object
  }
}

export async function handleSignup(formData: FormData) {
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  // --- Start: Input Validation ---
  if (
    !firstName || !lastName || !email || !password || !confirmPassword ||
    typeof firstName !== 'string' || typeof lastName !== 'string' ||
    typeof email !== 'string' || typeof password !== 'string' ||
    typeof confirmPassword !== 'string'
  ) {
    return { error: "All fields are required." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  // --- End: Input Validation ---

  try {
    // --- Start: Database Operations ---
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "User with this email already exists." };
    }

    const hashedPassword = await saltAndHashPassword(password);
    await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
      },
    });
    // --- End: Database Operations ---

    // --- Start: Attempt Auto Sign-In ---
    // Let redirects propagate from signIn
    await signIn("credentials", { email, password, redirectTo: "/" });
    // --- End: Attempt Auto Sign-In ---

  } catch (error) {
     // Check if it's the redirect error specifically
     if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
       throw error; // Re-throw NEXT_REDIRECT errors immediately
     }

    // Handle database errors or other unexpected issues during signup/signin
    console.error("Signup Process Error:", error);

    // Check if it's an error during the sign-in attempt after creation
    // You might want different messages depending on where the error occurred
    if (error instanceof Error && error.message.includes("CredentialsSignin")) { // Example check
        return { error: "Account created, but auto sign-in failed. Please log in manually."}
    }

    return { error: "An unexpected error occurred during signup. Please try again." };
  }
}
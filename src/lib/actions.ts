"use server";

import { signIn } from "@/auth"; 

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

// You can add other auth-related server actions here
// export async function handleGoogleLogin() { ... }
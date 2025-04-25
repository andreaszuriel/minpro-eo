"use server";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saltAndHashPassword } from "@/utils/password";
import { AuthError } from "next-auth";

export async function handleMagicLinkLogin(formData: FormData) {
  const email = formData.get("email");

  if (!email || typeof email !== 'string') {
    return { error: "Email is required and must be a string." }; 
  }

  try {
    // Let redirects propagate
    await signIn("nodemailer", { email, redirectTo: "/auth/verify-request" });
  } catch (error) {
    if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
       throw error; 
    }
    // Handle other errors (like network issues, config errors)
    console.error("Magic Link Sign-In Error:", error);
    return { error: "Could not send magic link. Please try again." }; 
  }

}

export async function handleCredentialsLogin(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return { error: "Email and password are required." };
  }

  try {
    console.log("CREDENTIALS LOGIN: Attempting signIn for email:", email);
    const result = await signIn("credentials", { 
      email, 
      password,
      redirect: false
    });
    
    console.log("CREDENTIALS LOGIN: signIn result:", result);
    
    // Check if authentication was successful - result.error will be present if failed
    if (result?.error) {
      return { error: result.error };
    } else {
      // Success! Return a redirectUrl that the client will use
      return { success: true, redirectUrl: "/auth/verify-signin" };
    }
  } catch (error) {
    console.error("Credentials Login Error:", error);
    return { error: "Invalid email or password." };
  }
}

export async function handleSignup(formData: FormData) {
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const referrerCode = formData.get("referrerCode"); // optional

  if (
    !firstName || !lastName || !email || !password || !confirmPassword ||
    typeof firstName !== 'string' || typeof lastName !== 'string' ||
    typeof email !== 'string' || typeof password !== 'string' ||
    typeof confirmPassword !== 'string' ||
    (referrerCode && typeof referrerCode !== 'string')
  ) {
    return { error: "All fields are required." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "User with this email already exists." };
    }

    // Check referral code validity
    let referrerId: string | null = null;
    if (referrerCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: referrerCode } });
      if (!referrer) {
        return { error: "Invalid referral code." };
      }
      referrerId = referrer.id;
    }

    // Generate unique referral code
    const { customAlphabet } = await import("nanoid");
    const generateReferralCode = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);
    let referralCode: string;
    while (true) {
      referralCode = generateReferralCode();
      const existing = await prisma.user.findUnique({ where: { referralCode } });
      if (!existing) break;
    }

    const hashedPassword = await saltAndHashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
        referralCode,
        referredBy: referrerCode || null,
      },
    });

    // Give the new user a coupon
    await prisma.coupon.create({
      data: {
        userId: newUser.id,
        code: `WELCOME-${referralCode}`,
        discount: 20000,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    // Reward the referrer
    if (referrerId) {
      await prisma.user.update({
        where: { id: referrerId },
        data: {
          points: { increment: 10000 },
        },
      });
    }

    // Attempt auto sign-in
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/auth/verify-signin",
    });

  } catch (error) {
    if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    console.error("Signup Process Error:", error);

    if (error instanceof Error && error.message.includes("CredentialsSignin")) {
      return { error: "Account created, but auto sign-in failed. Please log in manually." };
    }

    return { error: "An unexpected error occurred during signup. Please try again." };
  }
}

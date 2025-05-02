"use server";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saltAndHashPassword } from "@/utils/password";
import { AuthError, CredentialsSignin } from "@auth/core/errors";
import { Prisma } from '@prisma/client'; 

function getFutureDate(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
}

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
  const referrerCodeInput = formData.get("referrerCode"); // Renamed for clarity

  if (
    !firstName || !lastName || !email || !password || !confirmPassword ||
    typeof firstName !== 'string' || typeof lastName !== 'string' ||
    typeof email !== 'string' || typeof password !== 'string' ||
    typeof confirmPassword !== 'string' ||
    (referrerCodeInput && typeof referrerCodeInput !== 'string')
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
    let actualReferrerCode: string | null = null; // Store the code used
    if (referrerCodeInput) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referrerCodeInput }
      });
      if (!referrer) {
        return { error: "Invalid referral code." };
      }
      referrerId = referrer.id;
      actualReferrerCode = referrerCodeInput; // Save the valid code used
    }

    // Generate unique referral code for the new user
    const { customAlphabet } = await import("nanoid");
    const generateReferralCode = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);
    let newUserReferralCode: string;
    while (true) {
      newUserReferralCode = generateReferralCode();
      const existing = await prisma.user.findUnique({ where: { referralCode: newUserReferralCode } });
      if (!existing) break;
    }

    const hashedPassword = await saltAndHashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
        referralCode: newUserReferralCode, // Assign the generated code to the new user
        referredBy: actualReferrerCode, // Store the code they signed up with
      },
    });

    // --- Give the new user a coupon ---
    if (referrerId) { 
        const couponExpiryDate = getFutureDate(3); 

        await prisma.coupon.create({
            data: {
                userId: newUser.id,
                code: `REFERRED-${newUserReferralCode}`, 
                discount: 20000,
                expiresAt: couponExpiryDate, 
                isReferral: true, 
            },
        });
        console.log(`Created referral coupon for new user ${newUser.id}, expires ${couponExpiryDate.toISOString()}`);
    } else {
        console.log(`New user ${newUser.id} signed up without referral code. No referral coupon given.`);
    }


    // --- Reward the referrer ---
    if (referrerId) {
        const pointsExpiryDate = getFutureDate(3); 

        await prisma.pointTransaction.create({
            data: {
                userId: referrerId,
                points: 10000, // Award 10,000 points
                description: `Referral bonus for signup: ${newUser.name || newUser.email}`,
                expiresAt: pointsExpiryDate, // Set 3 month expiry
                // isExpired defaults to false
            },
        });
        console.log(`Awarded 10000 points via PointTransaction to referrer ${referrerId}, expires ${pointsExpiryDate.toISOString()}`);
    }

    // Attempt auto sign-in
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/auth/verify-signin", 
    });

  } catch (error) {
    // This specifically catches the intentional redirect thrown by NextAuth's signIn
    if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
       console.log("Signup successful, redirecting...");
       throw error; // Re-throw the redirect error so Next.js handles it
    }

    console.error("Signup Process Error:", error);

    // Check if the error is from failed credentials sign-in *after* user creation
    if (error instanceof CredentialsSignin) {
      // User was created, but auto-login failed.
      console.error("Auto sign-in failed (CredentialsSignin):", error.message);
      return { error: "Account created, but auto sign-in failed. Please log in manually." };
  }

    // Handle Prisma-specific errors if needed (e.g., constraint violations)
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
         console.error("Prisma Error Code:", error.code, error.message);
         return { error: "Database error during signup. Please try again."}
     }

    // Generic fallback error
    return { error: "An unexpected error occurred during signup. Please try again." };
  }

  // Fallback, indicate success 
  // return { success: true, message: "Signup successful, proceed to login." };
}

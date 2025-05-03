"use server";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saltAndHashPassword } from "@/utils/password";
import { AuthError, CredentialsSignin } from "@auth/core/errors";
import { Prisma } from '@prisma/client'; 
import { z, ZodError } from 'zod'; // Import z and ZodError
import {
    signInSchema,
    passwordValidation
} from '@/lib/validation/validation.schema';

// --- Helper function to format Zod errors ---
function formatZodError(error: ZodError): string {
  const fieldErrors = error.flatten().fieldErrors;
  const messages = Object.entries(fieldErrors)
    .map(([field, errors]) => {
      if (errors) {
        const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
        const fieldName = capitalizedField === 'ConfirmPassword' ? 'Confirm Password' : capitalizedField;
        return `${fieldName}: ${errors.join(', ')}`;
      }
      return null;
    })
    .filter(msg => msg !== null);

  const formErrors = error.flatten().formErrors;
  if (formErrors.length > 0) {
      // Use refine message directly if available (like password mismatch)
      messages.push(...formErrors);
  }

  // If no specific messages, return a generic message
  if (messages.length === 0 && error.issues.length > 0) {
      return "Validation failed. Please check your input.";
  }

  return messages.join(' | ');
}

// --- Define action-specific schemas ---

// Schema for Magic Link (just needs email)
const magicLinkSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
});

// Schema for Signup Action (handles separate names, confirmPassword, referrer)
const signupActionSchema = z.object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: passwordValidation, // Reuse the complex password rules
    confirmPassword: z.string().min(1, "Password confirmation is required"),
    referrerCode: z.string().optional(), // Optional referrer code
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match", // This message goes to formErrors
    path: ["confirmPassword"], // Apply refinement check conceptually related to confirm field
});




function getFutureDate(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
}

export async function handleMagicLinkLogin(formData: FormData) {
  // Convert FormData to plain object for Zod
  const formDataObject = Object.fromEntries(formData.entries());

  // Validate with Zod using safeParse
  const validationResult = magicLinkSchema.safeParse(formDataObject);

  if (!validationResult.success) {
    console.log("VALIDATION FAILED (Magic Link):", formatZodError(validationResult.error));
    return { error: formatZodError(validationResult.error) };
  }

  // Use validated data
  const { email } = validationResult.data;

  try {
    console.log(`MAGIC LINK: Attempting signIn for ${email.substring(0,3)}...`);
    // Let redirects propagate
    await signIn("nodemailer", { email, redirectTo: "/auth/verify-request" });
    // signIn with redirect throws NEXT_REDIRECT 
    console.log(`MAGIC LINK: signIn initiated for ${email.substring(0,3)}...`); // Should not be reached if redirect works

  } catch (error) {
    if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
       console.log(`MAGIC LINK: Redirecting user for ${email.substring(0,3)}...`);
       throw error; // Re-throw redirect error
    }
    // Handle other errors
    console.error("Magic Link Sign-In Error:", error);
    return { error: "Could not send magic link. Please try again." };
  }
}

export async function handleCredentialsLogin(formData: FormData) {
    // Convert FormData to plain object for Zod
    const formDataObject = Object.fromEntries(formData.entries());

    // Validate with Zod using safeParse
    const validationResult = signInSchema.safeParse(formDataObject); 

    if (!validationResult.success) {
        console.log("VALIDATION FAILED (Credentials Login):", formatZodError(validationResult.error));
        return { error: formatZodError(validationResult.error) };
    }

    // Use validated data
    const { email, password } = validationResult.data;

    try {
      console.log(`CREDENTIALS LOGIN: Attempting signIn for ${email.substring(0,3)}...`);
      await signIn("credentials-signin", {
          email,
          password,
          redirect: false
      });

      console.log(`CREDENTIALS LOGIN: Success for ${email.substring(0,3)}...`);
      return { success: true, redirectUrl: "/auth/verify-signin" };

  } catch (error) {
      if (error instanceof CredentialsSignin) {
           console.log(`CREDENTIALS LOGIN FAILED (CredentialsSignin): Invalid credentials provided for ${email.substring(0,3)}...`);
           return { error: 'Invalid email or password.' }; // User-friendly message
      }
      // Check for other AuthErrors if necessary, though less common for basic credentials
      else if (error instanceof AuthError) {
           // Catch other, potentially more configuration-related AuthErrors
           console.log(`CREDENTIALS LOGIN FAILED (AuthError): ${error.message}`, error.cause);
           // Provide a more generic auth error message
           return { error: 'An authentication error occurred. Please try again later.' };
      }

      // Handle other unexpected errors (non-AuthError)
      console.error("Credentials Login Unexpected Error:", error);
      return { error: "An unexpected error occurred during login." };
  }
}


export async function handleSignup(formData: FormData) {
    // Convert FormData to plain object for Zod
    const formDataObject = Object.fromEntries(formData.entries());

    // Validate with Zod using safeParse
    const validationResult = signupActionSchema.safeParse(formDataObject);

    if (!validationResult.success) {
        console.log("VALIDATION FAILED (Signup):", formatZodError(validationResult.error));
        return { error: formatZodError(validationResult.error) };
    }

    // Use validated data
    const { firstName, lastName, email, password, referrerCode: referrerCodeInput } = validationResult.data;
    const normalizedEmail = email.toLowerCase().trim(); // Normalize email

    try {
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
             console.log(`SIGNUP: User already exists - ${normalizedEmail.substring(0,3)}...`);
            return { error: "User with this email already exists." };
        }

        // Check referral code validity
        let referrerId: string | null = null;
        let actualReferrerCode: string | null = null;
        if (referrerCodeInput) {
            const referrer = await prisma.user.findUnique({
                where: { referralCode: referrerCodeInput }
            });
            if (!referrer) {
                console.log(`SIGNUP: Invalid referral code provided - ${referrerCodeInput}`);
                return { error: "Invalid referral code." };
            }
            referrerId = referrer.id;
            actualReferrerCode = referrerCodeInput;
            console.log(`SIGNUP: Valid referral code ${actualReferrerCode} used, referrer ID: ${referrerId.substring(0,8)}...`);
        }

        // Generate unique referral code for the new user
        const { customAlphabet } = await import("nanoid");
        const generateReferralCode = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);
        let newUserReferralCode: string;
        while (true) {
            newUserReferralCode = generateReferralCode();
            const existingCode = await prisma.user.findUnique({ where: { referralCode: newUserReferralCode } });
            if (!existingCode) break;
            console.log(`SIGNUP: Generated referral code ${newUserReferralCode} exists, retrying...`);
        }
        console.log(`SIGNUP: Assigned new referral code ${newUserReferralCode} to user ${normalizedEmail.substring(0,3)}...`);


        const hashedPassword = await saltAndHashPassword(password);
        const newUser = await prisma.user.create({
            data: {
                name: `${firstName} ${lastName}`, // Combine validated names
                email: normalizedEmail, // Use normalized email
                password: hashedPassword,
                referralCode: newUserReferralCode,
                referredBy: actualReferrerCode, // Store the code they signed up with (or null)
                role: 'customer', // Explicitly set default role
            },
        });
        console.log(`SIGNUP: User created successfully - ID: ${newUser.id.substring(0,8)}...`);


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
            console.log(`SIGNUP: Created referral coupon for new user ${newUser.id.substring(0,8)}..., expires ${couponExpiryDate.toISOString()}`);
        } else {
            console.log(`SIGNUP: New user ${newUser.id.substring(0,8)}... signed up without referral code. No referral coupon.`);
        }

        // --- Reward the referrer ---
        if (referrerId) {
            const pointsExpiryDate = getFutureDate(3);
            await prisma.pointTransaction.create({
                data: {
                    userId: referrerId,
                    points: 10000,
                    description: `Referral bonus for signup: ${newUser.name || newUser.email}`,
                    expiresAt: pointsExpiryDate,
                },
            });
            console.log(`SIGNUP: Awarded 10000 points via PointTransaction to referrer ${referrerId.substring(0,8)}..., expires ${pointsExpiryDate.toISOString()}`);
        }

        // Attempt auto sign-in using the "credentials-signin" provider
        console.log(`SIGNUP: Attempting auto sign-in for ${normalizedEmail.substring(0,3)}...`);
        await signIn("credentials-signin", { // <-- Use the signin provider ID
            email: normalizedEmail, // Use the actual email used for signup
            password: password, // Use the raw password submitted (NextAuth authorize will re-verify)
            redirect: true, // Redirect on successful sign-in
            redirectTo: "/auth/verify-signin", 
        });
        // signIn with redirect=true will throw NEXT_REDIRECT

    } catch (error) {
        // Catch specific redirect error from signIn
        if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
            console.log("SIGNUP: Signup successful, redirecting user...");
            throw error; // Re-throw the redirect error
        }

        // Handle specific NextAuth errors (e.g., if auto-login fails unexpectedly)
        if (error instanceof AuthError) {
            console.error(`SIGNUP: Auto sign-in failed (AuthError: ${error})`, error.cause);
             // User was likely created, but auto-login failed.
             return { error: "Account created, but auto sign-in failed. Please log in manually." };
        }

        // Handle Prisma errors (like unique constraint violation if check somehow failed)
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error("SIGNUP Prisma Error:", { code: error.code, meta: error.meta, message: error.message });
            // P2002 is unique constraint violation
             if (error.code === 'P2002') {
                return { error: "An account with this email or referral code already exists." };
             }
            return { error: "Database error during signup. Please try again."}
        }

        // Generic fallback error
        console.error("Signup Unexpected Error:", error);
        return { error: "An unexpected error occurred during signup. Please try again." };
    }
     // This part should ideally not be reached if signIn redirects successfully
     // return { success: true, message: "Signup successful! Please check your email or log in." };
}

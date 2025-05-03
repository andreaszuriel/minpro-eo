import type { NextAuthConfig } from 'next-auth';
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { verifyPassword, saltAndHashPassword } from "@/utils/password";
import { prisma } from "@/lib/prisma";
import { UserRole } from '@prisma/client';
import {
    signInSchema,
    signUpSchema,
    passwordValidation 
} from '@/lib/validation/validation.schema';
import { z } from 'zod';

// Check for required environment variables
const REQUIRED_ENV_VARS = [
  "EMAIL_SERVER_USER",
  "EMAIL_SERVER_PASSWORD",
  "EMAIL_SERVER_HOST",
  "EMAIL_SERVER_PORT",
  "EMAIL_FROM",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL"
] as const;

for (const name of REQUIRED_ENV_VARS) {
  if (!process.env[name]) {
    throw new Error(`Missing env var: ${name}`);
  }
}

// Define constants for session times
const ONE_DAY = 24 * 60 * 60;
const THIRTY_DAYS = 30 * ONE_DAY;

/**
 * Helper for handling Zod validation with proper error logging
 */
const validateWithZod = (schema: z.ZodSchema<any>, data: any) => { // Use z.ZodSchema for better typing
  const result = schema.safeParse(data);

  if (!result.success) {
    // Format error messages
    const errorMessages = result.error.errors.map(
      (err) => `${err.path.join('.')}: ${err.message}`
    ).join(', ');

    console.log(`VALIDATION: Failed - ${errorMessages}`);
    throw new Error(errorMessages); // Throw formatted Zod errors
  }

  return result.data;
};

// Define a specific schema for reset password credentials *including* the token
const resetPasswordCredentialsSchema = z.object({
    // 1. Add the token field
    token: z.string().min(1, "Reset token is required."),
    // 2. Use the imported password validation rules
    password: passwordValidation,
    // 3. Define confirm password validation (usually just existence needed)
    confirmPassword: z.string().min(1, "Password confirmation is required")
})
// 4. Apply the refinement to THIS object
.refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});

// Base auth config without the Prisma adapter
export const authConfig = {
    providers: [
        Nodemailer({
            server: {
                host: process.env.EMAIL_SERVER_HOST,
                port: Number(process.env.EMAIL_SERVER_PORT),
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD,
                },
                secure: process.env.NODE_ENV === "production",
            },
            from: process.env.EMAIL_FROM,
        }),
        Credentials({
            id: "credentials-signin",
            name: "Sign In",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    // Validate credentials against the schema
                    const { email, password } = validateWithZod(signInSchema, credentials);
                    console.log(`AUTHORIZE: Attempting login for ${email.substring(0, 3)}...`);

                    const user = await prisma.user.findUnique({
                        where: { email: email.toLowerCase().trim() }, // Normalize email
                    });

                    if (!user || !user.password) {
                        console.log(`AUTHORIZE: Invalid credentials for ${email.substring(0, 3)}...`);
                        throw new Error("Invalid credentials.");
                    }

                    const isValid = await verifyPassword(password, user.password);
                    if (!isValid) {
                        console.log(`AUTHORIZE: Password mismatch for ${email.substring(0, 3)}...`);
                        // TODO: track failed login attempts here
                        throw new Error("Invalid credentials.");
                    }

                    console.log(`AUTHORIZE: Success for ${email.substring(0, 3)}..., ID: ${user.id.substring(0, 8)}...`);

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        isAdmin: user.isAdmin,
                    };
                } catch (error) {
                    console.error("AUTHORIZE: Error during authentication:", error instanceof Error ? error.message : error);
                    // Check if it's a validation error to return a specific message
                    if (error instanceof Error && (error.message.includes(":") && error.message.includes("required"))) {
                         throw new Error("Please provide both email and password.");
                    }
                     // Otherwise, return generic message
                    throw new Error("Invalid credentials."); // Keep error generic for security
                }
            },
        }),
        Credentials({
            id: "credentials-signup",
            name: "Sign Up",
            credentials: {
                name: { label: "Name", type: "text" },
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                role: { label: "Role", type: "text" },
            },
            async authorize(credentials) {
                try {
                    // Validate signup data
                    const { name, email, password, role } = validateWithZod(signUpSchema, credentials);
                    console.log(`SIGNUP: Attempting signup for ${email.substring(0, 3)}...`);

                    // Check if user already exists
                    const existingUser = await prisma.user.findUnique({
                        where: { email: email.toLowerCase().trim() },
                    });

                    if (existingUser) {
                        console.log(`SIGNUP: User already exists: ${email.substring(0, 3)}...`);
                        throw new Error("User with this email already exists.");
                    }

                    // Create new user
                    const hashedPassword = await saltAndHashPassword(password);
                    const user = await prisma.user.create({
                        data: {
                            name,
                            email: email.toLowerCase().trim(),
                            password: hashedPassword, // Use the result
                            role: role as UserRole, // Role is validated by Zod enum
                        },
                    });

                    console.log(`SIGNUP: Success for ${email.substring(0, 3)}..., ID: ${user.id.substring(0, 8)}...`);

                    // Return user object for session
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        isAdmin: user.isAdmin || false, // Ensure isAdmin exists
                    };
                } catch (error) {
                    console.error("SIGNUP: Error during user creation:", error instanceof Error ? error.message : error);
                    // Propagate specific known errors
                    if (error instanceof Error && error.message === "User with this email already exists.") {
                        throw error;
                    }
                     // Propagate Zod validation errors
                    if (error instanceof Error && (error.message.includes(":") && error.message.includes("required") || error.message.includes("Invalid"))) {
                         throw error;
                    }
                    // Generic fallback
                    throw new Error("Registration failed. Please try again.");
                }
            },
        }),
        Credentials({
            id: "credentials-reset-password",
            name: "Reset Password",
            credentials: {
                token: { label: "Reset Token", type: "text" },
                password: { label: "New Password", type: "password" },
                confirmPassword: { label: "Confirm Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    const { token, password } =
                        validateWithZod(resetPasswordCredentialsSchema, credentials); 

                    //'Token' is guaranteed to be a non-empty string
                    console.log(`RESET: Attempting password reset with token: ${token.substring(0, 5)}...`);

                    // Find token in database (assuming raw token storage for this provider flow)
                    const resetToken = await prisma.passwordResetToken.findUnique({
                        where: { token: token }, // Use the validated string token
                        include: { user: true }, // Include user data
                    });

                    if (!resetToken) {
                        console.log(`RESET: Invalid token provided: ${token.substring(0, 5)}...`);
                        throw new Error("Invalid or expired reset token.");
                    }

                    if (resetToken.expires < new Date()) {
                        console.log(`RESET: Expired token: ${token.substring(0, 5)}...`);
                        await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
                        throw new Error("Reset token has expired. Please request a new password reset.");
                    }

                    if (!resetToken.user) {
                       console.error(`RESET: User data missing for valid token ID: ${resetToken.id}, UserID: ${resetToken.userId}`);
                       throw new Error("Password reset failed due to an internal error.");
                    }

                    const hashedPassword = await saltAndHashPassword(password); // Use the validated password
                    await prisma.user.update({
                        where: { id: resetToken.userId },
                        data: { password: hashedPassword },
                    });

                    await prisma.passwordResetToken.delete({
                        where: { id: resetToken.id }
                    });

                    console.log(`RESET: Password reset successful for user ID: ${resetToken.userId.substring(0, 8)}...`);

                    return {
                        id: resetToken.user.id,
                        email: resetToken.user.email,
                        name: resetToken.user.name,
                        role: resetToken.user.role,
                        isAdmin: resetToken.user.isAdmin || false,
                    };
                } catch (error) {
                    console.error("RESET: Error during password reset:", error instanceof Error ? error.message : error);
                    // Propagate specific/validation errors
                    if (error instanceof Error && (
                        error.message.includes("expired") ||
                        error.message.includes("Invalid or expired") ||
                        error.message.includes("token") || // For token required error
                        error.message.includes("match") || // For password match error
                        error.message.includes("Password must") // From Zod password rules
                    )) {
                        throw error;
                    }
                    // Generic fallback
                    throw new Error("Password reset failed. Please try again.");
                }
            }
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: THIRTY_DAYS,
        updateAge: ONE_DAY,
    },
    pages: {
        signIn: '/auth/signin',
        verifyRequest: '/auth/verify-request', // For Magic Link / Email provider
        signOut: '/auth/signout',
        error: '/auth/error', // Error code passed in query string
    },
    callbacks: {
        async jwt({ token, user, account }) {
            // On successful sign-in (user object passed), persist details to token
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.role = user.role; // Make sure role is included in the user object returned by authorize
                token.isAdmin = user.isAdmin; // Make sure isAdmin is included
                token.iat = Math.floor(Date.now() / 1000); // Add issued at timestamp
                // console.log("JWT Callback: User object present", user);
            }
            // console.log("JWT Callback: Token", token);
            return token;
        },
        async session({ session, token }) {
            // Transfer details from JWT token to session object
            if (token && session.user) { // Check if session.user exists
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string ?? "User"; // Provide default
                session.user.role = (token.role as UserRole | undefined) ?? 'customer'; // Provide default and cast
                session.user.isAdmin = Boolean(token.isAdmin); // Ensure boolean
            }
            // console.log("Session Callback: Session object", session);
            return session;
        },
        // signIn callback runs *before* authorize for credentials, but *after* for OAuth
        async signIn({ user, account, profile, email, credentials }) {
            console.log("SIGNIN CALLBACK Triggered", { provider: account?.provider });
            return true; // Allow sign in
        },
    },
    events: {
        async signIn({ user, account, isNewUser }) {
            console.log(`EVENT: SignIn success for ${user.email}`, { provider: account?.provider, isNewUser });
            // TODO: trigger welcome emails or update last login timestamps here
            if (user.id) {
              // await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } }); // Example
            }
        },
        async signOut(message) {
            // message contains either { session } or { token }
             if ('token' in message && message.token) {
               console.log(`EVENT: SignOut for user: ${message.token.email}`);
             } else if ('session' in message && message.session) {
                // Session strategy 'database' might provide session here
                console.log(`EVENT: SignOut involving session: ${message.session.sessionToken?.substring(0,5)}...`);
             } else {
                console.log(`EVENT: SignOut triggered`);
             }
        },
        // TODO: add other events like createUser, linkAccount etc.
        // async createUser({ user }) {
        //    console.log(`EVENT: User created: ${user.email}`);
        // },
    },
    secret: process.env.NEXTAUTH_SECRET,
    // debug: process.env.NODE_ENV !== 'production', // Debug moved to NextAuth instantiation in auth.ts
} satisfies NextAuthConfig; // Ensure the config matches the expected type
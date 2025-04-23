// auth.config.ts

import type { NextAuthConfig } from 'next-auth';
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { saltAndHashPassword, verifyPassword } from "@/utils/password"; // Adjust path if needed
import { prisma } from "@/lib/prisma"; // Adjust path if needed
import { UserRole } from '@prisma/client'; // Make sure UserRole is imported from Prisma

// Check for required environment variables
if (!process.env.EMAIL_SERVER_USER) {
    throw new Error("Missing environment variable: EMAIL_SERVER_USER");
}
if (!process.env.EMAIL_SERVER_PASSWORD) {
    throw new Error("Missing environment variable: EMAIL_SERVER_PASSWORD");
}
if (!process.env.EMAIL_SERVER_HOST) {
    throw new Error("Missing environment variable: EMAIL_SERVER_HOST");
}
if (!process.env.EMAIL_SERVER_PORT) {
    throw new Error("Missing environment variable: EMAIL_SERVER_PORT");
}
if (!process.env.EMAIL_FROM) {
    throw new Error("Missing environment variable: EMAIL_FROM");
}

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
                }
            },
            from: process.env.EMAIL_FROM,
        }),
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // Check existence first
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required.");
                }

                // Explicitly check types (Type Guard) - use 'as string' if preferred after existence check
                if (typeof credentials.email !== 'string' || typeof credentials.password !== 'string') {
                     throw new Error("Invalid credentials format.");
                }

                console.log(`AUTHORIZE: Attempting for email: ${credentials.email}`); // Debug log

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }, // No 'as string' needed after typeof check
                });

                if (!user) {
                    console.log(`AUTHORIZE: User not found for email: ${credentials.email}`);
                    throw new Error("Invalid credentials."); // User not found
                }
                 if (!user.password) {
                    console.log(`AUTHORIZE: User ${credentials.email} has no password set.`);
                     throw new Error("Invalid credentials."); // Password not set
                 }

                if (user.password === null) { // Redundant check if !user.password is above, but safe
                    console.log(`AUTHORIZE: User ${credentials.email} password is null.`);
                     throw new Error("User account issue: Password not set.");
                }


                const isValid = await verifyPassword(credentials.password, user.password); // No 'as string' needed
                if (!isValid) {
                    console.log(`AUTHORIZE: Invalid password for email: ${credentials.email}`);
                    throw new Error("Invalid credentials."); // Password mismatch
                }

                console.log(`AUTHORIZE: Success for email: ${credentials.email}, User ID: ${user.id}`);
                // Return the necessary user object fields for session/callbacks
                return { id: user.id, email: user.email, name: user.name, role: user.role };
            },
        }),
    ],
    session: { strategy: "database" }, // Ensures adapter is used for session management
    pages: {
        signIn: '/auth/signin',
        verifyRequest: '/auth/verify-request', // For Magic Link
        error: '/auth/error', // To display authentication errors
    },
    callbacks: {
        // --- ADDED signIn Callback ---
        async signIn({ user, account, profile, email, credentials }) {
            // This callback runs after authorize() for Credentials provider
            // 'user' here is the object returned successfully from authorize
            console.log(`SIGNIN CALLBACK: Provider=${account?.provider}. Attempting sign-in for user ID: ${user.id}`);

            // Example: Check if email is verified (requires 'emailVerified' field on User model)
            // const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { emailVerified: true } });
            // if (account?.provider === "credentials" && !dbUser?.emailVerified) {
            //     console.log(`SIGNIN CALLBACK: Denied for ${user.id} - Email not verified`);
            //     // Optionally redirect to a specific page:
            //     // return '/auth/verify-email-notice';
            //     // Or simply deny sign-in:
            //     return false;
            // }

            // Return true to allow the sign-in process to continue fully.
            // This seems necessary to trigger database session creation for Credentials.
            console.log(`SIGNIN CALLBACK: Allowing sign-in for user ID: ${user.id}`);
            return true;
        },

        // --- UPDATED session Callback ---
        async session({ session, user /* 'user' comes from adapter lookup based on session token */ }) {
            // Use session.sessionToken to identify the session
            console.log(`SESSION CALLBACK: Populating session. Session Token: ${session.sessionToken ?? 'N/A'}, User ID from token/lookup: ${user.id}`);

            // Add custom properties from the user object (fetched by adapter) to the session.user
            session.user.id = user.id;
            session.user.email = user.email; // Ensure email is included
            session.user.name = user.name;   // Ensure name is included

            // Handle 'role' - Check if it exists on the 'user' object passed in
            if (user.role) {
                session.user.role = user.role;
            } else {
                // Fallback logic... (keep as before)
                console.warn(`SESSION CALLBACK: Role missing on user object for ID ${user.id}. Fetching directly.`);
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: user.id },
                        select: { role: true }
                    });
                    session.user.role = dbUser?.role ?? UserRole.customer; // Use fetched role or default
                } catch (dbError) {
                    console.error(`SESSION CALLBACK: Error fetching role directly for user ${user.id}`, dbError);
                    session.user.role = UserRole.customer; // Default on error
                }
            }
             console.log(`SESSION CALLBACK: Final session object for user ${user.id}:`, JSON.stringify(session)); // Log final session object
            return session; // Return the modified session object
        },

        // JWT callback is generally used for "jwt" strategy, not "database"
        // async jwt({ token, user, account, profile }) {
        //   console.log("JWT CALLBACK:", { token, user, account });
        //   if (user) { // On sign in
        //     token.id = user.id;
        //     token.role = user.role;
        //   }
        //   return token;
        // }
    },
    // The adapter itself is configured in the main auth.ts file, not here in auth.config.ts
    // adapter: PrismaAdapter(prisma), // DO NOT PUT ADAPTER HERE

    // Optional: Add debug flag for more verbose next-auth internal logs
    // debug: process.env.NODE_ENV === 'development',

} satisfies NextAuthConfig;
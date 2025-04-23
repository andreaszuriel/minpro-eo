// auth.config.ts

import type { NextAuthConfig } from 'next-auth';
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { saltAndHashPassword, verifyPassword } from "@/utils/password"; // Adjust path if needed
import { prisma } from "@/lib/prisma"; // Adjust path if needed
import { UserRole } from '@prisma/client'; // Make sure UserRole is imported from Prisma
import crypto from 'crypto';
import { cookies } from 'next/headers';

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
    session: { 
        strategy: "jwt", // Changed from "database" to "jwt"
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
        updateAge: 24 * 60 * 60,   // 24 hours in seconds
    },
    pages: {
        signIn: '/auth/signin',
        verifyRequest: '/auth/verify-request', // For Magic Link
        error: '/auth/error', // To display authentication errors
    },
    callbacks: {
        async jwt({ token, user, account }) {
            // Keep the user ID and role in the token
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token, user }) {
            // For JWT strategy, use token instead of user
            if (token) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                session.user.role = token.role as UserRole || 'customer';
            } else if (user) {
                // For backward compatibility with database strategy
                session.user.id = user.id;
                session.user.email = user.email;
                session.user.name = user.name;
                session.user.role = user.role;
            }
            console.log(`SESSION CALLBACK: Final session object:`, JSON.stringify(session));
            return session;
        },
        async signIn({ user, account, profile }) {
            console.log("SIGNIN CALLBACK with account provider:", account?.provider);
            // Successfully signed in
            return true;
        },
    },
} satisfies NextAuthConfig;
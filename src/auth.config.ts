import type { NextAuthConfig } from 'next-auth';
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { saltAndHashPassword, verifyPassword } from "@/utils/password";
import { prisma } from "@/lib/prisma";

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
            
                // Explicitly check types (Type Guard)
                if (typeof credentials.email !== 'string' || typeof credentials.password !== 'string') {
                     throw new Error("Invalid credentials format.");
                }
            
                // --- From here, TS knows they are strings ---
            
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });
            
                if (!user || !user.password) {
                    throw new Error("Invalid credentials.");
                }
            
               
                if (user.password === null) {
                     throw new Error("User account issue: Password not set.");
                }
            
                
                const isValid = await verifyPassword(credentials.password, user.password);
                if (!isValid) {
                    throw new Error("Invalid credentials.");
                }
            
                return { id: user.id, email: user.email, name: user.name, role: user.role };
            },
        }),
    ],
    session: { strategy: "database" },
    pages: {
        signIn: '/auth/signin',
        verifyRequest: '/auth/verify-request',
        error: '/auth/error',
    },
    callbacks: {
        async session({ session, user }) {
            session.user.id = user.id;
            session.user.role = user.role;
            return session;
        },
    },
} satisfies NextAuthConfig;
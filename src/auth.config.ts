import type { NextAuthConfig } from 'next-auth';
import Nodemailer from "next-auth/providers/nodemailer";

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
        // Add other providers like Google, GitHub etc. here
    ],
    session: { strategy: "database" },
    pages: {
        signIn: '/auth/signin',
        verifyRequest: '/auth/verify-request', // Page shown after email is sent
        error: '/auth/error', // Error page
    },
    callbacks: {
        // Your callbacks here
    },
    // Add pages, theme, debug options if needed
} satisfies NextAuthConfig;
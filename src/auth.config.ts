import type { NextAuthConfig } from 'next-auth';
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { verifyPassword } from "@/utils/password"; 
import { prisma } from "@/lib/prisma";
import { UserRole } from '@prisma/client'; 

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
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // Early validation with improved error messages (not exposed to users)
                if (!credentials?.email || !credentials?.password) {
                    console.log(`AUTHORIZE: Missing email or password`);
                    throw new Error("Email and password are required.");
                }

                // Explicitly check types
                if (typeof credentials.email !== 'string' || typeof credentials.password !== 'string') {
                     console.log(`AUTHORIZE: Invalid credential format`);
                     throw new Error("Invalid credentials format.");
                }

                console.log(`AUTHORIZE: Attempting login for ${credentials.email.substring(0, 3)}...`); 

                try {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email.toLowerCase().trim() }, // Normalize email
                    });

                    if (!user || !user.password) {
                        console.log(`AUTHORIZE: Invalid credentials for ${credentials.email.substring(0, 3)}...`);
                        // Use same error for user not found and no password set for security
                        throw new Error("Invalid credentials.");
                    }

                    const isValid = await verifyPassword(credentials.password, user.password);
                    if (!isValid) {
                        console.log(`AUTHORIZE: Password mismatch for ${credentials.email.substring(0, 3)}...`);
                        
                        // TODO: track failed login attempts here
                        // await prisma.loginAttempt.create({ data: { userId: user.id, success: false } });
                        
                        throw new Error("Invalid credentials.");
                    }

                    // Successful login - could track successful login here
                    // await prisma.loginAttempt.create({ data: { userId: user.id, success: true } });
                    
                    console.log(`AUTHORIZE: Success for ${credentials.email.substring(0, 3)}..., ID: ${user.id.substring(0, 8)}...`);
                    
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        isAdmin: user.isAdmin,
                    };
                } catch (error) {
                    console.error("AUTHORIZE: Error during authentication:", error);
                    // Don't expose internal errors to the client
                    throw new Error("Authentication failed. Please try again.");
                }
            },
        }),
    ],
    session: { 
        strategy: "jwt", 
        maxAge: THIRTY_DAYS,  
        updateAge: ONE_DAY,  
    },
    pages: {
        signIn: '/auth/signin',
        verifyRequest: '/auth/verify-request', // For Magic Link
        signOut: '/auth/signout',
        error: '/auth/error', 
    },
    callbacks: {
        async jwt({ token, user, account }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.role = user.role;
                token.isAdmin = user.isAdmin;
                
                // Add token issued timestamp for potential token rotation
                token.iat = Math.floor(Date.now() / 1000);
            }
            
            // TODO Check token age for rotation if needed
            // if (token.iat && (Math.floor(Date.now() / 1000) - token.iat > REFRESH_THRESHOLD)) {
            //    // Implement token refresh logic here if needed
            // }
            
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string || "User";
                session.user.role = token.role as UserRole || 'customer';
                session.user.isAdmin = Boolean(token.isAdmin);
            }
            
            return session;
        },
        async signIn({ user, account, profile }) {
            // Log provider but remove sensitive details
            console.log("SIGNIN CALLBACK with account provider:", account?.provider);
            
            // Handle additional signIn validation if needed
           
            
            return true;
        },
    },
    events: {
        async signIn({ user }) {
            console.log(`EVENT: User signed in: ${user.email}`);
            // Could track sign-ins in the database here
        },
        async signOut(message) {
            if ('session' in message) {
                console.log(`EVENT: User signed out (session)`);
            } else if ('token' in message) {
                console.log(`EVENT: User signed out: ${message.token?.email || 'unknown'}`);
            }
            // Could track sign-outs in the database here
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
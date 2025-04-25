// pages/api/auth/[...nextauth].ts
import NextAuth, { type NextAuthConfig, type User } from "next-auth";
import NodemailerProvider from "next-auth/providers/nodemailer";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/utils/password";
import { UserRole } from "@prisma/client";

// 1) Env checks
for (const name of [
  "EMAIL_SERVER_USER",
  "EMAIL_SERVER_PASSWORD",
  "EMAIL_SERVER_HOST",
  "EMAIL_SERVER_PORT",
  "EMAIL_FROM",
] as const) {
  if (!process.env[name]) {
    throw new Error(`Missing env var: ${name}`);
  }
}

// 2) NextAuth config
export const authConfig: NextAuthConfig = {
  providers: [
    // Magic‐link / email
    NodemailerProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),

    // Credentials (email + password)
    CredentialsProvider({
      name: "Email + Password",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      // ← Note: credentials is Partial<Record<...>>, not Record or undefined
      async authorize(
        credentials: Partial<Record<"email" | "password", unknown>>,
        req: Request
      ): Promise<User | null> {
        const email = credentials.email;
        const pass  = credentials.password;

        if (typeof email !== "string" || typeof pass !== "string") {
          throw new Error("Invalid credentials format");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const valid = await verifyPassword(pass, user.password);
        if (!valid) {
          throw new Error("Invalid credentials");
        }

        // Return exactly your module‐augmented `User`
        return {
          id:    user.id.toString(),
          email: user.email,
          name:  user.name,
          role:  user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge:   30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = user.role as UserRole;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id   = token.id as string;
      session.user.role = token.role as UserRole;
      return session;
    },
    async signIn({ user, account }) {
      console.log(
        `SIGNIN callback: user=${user.email}, provider=${account?.provider}`
      );
      return true;
    },
  },

  pages: {
    signIn:        "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error:         "/auth/error",
  },
};

export default NextAuth(authConfig);

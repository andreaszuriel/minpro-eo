// auth.ts
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Adapter, AdapterAccount } from "@auth/core/adapters";

// Get the original adapter
const prismaAdapter = PrismaAdapter(prisma);

// Add debug logging using a logger function
const logAdapter = () => {
  // Add logging for createSession
  const originalCreateSession = prismaAdapter.createSession!;
  prismaAdapter.createSession = async (session) => {
    console.log("ADAPTER: Creating session", session);
    try {
      const result = await originalCreateSession(session);
      console.log("ADAPTER: Session created successfully", {
        userId: result.userId,
        expires: result.expires,
        sessionToken: result.sessionToken.substring(0, 5) + "...",
      });
      return result;
    } catch (error) {
      console.error("ADAPTER: Failed to create session", error);
      throw error;
    }
  };

  // Add logging for getSessionAndUser
  const originalGetSessionAndUser = prismaAdapter.getSessionAndUser!;
  prismaAdapter.getSessionAndUser = async (sessionToken) => {
    console.log("ADAPTER: Getting session and user", sessionToken.substring(0, 5) + "...");
    try {
      const result = await originalGetSessionAndUser(sessionToken);
      console.log("ADAPTER: Get session and user result", result ? {
        userId: result.user.id,
        email: result.user.email,
      } : "Not found");
      return result;
    } catch (error) {
      console.error("ADAPTER: Failed to get session and user", error);
      throw error;
    }
  };

  // Add logging for createUser
  const originalCreateUser = prismaAdapter.createUser!;
  prismaAdapter.createUser = async (user) => {
    console.log("ADAPTER: Attempting createUser", user);
    try {
      const created = await originalCreateUser(user);
      console.log("ADAPTER: createUser SUCCESS", {
        id: created.id,
        email: created.email,
        name: created.name,
      });
      return created;
    } catch (error) {
      console.error("ADAPTER: Failed to create user", error);
      throw error;
    }
  };

  // Add logging for linkAccount
  const originalLinkAccount = prismaAdapter.linkAccount!;
  prismaAdapter.linkAccount = async (account: AdapterAccount) => {
    console.log("ADAPTER: Attempting linkAccount", {
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      userId: account.userId,
    });
    try {
      await originalLinkAccount(account); // Explicitly await, return void
      console.log("ADAPTER: linkAccount SUCCESS", { provider: account.provider, userId: account.userId });
    } catch (error) {
      console.error("ADAPTER: Failed to link account", error);
      throw error;
    }
  };

  return prismaAdapter;
};

// Apply logging to the adapter
const adapter = logAdapter();

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter, // Keep the adapter for database operations
  debug: true,
  session: {
    strategy: "jwt", // Ensure this matches
  }
});
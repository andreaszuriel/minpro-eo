// auth.ts (Modified for Debugging)
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Adapter } from "@auth/core/adapters";

// Wrapper for logging
const adapterWithLogging: Adapter = {
    ...PrismaAdapter(prisma), // Spread original adapter methods
    createSession: async (session) => {
        console.log("ADAPTER LOG: Attempting createSession", session);
        try {
            const created = await PrismaAdapter(prisma).createSession(session);
            console.log("ADAPTER LOG: createSession SUCCESS", created);
            return created;
        } catch (e) {
            console.error("ADAPTER LOG: createSession ERROR", e);
            throw e;
        }
    },
    // Add logs for other methods if needed (e.g., getSessionAndUser)
    getSessionAndUser: async (sessionToken) => {
         console.log("ADAPTER LOG: Attempting getSessionAndUser", sessionToken);
         const result = await PrismaAdapter(prisma).getSessionAndUser(sessionToken);
         console.log("ADAPTER LOG: getSessionAndUser RESULT", result);
         return result;
    }
};

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    // adapter: PrismaAdapter(prisma) // Original
    adapter: adapterWithLogging // Use wrapped adapter for debugging
});
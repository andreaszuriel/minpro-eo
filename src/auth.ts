import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { AdapterAccount } from "@auth/core/adapters";

// Create enhanced adapter with logging
const createEnhancedAdapter = () => {
  // Get the original adapter
  const prismaAdapter = PrismaAdapter(prisma);

  // Add debug logging to key methods
  const originalCreateSession = prismaAdapter.createSession!;
  prismaAdapter.createSession = async (session) => {
    console.log("ADAPTER: Creating session", {
      userId: session.userId,
      expires: session.expires,
    });
    
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

  // Add logging for getSessionAndUser with better security
  const originalGetSessionAndUser = prismaAdapter.getSessionAndUser!;
  prismaAdapter.getSessionAndUser = async (sessionToken) => {
    console.log("ADAPTER: Getting session and user", {
      tokenPreview: sessionToken.substring(0, 5) + "...",
    });
    
    try {
      const result = await originalGetSessionAndUser(sessionToken);
      console.log("ADAPTER: Get session and user result", result ? {
        userId: result.user.id,
        email: result.user.email?.substring(0, 3) + "...",
        hasSession: !!result.session,
      } : "Not found");
      
      return result;
    } catch (error) {
      console.error("ADAPTER: Failed to get session and user", error);
      throw error;
    }
  };

  // Add logging for createUser with better security
  const originalCreateUser = prismaAdapter.createUser!;
  prismaAdapter.createUser = async (user) => {
    console.log("ADAPTER: Attempting createUser", {
      email: user.email?.substring(0, 3) + "...",
      hasName: !!user.name,
    });
    
    try {
      const created = await originalCreateUser(user);
      console.log("ADAPTER: createUser SUCCESS", {
        id: created.id,
        email: created.email?.substring(0, 3) + "...",
        hasName: !!created.name,
      });
      
      return created;
    } catch (error) {
      console.error("ADAPTER: Failed to create user", error);
      throw error;
    }
  };

  // Add logging for linkAccount with better security
  const originalLinkAccount = prismaAdapter.linkAccount!;
  prismaAdapter.linkAccount = async (account: AdapterAccount) => {
    console.log("ADAPTER: Attempting linkAccount", {
      provider: account.provider,
      userId: account.userId,
    });
    
    try {
      await originalLinkAccount(account);
      console.log("ADAPTER: linkAccount SUCCESS", { 
        provider: account.provider, 
        userId: account.userId 
      });
    } catch (error) {
      console.error("ADAPTER: Failed to link account", error);
      throw error;
    }
  };

  // Add defensive error handling to other adapter methods
  const wrapMethod = <T extends Function>(methodName: string, method?: T): T | undefined => {
    if (!method) return undefined;
    
    return (async (...args: any[]) => {
      try {
        return await method(...args);
      } catch (error) {
        console.error(`ADAPTER: Error in ${methodName}`, error);
        throw error;
      }
    }) as unknown as T;
  };

  // Wrap remaining methods with error handling
  prismaAdapter.getUser = wrapMethod('getUser', prismaAdapter.getUser);
  prismaAdapter.getUserByEmail = wrapMethod('getUserByEmail', prismaAdapter.getUserByEmail);
  prismaAdapter.getUserByAccount = wrapMethod('getUserByAccount', prismaAdapter.getUserByAccount);
  prismaAdapter.updateUser = wrapMethod('updateUser', prismaAdapter.updateUser);
  prismaAdapter.updateSession = wrapMethod('updateSession', prismaAdapter.updateSession);
  prismaAdapter.deleteSession = wrapMethod('deleteSession', prismaAdapter.deleteSession);

  return prismaAdapter;
};

// Create enhanced adapter
const enhancedAdapter = createEnhancedAdapter();

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: enhancedAdapter,
  debug: process.env.NODE_ENV !== "production",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? `__Secure-authjs.session-token` 
        : `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "production"
        ? `__Secure-authjs.callback-url`
        : `authjs.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production"
        ? `__Host-authjs.csrf-token`
        : `authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      }
    },
  },
});
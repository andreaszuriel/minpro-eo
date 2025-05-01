import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { JWT } from "next-auth/jwt";

/**
 * Custom getToken function that can handle both authjs and next-auth cookies
 */
export async function getTokenFromRequest(request: NextRequest): Promise<JWT | null> {
  console.log("CUSTOM_GET_TOKEN: Starting token extraction");
  
  // Try to get the token from various cookie names
  const cookieNames = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ];
  
  let token = null;
  
  for (const cookieName of cookieNames) {
    const cookie = request.cookies.get(cookieName);
    if (cookie?.value) {
      console.log(`CUSTOM_GET_TOKEN: Found cookie: ${cookieName}`);
      try {
        // Get NEXTAUTH_SECRET from environment
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) {
          console.error("CUSTOM_GET_TOKEN: NEXTAUTH_SECRET is not defined");
          continue;
        }
        
        // Try to verify the token
        const { payload } = await jwtVerify(
          cookie.value,
          new TextEncoder().encode(secret)
        );
        
        console.log("CUSTOM_GET_TOKEN: JWT verification successful");
        
        // Convert JWTPayload to JWT type
        // Ensure the payload has the required JWT properties
        token = {
          ...payload,
          id: payload.sub || payload.id, // Use sub as id if available, fallback to id
          email: payload.email || "",     // Ensure email property exists
        } as JWT;
        
        break;
      } catch (error) {
        console.log(`CUSTOM_GET_TOKEN: Failed to verify JWT from ${cookieName}:`, error);
      }
    }
  }
  
  console.log("CUSTOM_GET_TOKEN: Token found?", !!token);
  return token;
}
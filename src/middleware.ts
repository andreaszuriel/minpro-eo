import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET, // Add the secret here
  });

  // Path is being accessed
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const isPublicPath = [
    "/",
    "/auth/signin",
    "/auth/verify-request",
  ].includes(pathname);

  // Define API paths
  const isApiPath = pathname.startsWith("/api");

  // Define static resource paths
  const isStaticResourcePath = [
    "/_next/",
    "/favicon.ico",
    "/images/",
  ].some((path) => pathname.startsWith(path));

  // If it's a public path or static resource, allow access
  if (isPublicPath || isApiPath || isStaticResourcePath) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!token) {
    // Redirect to sign-in page if not authenticated
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // Allow access for authenticated users
  return NextResponse.next();
}

// Apply middleware only to specific paths
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth/signin|auth/verify-request|^/$).*)",
  ],

  
};
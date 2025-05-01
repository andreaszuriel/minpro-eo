import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log("MIDDLEWARE: Checking authentication for path:", pathname);
  
  // Protect against path traversal attacks
  if (pathname.includes("..")) {
    console.log("MIDDLEWARE: Potential path traversal detected");
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  // Basic rate limiting for login pages 
  if (pathname === "/auth/signin" || pathname === "/admin/login") {
    const ip = request.headers.get("x-forwarded-for") || "";
    
  }

  // Use short cache for performance 
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });
  
  console.log("MIDDLEWARE: Token exists?", !!token);
  console.log("MIDDLEWARE: Cookie:", request.cookies.get("next-auth.session-token")?.value?.substring(0, 5) + "..." || 
               request.cookies.get("__Secure-next-auth.session-token")?.value?.substring(0, 5) + "...");

  // Define constants for path patterns - easier to maintain
  const PUBLIC_EXACT_PATHS = [
    "/",
    "/auth/signin",
    "/auth/verify-request", 
    "/auth/error",
    "/admin/login",
    "/events"
  ];
  
  const PUBLIC_PATH_PREFIXES = [
    "/events/",
    "/api/public/",
  ];
  
  const STATIC_PATH_PREFIXES = [
    "/_next/",
    "/favicon.ico",
    "/images/",
    "/assets/",
  ];
  
  // Check path patterns
  const isPublicPathExact = PUBLIC_EXACT_PATHS.includes(pathname);
  const isPublicPathPrefix = PUBLIC_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));
  const isApiPath = pathname.startsWith("/api");
  const isStaticResourcePath = STATIC_PATH_PREFIXES.some(path => pathname.startsWith(path));

  // Special handling for admin dashboard routes
  if (pathname.startsWith('/admin/dashboard')) {
    console.log("MIDDLEWARE: Admin dashboard path detected");
    
    // Check if user is authenticated
    if (!token) {
      console.log("MIDDLEWARE: No token for admin route, redirecting to admin login");
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
  // Check if user is an admin (COMMENT THIS BLOCK OUT)
    // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
    /*  <-- Add this line to start the comment block
    if (!token.isAdmin) {
      console.log("MIDDLEWARE: User is not an admin, access denied");
      // Store the original URL for post-login redirect
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('error', 'insufficient_permissions');
      return NextResponse.redirect(redirectUrl);
    }
    */ // <-- Add this line to end the comment block
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    
    console.log("MIDDLEWARE: Admin access granted");
    return NextResponse.next();
  }

  // Standard handling for public/static resources
  if (isPublicPathExact || isPublicPathPrefix || isApiPath || isStaticResourcePath) {
    console.log("MIDDLEWARE: Allowing access to public/static path:", pathname);
    return NextResponse.next();
  }

  // Standard authentication check for protected routes
  if (!token) {
    console.log("MIDDLEWARE: No token, redirecting to signin");
    // Store the original URL for post-login redirect
    const redirectUrl = new URL("/auth/signin", request.url);
    redirectUrl.searchParams.set('callbackUrl', encodeURIComponent(request.nextUrl.href));
    return NextResponse.redirect(redirectUrl);
  }

  console.log("MIDDLEWARE: Token valid, allowing access");
  
  // Add security headers to all responses
  const response = NextResponse.next();
  
  // Only in production to avoid development issues
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    );
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }
  
  return response;
}

// Configure matcher to include both admin routes and protected routes
export const config = {
  matcher: [
    // Match everything except public paths and static assets
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|auth/signin|auth/verify-request|auth/error|^/$).*)",
    "/admin/dashboard/:path*"
  ],
};
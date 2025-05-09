import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getTokenFromRequest } from "./auth-helpers";

const rateLimitStore = new Map<string, { count: number, resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  message: 'Too many login attempts. Please try again later.'
};

function isRateLimited(ip: string): { limited: boolean, remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  // If no record or window expired, create new record
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { 
      count: 1, 
      resetTime: now + RATE_LIMIT.windowMs 
    });
    return { limited: false, remaining: RATE_LIMIT.max - 1 };
  }
  
  // Increment count
  record.count += 1;
  
  // Check if over limit
  if (record.count > RATE_LIMIT.max) {
    return { limited: true, remaining: 0 };
  }
  
  return { limited: false, remaining: RATE_LIMIT.max - record.count };
}

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
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";
    
    const { limited, remaining } = isRateLimited(ip);
    
    if (limited) {
      console.log(`RATE LIMIT: IP ${ip.substring(0, 8)}... exceeded login attempts`);
      
      // Return 429 Too Many Requests
      return new NextResponse(
        JSON.stringify({ error: RATE_LIMIT.message }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(RATE_LIMIT.windowMs / 1000))
          }
        }
      );
    }
    
    console.log(`RATE LIMIT: IP ${ip.substring(0, 8)}... has ${remaining} attempts remaining`);
  }

  // Log all cookies for debugging
  console.log("MIDDLEWARE: All cookies:", 
    Object.fromEntries(
      request.cookies.getAll().map(c => [c.name, c.value.substring(0, 5) + "..."])
    )
  );

  // First try with standard getToken
  let token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });
  
  // If standard getToken fails, try our custom implementation
  if (!token) {
    console.log("MIDDLEWARE: Standard getToken failed, trying custom implementation");
    token = await getTokenFromRequest(request);
  }
  
  console.log("MIDDLEWARE: Token exists?", !!token);
  
  // Check all possible cookie variants
  const nextAuthCookie = request.cookies.get("next-auth.session-token");
  const secureNextAuthCookie = request.cookies.get("__Secure-next-auth.session-token");
  const authJsCookie = request.cookies.get("authjs.session-token");
  const secureAuthJsCookie = request.cookies.get("__Secure-authjs.session-token");
  
  console.log("MIDDLEWARE: next-auth Cookie:", nextAuthCookie?.value?.substring(0, 5) + "..." || "Not found");
  console.log("MIDDLEWARE: Secure next-auth Cookie:", secureNextAuthCookie?.value?.substring(0, 5) + "..." || "Not found");
  console.log("MIDDLEWARE: authjs Cookie:", authJsCookie?.value?.substring(0, 5) + "..." || "Not found");
  console.log("MIDDLEWARE: Secure authjs Cookie:", secureAuthJsCookie?.value?.substring(0, 5) + "..." || "Not found"); 

  // Define constants for path patterns
  const PUBLIC_EXACT_PATHS = [
    "/",
    "/auth/signin",
    "/auth/verify-request", 
    "/auth/error",
    "/admin/login",
    "/events",
    "/auth/forgot-password",
    "/about",
    "/terms",
    "/not-found",
    "/auth/reset-password" 
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
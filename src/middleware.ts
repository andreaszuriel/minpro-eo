import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  console.log("MIDDLEWARE: Checking authentication for path:", request.nextUrl.pathname);
  
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  console.log("MIDDLEWARE: Token exists?", !!token);
  console.log("MIDDLEWARE: Cookie:", request.cookies.get("next-auth.session-token")?.value?.substring(0, 5) + "..." || 
               request.cookies.get("__Secure-next-auth.session-token")?.value?.substring(0, 5) + "...");

  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const isPublicPath = [
    "/",
    "/auth/signin",
    "/auth/verify-request",
    "/admin/login", 
  ].includes(pathname);

  const isApiPath = pathname.startsWith("/api");

  const isStaticResourcePath = [
    "/_next/",
    "/favicon.ico",
    "/images/",
  ].some((path) => pathname.startsWith(path));

  // Special handling for admin dashboard routes
  if (pathname.startsWith('/admin/dashboard')) {
    console.log("MIDDLEWARE: Admin dashboard path detected");
    
    // Check if user is authenticated
    if (!token) {
      console.log("MIDDLEWARE: No token for admin route, redirecting to admin login");
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // Check if user is an admin
    if (!token.isAdmin) {
      console.log("MIDDLEWARE: User is not an admin, access denied");
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    console.log("MIDDLEWARE: Admin access granted");
    return NextResponse.next();
  }

  // Standard handling for public/static resources
  if (isPublicPath || isApiPath || isStaticResourcePath) {
    console.log("MIDDLEWARE: Allowing access to public/static path:", pathname);
    return NextResponse.next();
  }

  // Standard authentication check for protected routes
  if (!token) {
    console.log("MIDDLEWARE: No token, redirecting to signin");
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  console.log("MIDDLEWARE: Token valid, allowing access");
  return NextResponse.next();
}

// Configure matcher to include both admin routes and protected routes
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth/signin|auth/verify-request|^/$).*)",
    "/admin/dashboard/:path*"
  ],
};
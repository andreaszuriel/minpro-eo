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

  const isPublicPath = [
    "/",
    "/auth/signin",
    "/auth/verify-request",
  ].includes(pathname);

  const isApiPath = pathname.startsWith("/api");

  const isStaticResourcePath = [
    "/_next/",
    "/favicon.ico",
    "/images/",
  ].some((path) => pathname.startsWith(path));

  if (isPublicPath || isApiPath || isStaticResourcePath) {
    console.log("MIDDLEWARE: Allowing access to public/static path:", pathname);
    return NextResponse.next();
  }

  if (!token) {
    console.log("MIDDLEWARE: No token, redirecting to signin");
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  console.log("MIDDLEWARE: Token valid, allowing access");
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth/signin|auth/verify-request|^/$).*)",
  ],
};
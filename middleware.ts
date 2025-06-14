import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "./src/lib/auth";

const protectedRoutes = ["/dashboard", "/reminders", "/analytics", "/settings"];
const authRoutes = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  // Check if the user is authenticated
  const isAuthenticated = token ? !!verifyJWT(token) : false;

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthenticated && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (
    !isAuthenticated &&
    protectedRoutes.some((route) => pathname.startsWith(route))
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, etc. (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|manifest.json).*)",
  ],
};

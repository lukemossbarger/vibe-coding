import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");
  const isHomePage = req.nextUrl.pathname === "/";
  const isDebugRoute = req.nextUrl.pathname === "/api/auth/debug";

  // Always allow auth routes and debug route
  if (req.nextUrl.pathname.startsWith("/api/auth") || isDebugRoute) {
    return NextResponse.next();
  }

  // Protect API routes (except /api/auth)
  if (isApiRoute) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Allow home page for everyone (has "Explore Menu" button)
  if (isHomePage) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to sign-in
  if (!isAuthenticated && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // Redirect authenticated users away from sign-in page
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/menu", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

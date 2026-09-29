import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Optimistic check: only looks at the cookie. The real session check
// happens on the page itself (see app/dashboard/page.tsx).
export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Add the routes you want to protect here.
export const config = {
  matcher: ["/dashboard/:path*"],
};

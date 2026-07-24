import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";


export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // console.log("MIDDLEWARE TOKEN:", token);

  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set(
      "redirect",
      request.nextUrl.pathname + request.nextUrl.search
    );
    return NextResponse.redirect(url);
  }

  // Global admin always has access
  if (token.role === "admin") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Unrestricted paths (everyone logged in can access)
  const unrestrictedPaths = ['/', '/introduction', '/profile', '/access-denied'];
  if (unrestrictedPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Check RBAC from token
  const allowedPages = (token.allowedPages as string[]) || [];
  
  // If the user's allowedPages array contains this pathname
  // or if the pathname starts with any of the allowed pages
  const isAllowed = allowedPages.some((p: string) => pathname === p || pathname.startsWith(p + '/'));

  if (!isAllowed) {
    // Redirect to an access denied page or home page
    const url = new URL("/access-denied", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next (Next.js internals)
     * - favicon.ico
     * - login, signup pages
     * - api routes
     * - Static files (images, fonts, etc.)
     */
    "/((?!_next|favicon\\.ico|login|signup|api|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|webp|mp4|webm)$).*)",
  ],
};

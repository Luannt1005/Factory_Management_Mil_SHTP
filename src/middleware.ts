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

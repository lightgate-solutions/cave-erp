import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // THIS IS NOT SECURE!
  // This is the recommended approach to optimistically redirect users
  // Recommended to handle auth checks in each page/route
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs", // Required for auth.api calls
  // Remove "/" from matcher to allow public landing page
  // Dashboard routes are already protected by their layouts
  matcher: [
    // Only protect specific dashboard routes explicitly
    "/dashboard/:path*",
    "/documents/:path*",
    "/finance/:path*",
    "/hr/:path*",
    "/payroll/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/mail/:path*",
    "/settings/:path*",
    "/news/:path*",
    "/notification/:path*",
    "/logs/:path*",
    "/bug/:path*",
    "/personalization/:path*",
  ],
};

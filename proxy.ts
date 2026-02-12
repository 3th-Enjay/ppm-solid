import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get auth token from cookie or header
  const authToken = request.cookies.get("auth-storage")?.value

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/courses", "/about", "/contact", "/faq", "/login", "/register", "/forgot-password"]

  // Check if route is public or a course detail page
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith("/courses/")

  // If trying to access protected route without auth, redirect to login
  if (!isPublicRoute && !authToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If authenticated user tries to access auth pages, redirect to dashboard
  if (authToken && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)",
  ],
}

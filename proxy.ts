import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Read JWT auth token from secure cookie set by /api/auth/login
  const authToken = request.cookies.get("token")?.value

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/courses", "/about", "/contact", "/faq", "/login", "/login-admin", "/register", "/forgot-password"]

  // Check if route is public or a course detail page
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith("/courses/")

  // If trying to access protected route without auth, redirect to login and preserve target
  if (!isPublicRoute && !authToken) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Allow authenticated users to access login page (they may want to switch accounts)
  // Only redirect from register page to prevent duplicate accounts
  if (authToken && pathname === "/register") {
    return NextResponse.redirect(new URL("/", request.url))
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

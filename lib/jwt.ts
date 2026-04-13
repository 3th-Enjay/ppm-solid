// JWT helpers for API routes
import type { NextRequest } from "next/server"

export function getTokenFromRequest(request: Request | NextRequest): string | null {
  const cookie = request.headers.get("cookie")
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)token=([^;]+)/)
    if (match) {
      return decodeURIComponent(match[1])
    }
  }

  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7)
  }

  return null
}

import { NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = authService.decodeToken(token)
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const url = new URL(request.url)
    const limitParam = url.searchParams.get("limit")
    const limit = limitParam ? Math.max(1, Math.min(200, Number(limitParam))) : 50

    const db = getDB()
    const logs = await db.getAdminLogs(limit)
    return NextResponse.json({ logs })
  } catch (error) {
    return NextResponse.json({ error: "Failed to load logs" }, { status: 500 })
  }
}


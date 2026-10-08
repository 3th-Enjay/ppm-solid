import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { getTokenFromRequest } from "@/lib/jwt"
import { authService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await authService.getCurrentUser(token)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requestedUserId = request.nextUrl.searchParams.get("userId")
    const userId = currentUser.role === "admin" && requestedUserId ? requestedUserId : currentUser.id

    if (requestedUserId && currentUser.role !== "admin" && requestedUserId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = getDB() as any
    const certificates = await db.getCertificatesByUserId(userId)
    const enriched = await Promise.all(
      (certificates || []).map(async (certificate: any) => {
        const course = await db.getCourseById(certificate.courseId)
        return {
          ...certificate,
          course: course
            ? {
                id: course.id,
                title: course.title,
                slug: course.slug,
                thumbnail: course.thumbnail,
                level: course.level,
              }
            : undefined,
        }
      }),
    )

    return NextResponse.json({ certificates: enriched })
  } catch (error) {
    console.error("GET /api/certificates failed:", error)
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 })
  }
}

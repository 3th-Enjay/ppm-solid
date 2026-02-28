import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const db = getDB() as any
    const enrollments = await db.getEnrollmentsByUserId(userId)
    const history = await Promise.all(
      (enrollments || []).map(async (e: any) => {
        const course = await db.getCourseById(e.courseId)
        return {
          id: `history-${e.id}`,
          label: `Enrolled in ${course?.title || "course"}`,
          when: e.enrolledAt,
          courseId: e.courseId,
        }
      }),
    )

    return NextResponse.json({
      history: history.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()),
    })
  } catch (error) {
    console.error("GET /api/history failed:", error)
    return NextResponse.json({ error: "Failed to load learning history" }, { status: 500 })
  }
}


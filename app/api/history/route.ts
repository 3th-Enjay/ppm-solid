import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")
    const page = Number(request.nextUrl.searchParams.get("page") || "1")
    const limit = Number(request.nextUrl.searchParams.get("limit") || "20")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const db = getDB() as any
    const [enrollments, certificates] = await Promise.all([
      db.getEnrollmentsByUserId(userId),
      db.getCertificatesByUserId(userId),
    ])

    const enrollmentEvents = await Promise.all(
      (enrollments || []).map(async (e: any) => {
        const course = await db.getCourseById(e.courseId)
        const events: any[] = [
          {
            id: `history-enroll-${e.id}`,
            type: "enrollment",
            label: `Enrolled in ${course?.title || "course"}`,
            when: e.enrolledAt,
            courseId: e.courseId,
          },
        ]

        ;(e.completedLessons || []).forEach((lessonId: string, i: number) => {
          events.push({
            id: `history-lesson-${e.id}-${lessonId}`,
            type: "lesson_completed",
            label: `Completed a lesson in ${course?.title || "course"}`,
            when: new Date(new Date(e.enrolledAt).getTime() + (i + 1) * 60_000),
            courseId: e.courseId,
          })
        })

        if (e.status === "completed" && e.completedAt) {
          events.push({
            id: `history-course-complete-${e.id}`,
            type: "course_completed",
            label: `Completed ${course?.title || "course"}`,
            when: e.completedAt,
            courseId: e.courseId,
          })
        }

        return events
      }),
    )

    const certificateEvents = await Promise.all(
      (certificates || []).map(async (c: any) => {
        const course = await db.getCourseById(c.courseId)
        return {
          id: `history-certificate-${c.id}`,
          type: "certificate_issued",
          label: `Certificate issued for ${course?.title || "course"}`,
          when: c.issuedAt,
          courseId: c.courseId,
        }
      }),
    )

    const merged = [...enrollmentEvents.flat(), ...certificateEvents].sort(
      (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime(),
    )

    const safeLimit = Math.max(1, Math.min(100, limit))
    const safePage = Math.max(1, page)
    const start = (safePage - 1) * safeLimit
    const items = merged.slice(start, start + safeLimit)

    return NextResponse.json({
      history: items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: merged.length,
        hasMore: start + safeLimit < merged.length,
      },
    })
  } catch (error) {
    console.error("GET /api/history failed:", error)
    return NextResponse.json({ error: "Failed to load learning history" }, { status: 500 })
  }
}


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
    const [enrollments, payments, certificates, notes] = await Promise.all([
      db.getEnrollmentsByUserId(userId),
      db.getPaymentsByUserId(userId),
      db.getCertificatesByUserId(userId),
      db.getNotesByUserId(userId),
    ])

    const enrollmentActivities = await Promise.all(
      (enrollments || []).flatMap(async (e: any) => {
        const course = await db.getCourseById(e.courseId)
        const events: any[] = [
          {
            id: `activity-enroll-${e.id}`,
            type: "course_enrollment",
            title: `Enrolled in ${course?.title || "course"}`,
            when: e.enrolledAt,
          },
          {
            id: `activity-progress-${e.id}`,
            type: "course_progress",
            title: `${e.progress}% progress in ${course?.title || "course"}`,
            when: e.enrolledAt,
          },
        ]
        if (e.status === "completed" && e.completedAt) {
          events.push({
            id: `activity-complete-${e.id}`,
            type: "course_completed",
            title: `Completed ${course?.title || "course"}`,
            when: e.completedAt,
          })
        }
        return events
      }),
    )

    const paymentActivities = (payments || []).map((p: any) => ({
      id: `activity-pay-${p.id}`,
      type: "payment",
      title: `Payment ${p.reference} is ${p.status}`,
      when: p.createdAt,
    }))

    const certificateActivities = (certificates || []).map((c: any) => ({
      id: `activity-certificate-${c.id}`,
      type: "certificate",
      title: `Certificate issued (${c.verificationCode})`,
      when: c.issuedAt,
    }))

    const noteActivities = (notes || []).map((n: any) => ({
      id: `activity-note-${n.id}`,
      type: "note",
      title: `Added note: ${String(n.content).slice(0, 40)}${String(n.content).length > 40 ? "..." : ""}`,
      when: n.updatedAt,
    }))

    const merged = [...enrollmentActivities.flat(), ...paymentActivities, ...certificateActivities, ...noteActivities].sort(
      (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime(),
    )

    const safeLimit = Math.max(1, Math.min(100, limit))
    const safePage = Math.max(1, page)
    const start = (safePage - 1) * safeLimit
    const items = merged.slice(start, start + safeLimit)

    return NextResponse.json({
      activities: items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: merged.length,
        hasMore: start + safeLimit < merged.length,
      },
    })
  } catch (error) {
    console.error("GET /api/activity failed:", error)
    return NextResponse.json({ error: "Failed to load activities" }, { status: 500 })
  }
}


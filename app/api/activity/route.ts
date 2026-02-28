import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const db = getDB() as any
    const [enrollments, payments] = await Promise.all([db.getEnrollmentsByUserId(userId), db.getPaymentsByUserId(userId)])

    const enrollmentActivities = await Promise.all(
      (enrollments || []).map(async (e: any) => {
        const course = await db.getCourseById(e.courseId)
        return {
          id: `activity-enroll-${e.id}`,
          type: "course",
          title: `${e.progress}% progress in ${course?.title || "course"}`,
          when: e.enrolledAt,
        }
      }),
    )

    const paymentActivities = (payments || []).map((p: any) => ({
      id: `activity-pay-${p.id}`,
      type: "payment",
      title: `Payment ${p.reference} is ${p.status}`,
      when: p.createdAt,
    }))

    const activities = [...enrollmentActivities, ...paymentActivities]
      .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
      .slice(0, 20)

    return NextResponse.json({ activities })
  } catch (error) {
    console.error("GET /api/activity failed:", error)
    return NextResponse.json({ error: "Failed to load activities" }, { status: 500 })
  }
}


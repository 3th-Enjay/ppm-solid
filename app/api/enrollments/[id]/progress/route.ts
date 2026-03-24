import { type NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { getDB } from "@/lib/db"
import { syncStudentMilestones } from "@/lib/student-milestones"
import { enrollmentProgressSchema } from "@/lib/validation"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { progress, completedLessons } = enrollmentProgressSchema.parse(body)

    const db = getDB()
    const enrollment = await db.getEnrollmentById(id)

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    const nextStatus = progress >= 100 ? "completed" : enrollment.status === "completed" ? "completed" : "active"
    const updated = await db.updateEnrollment(id, {
      progress,
      completedLessons,
      status: nextStatus,
      ...(progress >= 100 ? { completedAt: enrollment.completedAt || new Date() } : {}),
    })

    if (!updated) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    const user = await db.findUserById(enrollment.userId)
    if (user?.role === "student") {
      await syncStudentMilestones(db, user)
    }

    return NextResponse.json({ enrollment: updated })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Update progress error:", error)
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 })
  }
}

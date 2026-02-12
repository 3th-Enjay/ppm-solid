import { type NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { getDB } from "@/lib/db"
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

    const updated = await db.updateEnrollment(id, {
      progress,
      completedLessons,
    })

    if (!updated) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
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

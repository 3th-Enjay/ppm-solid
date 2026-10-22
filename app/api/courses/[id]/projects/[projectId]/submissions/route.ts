import { type NextRequest, NextResponse } from "next/server"
import { getAcademicDb } from "@/lib/academic-db"
import { getCurrentUserFromRequest } from "@/lib/authorization"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> },
) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: courseId, projectId } = await params
    const academicDb = getAcademicDb()

    if (user.role === "instructor" || user.role === "admin") {
      const submissions = await academicDb.getProjectSubmissionsByCourse(courseId, projectId)
      return NextResponse.json({ submissions })
    }

    // Student gets their own submission
    const submission = await academicDb.getProjectSubmissionByUserAndProject(user.id, projectId)
    return NextResponse.json({ submission: submission || null })
  } catch (error) {
    console.error("Fetch project submissions error:", error)
    return NextResponse.json({ error: "Failed to fetch project submissions" }, { status: 500 })
  }
}

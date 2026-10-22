import { type NextRequest, NextResponse } from "next/server"
import { getAcademicDb } from "@/lib/academic-db"
import { getCurrentUserFromRequest } from "@/lib/authorization"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: courseId } = await params
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get("assignmentId") || undefined
    const projectId = searchParams.get("projectId") || undefined

    const academicDb = getAcademicDb()
    const rubric = await academicDb.getRubricByTarget(courseId, { assignmentId, projectId })

    return NextResponse.json({ rubric: rubric || null })
  } catch (error) {
    console.error("Fetch rubric error:", error)
    return NextResponse.json({ error: "Failed to fetch rubric" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "instructor" && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Only instructors and admins can create rubrics" }, { status: 403 })
    }

    const { id: courseId } = await params
    const body = await request.json()
    const { assignmentId, projectId, title, description, criteria, totalMaxPoints } = body

    if (!title || !Array.isArray(criteria) || criteria.length === 0) {
      return NextResponse.json({ error: "Title and criteria array are required" }, { status: 400 })
    }

    const academicDb = getAcademicDb()
    const rubric = await academicDb.createRubric({
      courseId,
      assignmentId,
      projectId,
      title,
      description,
      criteria,
      totalMaxPoints,
    })

    return NextResponse.json({ rubric }, { status: 201 })
  } catch (error: any) {
    console.error("Create rubric error:", error)
    return NextResponse.json({ error: error.message || "Failed to create rubric" }, { status: 500 })
  }
}

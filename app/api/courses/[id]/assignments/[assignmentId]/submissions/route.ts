import { type NextRequest, NextResponse } from "next/server"
import { getAcademicDb } from "@/lib/academic-db"
import { getCurrentUserFromRequest } from "@/lib/authorization"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> },
) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: courseId, assignmentId } = await params
    const academicDb = getAcademicDb()

    if (user.role === "admin" || user.role === "instructor") {
      const submissions = await academicDb.getAssignmentSubmissionsByCourse(courseId, assignmentId)
      return NextResponse.json({ submissions })
    }

    // Students only see their own submissions
    const allUserSubmissions = await academicDb.getAssignmentSubmissionsByUser(user.id, courseId)
    const submissions = allUserSubmissions.filter((s) => s.assignmentId === assignmentId)
    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("Fetch assignment submissions error:", error)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> },
) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: courseId, assignmentId } = await params
    const body = await request.json()
    const { content, artifactUrls, lessonId } = body

    if (!content && (!artifactUrls || artifactUrls.length === 0)) {
      return NextResponse.json(
        { error: "Submission must contain either text content or artifact URLs" },
        { status: 400 },
      )
    }

    const academicDb = getAcademicDb()
    const submission = await academicDb.createAssignmentSubmission({
      assignmentId,
      courseId,
      lessonId,
      userId: user.id,
      content,
      artifactUrls: Array.isArray(artifactUrls) ? artifactUrls : [],
    })

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error: any) {
    console.error("Create assignment submission error:", error)
    return NextResponse.json({ error: error.message || "Failed to create submission" }, { status: 500 })
  }
}

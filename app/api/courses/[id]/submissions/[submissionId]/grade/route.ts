import { type NextRequest, NextResponse } from "next/server"
import { getAcademicDb } from "@/lib/academic-db"
import { getCurrentUserFromRequest } from "@/lib/authorization"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> },
) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { submissionId } = await params
    const { searchParams } = new URL(request.url)
    const submissionType = (searchParams.get("type") || "assignment") as "assignment" | "project"

    const academicDb = getAcademicDb()
    const grade = await academicDb.getGradeBySubmission(submissionType, submissionId)

    if (!grade) {
      return NextResponse.json({ grade: null, history: [] })
    }

    // Access check: student can only see their own grade
    if (user.role === "student" && grade.studentId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let history: any[] = []
    if (user.role === "instructor" || user.role === "admin") {
      history = await academicDb.getGradeHistory(grade.id)
    }

    return NextResponse.json({ grade, history })
  } catch (error) {
    console.error("Fetch grade error:", error)
    return NextResponse.json({ error: "Failed to fetch grade" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> },
) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "instructor" && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Only instructors and admins can grade" }, { status: 403 })
    }

    const { id: courseId, submissionId } = await params
    const body = await request.json()
    const {
      submissionType = "assignment",
      studentId,
      score,
      maxScore = 100,
      rubricScores,
      feedback,
      reason,
    } = body

    if (!studentId || score === undefined) {
      return NextResponse.json({ error: "studentId and score are required" }, { status: 400 })
    }

    const academicDb = getAcademicDb()
    const grade = await academicDb.gradeSubmission({
      submissionType,
      submissionId,
      courseId,
      studentId,
      instructorId: user.id,
      score: Number(score),
      maxScore: Number(maxScore),
      rubricScores: Array.isArray(rubricScores) ? rubricScores : [],
      feedback,
      reason,
    })

    return NextResponse.json({ grade }, { status: 200 })
  } catch (error: any) {
    console.error("Grade submission error:", error)
    return NextResponse.json({ error: error.message || "Failed to grade submission" }, { status: 500 })
  }
}

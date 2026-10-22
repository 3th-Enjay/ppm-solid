import { type NextRequest, NextResponse } from "next/server"
import { getAcademicDb } from "@/lib/academic-db"
import { getCurrentUserFromRequest } from "@/lib/authorization"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string; attemptId: string }> },
) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { attemptId } = await params
    const academicDb = getAcademicDb()
    const attempt = await academicDb.getQuizAttemptById(attemptId)

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    }

    // Authorization check
    if (attempt.userId !== user.id && user.role !== "admin" && user.role !== "instructor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ attempt })
  } catch (error) {
    console.error("Fetch quiz attempt error:", error)
    return NextResponse.json({ error: "Failed to fetch attempt" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string; attemptId: string }> },
) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { attemptId } = await params
    const body = await request.json()
    const { answers } = body

    if (!Array.isArray(answers)) {
      return NextResponse.json({ error: "Answers array is required" }, { status: 400 })
    }

    const academicDb = getAcademicDb()
    const result = await academicDb.submitQuizAttempt({
      attemptId,
      userId: user.id,
      answers,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Submit quiz attempt error:", error)
    if (error?.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error?.message?.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || "Failed to submit attempt" }, { status: 500 })
  }
}

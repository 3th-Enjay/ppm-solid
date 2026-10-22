import { type NextRequest, NextResponse } from "next/server"
import { getAcademicDb } from "@/lib/academic-db"
import { getCurrentUserFromRequest } from "@/lib/authorization"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> },
) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { quizId } = await params
    const academicDb = getAcademicDb()
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get("mode")

    if (mode === "questions") {
      // Return student-safe masked quiz questions without answers or explanations
      const studentQuiz = await academicDb.getQuizForStudent(quizId)
      if (!studentQuiz) {
        return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
      }
      return NextResponse.json({ quiz: studentQuiz })
    }

    // Return student's previous attempts for this quiz
    const attempts = await academicDb.getQuizAttemptsByUserAndQuiz(user.id, quizId)
    return NextResponse.json({ attempts })
  } catch (error) {
    console.error("Quiz attempts fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch quiz attempts" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> },
) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: courseId, quizId } = await params
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      // optional body
    }

    const academicDb = getAcademicDb()
    const attempt = await academicDb.createQuizAttempt({
      quizId,
      courseId,
      lessonId: body.lessonId,
      userId: user.id,
    })

    return NextResponse.json({ attempt }, { status: 201 })
  } catch (error: any) {
    console.error("Quiz attempt start error:", error)
    return NextResponse.json({ error: error.message || "Failed to start quiz attempt" }, { status: 500 })
  }
}

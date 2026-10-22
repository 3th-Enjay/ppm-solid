import { type NextRequest, NextResponse } from "next/server"
import { getAcademicDb } from "@/lib/academic-db"
import { getCurrentUserFromRequest } from "@/lib/authorization"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: courseId } = await params
    const academicDb = getAcademicDb()
    const projects = await academicDb.getProjectsByCourse(courseId)

    const user = await getCurrentUserFromRequest(request)
    let mySubmissions: any[] = []

    if (user && user.role === "student") {
      const userSubmissions = await Promise.all(
        projects.map((p) => academicDb.getProjectSubmissionByUserAndProject(user.id, p.id)),
      )
      mySubmissions = userSubmissions.filter(Boolean)
    }

    return NextResponse.json({ projects, submissions: mySubmissions })
  } catch (error) {
    console.error("Fetch projects error:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
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

    const { id: courseId } = await params
    const body = await request.json()
    const academicDb = getAcademicDb()

    // If instructor/admin: create a capstone project definition
    if (user.role === "instructor" || user.role === "admin") {
      const { title, description, instructions, maxScore, dueDate } = body
      if (!title || !description) {
        return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
      }

      const project = await academicDb.createProject({
        courseId,
        title,
        description,
        instructions,
        maxScore: maxScore ? Number(maxScore) : 100,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      })

      return NextResponse.json({ project }, { status: 201 })
    }

    // If student: submit a capstone project submission
    const { projectId, title, description, repositoryUrl, liveDemoUrl, artifacts } = body
    if (!projectId || !title) {
      return NextResponse.json({ error: "projectId and title are required for project submission" }, { status: 400 })
    }

    const submission = await academicDb.createProjectSubmission({
      projectId,
      courseId,
      userId: user.id,
      title,
      description,
      repositoryUrl,
      liveDemoUrl,
      artifacts: Array.isArray(artifacts) ? artifacts : [],
    })

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error: any) {
    console.error("Create project / submission error:", error)
    return NextResponse.json({ error: error.message || "Failed to process project request" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getAcademicDb } from "@/lib/academic-db"
import { getDB } from "@/lib/db"
import { getCurrentUserFromRequest } from "@/lib/authorization"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "instructor" && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Instructor or admin access required" }, { status: 403 })
    }

    const { id: courseId } = await params
    const db = getDB()
    const course = await db.getCourseById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (user.role !== "admin" && course.instructorId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this course" }, { status: 403 })
    }

    const academicDb = getAcademicDb()
    const [assignmentSubmissions, projectSubmissions] = await Promise.all([
      academicDb.getAssignmentSubmissionsByCourse(courseId),
      academicDb.getProjectSubmissionsByCourse(courseId),
    ])

    // Collect all student user IDs to decorate with safe names
    const userIds = Array.from(
      new Set([
        ...assignmentSubmissions.map((s) => s.userId),
        ...projectSubmissions.map((s) => s.userId),
      ]),
    )

    const studentUsers = await Promise.all(userIds.map((id) => db.findUserById(id)))
    const userMap = new Map<string, { id: string; name: string; email: string }>()
    for (const u of studentUsers) {
      if (u) {
        userMap.set(u.id, { id: u.id, name: u.name || "Student", email: u.email || "" })
      }
    }

    // Attach student info and existing grade
    const decoratedAssignments = await Promise.all(
      assignmentSubmissions.map(async (sub) => {
        const grade = await academicDb.getGradeBySubmission("assignment", sub.id)
        return {
          ...sub,
          student: userMap.get(sub.userId) || { id: sub.userId, name: "Student", email: "" },
          grade: grade || null,
        }
      }),
    )

    const decoratedProjects = await Promise.all(
      projectSubmissions.map(async (sub) => {
        const grade = await academicDb.getGradeBySubmission("project", sub.id)
        return {
          ...sub,
          student: userMap.get(sub.userId) || { id: sub.userId, name: "Student", email: "" },
          grade: grade || null,
        }
      }),
    )

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
      },
      assignmentSubmissions: decoratedAssignments,
      projectSubmissions: decoratedProjects,
    })
  } catch (error) {
    console.error("Fetch course submissions error:", error)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}

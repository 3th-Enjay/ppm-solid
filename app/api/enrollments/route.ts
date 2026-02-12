import { type NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { getDB } from "@/lib/db"
import { enrollmentCreateSchema } from "@/lib/validation"
import { maskCourseForUser } from "@/lib/utils/course-masking"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const courseId = searchParams.get("courseId")
    const courseIds = searchParams.get("courseIds")
    const all = searchParams.get("all") === "true"

    const db = getDB()
    let enrollments: any[] = []

    if (all) {
      enrollments = await db.getAllEnrollments()
    } else if (userId) {
      enrollments = await db.getEnrollmentsByUserId(userId)
    } else if (courseId || courseIds) {
      const ids = courseIds ? courseIds.split(",") : [courseId as string]
      const allEnrollments = await db.getAllEnrollments()
      enrollments = allEnrollments.filter((e: any) => ids.includes(e.courseId))
    } else {
      return NextResponse.json({ error: "Query parameters are required" }, { status: 400 })
    }

    // Add course details to each enrollment and mask video URLs for non-privileged users
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    let user = null
    if (token) {
      try {
        const { authService } = await import("@/lib/auth")
        user = await authService.getCurrentUser(token)
      } catch (e) {
        user = null
      }
    }

    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment: any) => {
        const course = await db.getCourseById(enrollment.courseId)
        if (!course) return { ...enrollment, course }

        const safeCourse = maskCourseForUser(course, user)

        return { ...enrollment, course: safeCourse }
      })
    )

    return NextResponse.json({ enrollments: enrichedEnrollments })
  } catch (error) {
    console.error("Get enrollments error:", error)
    return NextResponse.json({ error: "Failed to get enrollments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, courseId } = enrollmentCreateSchema.parse(body)

    const db = getDB()
    // Check if already enrolled
    const existing = await db.getEnrollment(userId, courseId)

    if (existing) {
      return NextResponse.json({ error: "Already enrolled in this course" }, { status: 400 })
    }

    // Create enrollment
    const enrollment = await db.createEnrollment({
      userId,
      courseId,
      progress: 0,
      completedLessons: [],
      status: "active",
      enrolledAt: new Date(),
    })

    const user = await db.findUserById(userId)
    if (user) {
      const updatedCourses = Array.from(new Set([...(user.enrolledCourses || []), courseId]))
      await db.updateUser(userId, { enrolledCourses: updatedCourses })
    }

    return NextResponse.json({ enrollment }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Create enrollment error:", error)
    return NextResponse.json({ error: "Failed to create enrollment" }, { status: 500 })
  }
}

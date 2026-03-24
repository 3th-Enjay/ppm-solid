import { type NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { getDB } from "@/lib/db"
import { getTokenFromRequest } from "@/lib/jwt"
import { authService } from "@/lib/auth"
import { syncStudentMilestones } from "@/lib/student-milestones"
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
      const token = getTokenFromRequest(request)
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const session = authService.decodeToken(token)
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      if (session.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      enrollments = await db.getAllEnrollments()
    } else if (userId) {
      enrollments = await db.getEnrollmentsByUserId(userId)
      const user = await db.findUserById(userId)
      if (
        user?.role === "student" &&
        user.studentProfile &&
        (user.studentProfile.trainingMode === "onsite" ||
          (!user.studentProfile.trainingMode && (user.studentProfile.registrationFeeNgn || 0) > 0))
      ) {
        const payments = await db.getPaymentsByUserId(userId)
        const hasCompletedOnsitePayment = (payments || []).some(
          (payment: any) =>
            payment.paymentType === "onsite_registration" &&
            (payment.status === "completed" || payment.status === "success"),
        )
        if (hasCompletedOnsitePayment) {
          const allCourses = await db.getAllCourses()
          const existingCourseIds = new Set(enrollments.map((item: any) => item.courseId))
          let created = false

          for (const course of allCourses || []) {
            if (existingCourseIds.has(course.id)) continue
            const enrollment = await db.createEnrollment({
              userId,
              courseId: course.id,
              progress: 0,
              completedLessons: [],
              status: "active",
              enrolledAt: new Date(),
            })
            enrollments.push(enrollment)
            existingCourseIds.add(course.id)
            created = true
          }

          if (created) {
            const updatedUser = await db.updateUser(userId, {
              enrolledCourses: Array.from(existingCourseIds),
            })
            if (updatedUser?.role === "student") {
              await syncStudentMilestones(db, updatedUser)
            }
          }
        }
      }
    } else if (courseId || courseIds) {
      const ids = courseIds ? courseIds.split(",") : [courseId as string]
      const allEnrollments = await db.getAllEnrollments()
      enrollments = allEnrollments.filter((e: any) => ids.includes(e.courseId))
    } else {
      return NextResponse.json({ error: "Query parameters are required" }, { status: 400 })
    }

    const token = getTokenFromRequest(request)
    let user = null
    if (token) {
      try {
        user = await authService.getCurrentUser(token)
      } catch {
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
    const existing = await db.getEnrollment(userId, courseId)

    if (existing) {
      return NextResponse.json({ error: "Already enrolled in this course" }, { status: 400 })
    }

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
      const updatedUser = await db.updateUser(userId, { enrolledCourses: updatedCourses })
      if (updatedUser?.role === "student") {
        await syncStudentMilestones(db, updatedUser)
      }
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

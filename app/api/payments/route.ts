import { type NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import type { Payment } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const userId = searchParams.get("userId")
    const reference = searchParams.get("reference")
    const status = searchParams.get("status")
    const currency = searchParams.get("currency")
    const courseId = searchParams.get("courseId")
    const courseIds = searchParams.get("courseIds")
    const includeDetails = searchParams.get("includeDetails") === "true"

    const db = getDB()
    let payments: Payment[] = await db.getAllPayments()

    if (id) {
      payments = payments.filter((payment) => payment.id === id)
    }

    if (reference) {
      const payment = await db.getPaymentByReference(reference)
      payments = payment ? [payment] : []
    }

    if (userId) {
      payments = payments.filter((p) => p.userId === userId)
    }

    if (status) {
      payments = payments.filter((p) => p.status === status)
    }

    if (currency) {
      payments = payments.filter((p) => p.currency === currency)
    }

    if (courseId || courseIds) {
      const ids = courseIds ? courseIds.split(",") : [courseId as string]
      payments = payments.filter((p) => {
        if (ids.includes(p.courseId)) return true
        if (p.courseIds && p.courseIds.some((id) => ids.includes(id))) return true
        return false
      })
    }

    if (!includeDetails) {
      return NextResponse.json({ payments })
    }

    const [users, courses] = await Promise.all([
      typeof (db as any).getAllUsers === "function" ? (db as any).getAllUsers() : Promise.resolve([]),
      typeof (db as any).getAllCoursesIncludingDrafts === "function"
        ? (db as any).getAllCoursesIncludingDrafts()
        : Promise.resolve([]),
    ])
    const userById = new Map((users || []).map((user: any) => [user.id, user]))
    const courseById = new Map((courses || []).map((course: any) => [course.id, course]))

    const enriched = payments.map((payment) => {
      const resolvedCourseIds =
        payment.courseIds && payment.courseIds.length > 0 ? payment.courseIds : [payment.courseId]
      const paymentCourses = resolvedCourseIds
        .map((resolvedId) => {
          const course = courseById.get(resolvedId) as any
          if (!course) return null
          return {
            id: course.id,
            title: course.title,
            slug: course.slug,
            thumbnail: course.thumbnail,
            level: course.level,
            category: course.category,
          }
        })
        .filter(Boolean)

      const user = userById.get(payment.userId) as any
      return {
        ...payment,
        user: user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            }
          : undefined,
        courses: paymentCourses,
      }
    })

    return NextResponse.json({ payments: enriched })
  } catch (error) {
    console.error("Get payments error:", error)
    return NextResponse.json({ error: "Failed to get payments" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { getTokenFromRequest } from "@/lib/jwt"
import { authService } from "@/lib/auth"
import type { Payment } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await authService.getCurrentUser(token)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    const isPrivilegedRole = currentUser.role === "admin" || currentUser.role === "finance"

    if (currentUser.role === "student") {
      payments = payments.filter((payment: Payment) => payment.userId === currentUser.id)
      if (userId && userId !== currentUser.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else if (currentUser.role === "instructor") {
      const instructorCourses = await db.getCoursesByInstructor(currentUser.id)
      const instructorCourseIds = new Set((instructorCourses || []).map((course: any) => course.id))
      payments = payments.filter((payment: Payment) => {
        if (instructorCourseIds.has(payment.courseId)) return true
        return Boolean(payment.courseIds?.some((value: string) => instructorCourseIds.has(value)))
      })

      if (userId) {
        payments = payments.filter((payment: Payment) => payment.userId === userId)
      }
    } else if (!isPrivilegedRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (id) {
      payments = payments.filter((payment: Payment) => payment.id === id)
    }

    if (reference) {
      payments = payments.filter((payment: Payment) => payment.reference === reference)
    }

    if (userId && currentUser.role !== "instructor") {
      payments = payments.filter((payment: Payment) => payment.userId === userId)
    }

    if (status) {
      payments = payments.filter((payment: Payment) => payment.status === status)
    }

    if (currency) {
      payments = payments.filter((payment: Payment) => payment.currency === currency)
    }

    if (courseId || courseIds) {
      const ids = courseIds ? courseIds.split(",") : [courseId as string]
      payments = payments.filter((payment: Payment) => {
        if (ids.includes(payment.courseId)) return true
        if (payment.courseIds && payment.courseIds.some((value: string) => ids.includes(value))) return true
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

    const enriched = payments.map((payment: Payment) => {
      const resolvedCourseIds = payment.courseIds && payment.courseIds.length > 0 ? payment.courseIds : [payment.courseId]
      const paymentCourses = resolvedCourseIds
        .map((resolvedId: string) => {
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

      const relatedUser = userById.get(payment.userId) as any
      const includeUserDetails = isPrivilegedRole

      return {
        ...payment,
        user: includeUserDetails && relatedUser
          ? {
              id: relatedUser.id,
              name: relatedUser.name,
              email: relatedUser.email,
              role: relatedUser.role,
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

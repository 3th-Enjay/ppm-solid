import type { Course, Enrollment, Payment, User } from "@/lib/types"

const monthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
  })

export function buildAdminRevenueTrend(payments: Payment[]) {
  const completed = payments.filter((p) => p.status === "completed" || p.status === "success")
  const monthly = new Map<string, number>()

  for (const payment of completed) {
    const date = new Date(payment.createdAt)
    const key = monthLabel(date)
    const value = monthly.get(key) || 0
    // Normalize rough view in NGN equivalent.
    const amount =
      payment.currency === "NGN" ? payment.amount : payment.currency === "USD" ? payment.amount * 1250 : payment.amount * 1580
    monthly.set(key, value + amount)
  }

  return Array.from(monthly.entries()).map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }))
}

export function buildRoleDistribution(users: User[]) {
  const roleCount = new Map<string, number>()
  for (const user of users) {
    roleCount.set(user.role, (roleCount.get(user.role) || 0) + 1)
  }
  return Array.from(roleCount.entries()).map(([role, total]) => ({ role, total }))
}

export function buildFinanceCurrencyRevenue(payments: Payment[]) {
  const completed = payments.filter((p) => p.status === "completed" || p.status === "success")
  const grouped = new Map<string, number>()
  for (const p of completed) {
    grouped.set(p.currency, (grouped.get(p.currency) || 0) + p.amount)
  }
  return Array.from(grouped.entries()).map(([currency, total]) => ({ currency, total }))
}

export function buildFinanceStatusMix(payments: Payment[]) {
  const grouped = new Map<string, number>()
  for (const p of payments) {
    grouped.set(p.status, (grouped.get(p.status) || 0) + 1)
  }
  return Array.from(grouped.entries()).map(([status, total]) => ({ status, total }))
}

export function buildInstructorEnrollmentByCourse(courses: Course[], enrollments: Enrollment[]) {
  return courses.map((course) => {
    const count = enrollments.filter((e) => e.courseId === course.id).length
    return { course: course.title.slice(0, 16), enrollments: count }
  })
}

export function buildInstructorCourseQuality(courses: Course[]) {
  return courses.map((course) => ({
    course: course.title.slice(0, 16),
    rating: Number(course.rating.toFixed(1)),
    published: course.published ? 1 : 0,
  }))
}


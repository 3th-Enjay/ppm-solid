"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BarChart3, BookOpen, CreditCard, TrendingUp, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Course, Enrollment, Payment, User } from "@/lib/types"
import { useAuthStore } from "@/lib/store"

export default function AdminAnalyticsPage() {
  const { token } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    const loadData = async () => {
      if (!token) return
      try {
        const [usersRes, coursesRes, enrollmentsRes, paymentsRes] = await Promise.all([
          fetch("/api/users", {
            headers: {
              Authorization: `Bearer ${token || ""}`,
            },
          }),
          fetch("/api/courses?includeDrafts=true"),
          fetch("/api/enrollments?all=true"),
          fetch("/api/payments"),
        ])

        const usersData = await usersRes.json()
        const coursesData = await coursesRes.json()
        const enrollmentsData = await enrollmentsRes.json()
        const paymentsData = await paymentsRes.json()

        setUsers(usersData.users || [])
        setCourses(coursesData.courses || [])
        setEnrollments(enrollmentsData.enrollments || [])
        setPayments(paymentsData.payments || [])
      } catch (error) {
        console.error("Error loading analytics data:", error)
      }
    }

    loadData()
  }, [token])

  const analytics = useMemo(() => {
    const students = users.filter((u) => u.role === "student")
    const instructors = users.filter((u) => u.role === "instructor")
    const admins = users.filter((u) => u.role === "admin")
    const financeUsers = users.filter((u) => u.role === "finance")

    const completedPayments = payments.filter((p) => p.status === "completed" || p.status === "success")
    const pendingPayments = payments.filter((p) => p.status === "pending")
    const failedPayments = payments.filter((p) => p.status === "failed")
    const refundedPayments = payments.filter((p) => p.status === "refunded")

    const totalRevenueNgn = completedPayments.reduce((sum, payment) => {
      if (payment.currency === "NGN") return sum + payment.amount
      if (payment.currency === "USD") return sum + payment.amount * 1250
      if (payment.currency === "EUR") return sum + payment.amount * 1350
      if (payment.currency === "GBP") return sum + payment.amount * 1580
      return sum
    }, 0)

    const enrollmentsByCourse = enrollments.reduce<Record<string, number>>((acc, enrollment) => {
      acc[enrollment.courseId] = (acc[enrollment.courseId] || 0) + 1
      return acc
    }, {})

    const topCourses = Object.entries(enrollmentsByCourse)
      .map(([courseId, count]) => {
        const course = courses.find((c) => c.id === courseId)
        return {
          courseId,
          title: course?.title || "Unknown course",
          count,
          published: course?.published || false,
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    const monthlyRevenue = completedPayments.reduce<Record<string, number>>((acc, payment) => {
      const month = new Date(payment.createdAt).toLocaleString("en-US", { month: "short", year: "2-digit" })
      if (!acc[month]) acc[month] = 0

      if (payment.currency === "NGN") acc[month] += payment.amount
      if (payment.currency === "USD") acc[month] += payment.amount * 1250
      if (payment.currency === "EUR") acc[month] += payment.amount * 1350
      if (payment.currency === "GBP") acc[month] += payment.amount * 1580

      return acc
    }, {})

    const monthlyTrend = Object.entries(monthlyRevenue)
      .map(([month, amount]) => ({ month, amount }))
      .slice(-6)

    return {
      totalUsers: users.length,
      totalCourses: courses.length,
      totalEnrollments: enrollments.length,
      totalRevenueNgn,
      students: students.length,
      instructors: instructors.length,
      admins: admins.length,
      financeUsers: financeUsers.length,
      completedPayments: completedPayments.length,
      pendingPayments: pendingPayments.length,
      failedPayments: failedPayments.length,
      refundedPayments: refundedPayments.length,
      topCourses,
      monthlyTrend,
    }
  }, [users, courses, enrollments, payments])

  const maxTopCourse = analytics.topCourses[0]?.count || 1

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-2">Platform growth, revenue, and engagement insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Students, instructors, and staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Including drafts and published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">Learner seats filled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue (NGN est.)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N{analytics.totalRevenueNgn.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Converted to Naira estimate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>User Mix</CardTitle>
            <CardDescription>Distribution by account role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm"><span>Students</span><Badge>{analytics.students}</Badge></div>
            <div className="flex items-center justify-between text-sm"><span>Instructors</span><Badge variant="secondary">{analytics.instructors}</Badge></div>
            <div className="flex items-center justify-between text-sm"><span>Admins</span><Badge variant="outline">{analytics.admins}</Badge></div>
            <div className="flex items-center justify-between text-sm"><span>Finance</span><Badge variant="outline">{analytics.financeUsers}</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Health</CardTitle>
            <CardDescription>Transaction status distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm"><span>Completed</span><Badge className="bg-green-600">{analytics.completedPayments}</Badge></div>
            <div className="flex items-center justify-between text-sm"><span>Pending</span><Badge variant="secondary">{analytics.pendingPayments}</Badge></div>
            <div className="flex items-center justify-between text-sm"><span>Failed</span><Badge variant="destructive">{analytics.failedPayments}</Badge></div>
            <div className="flex items-center justify-between text-sm"><span>Refunded</span><Badge className="bg-blue-600">{analytics.refundedPayments}</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Last six revenue buckets (NGN est.)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.monthlyTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed payments yet.</p>
            ) : (
              analytics.monthlyTrend.map((item) => (
                <div key={item.month} className="flex items-center justify-between text-sm">
                  <span>{item.month}</span>
                  <span className="font-medium">N{Math.round(item.amount).toLocaleString()}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Top Courses by Enrollment
          </CardTitle>
          <CardDescription>Most subscribed courses across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.topCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enrollments found yet.</p>
          ) : (
            <div className="space-y-4">
              {analytics.topCourses.map((course) => (
                <div key={course.courseId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{course.title}</div>
                    <div className="text-sm text-muted-foreground">{course.count} enrollments</div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.max(8, Math.round((course.count / maxTopCourse) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BarChart3, BookOpen, TrendingUp, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Course, Enrollment, Payment } from "@/lib/types"
import { useAuthStore } from "@/lib/store"

export default function InstructorAnalyticsPage() {
  const { user, token } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    const load = async () => {
      if (!user) return
      try {
        const coursesRes = await fetch(`/api/courses?instructorId=${user.id}&includeDrafts=true`, {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        })
        const coursesData = await coursesRes.json()
        const instructorCourses = coursesData.courses || []
        setCourses(instructorCourses)

        const courseIds = instructorCourses.map((course: Course) => course.id)
        const courseIdQuery = courseIds.join(",")

        if (courseIds.length === 0) {
          setEnrollments([])
          setPayments([])
          return
        }

        const [enrollmentsRes, paymentsRes] = await Promise.all([
          fetch(`/api/enrollments?courseIds=${courseIdQuery}`, {
            headers: {
              Authorization: `Bearer ${token || ""}`,
            },
          }),
          fetch(`/api/payments?courseIds=${courseIdQuery}`, {
            headers: {
              Authorization: `Bearer ${token || ""}`,
            },
          }),
        ])

        const enrollmentsData = await enrollmentsRes.json()
        const paymentsData = await paymentsRes.json()
        setEnrollments(enrollmentsData.enrollments || [])
        setPayments(paymentsData.payments || [])
      } catch (error) {
        console.error("Failed to load instructor analytics:", error)
      }
    }

    load()
  }, [user, token])

  const analytics = useMemo(() => {
    const totalCourses = courses.length
    const publishedCourses = courses.filter((c) => c.published).length
    const draftCourses = courses.filter((c) => !c.published).length

    const uniqueStudents = new Set(enrollments.map((e) => e.userId)).size
    const totalEnrollments = enrollments.length

    const completedPayments = payments.filter((p) => p.status === "completed" || p.status === "success")
    const totalRevenueNgn = completedPayments.reduce((sum, payment) => {
      if (payment.currency === "NGN") return sum + payment.amount
      if (payment.currency === "USD") return sum + payment.amount * 1250
      if (payment.currency === "EUR") return sum + payment.amount * 1350
      if (payment.currency === "GBP") return sum + payment.amount * 1580
      return sum
    }, 0)

    const avgRating =
      courses.length > 0
        ? courses.reduce((sum, course) => sum + (course.rating || 0), 0) / courses.length
        : 0

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

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      uniqueStudents,
      totalEnrollments,
      totalRevenueNgn,
      avgRating: Number(avgRating.toFixed(1)),
      topCourses,
    }
  }, [courses, enrollments, payments])

  const maxTopCourse = analytics.topCourses[0]?.count || 1

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/instructor">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Instructor Analytics</h1>
        <p className="text-muted-foreground mt-2">Track course performance and student engagement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.publishedCourses} published, {analytics.draftCourses} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unique Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueStudents}</div>
            <p className="text-xs text-muted-foreground">Learners enrolled in your courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">Seats filled across courses</p>
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
            <CardTitle>Average Rating</CardTitle>
            <CardDescription>Across all your courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgRating} / 5</div>
            <p className="text-xs text-muted-foreground">Based on student feedback</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Courses by Enrollment</CardTitle>
            <CardDescription>Your most popular courses</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No enrollments yet.</p>
            ) : (
              <div className="space-y-4">
                {analytics.topCourses.map((course) => (
                  <div key={course.courseId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{course.title}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {course.published ? <Badge>Published</Badge> : <Badge variant="secondary">Draft</Badge>}
                        {course.count} enrollments
                      </div>
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
    </div>
  )
}

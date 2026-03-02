"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Award, BarChart3, BookOpen, TrendingUp, Users } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RoleAnalyticsCard } from "@/components/skillup/role-analytics-card"
import type { Course, Enrollment, Payment } from "@/lib/types"
import { useAuthStore } from "@/lib/store"
import { buildInstructorCourseQuality, buildInstructorEnrollmentByCourse } from "@/lib/analytics/adapters"
import { roleAnalyticsRegistry } from "@/lib/analytics/registry"

export default function InstructorAnalyticsPage() {
  const { user, token } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    const load = async () => {
      if (!user) return
      try {
        const coursesRes = await fetch(`/api/courses?instructorId=${encodeURIComponent(user.id)}&includeDrafts=true`, {
          headers: { Authorization: `Bearer ${token || ""}` },
        })
        const coursesData = await coursesRes.json()
        const instructorCourses = coursesData.courses || []
        setCourses(instructorCourses)

        const courseIds = instructorCourses.map((course: Course) => course.id)
        if (courseIds.length === 0) {
          setEnrollments([])
          setPayments([])
          return
        }

        const query = courseIds.join(",")
        const [enrollmentsRes, paymentsRes] = await Promise.all([
          fetch(`/api/enrollments?courseIds=${query}`, { headers: { Authorization: `Bearer ${token || ""}` } }),
          fetch(`/api/payments?courseIds=${query}`, { headers: { Authorization: `Bearer ${token || ""}` } }),
        ])

        const enrollmentsData = await enrollmentsRes.json()
        const paymentsData = await paymentsRes.json()
        setEnrollments(enrollmentsData.enrollments || [])
        setPayments(paymentsData.payments || [])
      } catch (error) {
        console.error("Failed to load instructor analytics:", error)
      }
    }

    void load()
  }, [user, token])

  const stats = useMemo(() => {
    const uniqueStudents = new Set(enrollments.map((e) => e.userId)).size
    const completedPayments = payments.filter((p) => p.status === "completed" || p.status === "success")
    const totalRevenueNgn = completedPayments.reduce((sum, payment) => {
      if (payment.currency === "NGN") return sum + payment.amount
      if (payment.currency === "USD") return sum + payment.amount * 1250
      if (payment.currency === "GBP") return sum + payment.amount * 1580
      return sum
    }, 0)
    const avgRating = courses.length > 0 ? courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length : 0
    return {
      totalCourses: courses.length,
      publishedCourses: courses.filter((c) => c.published).length,
      uniqueStudents,
      totalEnrollments: enrollments.length,
      totalRevenueNgn,
      avgRating: Number(avgRating.toFixed(1)),
    }
  }, [courses, enrollments, payments])

  const enrollmentByCourse = buildInstructorEnrollmentByCourse(courses, enrollments)
  const qualityByCourse = buildInstructorCourseQuality(courses)
  const completionMix = useMemo(() => {
    const completed = enrollments.filter((e) => e.status === "completed").length
    const active = enrollments.filter((e) => e.status === "active").length
    const expired = enrollments.filter((e) => e.status === "expired").length
    return [
      { status: "Completed", total: completed },
      { status: "Active", total: active },
      { status: "Expired", total: expired },
    ].filter((x) => x.total > 0)
  }, [enrollments])
  const [enrollmentMeta, qualityMeta] = roleAnalyticsRegistry.instructor
  const pieColors = ["#22c7a8", "#4f46e5", "#ef4444"]

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="space-y-4">
        <Link href="/instructor">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">Instructor Analytics</h1>
          <p className="mt-1 text-muted-foreground">Measure learner progress, course quality, and revenue outcomes.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.totalCourses}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.publishedCourses}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.uniqueStudents}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.avgRating}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue (NGN est.)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">N{stats.totalRevenueNgn.toLocaleString()}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RoleAnalyticsCard title={enrollmentMeta.title} subtitle={enrollmentMeta.subtitle}>
          {enrollmentByCourse.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentByCourse}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="course" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="enrollments" fill="var(--accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No enrollment data.</div>
          )}
        </RoleAnalyticsCard>

        <RoleAnalyticsCard title={qualityMeta.title} subtitle={qualityMeta.subtitle}>
          {qualityByCourse.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qualityByCourse}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="course" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="rating" stroke="var(--primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No quality data.</div>
          )}
        </RoleAnalyticsCard>
      </div>

      <RoleAnalyticsCard title="Enrollment Completion Mix" subtitle="How learners are progressing in your courses">
        {completionMix.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={completionMix} dataKey="total" nameKey="status" outerRadius={100} label>
                {completionMix.map((item, index) => (
                  <Cell key={item.status} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No completion data.</div>
        )}
      </RoleAnalyticsCard>
    </div>
  )
}

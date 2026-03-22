"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BarChart3, BookOpen, TrendingUp, Users } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RoleAnalyticsCard } from "@/components/skillup/role-analytics-card"
import type { Course, Enrollment, Payment, User } from "@/lib/types"
import { useAuthStore } from "@/lib/store"
import { buildAdminRevenueTrend, buildFinanceStatusMix, buildRoleDistribution } from "@/lib/analytics/adapters"
import { roleAnalyticsRegistry } from "@/lib/analytics/registry"

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
            headers: { Authorization: `Bearer ${token || ""}` },
          }),
          fetch("/api/courses?includeDrafts=true"),
          fetch("/api/enrollments?all=true", {
            headers: {
              Authorization: `Bearer ${token || ""}`,
            },
          }),
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

    void loadData()
  }, [token])

  const stats = useMemo(() => {
    const completedPayments = payments.filter((p) => p.status === "completed" || p.status === "success")
    const totalRevenueNgn = completedPayments.reduce((sum, payment) => {
      if (payment.currency === "NGN") return sum + payment.amount
      if (payment.currency === "USD") return sum + payment.amount * 1250
      if (payment.currency === "GBP") return sum + payment.amount * 1580
      return sum
    }, 0)
    return {
      totalUsers: users.length,
      totalCourses: courses.length,
      totalEnrollments: enrollments.length,
      totalRevenueNgn,
    }
  }, [users, courses, enrollments, payments])

  const topCourses = useMemo(() => {
    const enrollmentsByCourse = enrollments.reduce<Record<string, number>>((acc, enrollment) => {
      acc[enrollment.courseId] = (acc[enrollment.courseId] || 0) + 1
      return acc
    }, {})

    return Object.entries(enrollmentsByCourse)
      .map(([courseId, count]) => ({
        course: (courses.find((course) => course.id === courseId)?.title || "Unknown").slice(0, 20),
        enrollments: count,
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 8)
  }, [courses, enrollments])

  const revenueTrend = buildAdminRevenueTrend(payments)
  const roleDistribution = buildRoleDistribution(users)
  const paymentStatusMix = buildFinanceStatusMix(payments)
  const [revenueMeta, roleMeta] = roleAnalyticsRegistry.admin
  const pieColors = ["#16a34a", "#22c7a8", "#f59e0b", "#ef4444", "#64748b"]

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="space-y-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">Admin Analytics</h1>
          <p className="mt-1 text-muted-foreground">Platform growth, revenue, and usage intelligence.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.totalUsers}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.totalCourses}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.totalEnrollments}</CardContent>
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
        <RoleAnalyticsCard title={revenueMeta.title} subtitle={revenueMeta.subtitle}>
          {revenueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No revenue data.</div>
          )}
        </RoleAnalyticsCard>

        <RoleAnalyticsCard title={roleMeta.title} subtitle={roleMeta.subtitle}>
          {roleDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="role" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="total" fill="var(--accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No role data.</div>
          )}
        </RoleAnalyticsCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RoleAnalyticsCard title="Payment Status Mix" subtitle="Operational payment health">
          {paymentStatusMix.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentStatusMix} dataKey="total" nameKey="status" outerRadius={95} label>
                  {paymentStatusMix.map((item, index) => (
                    <Cell key={item.status} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No payment data.</div>
          )}
        </RoleAnalyticsCard>

        <RoleAnalyticsCard title="Top Courses by Enrollment" subtitle="Most subscribed courses across the platform">
          {topCourses.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCourses}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="course" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="enrollments" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No enrollment data.</div>
          )}
        </RoleAnalyticsCard>
      </div>
    </div>
  )
}


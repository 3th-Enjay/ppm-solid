"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BarChart3, BookOpen, ScanSearch, TrendingUp, Users } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RoleAnalyticsCard } from "@/components/skillup/role-analytics-card"
import type { Course, Enrollment, OnboardingEvent, Payment, User } from "@/lib/types"
import { useAuthStore } from "@/lib/store"
import { buildAdminRevenueTrend, buildFinanceStatusMix, buildRoleDistribution } from "@/lib/analytics/adapters"
import { roleAnalyticsRegistry } from "@/lib/analytics/registry"

export default function AdminAnalyticsPage() {
  const { token } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [onboardingEvents, setOnboardingEvents] = useState<OnboardingEvent[]>([])

  useEffect(() => {
    const loadData = async () => {
      if (!token) return
      try {
        const [usersRes, coursesRes, enrollmentsRes, paymentsRes, onboardingRes] = await Promise.all([
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
          fetch("/api/onboarding/analytics", {
            headers: { Authorization: `Bearer ${token || ""}` },
          }),
        ])

        const usersData = await usersRes.json()
        const coursesData = await coursesRes.json()
        const enrollmentsData = await enrollmentsRes.json()
        const paymentsData = await paymentsRes.json()
        const onboardingData = await onboardingRes.json()

        setUsers(usersData.users || [])
        setCourses(coursesData.courses || [])
        setEnrollments(enrollmentsData.enrollments || [])
        setPayments(paymentsData.payments || [])
        setOnboardingEvents(onboardingData.events || [])
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

  const onboardingMetrics = useMemo(() => {
    const countByName = (name: string) => onboardingEvents.filter((event) => event.name === name).length
    const otpStarted = countByName("otp_verify_started")
    const otpSucceeded = onboardingEvents.filter((event) => event.name === "otp_verify_succeeded").length
    const otpFailed = onboardingEvents.filter((event) => event.name === "otp_verify_failed").length
    const onsiteStarted = onboardingEvents.filter((event) => event.name === "onsite_checkout_started").length
    const onsiteCompleted = onboardingEvents.filter(
      (event) => event.name === "onsite_payment_outcome" && event.status === "completed",
    ).length
    const onsiteManualReview = onboardingEvents.filter(
      (event) => event.name === "onsite_payment_outcome" && event.status === "manual_review",
    ).length
    const onsiteFailed = onboardingEvents.filter(
      (event) => event.name === "onsite_payment_outcome" && event.status === "failed",
    ).length

    const funnelOverview = [
      { stage: "Step views", total: countByName("signup_step_viewed") },
      { stage: "Step completions", total: countByName("signup_step_completed") },
      { stage: "Signup submits", total: countByName("signup_submitted") },
      { stage: "OTP starts", total: otpStarted },
      { stage: "OTP verified", total: otpSucceeded },
    ]

    const steps = Array.from(
      onboardingEvents
        .filter((event) => event.name === "signup_step_viewed" && event.step)
        .reduce((map, event) => {
          const key = `${event.role || "unknown"}:${event.step || "unknown"}`
          if (!map.has(key)) {
            map.set(key, {
              step: `${event.role === "instructor" ? "Instructor" : "Student"}: ${event.step}`,
              viewed: 0,
              completed: 0,
            })
          }
          map.get(key)!.viewed += 1
          return map
        }, new Map<string, { step: string; viewed: number; completed: number }>())
        .values(),
    )

    onboardingEvents
      .filter((event) => event.name === "signup_step_completed" && event.step)
      .forEach((event) => {
        const key = `${event.role || "unknown"}:${event.step || "unknown"}`
        const target = steps.find((item) => item.step === `${event.role === "instructor" ? "Instructor" : "Student"}: ${event.step}`)
        if (target) target.completed += 1
      })

    return {
      funnelOverview,
      stepPerformance: steps.slice(0, 10),
      otpStarted,
      otpSucceeded,
      otpFailed,
      otpSuccessRate: otpStarted > 0 ? Math.round((otpSucceeded / otpStarted) * 100) : 0,
      onsiteStarted,
      onsiteCompleted,
      onsiteManualReview,
      onsiteFailed,
      onsiteSuccessRate: onsiteStarted > 0 ? Math.round((onsiteCompleted / onsiteStarted) * 100) : 0,
    }
  }, [onboardingEvents])

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
          <p className="mt-1 text-muted-foreground">Platform growth, revenue, usage intelligence, and onboarding funnel visibility.</p>
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">OTP Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{onboardingMetrics.otpSuccessRate}%</p>
            <p className="text-xs text-muted-foreground">{onboardingMetrics.otpSucceeded} verified / {onboardingMetrics.otpStarted} started</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">OTP Failures</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{onboardingMetrics.otpFailed}</p>
            <p className="text-xs text-muted-foreground">Invalid or expired verification attempts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Onsite Checkout Starts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{onboardingMetrics.onsiteStarted}</p>
            <p className="text-xs text-muted-foreground">Students who initiated the onsite payment funnel</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Onsite Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{onboardingMetrics.onsiteSuccessRate}%</p>
            <p className="text-xs text-muted-foreground">{onboardingMetrics.onsiteCompleted} completed / {onboardingMetrics.onsiteStarted} started</p>
          </CardContent>
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
        <RoleAnalyticsCard title="Onboarding Funnel" subtitle="From step view to verified account">
          {onboardingMetrics.funnelOverview.some((item) => item.total > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={onboardingMetrics.funnelOverview}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="stage" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="total" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No onboarding funnel data yet.</div>
          )}
        </RoleAnalyticsCard>

        <RoleAnalyticsCard title="Step Activity" subtitle="Viewed vs completed steps across student and instructor flows">
          {onboardingMetrics.stepPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={onboardingMetrics.stepPerformance} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} />
                <YAxis dataKey="step" type="category" width={150} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="viewed" fill="var(--accent)" radius={[0, 8, 8, 0]} />
                <Bar dataKey="completed" fill="var(--primary)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No step activity has been recorded yet.</div>
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

        <RoleAnalyticsCard title="Onsite Outcome Mix" subtitle="Checkout completion, failure, and manual review visibility">
          {onboardingMetrics.onsiteStarted > 0 ? (
            <div className="grid h-full gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border bg-background p-4 text-sm">
                <p className="text-muted-foreground">Completed</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{onboardingMetrics.onsiteCompleted}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4 text-sm">
                <p className="text-muted-foreground">Manual Review</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{onboardingMetrics.onsiteManualReview}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4 text-sm">
                <p className="text-muted-foreground">Failed</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{onboardingMetrics.onsiteFailed}</p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No onsite funnel outcomes yet.</div>
          )}
        </RoleAnalyticsCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
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

        <RoleAnalyticsCard title="Recent Onboarding Signals" subtitle="Latest recorded events for QA and debugging">
          {onboardingEvents.length > 0 ? (
            <div className="space-y-3 overflow-auto pr-1 text-sm">
              {onboardingEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="rounded-2xl border bg-background p-3">
                  <p className="inline-flex items-center gap-2 font-medium text-foreground">
                    <ScanSearch className="h-4 w-4 text-primary" />
                    {event.name}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {(event.role || "unknown")} | {(event.status || event.step || event.mode || "n/a")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No onboarding events recorded yet.</div>
          )}
        </RoleAnalyticsCard>
      </div>
    </div>
  )
}

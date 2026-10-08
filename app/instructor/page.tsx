"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, BookOpen, Users, TrendingUp, Award, Plus, Eye, Edit, BarChart3, Clock, ClipboardList, Layers3, Settings, Sparkles } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { Course, Enrollment } from "@/lib/types"
import Link from "next/link"
import { RoleAnalyticsCard } from "@/components/skillup/role-analytics-card"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { buildInstructorCourseQuality, buildInstructorEnrollmentByCourse } from "@/lib/analytics/adapters"
import { roleAnalyticsRegistry } from "@/lib/analytics/registry"

export default function InstructorDashboard() {
  const { user, token, hydrated } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    avgRating: 0,
    totalRevenue: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalLessons: 0,
    totalAssignments: 0,
  })

  useEffect(() => {
    if (!hydrated || !user) return
    void loadInstructorData()
  }, [hydrated, user, token])

  const loadInstructorData = async () => {
    setLoading(true)
    try {
      const coursesRes = await fetch(`/api/courses?instructorId=${encodeURIComponent(user?.id || "")}&includeDrafts=true`, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      })
      const coursesData = await coursesRes.json()
      const instructorCourses = coursesData.courses || []
      setCourses(instructorCourses)

      const courseIds = instructorCourses.map((c: Course) => c.id)
      const courseIdQuery = courseIds.join(",")

      const [enrollmentsRes, paymentsRes] = await Promise.all([
        courseIds.length > 0
          ? fetch(`/api/enrollments?courseIds=${courseIdQuery}`, {
              headers: {
                Authorization: `Bearer ${token || ""}`,
              },
            })
          : Promise.resolve(null),
        courseIds.length > 0
          ? fetch(`/api/payments?courseIds=${courseIdQuery}`, {
              headers: {
                Authorization: `Bearer ${token || ""}`,
              },
            })
          : Promise.resolve(null),
      ])

      const enrollmentsData = enrollmentsRes ? await enrollmentsRes.json() : { enrollments: [] }
      const paymentsData = paymentsRes ? await paymentsRes.json() : { payments: [] }

      const courseEnrollments = enrollmentsData.enrollments || []
      setEnrollments(courseEnrollments)
      const enrolledStudents = new Set(courseEnrollments.map((e: Enrollment) => e.userId)).size

      const coursesWithRatings = instructorCourses.filter((c: Course) => c.rating > 0)
      const avgRating =
        coursesWithRatings.length > 0
          ? coursesWithRatings.reduce((sum: number, c: Course) => sum + c.rating, 0) /
            coursesWithRatings.length
          : 0

      const coursePayments = (paymentsData.payments || []).filter(
        (p: any) => p.status === "completed" || p.status === "success",
      )
      const totalRevenue = coursePayments.reduce((sum: number, p: any) => {
        if (p.currency === "NGN") return sum + p.amount
        if (p.currency === "USD") return sum + p.amount * 1250
        if (p.currency === "GBP") return sum + p.amount * 1580
        return sum
      }, 0)

      const publishedCourses = instructorCourses.filter((c: Course) => c.published).length
      const draftCourses = instructorCourses.filter((c: Course) => !c.published).length
      const totalLessons = instructorCourses.reduce(
        (sum: number, course: Course) => sum + course.modules.reduce((moduleSum, module) => moduleSum + module.lessons.length, 0),
        0,
      )
      const totalAssignments = instructorCourses.reduce(
        (sum: number, course: Course) =>
          sum +
          course.modules.reduce(
            (moduleSum, module) => moduleSum + module.lessons.filter((lesson) => lesson.content.assignment || lesson.type === "assignment").length,
            0,
          ),
        0,
      )

      setStats({
        totalCourses: instructorCourses.length,
        totalStudents: enrolledStudents,
        totalEnrollments: courseEnrollments.length,
        avgRating: Number(avgRating.toFixed(1)),
        totalRevenue,
        publishedCourses,
        draftCourses,
        totalLessons,
        totalAssignments,
      })
    } catch (error) {
      console.error("Error loading instructor data:", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Courses",
      value: stats.totalCourses,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      subtitle: `${stats.publishedCourses} published, ${stats.draftCourses} drafts`,
    },
    {
      title: "Lesson Library",
      value: stats.totalLessons,
      icon: Layers3,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      subtitle: "Lessons currently mapped across your courses",
    },
    {
      title: "Assignments Live",
      value: stats.totalAssignments,
      icon: ClipboardList,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      subtitle: "Video-linked and lesson-linked tasks",
    },
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
      subtitle: "Unique enrolled students",
    },
    {
      title: "Average Rating",
      value: `${stats.avgRating} stars`,
      icon: Award,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      subtitle: "Across all courses",
    },
    {
      title: "Total Revenue",
      value: `NGN ${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-lime-600",
      bgColor: "bg-lime-50",
      subtitle: "From all courses",
    },
  ]

  const needsAttention = useMemo(() => {
    const draftCourses = courses.filter((course) => !course.published)
    const lowRatedCourses = courses.filter((course) => course.published && course.rating > 0 && course.rating < 4)
    const zeroEnrollmentCourses = courses.filter((course) => course.published && (course.enrollmentCount || 0) === 0)

    return [
      draftCourses.length > 0
        ? {
            title: `${draftCourses.length} draft ${draftCourses.length === 1 ? "course" : "courses"} ready for review`,
            description: "Finish and publish the courses that are still sitting in draft.",
            href: "/instructor/courses",
            label: "Review drafts",
          }
        : null,
      lowRatedCourses.length > 0
        ? {
            title: `${lowRatedCourses.length} course ${lowRatedCourses.length === 1 ? "needs" : "need"} quality attention`,
            description: "One or more live courses are trending below a 4-star average rating.",
            href: "/instructor/analytics",
            label: "Open analytics",
          }
        : null,
      zeroEnrollmentCourses.length > 0
        ? {
            title: `${zeroEnrollmentCourses.length} published ${zeroEnrollmentCourses.length === 1 ? "course has" : "courses have"} no enrollments yet`,
            description: "These courses may need stronger promotion, pricing review, or clearer positioning.",
            href: "/instructor/courses",
            label: "Manage courses",
          }
        : null,
    ].filter(Boolean) as Array<{ title: string; description: string; href: string; label: string }>
  }, [courses])

  const enrollmentByCourse = buildInstructorEnrollmentByCourse(courses, enrollments)
  const qualityByCourse = buildInstructorCourseQuality(courses)
  const [enrollmentMeta, qualityMeta] = roleAnalyticsRegistry.instructor

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <Card variant="elevated" className="overflow-hidden border-sky-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_38%),linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(248,250,252,0.92)_52%,rgba(240,249,255,0.9)_100%)]">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.6fr_1fr] lg:p-8">
          <div className="space-y-4">
            <Badge className="w-fit bg-sky-600">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Instructor command center
            </Badge>
            <div>
              <h1 className="text-3xl font-bold text-balance md:text-4xl">Welcome, {user?.name}!</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Prioritize what needs attention, keep your active courses healthy, and attach richer lesson assignments directly from your teaching workflow.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/instructor/courses/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Course
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/instructor/analytics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Open Analytics
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/instructor/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Update Profile
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">Publishing rhythm</p>
              <p className="mt-2 text-2xl font-semibold">{stats.publishedCourses}</p>
              <p className="text-sm text-muted-foreground">Published courses now carrying your live teaching brand</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">Content production</p>
              <p className="mt-2 text-2xl font-semibold">{stats.totalLessons} lessons</p>
              <p className="text-sm text-muted-foreground">Structured lessons ready for learner delivery</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">Assessment depth</p>
              <p className="mt-2 text-2xl font-semibold">{stats.totalAssignments} assignments</p>
              <p className="text-sm text-muted-foreground">Tasks attached to lesson flows and videos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {needsAttention.length > 0 ? (
        <Card variant="elevated" className="border-amber-300/50 bg-gradient-to-br from-amber-50 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {needsAttention.map((item) => (
              <div key={item.title} className="rounded-xl border border-border/80 bg-card/80 p-4">
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card variant="elevated" className="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-background">
          <CardContent className="flex items-center gap-3 p-5">
            <Award className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-medium">No urgent teaching issues right now</p>
              <p className="text-sm text-muted-foreground">Your draft, enrollment, and quality signals look stable from this dashboard view.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card variant="elevated">
          <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
            <Clock className="h-5 w-5 animate-pulse" />
            <span>Loading your instructor dashboard...</span>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <div className={`absolute top-0 right-0 h-32 w-32 ${stat.bgColor} -mr-16 -mt-16 rounded-full opacity-20`} />
              <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="mb-1 text-2xl font-bold">{stat.value}</p>
                {stat.subtitle && <p className="text-xs text-muted-foreground">{stat.subtitle}</p>}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link href="/instructor/courses/new">
          <Card className="cursor-pointer transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Create Course
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Start creating a new course and share your knowledge.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/instructor/analytics">
          <Card className="cursor-pointer transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                View Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Track course performance and student engagement.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/instructor/courses">
          <Card className="cursor-pointer transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Manage Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Edit, update, and manage all your courses.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Courses</h2>
          <Link href="/instructor/courses">
            <Button variant="outline">View All</Button>
          </Link>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((course) => (
              <Card key={course.id} className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
                    {course.published ? <Badge className="bg-green-500">Published</Badge> : <Badge variant="secondary">Draft</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                  <div className="mb-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Students:</span>
                      <span className="font-semibold">{course.enrollmentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rating:</span>
                      <span className="font-semibold">{course.rating} stars</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-semibold">NGN {course.price.NGN.toLocaleString()} / ${course.price.USD}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/courses/${course.slug}`} className="w-full sm:flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/instructor/courses/${course.id}/content`} className="w-full sm:flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Content
                      </Button>
                    </Link>
                    <Link href={`/instructor/courses/${course.id}/edit`} className="w-full sm:flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : loading ? null : (
          <Card>
            <CardContent className="pt-6">
              <div className="py-12 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-4 text-center text-muted-foreground">No courses yet. Create your first course to get started!</p>
                <Link href="/instructor/courses/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Course
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}





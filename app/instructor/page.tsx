"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, TrendingUp, Award, Plus, Eye, Edit, BarChart3 } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { Course, Enrollment } from "@/lib/types"
import Link from "next/link"

export default function InstructorDashboard() {
  const { user, token, hydrated } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    avgRating: 0,
    totalRevenue: 0,
    publishedCourses: 0,
    draftCourses: 0,
  })

  useEffect(() => {
    if (!hydrated || !user) return
    loadInstructorData()
  }, [hydrated, user, token])

  const loadInstructorData = async () => {
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
      const enrolledStudents = new Set(courseEnrollments.map((e: Enrollment) => e.userId)).size

      const coursesWithRatings = instructorCourses.filter((c: Course) => c.rating > 0)
      const avgRating =
        coursesWithRatings.length > 0
          ? coursesWithRatings.reduce((sum: number, c: Course) => sum + c.rating, 0) /
            coursesWithRatings.length
          : 0

      const coursePayments = (paymentsData.payments || []).filter(
        (p: any) => p.status === "completed" || p.status === "success"
      )
      const totalRevenue = coursePayments.reduce((sum: number, p: any) => {
        if (p.currency === "NGN") return sum + p.amount
        if (p.currency === "USD") return sum + p.amount * 1250
        if (p.currency === "GBP") return sum + p.amount * 1580
        return sum
      }, 0)

      const publishedCourses = instructorCourses.filter((c: Course) => c.published).length
      const draftCourses = instructorCourses.filter((c: Course) => !c.published).length

      setStats({
        totalCourses: instructorCourses.length,
        totalStudents: enrolledStudents,
        totalEnrollments: courseEnrollments.length,
        avgRating: Number(avgRating.toFixed(1)),
        totalRevenue,
        publishedCourses,
        draftCourses,
      })
    } catch (error) {
      console.error("Error loading instructor data:", error)
    }
  }

  const statCards = [
    { 
      title: "Total Courses", 
      value: stats.totalCourses, 
      icon: BookOpen, 
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      subtitle: `${stats.publishedCourses} published, ${stats.draftCourses} drafts`
    },
    { 
      title: "Total Students", 
      value: stats.totalStudents, 
      icon: Users, 
      color: "text-green-600",
      bgColor: "bg-green-50",
      subtitle: "Unique enrolled students"
    },
    { 
      title: "Total Enrollments", 
      value: stats.totalEnrollments, 
      icon: TrendingUp, 
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      subtitle: "All course enrollments"
    },
    { 
      title: "Average Rating", 
      value: `${stats.avgRating} ★`, 
      icon: Award, 
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      subtitle: "Across all courses"
    },
    {
      title: "Total Revenue",
      value: `₦${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      subtitle: "From all courses"
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
          <p className="text-muted-foreground mt-2">Manage your courses and track student progress</p>
        </div>
        <Link href="/instructor/courses/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Course
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bgColor} opacity-20 rounded-full -mr-16 -mt-16`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-2xl font-bold mb-1">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/instructor/courses/new">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Create Course
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Start creating a new course and share your knowledge
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/instructor/analytics">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                View Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track course performance and student engagement
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/instructor/courses">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Manage Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Edit, update, and manage all your courses
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* My Courses Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">My Courses</h2>
          <Link href="/instructor/courses">
            <Button variant="outline">View All</Button>
          </Link>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 6).map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
                    {course.published ? (
                      <Badge className="bg-green-500">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Students:</span>
                      <span className="font-semibold">{course.enrollmentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rating:</span>
                      <span className="font-semibold">{course.rating} ★</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-semibold">
                        ₦{course.price.NGN.toLocaleString()} / ${course.price.USD}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/courses/${course.slug}`} className="w-full sm:flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/instructor/courses/${course.id}/content`} className="w-full sm:flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Content
                      </Button>
                    </Link>
                    <Link href={`/instructor/courses/${course.id}/edit`} className="w-full sm:flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-center text-muted-foreground mb-4">
                  No courses yet. Create your first course to get started!
                </p>
                <Link href="/instructor/courses/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
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

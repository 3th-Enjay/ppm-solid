"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock, Play } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { Enrollment, Course } from "@/lib/types"
import { formatDuration } from "@/lib/utils/format"

export default function MyCoursesPage() {
  const { user, token } = useAuthStore()
  const [enrollments, setEnrollments] = useState<(Enrollment & { course: Course | undefined })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const loadEnrollments = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/enrollments?userId=${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        const data = await res.json()
        setEnrollments(data.enrollments || [])
      } catch (error) {
        console.error("Failed to load enrollments:", error)
        setEnrollments([])
      } finally {
        setLoading(false)
      }
    }
    void loadEnrollments()
  }, [user, token])

  const activeCount = useMemo(() => enrollments.filter((item) => item.status === "active").length, [enrollments])

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-balance">My Courses</h1>
        <p className="text-muted-foreground">Continue where you left off and keep your progress moving.</p>
      </div>

      {loading ? (
        <Card variant="elevated">
          <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
            <Clock className="h-5 w-5 animate-pulse" />
            <span>Loading your courses...</span>
          </CardContent>
        </Card>
      ) : null}

      {enrollments.length > 0 ? (
        <>
          <Card variant="elevated">
            <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Course overview</p>
                <h2 className="text-xl font-semibold">{activeCount} active course{activeCount === 1 ? "" : "s"} ready to continue</h2>
              </div>
              <Button variant="outline" asChild>
                <Link href="/courses">Browse more courses</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id} variant="elevated">
                <div className="relative">
                  <img
                    src={enrollment.course?.thumbnail || "/placeholder.svg"}
                    alt={enrollment.course?.title}
                    className="h-48 w-full rounded-t-lg object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <div className="rounded bg-black/70 px-2 py-1 text-xs text-white">{enrollment.progress}% complete</div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="mb-2 line-clamp-2 text-lg font-semibold">{enrollment.course?.title}</h3>
                  <div className="mb-4 text-sm text-muted-foreground">
                    {formatDuration(enrollment.course?.totalDuration || 0)} • {enrollment.course?.level}
                  </div>
                  <Progress value={enrollment.progress} className="mb-4 h-2" />
                  <Button className="w-full" asChild>
                    <Link href={`/dashboard/courses/${enrollment.courseId}/learn`}>
                      <Play className="mr-2 h-4 w-4" />
                      {enrollment.progress === 0 ? "Start Course" : "Continue Learning"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : loading ? null : (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No enrolled courses</h3>
            <p className="mb-4 text-muted-foreground">Browse our course catalog and start learning today.</p>
            <Button asChild>
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

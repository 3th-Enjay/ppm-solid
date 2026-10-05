"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, BookOpen, Clock, Pencil, Plus, Settings } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { Course } from "@/lib/types"

export default function InstructorCoursesPage() {
  const { user, token, hydrated } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hydrated || !user) return
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/courses?instructorId=${encodeURIComponent(user.id)}&includeDrafts=true`, {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        })
        const data = await res.json()
        setCourses(data.courses || [])
      } catch (error) {
        console.error("Failed to load courses:", error)
        setCourses([])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [hydrated, user, token])

  const draftCount = useMemo(() => courses.filter((course) => !course.published).length, [courses])

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Create, edit, and manage your course content.</p>
        </div>
        <Button asChild>
          <Link href="/instructor/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Link>
        </Button>
      </div>

      {loading ? (
        <Card variant="elevated">
          <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
            <Clock className="h-5 w-5 animate-pulse" />
            <span>Loading your courses...</span>
          </CardContent>
        </Card>
      ) : null}

      {courses.length > 0 ? (
        <>
          <Card variant="elevated" className={draftCount > 0 ? "border-amber-300/50 bg-gradient-to-br from-amber-50 to-background" : ""}>
            <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Course overview</p>
                <h2 className="text-xl font-semibold">{courses.length} course{courses.length === 1 ? "" : "s"} in your workspace</h2>
                <p className="text-sm text-muted-foreground">
                  {draftCount > 0 ? `${draftCount} draft course${draftCount === 1 ? "" : "s"} still need review before publishing.` : "All current courses are out of draft state."}
                </p>
              </div>
              {draftCount > 0 ? (
                <Button asChild variant="outline">
                  <Link href="/instructor">Review needs attention</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} variant="elevated">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
                    <Badge variant={course.published ? "default" : "secondary"}>
                      {course.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                  {!course.published ? (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-300/40 bg-amber-50 p-3 text-sm text-amber-900">
                      <AlertCircle className="mt-0.5 h-4 w-4" />
                      <span>This course is still in draft and will not be visible to learners until you publish it.</span>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild className="w-full sm:flex-1">
                      <Link href={`/courses/${course.slug}`}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    <Button size="sm" asChild className="w-full sm:flex-1">
                      <Link href={`/instructor/courses/${course.id}/content`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Content
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="w-full sm:flex-1">
                      <Link href={`/instructor/courses/${course.id}/edit`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : loading ? null : (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No courses yet</h3>
            <p className="mb-4 text-muted-foreground">Create your first course to start building content.</p>
            <Button asChild>
              <Link href="/instructor/courses/new">Create Course</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertCircle,
  BookOpen,
  Clock,
  Eye,
  FileCheck,
  Layers,
  Pencil,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { Course } from "@/lib/types"

export default function InstructorCoursesPage() {
  const { user, token, hydrated } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all")

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

  const draftCount = useMemo(() => courses.filter((c) => !c.published).length, [courses])
  const publishedCount = useMemo(() => courses.filter((c) => c.published).length, [courses])

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (statusFilter === "published" && !course.published) return false
      if (statusFilter === "draft" && course.published) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesTitle = course.title?.toLowerCase().includes(q)
        const matchesDesc = course.description?.toLowerCase().includes(q)
        const matchesCat = course.category?.toLowerCase().includes(q)
        if (!matchesTitle && !matchesDesc && !matchesCat) return false
      }

      return true
    })
  }, [courses, statusFilter, searchQuery])

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Course Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Author, structure, and maintain your technology courses, modules, and lessons.
          </p>
        </div>
        <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
          <Link href="/instructor/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Link>
        </Button>
      </div>

      {/* Loading state */}
      {loading ? (
        <Card variant="elevated">
          <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
            <Clock className="h-5 w-5 animate-pulse text-blue-600" />
            <span>Loading your courses...</span>
          </CardContent>
        </Card>
      ) : null}

      {/* Overview Card */}
      {!loading && courses.length > 0 && (
        <Card variant="elevated" className={draftCount > 0 ? "border-amber-300/60 bg-gradient-to-br from-amber-50/40 to-background dark:border-amber-900/50 dark:from-amber-950/20" : ""}>
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course Portfolio Overview</p>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {courses.length} course{courses.length === 1 ? "" : "s"} under faculty management
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {publishedCount} published and active • {draftCount} draft{draftCount === 1 ? "" : "s"} awaiting publication
              </p>
            </div>
            {draftCount > 0 && (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/instructor">Review Faculty Alerts</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      {!loading && courses.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
            >
              All ({courses.length})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "published" ? "default" : "outline"}
              onClick={() => setStatusFilter("published")}
            >
              Published ({publishedCount})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "draft" ? "default" : "outline"}
              onClick={() => setStatusFilter("draft")}
            >
              Drafts ({draftCount})
            </Button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title or category..."
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && filteredCourses.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const moduleCount = course.modules?.length || 0
            const lessonCount = (course.modules || []).reduce(
              (sum, m) => sum + (m.lessons?.length || 0),
              0,
            )

            return (
              <Card key={course.id} variant="elevated" className="flex flex-col justify-between transition-all hover:border-blue-400/60 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="line-clamp-2 text-base font-semibold leading-snug">
                      {course.title}
                    </CardTitle>
                    {course.published ? (
                      <Badge className="bg-emerald-600 text-white shrink-0 text-xs">Published</Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0 text-xs">Draft</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                  <p className="line-clamp-2 text-xs text-muted-foreground">{course.description}</p>

                  <div className="space-y-1.5 rounded-xl border border-border/70 bg-muted/20 p-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{course.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Level:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{course.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Curriculum:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {moduleCount} module{moduleCount === 1 ? "" : "s"} • {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Enrollments:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {course.enrollmentCount || 0} students
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        NGN {course.price?.NGN?.toLocaleString() ?? 0} / ${course.price?.USD ?? 0}
                      </span>
                    </div>
                  </div>

                  {!course.published && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-300/40 bg-amber-50/50 p-2.5 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <span>Draft mode: Not visible on the public catalog until published.</span>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1 text-xs">
                        <Link href={`/courses/${course.slug}`}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View
                        </Link>
                      </Button>
                      <Button size="sm" asChild className="flex-1 bg-blue-600 text-white hover:bg-blue-700 text-xs">
                        <Link href={`/instructor/courses/${course.id}/content`}>
                          <Layers className="mr-1.5 h-3.5 w-3.5" />
                          Curriculum
                        </Link>
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1 text-xs">
                        <Link href={`/instructor/courses/${course.id}/edit`}>
                          <Settings className="mr-1.5 h-3.5 w-3.5" />
                          Edit Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1 text-xs">
                        <Link href={`/instructor/evaluations`}>
                          <FileCheck className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                          Submissions
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty states */}
      {!loading && courses.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">No courses in your workspace</h2>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              You haven't created any technology courses yet. Start creating your curriculum with modules, lessons, and code examples.
            </p>
            <Button asChild className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
              <Link href="/instructor/courses/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Course
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && courses.length > 0 && filteredCourses.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
            <Search className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">No courses match your filter</p>
            <p className="mt-1 text-xs">Try adjusting your search terms or status selection.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-xs"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
              }}
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

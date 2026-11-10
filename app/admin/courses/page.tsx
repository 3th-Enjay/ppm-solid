"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Loader2,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Search,
  ExternalLink,
  Tags,
  FileCode2,
  AlertTriangle,
  PlayCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { Course, Lesson, CourseModule } from "@/lib/types"
import { AdminActionDialog } from "@/components/admin/AdminActionDialog"
import { TechnicalContentRenderer } from "@/components/learning/TechnicalContentRenderer"

type AdminCourseActionDialogState =
  | { type: "approve-course"; course: Course }
  | { type: "reject-course"; course: Course }
  | { type: "toggle-publish"; course: Course }
  | { type: "delete-course"; course: Course }
  | { type: "approve-lesson"; courseId: string; lessonId: string; courseTitle: string; lessonTitle: string }
  | { type: "reject-lesson"; courseId: string; lessonId: string; courseTitle: string; lessonTitle: string }

type CourseStatusFilter = "all" | "pending_review" | "approved" | "published" | "draft"

export default function AdminCoursesPage() {
  const { token, user: currentUser } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<CourseStatusFilter>("all")
  const [actionMessage, setActionMessage] = useState("")
  const [dialogState, setDialogState] = useState<AdminCourseActionDialogState | null>(null)
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null)

  // Curriculum inspection drawer state
  const [inspectCourse, setInspectCourse] = useState<Course | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const coursesRes = await fetch("/api/courses?includeDrafts=true", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const data = await coursesRes.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error("Failed to load courses:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateCourse = async (courseId: string, payload: Partial<Course>) => {
    setActionMessage("")
    const actionKey = `course-update-${courseId}`
    setPendingActionKey(actionKey)
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update course")
      setCourses((prev) => prev.map((c) => (c.id === courseId ? data.course : c)))
      setActionMessage("Course updated successfully.")
    } catch (err: any) {
      const message = err?.message || "Failed to update course."
      setActionMessage(message)
      throw new Error(message)
    } finally {
      setPendingActionKey(null)
    }
  }

  const deleteCourse = async (target: Course) => {
    setActionMessage("")
    const actionKey = `course-delete-${target.id}`
    setPendingActionKey(actionKey)
    try {
      const res = await fetch(`/api/courses/${target.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete course")
      setCourses((prev) => prev.filter((c) => c.id !== target.id))
      setActionMessage("Course deleted.")
    } catch (err: any) {
      const message = err?.message || "Failed to delete course."
      setActionMessage(message)
      throw new Error(message)
    } finally {
      setPendingActionKey(null)
    }
  }

  const handleApproveLesson = async (courseId: string, lessonId: string) => {
    const actionKey = `lesson-approve-${lessonId}`
    setPendingActionKey(actionKey)
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
      })
      if (!res.ok) throw new Error("Failed to approve lesson")
      await load()
    } catch (err) {
      console.error(err)
      throw err
    } finally {
      setPendingActionKey(null)
    }
  }

  const handleRejectLesson = async (courseId: string, lessonId: string, note: string) => {
    const actionKey = `lesson-reject-${lessonId}`
    setPendingActionKey(actionKey)
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ note }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Reject failed")
      }
      await load()
    } catch (err) {
      console.error(err)
      throw err
    } finally {
      setPendingActionKey(null)
    }
  }

  const pendingLessons = courses
    .flatMap((course) =>
      (course.modules || []).flatMap((m) =>
        (m.lessons || []).map((l) => ({ course, module: m, lesson: l })),
      ),
    )
    .filter((x: any) => x.lesson?.pendingApproval)

  const counts = useMemo(() => {
    return {
      all: courses.length,
      pending_review: courses.filter((c) => !c.approved).length,
      approved: courses.filter((c) => c.approved).length,
      published: courses.filter((c) => c.published).length,
      draft: courses.filter((c) => !c.published).length,
    }
  }, [courses])

  const filteredCourses = useMemo(() => {
    let result = [...courses]

    if (statusFilter === "pending_review") {
      result = result.filter((c) => !c.approved)
    } else if (statusFilter === "approved") {
      result = result.filter((c) => c.approved)
    } else if (statusFilter === "published") {
      result = result.filter((c) => c.published)
    } else if (statusFilter === "draft") {
      result = result.filter((c) => !c.published)
    }

    if (search.trim()) {
      const query = search.toLowerCase()
      result = result.filter((course) =>
        [course.title, course.description, course.category, course.level, course.instructorId, course.instructorName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
      )
    }

    return result
  }, [courses, statusFilter, search])

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Academic Governance</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Course Review & Academic Approval
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review submitted engineering syllabi, inspect technical content, and authorize platform publication.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild size="sm">
            <Link href="/admin/categories" className="flex items-center gap-1.5">
              <Tags className="w-4 h-4 text-primary" />
              <span>Category Architecture</span>
            </Link>
          </Button>
        </div>
      </div>

      {actionMessage && (
        <Alert>
          <AlertTitle>Notification</AlertTitle>
          <AlertDescription>{actionMessage}</AlertDescription>
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
        {(
          [
            { key: "all", label: "All Courses", count: counts.all },
            { key: "pending_review", label: "Pending Review", count: counts.pending_review },
            { key: "approved", label: "Approved", count: counts.approved },
            { key: "published", label: "Published", count: counts.published },
            { key: "draft", label: "Drafts", count: counts.draft },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === tab.key
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === tab.key
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-border text-muted-foreground"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, category, instructor, level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {filteredCourses.length} of {courses.length} courses
        </p>
      </div>

      {/* Course List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl border border-border/50 bg-muted/20 animate-pulse" />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card className="border border-dashed border-border/80 p-8 text-center bg-card/40">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No Courses Found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {search
                ? `No courses matched "${search}".`
                : "No courses found matching this review status filter."}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course) => {
              const moduleCount = course.modules?.length || 0
              const lessonCount =
                course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0

              return (
                <Card
                  key={course.id}
                  className="border border-border/70 shadow-xs hover:border-primary/40 transition-all"
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-lg font-bold text-foreground">
                            {course.title}
                          </CardTitle>
                          <Badge variant="outline" className="text-[11px] font-mono">
                            {course.category}
                          </Badge>
                          <Badge variant="secondary" className="text-[11px]">
                            {course.level}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Instructor:{" "}
                          <strong className="text-foreground">
                            {course.instructorName || course.instructorId}
                          </strong>{" "}
                          • Modules: {moduleCount} • Lessons: {lessonCount}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {course.approved ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending Review
                          </Badge>
                        )}

                        {course.published ? (
                          <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Draft
                          </Badge>
                        )}

                        <span className="text-xs font-mono font-semibold text-muted-foreground px-2 py-0.5 rounded border border-border/60">
                          NGN {course.price?.NGN?.toLocaleString() ?? 0}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-4">
                    <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setInspectCourse(course)
                          setSelectedLesson(course.modules?.[0]?.lessons?.[0] || null)
                        }}
                        className="text-xs text-primary hover:text-primary/90 h-8 px-2.5 font-medium"
                      >
                        <FileCode2 className="w-3.5 h-3.5 mr-1.5" />
                        <span>Inspect Syllabus & Technical Content</span>
                      </Button>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Approval Action */}
                        {course.approved ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDialogState({ type: "reject-course", course })}
                            disabled={pendingActionKey === `course-update-${course.id}`}
                            className="h-8 text-xs text-rose-600 hover:text-rose-700"
                          >
                            Revoke Approval
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setDialogState({ type: "approve-course", course })}
                            disabled={pendingActionKey === `course-update-${course.id}`}
                            className="h-8 text-xs"
                          >
                            Approve Course
                          </Button>
                        )}

                        {/* Publish Action (only if approved) */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDialogState({ type: "toggle-publish", course })}
                          disabled={
                            pendingActionKey === `course-update-${course.id}` ||
                            (!course.approved && !course.published)
                          }
                          title={
                            !course.approved && !course.published
                              ? "Course must be approved before publication"
                              : ""
                          }
                          className="h-8 text-xs"
                        >
                          {course.published ? "Unpublish" : "Publish"}
                        </Button>

                        <Button size="sm" variant="outline" asChild className="h-8 text-xs">
                          <Link href={`/admin/courses/${course.id}/edit`}>Edit Details</Link>
                        </Button>

                        <Button size="sm" variant="outline" asChild className="h-8 text-xs">
                          <Link href={`/admin/courses/${course.id}/content`}>Edit Content</Link>
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDialogState({ type: "delete-course", course })}
                          disabled={pendingActionKey === `course-delete-${course.id}`}
                          className="h-8 text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Lesson-Level Approvals Queue */}
      <div className="space-y-4 border-t border-border/60 pt-8 mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <span>Lesson-Level Review Queue</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Individual lessons flagged for academic approval by faculty.
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {pendingLessons.length} Pending Lessons
          </Badge>
        </div>

        {pendingLessons.length === 0 ? (
          <Card className="p-6 text-center border-dashed border-border/70 bg-card/40">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-foreground">All Lessons Approved</p>
            <p className="text-xs text-muted-foreground mt-1">
              There are no individual lessons awaiting academic review at this time.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingLessons.map((item: any) => (
              <Card key={item.lesson.id} className="border border-border/70 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {item.course.title} — {item.lesson.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Module: {item.module.title} • Instructor: {item.course.instructorId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() =>
                        setDialogState({
                          type: "approve-lesson",
                          courseId: item.course.id,
                          lessonId: item.lesson.id,
                          lessonTitle: item.lesson.title,
                          courseTitle: item.course.title,
                        })
                      }
                      disabled={pendingActionKey === `lesson-approve-${item.lesson.id}`}
                      className="h-8 text-xs"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setDialogState({
                          type: "reject-lesson",
                          courseId: item.course.id,
                          lessonId: item.lesson.id,
                          lessonTitle: item.lesson.title,
                          courseTitle: item.course.title,
                        })
                      }
                      disabled={pendingActionKey === `lesson-reject-${item.lesson.id}`}
                      className="h-8 text-xs text-rose-600 hover:text-rose-700"
                    >
                      Reject with Reason
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Curriculum & Technical Content Inspection Dialog */}
      <Dialog
        open={Boolean(inspectCourse)}
        onOpenChange={(open) => {
          if (!open) {
            setInspectCourse(null)
            setSelectedLesson(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-5xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border/60">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-primary" />
                  <span>{inspectCourse?.title}</span>
                </DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  Category: {inspectCourse?.category} • Level: {inspectCourse?.level} • Instructor:{" "}
                  {inspectCourse?.instructorName || inspectCourse?.instructorId}
                </DialogDescription>
              </div>
              <Badge
                variant={inspectCourse?.approved ? "default" : "outline"}
                className="font-mono text-xs"
              >
                {inspectCourse?.approved ? "Approved" : "Awaiting Approval"}
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Module & Lesson Tree */}
            <div className="w-1/3 border-r border-border/60 overflow-y-auto p-4 space-y-4 bg-muted/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Syllabus Architecture
              </h4>
              {inspectCourse?.modules && inspectCourse.modules.length > 0 ? (
                inspectCourse.modules.map((mod: CourseModule, mIdx: number) => (
                  <div key={mod.id || mIdx} className="space-y-1.5">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-mono">
                        {mIdx + 1}
                      </span>
                      <span>{mod.title}</span>
                    </p>
                    <div className="pl-5 space-y-1">
                      {mod.lessons?.map((les: Lesson, lIdx: number) => (
                        <button
                          key={les.id || lIdx}
                          onClick={() => setSelectedLesson(les)}
                          className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between cursor-pointer ${
                            selectedLesson?.id === les.id
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <span className="truncate">{les.title}</span>
                          {les.content?.videoUrl && (
                            <PlayCircle className="w-3 h-3 shrink-0 opacity-70 ml-1" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No modules created yet.</p>
              )}
            </div>

            {/* Right Column: Technical Content Preview */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedLesson ? (
                <div className="space-y-4">
                  <div className="border-b border-border/50 pb-3">
                    <h3 className="text-lg font-bold text-foreground">{selectedLesson.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Duration: {selectedLesson.duration}m • Type: {selectedLesson.type || "markdown"}
                    </p>
                  </div>

                  {selectedLesson.content?.videoUrl && (
                    <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs space-y-1.5">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <PlayCircle className="w-3.5 h-3.5 text-primary" />
                        <span>Video Asset Reference:</span>
                      </p>
                      <code className="text-[11px] text-muted-foreground break-all">
                        {selectedLesson.content.videoUrl}
                      </code>
                    </div>
                  )}

                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <TechnicalContentRenderer
                      content={
                        selectedLesson.content?.articleContent ||
                        (selectedLesson.content as any)?.text ||
                        "*(No markdown lesson body provided for this unit.)*"
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <FileCode2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-semibold">Select a Lesson to Preview</p>
                  <p className="text-xs mt-1">
                    Click any lesson from the syllabus tree on the left to inspect its technical curriculum.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border/60 bg-card">
            <Button variant="outline" size="sm" onClick={() => setInspectCourse(null)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Action Confirmation Dialog */}
      <AdminActionDialog
        open={Boolean(dialogState)}
        onOpenChange={(open) => {
          if (!open) setDialogState(null)
        }}
        title={
          dialogState?.type === "approve-course"
            ? "Approve Course for Publication"
            : dialogState?.type === "reject-course"
              ? "Revoke / Reject Course Approval"
              : dialogState?.type === "toggle-publish"
                ? dialogState.course.published
                  ? "Unpublish Course"
                  : "Publish Course to Catalog"
                : dialogState?.type === "delete-course"
                  ? "Delete Course"
                  : dialogState?.type === "approve-lesson"
                    ? "Approve Lesson"
                    : dialogState?.type === "reject-lesson"
                      ? "Reject Lesson"
                      : "Confirm Action"
        }
        description={
          dialogState?.type === "approve-course"
            ? `Are you sure you want to approve "${dialogState.course.title}"? Approved courses are eligible for public publishing.`
            : dialogState?.type === "reject-course"
              ? `This will revoke approval for "${dialogState.course.title}" and automatically unpublish it if live.`
              : dialogState?.type === "toggle-publish"
                ? `This will ${dialogState.course.published ? "unpublish" : "publish"} "${dialogState.course.title}" on the public course catalog.`
                : dialogState?.type === "delete-course"
                  ? `This permanently deletes "${dialogState.course.title}" and its syllabus modules.`
                  : dialogState?.type === "approve-lesson"
                    ? `Approve "${dialogState.lessonTitle}" in ${dialogState.courseTitle}.`
                    : dialogState?.type === "reject-lesson"
                      ? `Reject "${dialogState.lessonTitle}" in ${dialogState.courseTitle}.`
                      : "Confirm this administrative action."
        }
        warningBadge={
          dialogState?.type === "delete-course" ||
          dialogState?.type === "reject-course" ||
          dialogState?.type === "reject-lesson"
            ? "Destructive / Restrictive"
            : "Academic Governance"
        }
        secondaryDescription={
          dialogState?.type === "reject-lesson" || dialogState?.type === "reject-course"
            ? "Please provide feedback or specific notes for the faculty instructor."
            : undefined
        }
        noteLabel={
          dialogState?.type === "reject-lesson" || dialogState?.type === "reject-course"
            ? "Feedback / Reason"
            : undefined
        }
        notePlaceholder="Describe why revisions are required..."
        noteRequired={dialogState?.type === "reject-lesson"}
        confirmLabel={
          dialogState?.type === "delete-course"
            ? "Delete Course"
            : dialogState?.type === "reject-course"
              ? "Revoke Approval"
              : dialogState?.type === "reject-lesson"
                ? "Reject Lesson"
                : dialogState?.type === "approve-course"
                  ? "Approve Course"
                  : "Confirm"
        }
        successToast="Action executed successfully."
        errorToast="Failed to execute administrative action."
        executeAction={async (note) => {
          if (!dialogState) return

          if (dialogState.type === "approve-course") {
            await updateCourse(dialogState.course.id, {
              approved: true,
            })
            return
          }

          if (dialogState.type === "reject-course") {
            await updateCourse(dialogState.course.id, {
              approved: false,
              published: false,
            })
            return
          }

          if (dialogState.type === "toggle-publish") {
            await updateCourse(dialogState.course.id, {
              published: !dialogState.course.published,
            })
            return
          }

          if (dialogState.type === "delete-course") {
            await deleteCourse(dialogState.course)
            return
          }

          if (dialogState.type === "approve-lesson") {
            await handleApproveLesson(dialogState.courseId, dialogState.lessonId)
            return
          }

          if (dialogState.type === "reject-lesson") {
            await handleRejectLesson(dialogState.courseId, dialogState.lessonId, note || "")
          }
        }}
      />
    </div>
  )
}

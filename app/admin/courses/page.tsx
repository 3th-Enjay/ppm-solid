"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { Category, Course } from "@/lib/types"
import { AdminActionDialog } from "@/components/admin/AdminActionDialog"

type AdminCourseActionDialogState =
  | { type: "toggle-approval"; course: Course }
  | { type: "toggle-publish"; course: Course }
  | { type: "delete-course"; course: Course }
  | { type: "approve-lesson"; courseId: string; lessonId: string; courseTitle: string; lessonTitle: string }
  | { type: "reject-lesson"; courseId: string; lessonId: string; courseTitle: string; lessonTitle: string }

export default function AdminCoursesPage() {
  const { token } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState("")
  const [categoryMessage, setCategoryMessage] = useState("")
  const [actionMessage, setActionMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [dialogState, setDialogState] = useState<AdminCourseActionDialogState | null>(null)
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [coursesRes, categoriesRes] = await Promise.all([
        fetch("/api/courses?includeDrafts=true", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }),
        fetch("/api/categories"),
      ])
      const data = await coursesRes.json()
      const categoriesData = await categoriesRes.json()
      setCourses(data.courses || [])
      setCategories(categoriesData.categories || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    const name = newCategory.trim()
    if (!name) return
    setCategoryMessage("")
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create category")
      setCategories((prev) => [...prev, data.category])
      setNewCategory("")
      setCategoryMessage("Category created.")
    } catch (err: any) {
      setCategoryMessage(err?.message || "Failed to create category.")
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategoryId) return
    const name = editingCategoryName.trim()
    if (!name) return
    setCategoryMessage("")
    try {
      const res = await fetch(`/api/categories/${editingCategoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update category")
      setCategories((prev) => prev.map((c) => (c.id === editingCategoryId ? data.category : c)))
      setEditingCategoryId(null)
      setEditingCategoryName("")
      setCategoryMessage("Category updated.")
    } catch (err: any) {
      setCategoryMessage(err?.message || "Failed to update category.")
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
      setActionMessage("Course updated.")
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
    .flatMap((course) => course.modules.flatMap((m) => m.lessons.map((l) => ({ course, module: m, lesson: l }))))
    .filter((x: any) => x.lesson.pendingApproval)

  const filteredCourses = useMemo(() => {
    if (!search.trim()) return courses
    const query = search.toLowerCase()
    return courses.filter((course) =>
      [course.title, course.description, course.category, course.level, course.instructorId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [courses, search])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Course Review</h1>

      {actionMessage && (
        <Alert className="mb-6">
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>{actionMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
          <CardDescription>Create or rename course categories.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {categoryMessage && (
            <Alert>
              <AlertTitle>Info</AlertTitle>
              <AlertDescription>{categoryMessage}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="New category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <Button variant="outline" onClick={handleAddCategory}>
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2">
                {editingCategoryId === cat.id ? (
                  <>
                    <Input value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} />
                    <Button size="sm" onClick={handleEditCategory}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCategoryId(null)
                        setEditingCategoryName("")
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm flex-1">{cat.name}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCategoryId(cat.id)
                        setEditingCategoryName(cat.name)
                      }}
                    >
                      Edit
                    </Button>
                  </>
                )}
              </div>
            ))}
            {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
          <CardDescription>Approve, edit pricing, publish, or delete instructor courses.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search by title, category, level, or instructor ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : filteredCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses found.</p>
          ) : (
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <Card key={course.id}>
                  <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {course.category} - {course.level} - Instructor: {course.instructorId}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Approved: {course.approved ? "Yes" : "No"}</span>
                      <span>Published: {course.published ? "Yes" : "No"}</span>
                      <span>NGN {course.price?.NGN ?? 0}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-muted-foreground line-clamp-2 md:max-w-xl">{course.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => setDialogState({ type: "toggle-approval", course })}
                        disabled={pendingActionKey === `course-update-${course.id}`}
                      >
                        {pendingActionKey === `course-update-${course.id}` ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : course.approved ? (
                          "Revoke Approval"
                        ) : (
                          "Approve Course"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => setDialogState({ type: "toggle-publish", course })}
                        disabled={pendingActionKey === `course-update-${course.id}`}
                      >
                        {pendingActionKey === `course-update-${course.id}` ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : course.published ? (
                          "Unpublish"
                        ) : (
                          "Publish"
                        )}
                      </Button>
                      <Button size="sm" variant="outline" asChild className="w-full sm:w-auto">
                        <Link href={`/admin/courses/${course.id}/edit`}>Edit Details</Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild className="w-full sm:w-auto">
                        <Link href={`/admin/courses/${course.id}/content`}>Edit Content</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full sm:w-auto"
                        onClick={() => setDialogState({ type: "delete-course", course })}
                        disabled={pendingActionKey === `course-delete-${course.id}`}
                      >
                        {pendingActionKey === `course-delete-${course.id}` ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-3">Lesson Approvals</h2>
      {loading ? (
        <p>Loading...</p>
      ) : pendingLessons.length === 0 ? (
        <p>No lessons pending review.</p>
      ) : (
        <div className="space-y-4">
          {pendingLessons.map((item: any) => {
            const url = item.lesson.content?.videoUrl as string | undefined
            let embed: string | null = null
            if (url) {
              const match = url.match(
                /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/,
              )
              if (match && match[1]) embed = `https://www.youtube-nocookie.com/embed/${match[1]}`
            }

            return (
              <Card key={item.lesson.id}>
                <CardHeader>
                  <CardTitle>
                    {item.course.title} - {item.lesson.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {embed ? (
                    <div className="aspect-video mb-3">
                      <iframe src={embed} allowFullScreen className="w-full h-full" />
                    </div>
                  ) : (
                    <p>No preview available.</p>
                  )}
                  <div className="flex gap-2">
                    <Button
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
                    >
                      {pendingActionKey === `lesson-approve-${item.lesson.id}` ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        "Approve"
                      )}
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/admin/courses/${item.course.id}/edit`}>Edit Details</Link>
                    </Button>
                    <Button
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
                    >
                      {pendingActionKey === `lesson-reject-${item.lesson.id}` ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        "Reject"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AdminActionDialog
        open={Boolean(dialogState)}
        onOpenChange={(open) => {
          if (!open) setDialogState(null)
        }}
        title={
          dialogState?.type === "toggle-approval"
            ? dialogState.course.approved
              ? "Revoke course approval"
              : "Approve course"
            : dialogState?.type === "toggle-publish"
              ? dialogState.course.published
                ? "Unpublish course"
                : "Publish course"
              : dialogState?.type === "delete-course"
                ? "Delete course"
                : dialogState?.type === "approve-lesson"
                  ? "Approve lesson"
                  : dialogState?.type === "reject-lesson"
                    ? "Reject lesson"
                    : "Confirm action"
        }
        description={
          dialogState?.type === "toggle-approval"
            ? `This will ${dialogState.course.approved ? "revoke approval for" : "approve"} "${dialogState.course.title}".`
            : dialogState?.type === "toggle-publish"
              ? `This will ${dialogState.course.published ? "unpublish" : "publish"} "${dialogState.course.title}".`
              : dialogState?.type === "delete-course"
                ? `This permanently deletes "${dialogState.course.title}" and all related content.`
                : dialogState?.type === "approve-lesson"
                  ? `Approve "${dialogState.lessonTitle}" in ${dialogState.courseTitle}.`
                  : dialogState?.type === "reject-lesson"
                    ? `Reject "${dialogState.lessonTitle}" in ${dialogState.courseTitle}.`
                    : "Confirm this action."
        }
        warningBadge={
          dialogState?.type === "delete-course" || dialogState?.type === "reject-lesson"
            ? "Destructive Action"
            : "Operational Action"
        }
        secondaryDescription={
          dialogState?.type === "reject-lesson"
            ? "A rejection note is required for instructor visibility."
            : undefined
        }
        noteLabel={dialogState?.type === "reject-lesson" ? "Rejection note" : undefined}
        notePlaceholder="Provide clear feedback for the instructor..."
        noteRequired={dialogState?.type === "reject-lesson"}
        confirmLabel={
          dialogState?.type === "delete-course"
            ? "Delete Course"
            : dialogState?.type === "reject-lesson"
              ? "Reject Lesson"
              : "Confirm"
        }
        successToast="Action completed."
        errorToast="Action failed."
        executeAction={async (note) => {
          if (!dialogState) return

          if (dialogState.type === "toggle-approval") {
            await updateCourse(dialogState.course.id, {
              approved: !dialogState.course.approved,
              published: dialogState.course.approved ? false : dialogState.course.published,
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

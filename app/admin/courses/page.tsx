"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuthStore } from "@/lib/store"
import type { Category, Course } from "@/lib/types"

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
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)

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
      setActionMessage(err?.message || "Failed to update course.")
    }
  }

  const deleteCourse = async () => {
    if (!deleteTarget) return
    setActionMessage("")
    try {
      const res = await fetch(`/api/courses/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete course")
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setDeleteTarget(null)
      setActionMessage("Course deleted.")
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to delete course.")
    }
  }

  const handleApproveLesson = async (courseId: string, lessonId: string) => {
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
                        onClick={() =>
                          updateCourse(course.id, {
                            approved: !course.approved,
                            published: course.approved ? false : course.published,
                          })
                        }
                      >
                        {course.approved ? "Revoke Approval" : "Approve Course"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() =>
                          updateCourse(course.id, {
                            published: !course.published,
                          })
                        }
                      >
                        {course.published ? "Unpublish" : "Publish"}
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
                        onClick={() => setDeleteTarget(course)}
                      >
                        Delete
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
                    <Button onClick={() => handleApproveLesson(item.course.id, item.lesson.id)}>Approve</Button>
                    <Button variant="outline" asChild>
                      <Link href={`/admin/courses/${item.course.id}/edit`}>Edit Details</Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const note = window.prompt("Enter rejection note for instructor:") || ""
                        if (!note) return
                        try {
                          const res = await fetch(
                            `/api/courses/${item.course.id}/lessons/${item.lesson.id}/reject`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${localStorage.getItem("auth-storage") ? JSON.parse(localStorage.getItem("auth-storage") || "null")?.token : ""}`,
                              },
                              body: JSON.stringify({ note }),
                            },
                          )
                          if (!res.ok) throw new Error("Reject failed")
                          await load()
                        } catch (err) {
                          console.error(err)
                          alert("Failed to send rejection note")
                        }
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete course</DialogTitle>
            <DialogDescription>This will permanently remove the course. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="text-sm">
            {deleteTarget ? (
              <span>
                You are deleting <strong>{deleteTarget.title}</strong>.
              </span>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteCourse}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

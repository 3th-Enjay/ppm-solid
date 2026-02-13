"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Course } from "@/lib/types"
import { useAuthStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Category } from "@/lib/types"
import Link from "next/link"

export default function AdminCoursesPage() {
  const { token } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState("")
  const [categoryMessage, setCategoryMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [coursesRes, categoriesRes] = await Promise.all([
        fetch("/api/courses?includeDrafts=true"),
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

  const handleApprove = async (courseId: string, lessonId: string) => {
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

  const pendingLessons = courses.flatMap((course) =>
    course.modules.flatMap((m) => m.lessons.map((l) => ({ course, module: m, lesson: l })))
  ).filter((x: any) => x.lesson.pendingApproval)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Course Review</h1>

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
                    <Input
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                    />
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
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">No categories yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

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
              const m = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/)
              if (m && m[1]) embed = `https://www.youtube-nocookie.com/embed/${m[1]}`
            }

            return (
              <Card key={item.lesson.id}>
                <CardHeader>
                  <CardTitle>{item.course.title} — {item.lesson.title}</CardTitle>
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
                    <Button onClick={() => handleApprove(item.course.id, item.lesson.id)}>
                      Approve
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/admin/courses/${item.course.id}/edit`}>Edit Details</Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const note = window.prompt("Enter rejection note for instructor:") || ""
                        if (!note) return
                        try {
                          const res = await fetch(`/api/courses/${item.course.id}/lessons/${item.lesson.id}/reject`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${localStorage.getItem("auth-storage") ? JSON.parse(localStorage.getItem("auth-storage") || "null")?.token : ""}`,
                            },
                            body: JSON.stringify({ note }),
                          })
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
    </div>
  )
}
/*
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, CheckCircle2, XCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import type { Course } from "@/lib/types"

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/courses?includeDrafts=true")
      const data = await res.json()
      setCourses(data.courses ?? [])
    }
    load()
  }, [])

  const filtered = courses.filter(c =>
    (c.title + c.description + c.category)
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const togglePublish = async (course: Course) => {
    const res = await fetch(`/api/courses/${course.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !course.published }),
    })
    if (!res.ok) return
    const data = await res.json()
    setCourses(prev => prev.map(c => (c.id === course.id ? data.course : c)))
  }

  const deleteCourse = async (course: Course) => {
    if (!confirm("Delete this course?")) return
    const res = await fetch(`/api/courses/${course.id}`, { method: "DELETE" })
    if (!res.ok) return
    setCourses(prev => prev.filter(c => c.id !== course.id))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Course Approval</h1>
          <p className="text-muted-foreground">
            Review, approve, and manage all courses on the platform.
          </p>
        </div>
      </div>

      <div className="max-w-md mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by title, description, or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filtered.map(course => (
          <Card key={course.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {course.category} • {course.level}
                </p>
              </div>
              <Badge variant={course.published ? "default" : "secondary"}>
                {course.published ? "Published" : "Draft"}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground line-clamp-2 md:max-w-xl">
                {course.description}
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/courses/${course.slug}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Link>
                </Button>
                <Button
                  variant={course.published ? "outline" : "default"}
                  size="sm"
                  onClick={() => togglePublish(course)}
                >
                  {course.published ? (
                    <>
                      <XCircle className="h-4 w-4 mr-1" /> Unpublish
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Approve / Publish
                    </>
                  )}
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/courses/${course.id}/content`}>
                    <Eye className="h-4 w-4 mr-1" />
                    Edit Content
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteCourse(course)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-sm">No courses found.</p>
        )}
      </div>
    </div>
  )
}
*/

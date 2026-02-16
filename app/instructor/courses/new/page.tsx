"use client"

import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle2, Link as LinkIcon, Upload, FileVideo, Plus, Trash2 } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { CourseCategory, CourseLevel, Category } from "@/lib/types"

const levels: CourseLevel[] = ["Beginner Courses", "Intermediate Courses", "Pro Courses"]
const levelLabels: Record<CourseLevel, string> = {
  "Beginner Courses": "Beginner Courses",
  "Intermediate Courses": "Intermediate Courses",
  "Pro Courses": "Pro Courses",
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export default function NewCoursePage() {
  const { user, token } = useAuthStore()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<CourseCategory | "">("")
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState("")
  const [level, setLevel] = useState<CourseLevel | "">("")
  const [priceNGN, setPriceNGN] = useState("45000")
  const [priceUSD, setPriceUSD] = useState("99")
  const [priceEUR, setPriceEUR] = useState("89")
  const [priceGBP, setPriceGBP] = useState("79")
  const [thumbnail, setThumbnail] = useState("")
  const [thumbnailPreview, setThumbnailPreview] = useState("")
  const [duration, setDuration] = useState("")
  const [overview, setOverview] = useState("")
  const [lessons, setLessons] = useState([
    { title: "Lesson 1", videoUrl: "", duration: 10 },
  ])
  const [publishNow, setPublishNow] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const firstLesson = lessons[0]
  const firstLessonVideoId = useMemo(() => {
    if (!firstLesson?.videoUrl) return ""
    const match = firstLesson.videoUrl.match(
      /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/,
    )
    return match?.[1] || ""
  }, [firstLesson?.videoUrl])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories")
        const data = await res.json()
        setCategories(data.categories || [])
      } catch (error) {
        console.error("Failed to load categories:", error)
      }
    }
    loadCategories()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage("")
    setErrorMessage("")

    if (!user) {
      setErrorMessage("You must be logged in to create a course.")
      return
    }

    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()

    if (!trimmedTitle || !trimmedDescription || !category || !level) {
      setErrorMessage("Please fill out the required fields.")
      return
    }
    if (trimmedTitle.length < 5) {
      setErrorMessage("Title must be at least 5 characters.")
      return
    }
    if (!duration || Number(duration) <= 0) {
      setErrorMessage("Course duration is required.")
      return
    }
    const prices = [Number(priceNGN) || 0, Number(priceUSD) || 0, Number(priceEUR) || 0, Number(priceGBP) || 0]
    if (!prices.some((value) => value > 0)) {
      setErrorMessage("At least one price must be greater than 0.")
      return
    }
    if (!lessons[0]?.videoUrl?.trim()) {
      setErrorMessage("Add at least one YouTube video URL for the first lesson.")
      return
    }

    const overviewItems = overview
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          description: trimmedDescription,
          category,
          level,
          instructorId: user.id,
          price: {
            NGN: Number(priceNGN) || 0,
            USD: Number(priceUSD) || 0,
            EUR: Number(priceEUR) || 0,
            GBP: Number(priceGBP) || 0,
          },
          overview: overviewItems.length ? overviewItems : undefined,
          thumbnail: thumbnail.trim() || "/placeholder.jpg",
          published: publishNow,
          modules: [
            {
              id: `module-${Date.now()}`,
              title: "Module 1",
              order: 1,
              lessons: lessons.map((lesson, index) => ({
                id: `lesson-${Date.now()}-${index}`,
                title: lesson.title.trim() || `Lesson ${index + 1}`,
                type: "video",
                order: index + 1,
                duration: Number(lesson.duration) || 10,
                isFree: index === 0,
                content: { videoUrl: lesson.videoUrl.trim() },
              })),
            },
          ],
          totalDuration: Number(duration) || 0,
          enrollmentCount: 0,
          rating: 0,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create course")
      }

      const data = await res.json()
      setSuccessMessage(`Course created: ${data.course?.title || title}`)
      setTitle("")
      setDescription("")
      setCategory("")
      setLevel("")
      setPriceNGN("45000")
      setPriceUSD("99")
      setPriceEUR("89")
      setPriceGBP("79")
      setThumbnail("")
      setThumbnailPreview("")
      setDuration("")
      setOverview("")
      setLessons([{ title: "Lesson 1", videoUrl: "", duration: 10 }])
      setPublishNow(false)
    } catch (error) {
      console.error("Failed to create course:", error)
      if (error instanceof Error) {
        const message = error.message?.trim()
        if (message?.startsWith("[")) {
          try {
            const parsed = JSON.parse(message)
            const firstError = parsed?.[0]?.message
            if (firstError) {
              setErrorMessage(firstError)
              return
            }
          } catch {
            // fall through to generic message
          }
        }
      }
      setErrorMessage("Failed to create course. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleThumbnailChange = (file?: File | null) => {
    if (!file) {
      setThumbnail("")
      setThumbnailPreview("")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || "")
      setThumbnail(result)
      setThumbnailPreview(result)
    }
    reader.readAsDataURL(file)
  }

  const addLesson = () => {
    setLessons((prev) => [
      ...prev,
      { title: `Lesson ${prev.length + 1}`, videoUrl: "", duration: 10 },
    ])
  }

  const updateLesson = (index: number, updates: Partial<(typeof lessons)[number]>) => {
    setLessons((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...updates }
      return next
    })
  }

  const removeLesson = (index: number) => {
    if (index === 0) return
    setLessons((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleAddCategory = async () => {
    const name = newCategory.trim()
    if (!name) return
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
      if (!res.ok) {
        throw new Error(data.error || "Failed to create category")
      }
      setCategories((prev) => [...prev, data.category])
      setNewCategory("")
    } catch (error) {
      console.error("Failed to create category:", error)
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategoryId) return
    const name = editingCategoryName.trim()
    if (!name) return
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
      if (!res.ok) {
        throw new Error(data.error || "Failed to update category")
      }
      setCategories((prev) => prev.map((c) => (c.id === editingCategoryId ? data.category : c)))
      setEditingCategoryId(null)
      setEditingCategoryName("")
      if (category === (data.category?.name || "")) {
        setCategory(data.category.name)
      }
    } catch (error) {
      console.error("Failed to update category:", error)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/instructor">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Course</h1>
        <p className="text-muted-foreground mt-2">
          Set up the basics. You can add modules and lessons after saving.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>How to Create and Upload a Course</CardTitle>
          <CardDescription>Follow this flow for the best instructor experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Fill in course title, description, category, and level below.</li>
            <li>Set pricing for each currency.</li>
            <li>Create the course.</li>
            <li>Open the course content editor and add lessons.</li>
            <li>For video lessons, paste a YouTube link (public or unlisted).</li>
            <li>Save content, then submit for review if required.</li>
          </ol>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="outline">
              <Link href="/instructor/upload">
                <Upload className="h-4 w-4 mr-2" />
                YouTube Upload Guide
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/instructor/courses">
                <LinkIcon className="h-4 w-4 mr-2" />
                Go to My Courses
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {successMessage && (
        <Alert className="mb-6">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Course Created</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="mb-6" variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
            <CardDescription>Basic information about your course</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Modern Web Development"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Write a concise course summary..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="overview">Overview (one item per line)</Label>
              <Textarea
                id="overview"
                placeholder="What learners will gain or cover..."
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as CourseCategory)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Manage categories (add or rename)</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="New category name"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={handleAddCategory}>
                      Add
                    </Button>
                  </div>
                  {categories.length > 0 && (
                    <div className="space-y-2">
                      {categories.slice(0, 6).map((cat) => (
                        <div key={cat.id} className="flex items-center gap-2">
                          {editingCategoryId === cat.id ? (
                            <>
                              <Input
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                              />
                              <Button type="button" size="sm" onClick={handleEditCategory}>
                                Save
                              </Button>
                              <Button
                                type="button"
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
                                type="button"
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
                      {categories.length > 6 && (
                        <p className="text-xs text-muted-foreground">
                          Showing 6 categories. Use search on courses page to see all.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Level *</Label>
                <Select value={level} onValueChange={(value) => setLevel(value as CourseLevel)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((item) => (
                      <SelectItem key={item} value={item}>
                        {levelLabels[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Set pricing for each currency</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price-ngn">NGN</Label>
              <Input
                id="price-ngn"
                type="number"
                value={priceNGN}
                onChange={(e) => setPriceNGN(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price-usd">USD</Label>
              <Input
                id="price-usd"
                type="number"
                value={priceUSD}
                onChange={(e) => setPriceUSD(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price-eur">EUR</Label>
              <Input
                id="price-eur"
                type="number"
                value={priceEUR}
                onChange={(e) => setPriceEUR(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price-gbp">GBP</Label>
              <Input
                id="price-gbp"
                type="number"
                value={priceGBP}
                onChange={(e) => setPriceGBP(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Media</CardTitle>
            <CardDescription>Course thumbnail (optional) and total duration</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Course Thumbnail (optional)</Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => handleThumbnailChange(e.target.files?.[0])}
              />
              {thumbnailPreview && (
                <div className="mt-2 overflow-hidden rounded-lg border">
                  <img src={thumbnailPreview} alt="Course thumbnail preview" className="w-full h-40 object-cover" />
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Total Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>First Lesson (YouTube)</CardTitle>
            <CardDescription>
              Add at least one YouTube video URL to save the course. You can add more lessons later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lessons.map((lesson, index) => (
              <div key={`lesson-${index}`} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Lesson {index + 1}</h4>
                  {index > 0 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeLesson(index)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Lesson Title</Label>
                  <Input
                    value={lesson.title}
                    onChange={(e) => updateLesson(index, { title: e.target.value })}
                    placeholder="e.g. Introduction to the Course"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <FileVideo className="h-4 w-4" />
                    YouTube Video URL *
                  </Label>
                  <Input
                    value={lesson.videoUrl}
                    onChange={(e) => updateLesson(index, { videoUrl: e.target.value })}
                    placeholder="https://youtu.be/VIDEOID"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Lesson Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={lesson.duration}
                    onChange={(e) => updateLesson(index, { duration: Number(e.target.value) || 0 })}
                  />
                </div>
                {index === 0 && firstLessonVideoId && (
                  <div className="aspect-video overflow-hidden rounded border">
                    <iframe
                      title="First lesson preview"
                      src={`https://www.youtube-nocookie.com/embed/${firstLessonVideoId}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addLesson}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lesson
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Publish</CardTitle>
            <CardDescription>Decide when your course is visible to students</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={publishNow} onCheckedChange={(value) => setPublishNow(Boolean(value))} />
              Publish this course immediately
            </label>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Course"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/instructor">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}

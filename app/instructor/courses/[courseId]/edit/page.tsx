"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Link as LinkIcon, Save, Trash2, Upload } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { Course, CourseCategory, CourseLevel, Category } from "@/lib/types"

const levels: CourseLevel[] = ["Beginner Courses", "Intermediate Courses", "Pro Courses"]

const levelLabels: Record<CourseLevel, string> = {
  "Beginner Courses": "Beginner Courses",
  "Intermediate Courses": "Intermediate Courses",
  "Pro Courses": "Pro Courses",
}

const legacyLevelMap: Record<string, CourseLevel> = {
  beginner: "Beginner Courses",
  intermediate: "Intermediate Courses",
  advanced: "Pro Courses",
}

export default function InstructorCourseEditPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const { token } = useAuthStore()

  const [course, setCourse] = useState<Course | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<CourseCategory | "">("")
  const [level, setLevel] = useState<CourseLevel | "">("")
  const [priceNGN, setPriceNGN] = useState("0")
  const [priceUSD, setPriceUSD] = useState("0")
  const [priceEUR, setPriceEUR] = useState("0")
  const [priceGBP, setPriceGBP] = useState("0")
  const [thumbnail, setThumbnail] = useState("")
  const [duration, setDuration] = useState("0")
  const [overview, setOverview] = useState("")
  const [publishNow, setPublishNow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const [courseRes, categoriesRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token || ""}` },
          }),
          fetch("/api/categories"),
        ])
        if (!courseRes.ok) {
          router.push("/instructor/courses")
          return
        }
        const courseData = await courseRes.json()
        const categoriesData = await categoriesRes.json()
        const fetchedCourse: Course = courseData.course
        setCourse(fetchedCourse)
        setTitle(fetchedCourse.title || "")
        setDescription(fetchedCourse.description || "")
        setCategory(fetchedCourse.category || "")

        const normalizedLevel =
          legacyLevelMap[String(fetchedCourse.level).toLowerCase()] ||
          (fetchedCourse.level as CourseLevel)
        setLevel(normalizedLevel || "")

        setPriceNGN(String(fetchedCourse.price?.NGN ?? 0))
        setPriceUSD(String(fetchedCourse.price?.USD ?? 0))
        setPriceEUR(String(fetchedCourse.price?.EUR ?? 0))
        setPriceGBP(String(fetchedCourse.price?.GBP ?? 0))
        setThumbnail(fetchedCourse.thumbnail || "")
        setDuration(String(fetchedCourse.totalDuration ?? 0))
        setOverview((fetchedCourse.overview || []).join("\n"))
        setPublishNow(Boolean(fetchedCourse.published))
        setCategories(categoriesData.categories || [])
      } catch (error) {
        console.error("Failed to load course:", error)
      }
    }
    load()
  }, [courseId, router, token])

  const handleSave = async () => {
    if (!course) return
    setSaving(true)
    setSuccessMessage("")
    setErrorMessage("")
    try {
      const prices = [Number(priceNGN) || 0, Number(priceUSD) || 0, Number(priceEUR) || 0, Number(priceGBP) || 0]
      if (!prices.some((value) => value > 0)) {
        setErrorMessage("At least one price must be greater than 0.")
        return
      }

      const overviewItems = overview
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)

      const res = await fetch(`/api/courses/${course.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          level,
          price: {
            NGN: Number(priceNGN) || 0,
            USD: Number(priceUSD) || 0,
            EUR: Number(priceEUR) || 0,
            GBP: Number(priceGBP) || 0,
          },
          overview: overviewItems.length ? overviewItems : undefined,
          thumbnail: thumbnail.trim() || "/placeholder.jpg",
          totalDuration: Number(duration) || 0,
          published: publishNow,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update course")
      }
      setSuccessMessage("Course details updated successfully.")
      setCourse(data.course)
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to update course.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!course) return
    setSuccessMessage("")
    setErrorMessage("")
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete course")
      }
      router.push("/instructor/courses")
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to delete course.")
    }
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
      setCategory(data.category.name)
      setNewCategory("")
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to create category.")
    }
  }

  if (!course) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading course details...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/instructor/courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Course Details</h1>
        <p className="text-muted-foreground mt-2">Update course info, pricing, and visibility.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>How to Update This Course</CardTitle>
          <CardDescription>Use this workflow to keep edits clean and publish-ready.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Update title, description, level, and category.</li>
            <li>Adjust prices and duration.</li>
            <li>Click Save Changes.</li>
            <li>Open Edit Content to manage modules, lessons, and video URLs.</li>
            <li>Publish only after content and pricing are final.</li>
          </ol>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="outline">
              <Link href={`/instructor/courses/${course.id}/content`}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Edit Course Content
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/instructor/upload">
                <Upload className="h-4 w-4 mr-2" />
                YouTube Upload Guide
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {successMessage && (
        <Alert className="mb-6">
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="mb-6" variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
            <CardDescription>Title, description, category, and level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="overview">Overview (one item per line)</Label>
              <Textarea id="overview" value={overview} onChange={(e) => setOverview(e.target.value)} />
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
                <div className="flex gap-2">
                  <Input
                    placeholder="Create category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <Button type="button" variant="outline" onClick={handleAddCategory}>
                    Add
                  </Button>
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

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Set pricing for each currency</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price-ngn">NGN</Label>
              <Input id="price-ngn" type="number" value={priceNGN} onChange={(e) => setPriceNGN(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price-usd">USD</Label>
              <Input id="price-usd" type="number" value={priceUSD} onChange={(e) => setPriceUSD(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price-eur">EUR</Label>
              <Input id="price-eur" type="number" value={priceEUR} onChange={(e) => setPriceEUR(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price-gbp">GBP</Label>
              <Input id="price-gbp" type="number" value={priceGBP} onChange={(e) => setPriceGBP(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media</CardTitle>
            <CardDescription>Thumbnail and duration</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input id="thumbnail" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Estimated Duration (minutes)</Label>
              <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publish</CardTitle>
            <CardDescription>Choose whether the course is visible to students</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={publishNow}
                onChange={(e) => setPublishNow(e.target.checked)}
                className="h-4 w-4"
              />
              Publish this course immediately
            </label>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/instructor/courses/${course.id}/content`}>Edit Content</Link>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete course</DialogTitle>
                <DialogDescription>
                  This will permanently delete this course and its content. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete Course
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

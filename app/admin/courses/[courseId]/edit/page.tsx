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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
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

export default function AdminCourseEditPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const { token } = useAuthStore()

  const [course, setCourse] = useState<Course | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
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
  const [publishNow, setPublishNow] = useState(false)
  const [approved, setApproved] = useState(false)
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
          router.push("/admin/courses")
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
        setPublishNow(Boolean(fetchedCourse.published))
        setApproved(Boolean(fetchedCourse.approved))
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
          thumbnail: thumbnail.trim() || "/placeholder.jpg",
          totalDuration: Number(duration) || 0,
          published: publishNow,
          approved,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update course")
      }
      setSuccessMessage("Course updated successfully.")
      setCourse(data.course)
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to update course.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!course) return
    if (!confirm("Delete this course? This cannot be undone.")) return
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete course")
      }
      router.push("/admin/courses")
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to delete course.")
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
        <Link href="/admin/courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Review
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Course Details</h1>
        <p className="text-muted-foreground mt-2">Admin edit for full course details and approval.</p>
      </div>

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
            <CardTitle>Publishing</CardTitle>
            <CardDescription>Visibility and approval controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={publishNow}
                onChange={(e) => setPublishNow(e.target.checked)}
                className="h-4 w-4"
              />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={approved}
                onChange={(e) => setApproved(e.target.checked)}
                className="h-4 w-4"
              />
              Approved
            </label>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/admin/courses/${course.id}/content`}>Edit Content</Link>
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
                  This will permanently delete the course and its content. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
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

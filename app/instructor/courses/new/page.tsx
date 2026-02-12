"use client"

import { useState } from "react"
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
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { CourseCategory, CourseLevel } from "@/lib/types"

const categories: CourseCategory[] = [
  "development",
  "design",
  "business",
  "marketing",
  "photography",
  "music",
]

const levels: CourseLevel[] = ["beginner", "intermediate", "advanced"]

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export default function NewCoursePage() {
  const { user } = useAuthStore()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<CourseCategory | "">("")
  const [level, setLevel] = useState<CourseLevel | "">("")
  const [priceNGN, setPriceNGN] = useState("45000")
  const [priceUSD, setPriceUSD] = useState("99")
  const [priceEUR, setPriceEUR] = useState("89")
  const [priceGBP, setPriceGBP] = useState("79")
  const [thumbnail, setThumbnail] = useState("")
  const [duration, setDuration] = useState("0")
  const [publishNow, setPublishNow] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage("")
    setErrorMessage("")

    if (!user) {
      setErrorMessage("You must be logged in to create a course.")
      return
    }

    if (!title.trim() || !description.trim() || !category || !level) {
      setErrorMessage("Please fill out the required fields.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          level,
          instructorId: user.id,
          price: {
            NGN: Number(priceNGN) || 0,
            USD: Number(priceUSD) || 0,
            EUR: Number(priceEUR) || 0,
            GBP: Number(priceGBP) || 0,
          },
          thumbnail: thumbnail.trim() || "/placeholder.jpg",
          published: publishNow,
          modules: [],
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
      setDuration("0")
      setPublishNow(false)
    } catch (error) {
      console.error("Failed to create course:", error)
      setErrorMessage("Failed to create course. Please try again.")
    } finally {
      setIsSubmitting(false)
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as CourseCategory)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
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
                        {item}
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
            <CardDescription>Course thumbnail and duration</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                placeholder="/placeholder.jpg"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Estimated Duration (minutes)</Label>
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

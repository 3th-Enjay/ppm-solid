"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Clock,
  Code2,
  Eye,
  FileCode,
  FileText,
  FileVideo,
  HelpCircle,
  Layers,
  Link as LinkIcon,
  Pencil,
  Plus,
  Save,
  Terminal,
  Trash2,
} from "lucide-react"
import type { Course, CourseModule, Lesson, LessonAssignmentDetails, LessonType } from "@/lib/types"
import { useAuthStore } from "@/lib/store"
import { TechnicalContentRenderer } from "@/components/learning/TechnicalContentRenderer"

type ResourceItem = { title: string; url: string }

const lessonTypes: LessonType[] = ["video", "article", "quiz", "assignment"]

export default function InstructorCourseContentPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const { token } = useAuthStore()

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<CourseModule[]>([])
  const [priceNGN, setPriceNGN] = useState("0")
  const [priceUSD, setPriceUSD] = useState("0")
  const [priceEUR, setPriceEUR] = useState("0")
  const [priceGBP, setPriceGBP] = useState("0")
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [activePreviewLessonId, setActivePreviewLessonId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}`, {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        })
        if (!res.ok) {
          router.push("/instructor/courses")
          return
        }
        const data = await res.json()
        setCourse(data.course)
        setModules(data.course?.modules || [])
        setPriceNGN(String(data.course?.price?.NGN ?? 0))
        setPriceUSD(String(data.course?.price?.USD ?? 0))
        setPriceEUR(String(data.course?.price?.EUR ?? 0))
        setPriceGBP(String(data.course?.price?.GBP ?? 0))
      } catch (error) {
        console.error("Failed to load course:", error)
      }
    }
    load()
  }, [courseId, router, token])

  const totalLessons = useMemo(
    () => modules.reduce((sum, module) => sum + module.lessons.length, 0),
    [modules],
  )

  const addModule = () => {
    setModules((prev) => [
      ...prev,
      {
        id: `module-${Date.now()}`,
        title: `Module ${prev.length + 1}: Technical Domain`,
        order: prev.length + 1,
        lessons: [],
      },
    ])
  }

  const updateModuleTitle = (index: number, title: string) => {
    setModules((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], title }
      return next
    })
  }

  const removeModule = (index: number) => {
    setModules((prev) => prev.filter((_, idx) => idx !== index))
  }

  const moveModule = (index: number, direction: -1 | 1) => {
    setModules((prev) => {
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  const addLesson = (moduleIndex: number, type: LessonType = "article") => {
    setModules((prev) => {
      const next = [...prev]
      const lesson: Lesson = {
        id: `lesson-${Date.now()}`,
        title: `Lesson ${next[moduleIndex].lessons.length + 1}`,
        type,
        order: next[moduleIndex].lessons.length + 1,
        duration: 15,
        isFree: false,
        content: {
          articleContent: type === "article" ? "## Overview\n\nExplain the technical architecture and core concepts here.\n\n```typescript\n// Example Code\nexport function example() {\n  return true;\n}\n```\n" : "",
          videoUrl: "",
          resources: [],
        },
      }
      next[moduleIndex] = {
        ...next[moduleIndex],
        lessons: [...next[moduleIndex].lessons, lesson],
      }
      return next
    })
  }

  const updateLesson = (
    moduleIndex: number,
    lessonIndex: number,
    updates: Partial<Lesson>,
  ) => {
    setModules((prev) => {
      const next = [...prev]
      const lesson = next[moduleIndex].lessons[lessonIndex]
      next[moduleIndex].lessons[lessonIndex] = { ...lesson, ...updates }
      return next
    })
  }

  const updateLessonContent = (
    moduleIndex: number,
    lessonIndex: number,
    updates: Partial<Lesson["content"]>,
  ) => {
    setModules((prev) => {
      const next = [...prev]
      const lesson = next[moduleIndex].lessons[lessonIndex]
      next[moduleIndex].lessons[lessonIndex] = {
        ...lesson,
        content: { ...lesson.content, ...updates },
      }
      return next
    })
  }

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    setModules((prev) => {
      const next = [...prev]
      next[moduleIndex] = {
        ...next[moduleIndex],
        lessons: next[moduleIndex].lessons.filter((_, idx) => idx !== lessonIndex),
      }
      return next
    })
  }

  const moveLesson = (moduleIndex: number, lessonIndex: number, direction: -1 | 1) => {
    setModules((prev) => {
      const targetIndex = lessonIndex + direction
      const lessons = prev[moduleIndex].lessons
      if (targetIndex < 0 || targetIndex >= lessons.length) return prev
      const next = [...prev]
      const nextLessons = [...lessons]
      const [moved] = nextLessons.splice(lessonIndex, 1)
      nextLessons.splice(targetIndex, 0, moved)
      next[moduleIndex] = { ...next[moduleIndex], lessons: nextLessons }
      return next
    })
  }

  const insertCodeSnippet = (
    moduleIndex: number,
    lessonIndex: number,
    lang: "typescript" | "python" | "sql" | "bash",
  ) => {
    const snippets = {
      typescript: "\n\n```typescript\ninterface Config {\n  port: number;\n  host: string;\n}\n\nexport const appConfig: Config = {\n  port: 8080,\n  host: \"0.0.0.0\",\n};\n```\n",
      python: "\n\n```python\ndef execute_pipeline(data: list[dict]) -> dict:\n    \"\"\"Process engineering pipeline records.\"\"\"\n    processed = [item for item in data if item.get(\"active\")]\n    return {\"count\": len(processed), \"records\": processed}\n```\n",
      sql: "\n\n```sql\n-- Retrieve enrolled active learners\nSELECT u.id, u.name, e.course_id, e.enrolled_at\nFROM users u\nJOIN enrollments e ON u.id = e.user_id\nWHERE e.status = 'active'\nORDER BY e.enrolled_at DESC;\n```\n",
      bash: "\n\n```bash\n# Verify dependencies and run static verification\nnpm run test:academic\nnpx tsc --noEmit\n```\n",
    }

    const current = modules[moduleIndex].lessons[lessonIndex].content?.articleContent || ""
    updateLessonContent(moduleIndex, lessonIndex, {
      articleContent: current + snippets[lang],
    })
  }

  const addResource = (moduleIndex: number, lessonIndex: number) => {
    setModules((prev) => {
      const next = [...prev]
      const lesson = next[moduleIndex].lessons[lessonIndex]
      const resources = lesson.content.resources || []
      next[moduleIndex].lessons[lessonIndex] = {
        ...lesson,
        content: {
          ...lesson.content,
          resources: [...resources, { title: "", url: "" }],
        },
      }
      return next
    })
  }

  const updateResource = (
    moduleIndex: number,
    lessonIndex: number,
    resourceIndex: number,
    updates: Partial<ResourceItem>,
  ) => {
    setModules((prev) => {
      const next = [...prev]
      const lesson = next[moduleIndex].lessons[lessonIndex]
      const resources = [...(lesson.content.resources || [])]
      resources[resourceIndex] = { ...resources[resourceIndex], ...updates }
      next[moduleIndex].lessons[lessonIndex] = {
        ...lesson,
        content: { ...lesson.content, resources },
      }
      return next
    })
  }

  const removeResource = (moduleIndex: number, lessonIndex: number, resourceIndex: number) => {
    setModules((prev) => {
      const next = [...prev]
      const lesson = next[moduleIndex].lessons[lessonIndex]
      const resources = (lesson.content.resources || []).filter((_, idx) => idx !== resourceIndex)
      next[moduleIndex].lessons[lessonIndex] = {
        ...lesson,
        content: { ...lesson.content, resources },
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!course) return
    setSaving(true)
    setErrorMessage("")
    setSuccessMessage("")
    try {
      const prices = [Number(priceNGN) || 0, Number(priceUSD) || 0, Number(priceEUR) || 0, Number(priceGBP) || 0]
      if (!prices.some((value) => value > 0)) {
        setErrorMessage("At least one price currency must be greater than 0.")
        return
      }

      const totalDuration = modules.reduce((sum, module) => {
        return (
          sum +
          module.lessons.reduce((lessonSum, lesson) => lessonSum + (lesson.duration || 0), 0)
        )
      }, 0)

      const res = await fetch(`/api/courses/${course.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          price: {
            NGN: Number(priceNGN) || 0,
            USD: Number(priceUSD) || 0,
            EUR: Number(priceEUR) || 0,
            GBP: Number(priceGBP) || 0,
          },
          modules: modules.map((module, moduleIndex) => ({
            ...module,
            order: moduleIndex + 1,
            lessons: module.lessons.map((lesson, lessonIndex) => ({
              ...lesson,
              order: lessonIndex + 1,
            })),
          })),
          totalDuration,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to save curriculum content")
      }

      setSuccessMessage("Curriculum content, modules, and lessons saved successfully.")
    } catch (error: any) {
      console.error("Failed to save course:", error)
      setErrorMessage(error?.message || "Failed to save course curriculum.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/instructor/courses">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Courses
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600 text-white text-xs">Curriculum Architect</Badge>
              {course?.published ? (
                <Badge className="bg-emerald-600 text-white text-xs">Live</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Draft</Badge>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">
              {course?.title || "Curriculum & Lesson Authoring"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving Curriculum..." : "Save Content"}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <Alert className="border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Curriculum Stats & Add Module */}
      <Card variant="elevated">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Modules: </span>
              <strong className="text-slate-900 dark:text-slate-100">{modules.length}</strong>
            </div>
            <span className="text-muted-foreground">•</span>
            <div>
              <span className="text-muted-foreground">Total Lessons: </span>
              <strong className="text-slate-900 dark:text-slate-100">{totalLessons}</strong>
            </div>
            <span className="text-muted-foreground">•</span>
            <div>
              <span className="text-muted-foreground">Estimated Duration: </span>
              <strong className="text-slate-900 dark:text-slate-100">
                {modules.reduce((sum, m) => sum + m.lessons.reduce((ls, l) => ls + (l.duration || 0), 0), 0)} min
              </strong>
            </div>
          </div>
          <Button onClick={addModule} className="bg-blue-600 text-white hover:bg-blue-700 text-xs" size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add New Module
          </Button>
        </CardContent>
      </Card>

      {/* Modules List */}
      <div className="space-y-6">
        {modules.map((module, moduleIndex) => (
          <Card key={module.id} variant="elevated" className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Badge variant="outline" className="shrink-0 text-xs">
                    Module {moduleIndex + 1}
                  </Badge>
                  <Input
                    value={module.title}
                    onChange={(e) => updateModuleTitle(moduleIndex, e.target.value)}
                    placeholder="Module Title (e.g., Relational Data Modeling with PostgreSQL)"
                    className="font-semibold text-base max-w-xl"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={moduleIndex === 0}
                    onClick={() => moveModule(moduleIndex, -1)}
                    title="Move module up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={moduleIndex === modules.length - 1}
                    onClick={() => moveModule(moduleIndex, 1)}
                    title="Move module down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeModule(moduleIndex)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    title="Delete module"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs">
                  {module.lessons.length} lesson{module.lessons.length === 1 ? "" : "s"} in this module
                </CardDescription>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => addLesson(moduleIndex, "article")}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Markdown Lesson
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addLesson(moduleIndex, "video")}>
                    <FileVideo className="mr-1.5 h-3.5 w-3.5" />
                    Add Video Lesson
                  </Button>
                </div>
              </div>

              {/* Lesson Items */}
              <div className="space-y-4">
                {module.lessons.map((lesson, lessonIndex) => {
                  const isPreviewMode = activePreviewLessonId === lesson.id

                  return (
                    <Card key={lesson.id} className="border border-border/80 bg-card/60">
                      <CardHeader className="border-b border-border/60 pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Lesson {lessonIndex + 1}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={
                                lesson.type === "article"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                  : "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                              }
                            >
                              {lesson.type}
                            </Badge>
                            {lesson.isFree && <Badge className="bg-emerald-600 text-white text-[10px]">Free Preview</Badge>}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={lessonIndex === 0}
                              onClick={() => moveLesson(moduleIndex, lessonIndex, -1)}
                              title="Move lesson up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={lessonIndex === module.lessons.length - 1}
                              onClick={() => moveLesson(moduleIndex, lessonIndex, 1)}
                              title="Move lesson down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLesson(moduleIndex, lessonIndex)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete lesson"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 pt-4">
                        <Input
                          value={lesson.title}
                          onChange={(e) =>
                            updateLesson(moduleIndex, lessonIndex, { title: e.target.value })
                          }
                          placeholder="Lesson title (e.g. Index Tuning & Query Optimization)"
                          className="font-medium"
                        />

                        {/* Metadata row */}
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <Label className="text-xs">Format Type</Label>
                            <Select
                              value={lesson.type}
                              onValueChange={(val) =>
                                updateLesson(moduleIndex, lessonIndex, { type: val as LessonType })
                              }
                            >
                              <SelectTrigger className="mt-1 h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {lessonTypes.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Estimated Minutes</Label>
                            <Input
                              type="number"
                              min={1}
                              value={lesson.duration || 10}
                              onChange={(e) =>
                                updateLesson(moduleIndex, lessonIndex, {
                                  duration: Number(e.target.value) || 0,
                                })
                              }
                              className="mt-1 h-9"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Access Tier</Label>
                            <Select
                              value={lesson.isFree ? "free" : "paid"}
                              onValueChange={(val) =>
                                updateLesson(moduleIndex, lessonIndex, { isFree: val === "free" })
                              }
                            >
                              <SelectTrigger className="mt-1 h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="paid">Paid (Enrolled Students Only)</SelectItem>
                                <SelectItem value="free">Free Preview (Public Sample)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Video Lesson URL and Preview */}
                        {lesson.type === "video" && (
                          <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-4">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <FileVideo className="h-4 w-4 text-purple-600" />
                              Video Stream URL (YouTube)
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Enter a YouTube unlisted or public URL (e.g., https://youtu.be/ID or https://www.youtube.com/watch?v=ID).
                            </p>
                            <Input
                              value={lesson.content?.videoUrl || ""}
                              onChange={(e) =>
                                updateLessonContent(moduleIndex, lessonIndex, {
                                  videoUrl: e.target.value,
                                })
                              }
                              placeholder="https://youtu.be/..."
                              className="font-mono text-xs"
                            />

                            {/* Embed Preview */}
                            {lesson.content?.videoUrl && (() => {
                              const match = (lesson.content.videoUrl as string).match(
                                /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/,
                              )
                              if (match && match[1]) {
                                return (
                                  <div className="mt-3 aspect-video max-w-lg overflow-hidden rounded-lg border border-border/80 shadow-sm">
                                    <iframe
                                      title={lesson.title}
                                      src={`https://www.youtube-nocookie.com/embed/${match[1]}`}
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      className="h-full w-full"
                                    />
                                  </div>
                                )
                              }
                              return (
                                <p className="text-xs text-amber-600">
                                  Please provide a valid YouTube video URL to generate the preview.
                                </p>
                              )
                            })()}
                          </div>
                        )}

                        {/* Technical Article / Markdown Lesson Authoring */}
                        {lesson.type === "article" && (
                          <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <FileText className="h-4 w-4 text-blue-600" />
                                Technical Article Content (Markdown)
                              </Label>

                              {/* Toggle between Edit and Live Preview */}
                              <div className="flex items-center gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={!isPreviewMode ? "default" : "outline"}
                                  onClick={() => setActivePreviewLessonId(null)}
                                  className="h-7 text-xs"
                                >
                                  <Pencil className="mr-1 h-3 w-3" />
                                  Editor
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isPreviewMode ? "default" : "outline"}
                                  onClick={() => setActivePreviewLessonId(lesson.id)}
                                  className="h-7 text-xs"
                                >
                                  <Eye className="mr-1 h-3 w-3" />
                                  Student Preview
                                </Button>
                              </div>
                            </div>

                            {!isPreviewMode ? (
                              <div className="space-y-2">
                                {/* Code block inserter toolbar */}
                                <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border/60 bg-card p-1.5 text-xs">
                                  <span className="text-[11px] font-semibold text-muted-foreground px-1">
                                    Insert Code:
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => insertCodeSnippet(moduleIndex, lessonIndex, "typescript")}
                                    className="h-6 text-[11px] px-2"
                                  >
                                    <FileCode className="mr-1 h-3 w-3 text-blue-600" />
                                    TypeScript
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => insertCodeSnippet(moduleIndex, lessonIndex, "python")}
                                    className="h-6 text-[11px] px-2"
                                  >
                                    <Code2 className="mr-1 h-3 w-3 text-yellow-600" />
                                    Python
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => insertCodeSnippet(moduleIndex, lessonIndex, "sql")}
                                    className="h-6 text-[11px] px-2"
                                  >
                                    <Terminal className="mr-1 h-3 w-3 text-cyan-600" />
                                    SQL
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => insertCodeSnippet(moduleIndex, lessonIndex, "bash")}
                                    className="h-6 text-[11px] px-2"
                                  >
                                    <Terminal className="mr-1 h-3 w-3 text-emerald-600" />
                                    Bash
                                  </Button>
                                </div>

                                <Textarea
                                  rows={12}
                                  value={lesson.content?.articleContent || ""}
                                  onChange={(e) =>
                                    updateLessonContent(moduleIndex, lessonIndex, {
                                      articleContent: e.target.value,
                                    })
                                  }
                                  placeholder="Write technical lesson content in Markdown. Supports headers, code blocks with syntax highlighting, lists, and callout alerts..."
                                  className="font-mono text-xs leading-relaxed"
                                />
                              </div>
                            ) : (
                              <div className="rounded-lg border border-border/80 bg-card p-4 min-h-[200px]">
                                <div className="mb-2 pb-2 border-b border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                                  <span>Live Learner View (rendered via TechnicalContentRenderer)</span>
                                  <Badge variant="outline" className="text-[10px]">Preview Mode</Badge>
                                </div>
                                <TechnicalContentRenderer content={lesson.content?.articleContent || "*No content written yet.*"} />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quiz or Assignment reference */}
                        {(lesson.type === "quiz" || lesson.type === "assignment") && (
                          <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-4">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              {lesson.type === "quiz" ? <HelpCircle className="h-4 w-4" /> : <FileCode className="h-4 w-4" />}
                              {lesson.type === "quiz" ? "Academic Quiz Reference" : "Assignment Reference ID"}
                            </Label>
                            <Input
                              value={
                                lesson.type === "quiz"
                                  ? lesson.content?.quizId || ""
                                  : lesson.content?.assignmentId || ""
                              }
                              onChange={(e) =>
                                updateLessonContent(moduleIndex, lessonIndex, {
                                  quizId: lesson.type === "quiz" ? e.target.value : lesson.content?.quizId,
                                  assignmentId:
                                    lesson.type === "assignment"
                                      ? e.target.value
                                      : lesson.content?.assignmentId,
                                })
                              }
                              placeholder={lesson.type === "quiz" ? "quiz-id-ref" : "assignment-id-ref"}
                              className="font-mono text-xs"
                            />
                            <p className="text-xs text-muted-foreground">
                              Links this lesson to an academic quiz or project assignment evaluated in the faculty workspace.
                            </p>
                          </div>
                        )}

                        {/* Resources */}
                        <div className="space-y-2 pt-1 border-t border-border/60">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <LinkIcon className="h-3.5 w-3.5" />
                              Technical Learning Resources & Documentation Links
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addResource(moduleIndex, lessonIndex)}
                              className="h-6 text-[11px] px-2"
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add Resource
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {(lesson.content?.resources || []).map((resource, resIdx) => (
                              <div key={resIdx} className="grid gap-2 sm:grid-cols-5">
                                <Input
                                  className="sm:col-span-2 h-8 text-xs"
                                  value={resource.title}
                                  onChange={(e) =>
                                    updateResource(moduleIndex, lessonIndex, resIdx, {
                                      title: e.target.value,
                                    })
                                  }
                                  placeholder="Resource title (e.g. PostgreSQL Docs)"
                                />
                                <Input
                                  className="sm:col-span-2 h-8 text-xs font-mono"
                                  value={resource.url}
                                  onChange={(e) =>
                                    updateResource(moduleIndex, lessonIndex, resIdx, {
                                      url: e.target.value,
                                    })
                                  }
                                  placeholder="https://..."
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeResource(moduleIndex, lessonIndex, resIdx)}
                                  className="h-8 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

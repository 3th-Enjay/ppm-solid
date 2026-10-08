"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, Save, FileVideo, Link as LinkIcon } from "lucide-react"
import type { Course, CourseModule, Lesson, LessonType } from "@/lib/types"

type ResourceItem = { title: string; url: string }

const lessonTypes: LessonType[] = ["video", "article", "quiz", "assignment"]

export default function AdminCourseContentPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<CourseModule[]>([])
  const [priceNGN, setPriceNGN] = useState("0")
  const [priceUSD, setPriceUSD] = useState("0")
  const [priceEUR, setPriceEUR] = useState("0")
  const [priceGBP, setPriceGBP] = useState("0")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}`)
        if (!res.ok) {
          router.push("/admin/courses")
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
  }, [courseId, router])

  const totalLessons = useMemo(
    () => modules.reduce((sum, module) => sum + module.lessons.length, 0),
    [modules]
  )

  const addModule = () => {
    setModules((prev) => [
      ...prev,
      {
        id: `module-${Date.now()}`,
        title: `New Module ${prev.length + 1}`,
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

  const addLesson = (moduleIndex: number) => {
    setModules((prev) => {
      const next = [...prev]
      const lesson: Lesson = {
        id: `lesson-${Date.now()}`,
        title: `New Lesson ${next[moduleIndex].lessons.length + 1}`,
        type: "video",
        order: next[moduleIndex].lessons.length + 1,
        duration: 10,
        isFree: false,
        content: {
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
    updates: Partial<Lesson>
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
    updates: Partial<Lesson["content"]>
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
    updates: Partial<ResourceItem>
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
    try {
      const totalDuration = modules.reduce((sum, module) => {
        return (
          sum +
          module.lessons.reduce((lessonSum, lesson) => lessonSum + (lesson.duration || 0), 0)
        )
      }, 0)

      const res = await fetch(`/api/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
        throw new Error("Failed to save course content")
      }
    } catch (error) {
      console.error("Failed to save course:", error)
    } finally {
      setSaving(false)
    }
  }

  if (!course) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading course content...</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/admin/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">
            {modules.length} modules â€¢ {totalLessons} lessons
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Content"}
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Modules</h2>
        <Button variant="outline" onClick={addModule}>
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Pricing</CardTitle>
          <CardDescription>Set pricing across supported currencies</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">NGN</label>
            <Input type="number" value={priceNGN} onChange={(e) => setPriceNGN(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">USD</label>
            <Input type="number" value={priceUSD} onChange={(e) => setPriceUSD(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">EUR</label>
            <Input type="number" value={priceEUR} onChange={(e) => setPriceEUR(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">GBP</label>
            <Input type="number" value={priceGBP} onChange={(e) => setPriceGBP(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {modules.map((module, moduleIndex) => (
          <Card key={module.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <CardTitle>Module {moduleIndex + 1}</CardTitle>
                  <Input
                    value={module.title}
                    onChange={(e) => updateModuleTitle(moduleIndex, e.target.value)}
                    placeholder="Module title"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeModule(moduleIndex)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <CardDescription>{module.lessons.length} lessons</CardDescription>
                <Button size="sm" variant="outline" onClick={() => addLesson(moduleIndex)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
              </div>

              <div className="space-y-4">
                {module.lessons.map((lesson, lessonIndex) => (
                  <Card key={lesson.id} className="border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Lesson {lessonIndex + 1}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLesson(moduleIndex, lessonIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        value={lesson.title}
                        onChange={(e) =>
                          updateLesson(moduleIndex, lessonIndex, { title: e.target.value })
                        }
                        placeholder="Lesson title"
                      />

                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="text-sm font-medium">Type</label>
                          <Select
                            value={lesson.type}
                            onValueChange={(value) =>
                              updateLesson(moduleIndex, lessonIndex, { type: value as LessonType })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {lessonTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Duration (min)</label>
                          <Input
                            type="number"
                            value={lesson.duration || 0}
                            onChange={(e) =>
                              updateLesson(moduleIndex, lessonIndex, {
                                duration: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Access</label>
                          <Select
                            value={lesson.isFree ? "free" : "paid"}
                            onValueChange={(value) =>
                              updateLesson(moduleIndex, lessonIndex, { isFree: value === "free" })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="free">Free Preview</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {lesson.type === "video" && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <FileVideo className="h-4 w-4" />
                            Video URL
                          </label>
                          <Input
                            value={lesson.content.videoUrl || ""}
                            onChange={(e) =>
                              updateLessonContent(moduleIndex, lessonIndex, {
                                videoUrl: e.target.value,
                              })
                            }
                            placeholder="https://..."
                          />
                        </div>
                      )}

                      {lesson.type === "article" && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Article Content</label>
                          <Textarea
                            value={lesson.content.articleContent || ""}
                            onChange={(e) =>
                              updateLessonContent(moduleIndex, lessonIndex, {
                                articleContent: e.target.value,
                              })
                            }
                            placeholder="Write lesson content..."
                          />
                        </div>
                      )}

                      {(lesson.type === "quiz" || lesson.type === "assignment") && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            {lesson.type === "quiz" ? "Quiz ID" : "Assignment ID"}
                          </label>
                          <Input
                            value={
                              lesson.type === "quiz"
                                ? lesson.content.quizId || ""
                                : lesson.content.assignmentId || ""
                            }
                            onChange={(e) =>
                              updateLessonContent(moduleIndex, lessonIndex, {
                                quizId: lesson.type === "quiz" ? e.target.value : lesson.content.quizId,
                                assignmentId:
                                  lesson.type === "assignment"
                                    ? e.target.value
                                    : lesson.content.assignmentId,
                              })
                            }
                            placeholder="Reference ID"
                          />
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" />
                            Resources
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addResource(moduleIndex, lessonIndex)}
                          >
                            Add Resource
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(lesson.content.resources || []).map((resource, resourceIndex) => (
                            <div key={`${lesson.id}-resource-${resourceIndex}`} className="grid gap-2 md:grid-cols-5">
                              <Input
                                className="md:col-span-2"
                                value={resource.title}
                                onChange={(e) =>
                                  updateResource(moduleIndex, lessonIndex, resourceIndex, {
                                    title: e.target.value,
                                  })
                                }
                                placeholder="Resource title"
                              />
                              <Input
                                className="md:col-span-2"
                                value={resource.url}
                                onChange={(e) =>
                                  updateResource(moduleIndex, lessonIndex, resourceIndex, {
                                    url: e.target.value,
                                  })
                                }
                                placeholder="https://..."
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeResource(moduleIndex, lessonIndex, resourceIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Badge variant="outline">{lesson.type}</Badge>
                        {lesson.isFree && <Badge className="bg-green-500">Free</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

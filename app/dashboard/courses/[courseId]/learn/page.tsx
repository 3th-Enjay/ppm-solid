"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, CheckCircle, ClipboardList, ExternalLink, FileText, PlayCircle } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { Course, Enrollment, Lesson } from "@/lib/types"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function LearnPage() {
  const params = useParams()
  const router = useRouter()
  const { user, token } = useAuthStore()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const loadData = async () => {
      try {
        const [courseRes, enrollmentsRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`, { headers: { Authorization: `Bearer ${token || ""}` } }),
          fetch(`/api/enrollments?userId=${user.id}`, { headers: { Authorization: `Bearer ${token || ""}` } }),
        ])

        if (!courseRes.ok || !enrollmentsRes.ok) {
          router.push("/dashboard/courses")
          return
        }

        const courseData = await courseRes.json()
        const enrollmentsData = await enrollmentsRes.json()
        const foundCourse = courseData.course as Course
        const foundEnrollment = (enrollmentsData.enrollments || []).find((e: Enrollment) => e.courseId === courseId)

        if (!foundCourse || !foundEnrollment) {
          router.push("/dashboard/courses")
          return
        }

        setCourse(foundCourse)
        setEnrollment(foundEnrollment)

        if (foundCourse.modules.length > 0) {
          const firstModule = foundCourse.modules[0]
          if (firstModule && firstModule.lessons.length > 0) {
            setCurrentLesson(firstModule.lessons[0] as Lesson)
          }
        }
      } catch (error) {
        console.error("Failed to load course data:", error)
        router.push("/dashboard/courses")
      }
    }

    void loadData()
  }, [user, courseId, router, token])

  const markLessonComplete = () => {
    if (!currentLesson || !enrollment) return

    const isCompleted = enrollment.completedLessons.includes(currentLesson.id)
    if (isCompleted) return

    const updatedLessons = [...enrollment.completedLessons, currentLesson.id]
    const totalLessons = course?.modules.reduce((sum, module) => sum + module.lessons.length, 0) || 1
    const progress = Math.round((updatedLessons.length / totalLessons) * 100)

    fetch(`/api/enrollments/${enrollment.id}/progress`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || ""}`,
      },
      body: JSON.stringify({ completedLessons: updatedLessons, progress }),
    }).catch((error) => console.error("Failed to update progress:", error))

    setEnrollment({ ...enrollment, completedLessons: updatedLessons, progress })
  }

  const goToNextLesson = () => {
    if (!course || !currentLesson) return

    let found = false
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (found) {
          setCurrentLesson(lesson as Lesson)
          return
        }
        if (lesson.id === currentLesson.id) {
          found = true
        }
      }
    }
  }

  const goToPreviousLesson = () => {
    if (!course || !currentLesson) return

    let previousLesson: Lesson | null = null
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (lesson.id === currentLesson.id && previousLesson) {
          setCurrentLesson(previousLesson)
          return
        }
        previousLesson = lesson as Lesson
      }
    }
  }

  if (!course || !enrollment || !currentLesson) {
    return null
  }

  const lessonAssignment = currentLesson.content.assignment
  const lessonResources = currentLesson.content.resources || []

  return (
    <div className="flex h-screen">
      <div className="flex flex-1 flex-col">
        <div className="aspect-video bg-black flex items-center justify-center">
          {currentLesson.type === "video" && currentLesson.content?.videoUrl ? (
            (() => {
              const url = currentLesson.content.videoUrl as string
              const ytMatch = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/)
              if (ytMatch && ytMatch[1]) {
                return (
                  <iframe
                    title={currentLesson.title}
                    src={`https://www.youtube-nocookie.com/embed/${ytMatch[1]}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                )
              }
              if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
                return <video src={url} controls className="h-full w-full object-contain" />
              }
              return (
                <div className="text-center text-white">
                  <PlayCircle className="mx-auto mb-4 h-20 w-20 opacity-50" />
                  <p className="text-lg">{currentLesson.title}</p>
                  <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-gray-300 underline">
                    Open lesson resource
                  </a>
                </div>
              )
            })()
          ) : (
            <div className="text-center text-white">
              <PlayCircle className="mx-auto mb-4 h-20 w-20 opacity-50" />
              <p className="text-lg">{currentLesson.title}</p>
              <p className="mt-2 text-sm text-gray-400">Lesson media is not available for this item.</p>
            </div>
          )}
        </div>

        <div className="space-y-4 border-b p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{currentLesson.type}</Badge>
            {lessonAssignment ? <Badge variant="secondary">Assignment attached</Badge> : null}
            {currentLesson.isFree ? <Badge className="bg-green-600">Free preview</Badge> : null}
          </div>
          <div>
            <h1 className="mb-2 text-2xl font-bold text-balance">{currentLesson.title}</h1>
            <p className="text-muted-foreground">{currentLesson.type} • {currentLesson.duration} minutes</p>
          </div>

          {currentLesson.type === "article" && currentLesson.content.articleContent ? (
            <Card className="border-border/70 bg-muted/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  Lesson reading
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{currentLesson.content.articleContent}</p>
              </CardContent>
            </Card>
          ) : null}

          {lessonAssignment ? (
            <Card className="border-amber-200/70 bg-amber-50/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="h-4 w-4 text-amber-700" />
                  {lessonAssignment.title || "Lesson assignment"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {lessonAssignment.instructions || "Your instructor attached an assignment to this lesson."}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">{lessonAssignment.submissionType} submission</Badge>
                  <Badge variant="outline">Max score: {lessonAssignment.maxScore}</Badge>
                  {lessonAssignment.estimatedMinutes ? <Badge variant="outline">{lessonAssignment.estimatedMinutes} min task</Badge> : null}
                  {lessonAssignment.dueDate ? <Badge variant="outline">Due {lessonAssignment.dueDate}</Badge> : null}
                </div>
                {(lessonAssignment.resources || []).length > 0 ? (
                  <div className="space-y-2">
                    <p className="font-medium">Assignment resources</p>
                    <div className="space-y-2">
                      {(lessonAssignment.resources || []).map((resource, index) => (
                        <a
                          key={`${resource.url}-${index}`}
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2 text-sm hover:border-primary"
                        >
                          <span>{resource.title || resource.url}</span>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {lessonResources.length > 0 ? (
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-base">Lesson resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lessonResources.map((resource, index) => (
                  <a
                    key={`${resource.url}-${index}`}
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-sm hover:border-primary"
                  >
                    <span>{resource.title || resource.url}</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between border-t p-6">
          <Button variant="outline" onClick={goToPreviousLesson} className="bg-transparent">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button onClick={markLessonComplete}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark Complete
          </Button>
          <Button variant="outline" onClick={goToNextLesson} className="bg-transparent">
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <aside className="w-96 overflow-auto border-l bg-card">
        <div className="border-b p-6">
          <h2 className="mb-2 font-semibold">Course Content</h2>
          <Progress value={enrollment.progress} className="h-2" />
          <p className="mt-2 text-sm text-muted-foreground">{enrollment.progress}% complete</p>
        </div>

        <Accordion type="single" collapsible className="px-4">
          {course.modules.map((module, index) => (
            <AccordionItem key={module.id} value={module.id}>
              <AccordionTrigger className="text-sm font-semibold">
                Module {index + 1}: {module.title}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {module.lessons.map((lesson) => {
                    const isCompleted = enrollment.completedLessons.includes(lesson.id)
                    const isCurrent = currentLesson.id === lesson.id

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setCurrentLesson(lesson as Lesson)}
                        className={`w-full rounded-lg p-3 text-left text-sm transition-colors ${isCurrent ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                      >
                        <div className="flex items-center gap-2">
                          {isCompleted ? <CheckCircle className="h-4 w-4 text-green-600" /> : <div className="h-4 w-4 rounded-full border-2" />}
                          <span className="flex-1">{lesson.title}</span>
                          <span className="text-xs text-muted-foreground">{lesson.duration}m</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </aside>
    </div>
  )
}

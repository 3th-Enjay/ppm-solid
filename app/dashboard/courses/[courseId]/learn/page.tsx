"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, CheckCircle, PlayCircle } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { Course, Enrollment, Lesson } from "@/lib/types"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function LearnPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
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
          fetch(`/api/courses/${courseId}`),
          fetch(`/api/enrollments?userId=${user.id}`),
        ])

        if (!courseRes.ok || !enrollmentsRes.ok) {
          router.push("/dashboard/courses")
          return
        }

        const courseData = await courseRes.json()
        const enrollmentsData = await enrollmentsRes.json()
        const foundCourse = courseData.course as Course
        const foundEnrollment = (enrollmentsData.enrollments || []).find(
          (e: Enrollment) => e.courseId === courseId
        )

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

    loadData()
  }, [user, courseId, router])

  const markLessonComplete = () => {
    if (!currentLesson || !enrollment) return

    const isCompleted = enrollment.completedLessons.includes(currentLesson.id)

    if (!isCompleted) {
      const updatedLessons = [...enrollment.completedLessons, currentLesson.id]
      const totalLessons = course?.modules.reduce((sum, m) => sum + m.lessons.length, 0) || 1
      const progress = Math.round((updatedLessons.length / totalLessons) * 100)

      fetch(`/api/enrollments/${enrollment.id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedLessons: updatedLessons,
          progress,
        }),
      }).catch((error) => console.error("Failed to update progress:", error))

      setEnrollment({ ...enrollment, completedLessons: updatedLessons, progress })
    }
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

  return (
    <div className="flex h-screen">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Video Player */}
        <div className="bg-black aspect-video flex items-center justify-center">
          {currentLesson.type === "video" && currentLesson.content?.videoUrl ? (
            (() => {
              const url = currentLesson.content.videoUrl as string
              // extract YouTube video id if possible
              const ytMatch = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/)
              if (ytMatch && ytMatch[1]) {
                const videoId = ytMatch[1]
                return (
                  <iframe
                    title={currentLesson.title}
                    src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                )
              }

              // Fallback: show a native video tag if the URL looks like a plain video file
              if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
                return <video src={url} controls className="w-full h-full object-contain" />
              }

              // Otherwise show a link to the URL
              return (
                <div className="text-white text-center">
                  <PlayCircle className="h-20 w-20 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">{currentLesson.title}</p>
                  <a href={url} target="_blank" rel="noreferrer" className="text-sm text-gray-300 mt-2 underline">
                    Open lesson resource
                  </a>
                </div>
              )
            })()
          ) : (
            <div className="text-white text-center">
              <PlayCircle className="h-20 w-20 mx-auto mb-4 opacity-50" />
              <p className="text-lg">{currentLesson.title}</p>
              <p className="text-sm text-gray-400 mt-2">Video player simulation</p>
            </div>
          )}
        </div>

        {/* Lesson Info */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold mb-2 text-balance">{currentLesson.title}</h1>
          <p className="text-muted-foreground">
            {currentLesson.type} • {currentLesson.duration} minutes
          </p>
        </div>

        {/* Lesson Navigation */}
        <div className="p-6 flex justify-between items-center border-t mt-auto">
          <Button variant="outline" onClick={goToPreviousLesson} className="bg-transparent">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button onClick={markLessonComplete}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Complete
          </Button>
          <Button variant="outline" onClick={goToNextLesson} className="bg-transparent">
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Sidebar - Course Content */}
      <aside className="w-96 border-l bg-card overflow-auto">
        <div className="p-6 border-b">
          <h2 className="font-semibold mb-2">Course Content</h2>
          <Progress value={enrollment.progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">{enrollment.progress}% complete</p>
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
                        className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                          isCurrent ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2" />
                          )}
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

"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Award,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  HelpCircle,
  PlayCircle,
  ShoppingCart,
  Star,
  Users,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CourseCard } from "@/components/skillup/course-card"
import { fadeUp } from "@/components/skillup/motion-presets"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore, useCartStore, usePreferencesStore } from "@/lib/store"
import type { Course, User as UserType } from "@/lib/types"
import { formatCurrency, formatDuration } from "@/lib/utils/format"

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [course, setCourse] = useState<Course | null>(null)
  const [instructor, setInstructor] = useState<UserType | null>(null)
  const [relatedCourses, setRelatedCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const { currency } = usePreferencesStore()
  const { addToCart, items } = useCartStore()
  const { user } = useAuthStore()
  const { toast } = useToast()

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const [courseRes, allCoursesRes] = await Promise.all([fetch(`/api/courses/slug/${slug}`), fetch("/api/courses")])

        if (!courseRes.ok) {
          setCourse(null)
          setInstructor(null)
          setRelatedCourses([])
          return
        }

        const courseData = await courseRes.json()
        const allCoursesData = await allCoursesRes.json()
        const loadedCourse = (courseData.course || null) as Course | null

        setCourse(loadedCourse)
        setInstructor((courseData.instructor || null) as UserType | null)

        if (loadedCourse) {
          const related = (allCoursesData.courses || [])
            .filter((c: Course) => c.id !== loadedCourse.id)
            .filter((c: Course) => c.category === loadedCourse.category)
            .slice(0, 3)
          setRelatedCourses(related)
        }
      } catch (error) {
        console.error("Failed to load course:", error)
        setCourse(null)
        setInstructor(null)
        setRelatedCourses([])
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [slug])

  const isEnrolled = Boolean(course && user?.enrolledCourses.includes(course.id))
  const isInCart = Boolean(course && items.find((item) => item.courseId === course.id))

  const totalLessons = useMemo(() => course?.modules.reduce((sum, module) => sum + module.lessons.length, 0) || 0, [course])
  const totalQuizzes = useMemo(
    () => course?.modules.reduce((sum, module) => sum + module.lessons.filter((l) => l.type === "quiz").length, 0) || 0,
    [course],
  )
  const totalAssignments = useMemo(
    () =>
      course?.modules.reduce((sum, module) => sum + module.lessons.filter((l) => l.type === "assignment").length, 0) || 0,
    [course],
  )

  const overviewItems =
    course?.overview && course.overview.length > 0
      ? course.overview
      : [
          "Master the fundamentals and advanced concepts",
          "Build real-world projects from scratch",
          "Learn industry best practices",
          "Get hands-on coding experience",
          "Understand key concepts and patterns",
          "Prepare for professional opportunities",
        ]

  const handleAddToCart = () => {
    if (!course) return

    if (user && user.enrolledCourses.includes(course.id)) {
      router.push("/dashboard")
      return
    }

    if (items.find((item) => item.courseId === course.id)) {
      router.push("/cart")
      return
    }

    addToCart({ courseId: course.id, course })
    toast({ title: "Added to Cart", description: `${course.title} has been added to your cart` })
  }

  const handleBuyNow = () => {
    if (!course) return

    if (user && user.enrolledCourses.includes(course.id)) {
      router.push("/dashboard")
      return
    }

    if (!items.find((item) => item.courseId === course.id)) {
      addToCart({ courseId: course.id, course })
    }

    router.push("/cart")
  }

  if (loading) {
    return (
      <div className="container py-12">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-2/3 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="h-[320px] rounded-2xl bg-muted" />
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container py-16 text-center">
        <h1 className="mb-3 text-2xl font-bold">Course Not Found</h1>
        <p className="mb-5 text-muted-foreground">The course you requested is not available.</p>
        <Button asChild>
          <Link href="/courses">Browse All Courses</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-10 md:py-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-8">
          <motion.section variants={fadeUp()} initial="hidden" animate="visible" className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="level">{course.level}</Badge>
              <Badge variant="outline">{course.category}</Badge>
            </div>

            <h1 className="text-3xl font-bold leading-tight md:text-4xl">{course.title}</h1>
            <p className="max-w-3xl text-lg text-muted-foreground">{course.description}</p>

            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">{course.rating}</span>
                <span>({course.enrollmentCount} students)</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(course.totalDuration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{course.enrollmentCount} enrolled</span>
              </div>
            </div>

            {instructor ? (
              <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-card/70 p-3">
                <Avatar>
                  <AvatarImage src={instructor.avatar || "/placeholder.svg"} alt={instructor.name} />
                  <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xs text-muted-foreground">Instructor</div>
                  <div className="font-medium">{instructor.name}</div>
                </div>
              </div>
            ) : null}
          </motion.section>

          <motion.section variants={fadeUp(0.05)} initial="hidden" animate="visible">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/80 bg-muted">
              <img
                src={course.thumbnail || "/placeholder.svg"}
                alt={course.title}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="rounded-full bg-white/90 p-4">
                  <PlayCircle className="h-12 w-12 text-primary" />
                </div>
              </div>
            </div>
          </motion.section>

          <Tabs defaultValue="curriculum" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="instructor">Instructor</TabsTrigger>
            </TabsList>

            <TabsContent value="curriculum" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Course Curriculum</h2>
                <p className="text-sm text-muted-foreground">
                  {course.modules.length} modules • {totalLessons} lessons
                </p>
              </div>

              <Card variant="elevated" className="py-2">
                <CardContent className="p-4">
                  <Accordion type="single" collapsible className="w-full">
                    {course.modules.map((module, index) => (
                      <AccordionItem key={module.id} value={module.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex w-full items-center justify-between pr-2">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-medium text-primary">
                                {index + 1}
                              </div>
                              <span className="font-semibold">{module.title}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{module.lessons.length} lessons</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pl-11 pt-2">
                            {module.lessons.map((lesson) => (
                              <div key={lesson.id} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-2">
                                  {lesson.type === "video" && <PlayCircle className="h-4 w-4 text-muted-foreground" />}
                                  {lesson.type === "article" && <FileText className="h-4 w-4 text-muted-foreground" />}
                                  {lesson.type === "quiz" && <HelpCircle className="h-4 w-4 text-muted-foreground" />}
                                  {lesson.type === "assignment" && <ClipboardList className="h-4 w-4 text-muted-foreground" />}
                                  <span className="text-sm">{lesson.title}</span>
                                  {lesson.isFree ? (
                                    <Badge variant="outline" className="text-xs">
                                      Free
                                    </Badge>
                                  ) : null}
                                </div>
                                {lesson.duration ? (
                                  <span className="text-sm text-muted-foreground">{formatDuration(lesson.duration)}</span>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">What You'll Learn</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {overviewItems.map((item, index) => (
                    <div key={`${item}-${index}`} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Card variant="elevated" className="py-0">
                <CardHeader>
                  <CardTitle>Course Includes</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 pb-6 text-sm md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDuration(course.totalDuration)} on-demand video</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{totalLessons} downloadable resources</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{totalQuizzes} quizzes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    <span>{totalAssignments} assignments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span>Certificate of completion</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="instructor" className="mt-6">
              {instructor ? (
                <Card variant="elevated" className="py-0">
                  <CardContent className="flex items-start gap-4 p-6">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={instructor.avatar || "/placeholder.svg"} alt={instructor.name} />
                      <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{instructor.name}</h3>
                      <p className="text-sm text-muted-foreground">{instructor.bio}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          Expert Instructor
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course.enrollmentCount}+ students
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>
          </Tabs>
        </main>

        <aside>
          <div className="sticky top-24 space-y-4">
            <Card variant="gradient" className="py-0">
              <CardContent className="space-y-5 p-6">
                <div className="space-y-1 text-center">
                  <p className="text-4xl font-bold text-primary">{formatCurrency(course.price[currency], currency)}</p>
                  <p className="text-sm text-muted-foreground">One-time payment • Lifetime access</p>
                </div>

                {isEnrolled ? (
                  <Button variant="cta" size="lg" className="w-full" asChild>
                    <Link href="/dashboard">Go to Course</Link>
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button variant="cta" size="lg" className="w-full" onClick={handleBuyNow}>
                      {isInCart ? "Go to Checkout" : "Buy Now"}
                    </Button>
                    {!isInCart ? (
                      <Button variant="outline" size="lg" className="w-full" onClick={handleAddToCart}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </Button>
                    ) : null}
                  </div>
                )}

                <div className="space-y-2 border-t pt-4 text-sm">
                  <p className="font-semibold">This course includes:</p>
                  <div className="space-y-2 text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {formatDuration(course.totalDuration)} video content
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Lifetime access
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Certificate of completion
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      30-day money-back guarantee
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline">Share</Button>
              <Button variant="outline">Save</Button>
            </div>
          </div>
        </aside>
      </div>

      {relatedCourses.length > 0 ? (
        <section className="mt-14 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Related Courses</h2>
            <p className="text-sm text-muted-foreground">Keep learning with similar courses from this category.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedCourses.map((related, index) => (
              <motion.div
                key={related.id}
                variants={fadeUp(Math.min(index * 0.04, 0.12))}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <CourseCard course={related} currency={currency} />
              </motion.div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}


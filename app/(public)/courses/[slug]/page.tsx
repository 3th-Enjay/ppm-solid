"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Star,
  Clock,
  Users,
  Award,
  CheckCircle2,
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardList,
  ShoppingCart,
} from "lucide-react"
import type { Course, User as UserType } from "@/lib/types"
import { formatCurrency, formatDuration } from "@/lib/utils/format"
import { usePreferencesStore, useCartStore, useAuthStore } from "@/lib/store"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [course, setCourse] = useState<Course | null>(null)
  const [instructor, setInstructor] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)

  const { currency } = usePreferencesStore()
  const { addToCart, items } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const { toast } = useToast()

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const res = await fetch(`/api/courses/slug/${slug}`)
        if (!res.ok) {
          setCourse(null)
          setInstructor(null)
        } else {
          const data = await res.json()
          setCourse(data.course || null)
          setInstructor(data.instructor || null)
        }
      } catch (error) {
        console.error("Failed to load course:", error)
        setCourse(null)
        setInstructor(null)
      } finally {
        setLoading(false)
      }
    }
    loadCourse()
  }, [slug])

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
    toast({
      title: "Added to Cart",
      description: `${course.title} has been added to your cart`,
    })
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
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="aspect-video bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
        <Button asChild>
          <Link href="/courses">Browse All Courses</Link>
        </Button>
      </div>
    )
  }

  const isEnrolled = user?.enrolledCourses.includes(course.id)
  const isInCart = items.find((item) => item.courseId === course.id)

  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0)
  const totalQuizzes = course.modules.reduce(
    (sum, module) => sum + module.lessons.filter((l) => l.type === "quiz").length,
    0,
  )
  const totalAssignments = course.modules.reduce(
    (sum, module) => sum + module.lessons.filter((l) => l.type === "assignment").length,
    0,
  )
  const overviewItems =
    course.overview && course.overview.length > 0
      ? course.overview
      : [
          "Master the fundamentals and advanced concepts",
          "Build real-world projects from scratch",
          "Learn industry best practices",
          "Get hands-on coding experience",
          "Understand key concepts and patterns",
          "Prepare for professional opportunities",
        ]

  return (
    <div className="container py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge>{course.level}</Badge>
              <Badge variant="outline">{course.category}</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-balance">{course.title}</h1>
            <p className="text-lg text-muted-foreground text-pretty">{course.description}</p>

            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{course.rating}</span>
                <span className="text-muted-foreground">({course.enrollmentCount} students)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{formatDuration(course.totalDuration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{course.enrollmentCount} enrolled</span>
              </div>
            </div>

            {/* Instructor */}
            {instructor && (
              <div className="flex items-center gap-3 pt-4 border-t">
                <Avatar>
                  <AvatarImage src={instructor.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm text-muted-foreground">Instructor</div>
                  <div className="font-medium">{instructor.name}</div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Course Preview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="aspect-video relative overflow-hidden rounded-lg bg-muted">
              <img
                src={course.thumbnail || "/placeholder.svg"}
                alt={course.title}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-4">
                  <PlayCircle className="w-12 h-12 text-primary" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="curriculum" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="instructor">Instructor</TabsTrigger>
            </TabsList>

            <TabsContent value="curriculum" className="space-y-4 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold">Course Curriculum</h3>
                <div className="text-sm text-muted-foreground">
                  {course.modules.length} modules • {totalLessons} lessons
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {course.modules.map((module, index) => (
                  <AccordionItem key={module.id} value={module.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 w-8 h-8 rounded flex items-center justify-center text-sm font-medium">
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
                            <div className="flex items-center gap-3">
                              {lesson.type === "video" && <PlayCircle className="w-4 h-4 text-muted-foreground" />}
                              {lesson.type === "article" && <FileText className="w-4 h-4 text-muted-foreground" />}
                              {lesson.type === "quiz" && <HelpCircle className="w-4 h-4 text-muted-foreground" />}
                              {lesson.type === "assignment" && (
                                <ClipboardList className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="text-sm">{lesson.title}</span>
                              {lesson.isFree && (
                                <Badge variant="outline" className="text-xs">
                                  Free
                                </Badge>
                              )}
                            </div>
                            {lesson.duration && (
                              <span className="text-sm text-muted-foreground">{formatDuration(lesson.duration)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div>
                <h3 className="text-2xl font-semibold mb-4">What You'll Learn</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {overviewItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4">Course Includes</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">{formatDuration(course.totalDuration)} on-demand video</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">{totalLessons} downloadable resources</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">{totalQuizzes} quizzes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">{totalAssignments} assignments</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Certificate of completion</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="instructor" className="mt-6">
              {instructor && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={instructor.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-2xl font-semibold mb-1">{instructor.name}</h3>
                      <p className="text-muted-foreground mb-4">{instructor.bio}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          <span>Expert Instructor</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{course.enrollmentCount}+ students</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {formatCurrency(course.price[currency], currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">One-time payment • Lifetime access</div>
                </div>

                {isEnrolled ? (
                  <Button className="w-full" size="lg" asChild>
                    <Link href="/dashboard">Go to Course</Link>
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button className="w-full" size="lg" onClick={handleBuyNow}>
                      {isInCart ? "Go to Checkout" : "Buy Now"}
                    </Button>
                    {!isInCart && (
                      <Button className="w-full bg-transparent" variant="outline" size="lg" onClick={handleAddToCart}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    )}
                  </div>
                )}

                <div className="border-t pt-6 space-y-3">
                  <h4 className="font-semibold mb-3">This course includes:</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>{formatDuration(course.totalDuration)} video content</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>Lifetime access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>Certificate of completion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>30-day money-back guarantee</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share/Save */}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent">
                Share
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

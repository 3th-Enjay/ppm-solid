"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  Quote,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthGateModal } from "@/components/skillup/auth-gate-modal"
import { CourseCard } from "@/components/skillup/course-card"
import { EnrollmentCard } from "@/components/skillup/enrollment-card"
import { SectionShell } from "@/components/skillup/section-shell"
import { useToast } from "@/hooks/use-toast"
import { usePurchaseGuard } from "@/hooks/use-purchase-guard"
import { fadeUp, maskReveal, sectionStagger, slowZoom, useReducedMotionSafe } from "@/lib/motion"
import { useAuthStore, useCartStore, usePreferencesStore } from "@/lib/store"
import type { Course, User as UserType } from "@/lib/types"
import { formatCurrency, formatDuration } from "@/lib/utils/format"

const courseLearningStandards = [
  {
    id: "s1",
    title: "Continuous Code Labs",
    description: "Hands-on implementation checkpoints reinforce concepts after each theoretical unit.",
    tag: "Practical Labs",
  },
  {
    id: "s2",
    title: "Rubric-Based Evaluations",
    description: "Submissions are reviewed against clear criteria for code structure, accuracy, and best practices.",
    tag: "Transparent Grading",
  },
]

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [course, setCourse] = useState<Course | null>(null)
  const [instructor, setInstructor] = useState<UserType | null>(null)
  const [relatedCourses, setRelatedCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const shouldReduceMotion = useReducedMotionSafe()

  const { currency } = usePreferencesStore()
  const { addToCart, items } = useCartStore()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const { isAuthGateOpen, setIsAuthGateOpen, loginHref, registerHref, requirePurchaseAuth, consumeStoredIntent } =
    usePurchaseGuard()
  const restoredIntentRef = useRef(false)

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
      } catch {
        setCourse(null)
        setInstructor(null)
        setRelatedCourses([])
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [slug])

  useEffect(() => {
    if (!user || !course || restoredIntentRef.current) return
    const pending = consumeStoredIntent()
    if (!pending) return
    if (pending.courseId !== course.id && pending.courseSlug !== course.slug) return

    restoredIntentRef.current = true
    if (!items.find((item) => item.courseId === course.id)) {
      addToCart({ courseId: course.id, course })
    }
    if (pending.action === "buy_now") {
      router.push("/cart")
      return
    }
    toast({ title: "Enrollment resumed", description: "Course added to your cart." })
  }, [user, course, items, addToCart, consumeStoredIntent, router, toast])

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

  const outcomes = (course?.overview || []).slice(0, 3)

  const runAddToCart = () => {
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
    toast({ title: "Added to cart", description: `${course.title} has been added to your cart.` })
  }

  const runBuyNow = () => {
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

  const handleAddToCart = () => {
    if (!course) return
    requirePurchaseAuth({ action: "add_to_cart", courseId: course.id, courseSlug: course.slug }, runAddToCart)
  }

  const handleBuyNow = () => {
    if (!course) return
    requirePurchaseAuth({ action: "buy_now", courseId: course.id, courseSlug: course.slug }, runBuyNow)
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
    <div className="pb-12">
      <SectionShell variant="split" hasParallax className="pb-10 pt-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <motion.div variants={sectionStagger} initial="initial" animate="animate" className="space-y-5">
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{course.category}</Badge>
              <Badge variant="level">{course.level}</Badge>
            </motion.div>

            <div className="space-y-3">
              <div className="overflow-hidden">
                <motion.h1 variants={maskReveal} className="text-3xl font-bold leading-tight md:text-4xl">
                  {course.title}
                </motion.h1>
              </div>
              <motion.p variants={fadeUp} className="max-w-3xl text-base text-muted-foreground md:text-lg">
                {course.description}
              </motion.p>
            </div>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <strong className="text-foreground">{course.rating.toFixed(1)}</strong> ({course.enrollmentCount} students)
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatDuration(course.totalDuration)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {course.enrollmentCount} enrolled
              </span>
            </motion.div>

            <motion.div variants={fadeUp} className="grid gap-2 rounded-2xl border border-border/70 bg-card/60 p-4 text-sm">
              {(outcomes.length > 0 ? outcomes : ["Build functional, portfolio-ready technical projects", "Master industry-standard development workflows and tooling", "Prepare for real-world software engineering and deployment"]).map(
                (item, index) => (
                  <p key={`${item}-${index}`} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </p>
                ),
              )}
            </motion.div>

            {instructor ? (
              <motion.div variants={fadeUp} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/60 p-3">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={instructor.avatar || "/placeholder.svg"} alt={instructor.name} />
                  <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">Instructor</p>
                  <p className="font-medium">{instructor.name}</p>
                  {instructor.instructorProfile?.professionalHeadline ? (
                    <p className="text-xs text-muted-foreground">{instructor.instructorProfile.professionalHeadline}</p>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </motion.div>

          <motion.div variants={fadeUp} initial="initial" animate="animate">
            <div className="relative aspect-video overflow-hidden rounded-3xl border border-border/70 bg-muted">
              {/* Placeholder media: healthcare training environment or live skills demo */}
              <motion.img
                src={course.thumbnail || "/placeholder.svg"}
                alt={course.title}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
                variants={shouldReduceMotion ? undefined : slowZoom}
                initial={shouldReduceMotion ? undefined : "initial"}
                animate={shouldReduceMotion ? undefined : "animate"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full border border-white/30 bg-white/85 p-4 shadow-lg">
                  <PlayCircle className="h-12 w-12 text-primary" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </SectionShell>

      <div className="container grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-8">
          <Tabs defaultValue="curriculum" className="w-full">
            <TabsList className="sticky top-20 z-20 w-full justify-start overflow-x-auto rounded-2xl border border-border/70 bg-background/95 p-1 backdrop-blur">
              <TabsTrigger value="curriculum" className="rounded-xl">
                Curriculum
              </TabsTrigger>
              <TabsTrigger value="overview" className="rounded-xl">
                Overview
              </TabsTrigger>
              <TabsTrigger value="instructor" className="rounded-xl">
                Instructor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="curriculum" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Curriculum Preview</h2>
                <p className="text-sm text-muted-foreground">
                  {course.modules.length} modules • {totalLessons} lessons
                </p>
              </div>

              <Card variant="elevated" className="rounded-3xl border-border/70 py-2">
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

            <TabsContent value="overview" className="mt-6">
              <Card variant="elevated" className="rounded-3xl border-border/70 py-0">
                <CardContent className="grid gap-3 p-6 text-sm md:grid-cols-2">
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {formatDuration(course.totalDuration)} on-demand video
                  </p>
                  <p className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {totalLessons} downloadable resources
                  </p>
                  <p className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    {totalQuizzes} quizzes
                  </p>
                  <p className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    {totalAssignments} assignments
                  </p>
                  <p className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    Certificate of completion
                  </p>
                  <p className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    Instructor support included
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="instructor" className="mt-6">
              {instructor ? (
                <Card variant="elevated" className="rounded-3xl border-border/70 py-0">
                  <CardContent className="flex items-start gap-4 p-6">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={instructor.avatar || "/placeholder.svg"} alt={instructor.name} />
                      <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{instructor.name}</h3>
                      <p className="text-sm text-muted-foreground">{instructor.bio}</p>
                      {instructor.instructorProfile ? (
                        <div className="text-xs text-muted-foreground">
                          <p>{instructor.instructorProfile.yearsOfExperience}+ years experience</p>
                          <p>{instructor.instructorProfile.specialties.join(", ")}</p>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>
          </Tabs>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Assessment & Milestone Standards</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {courseLearningStandards.map((item, index) => (
                <motion.article
                  key={item.id}
                  variants={fadeUp}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-3xl border border-border/70 bg-card/70 p-5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{item.tag}</Badge>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </motion.article>
              ))}
            </div>
          </section>
        </main>

        <aside>
          <div className="sticky top-24 space-y-4">
            <EnrollmentCard
              price={course.price[currency]}
              currency={currency}
              isEnrolled={isEnrolled}
              isInCart={isInCart}
              onBuyNow={handleBuyNow}
              onAddToCart={handleAddToCart}
            />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline">Share</Button>
              <Button variant="outline">Save</Button>
            </div>
          </div>
        </aside>
      </div>

      {relatedCourses.length > 0 ? (
        <section className="container mt-14 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Related Courses</h2>
            <p className="text-sm text-muted-foreground">Keep learning with similar courses from this category.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedCourses.map((related, index) => (
              <motion.div
                key={related.id}
                variants={fadeUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ delay: Math.min(index * 0.05, 0.15) }}
              >
                <CourseCard course={related} currency={currency} />
              </motion.div>
            ))}
          </div>
        </section>
      ) : null}

      <AuthGateModal
        open={isAuthGateOpen}
        onOpenChange={setIsAuthGateOpen}
        loginHref={loginHref}
        registerHref={registerHref}
      />
    </div>
  )
}


"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Award, BookOpen, Clock, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Testimonials } from "@/components/testimonials"
import { SectionShell } from "@/components/skillup/section-shell"
import { SkillupHero } from "@/components/skillup/hero"
import { fadeUp, sectionStagger } from "@/components/skillup/motion-presets"
import { useEffect, useState } from "react"
import type { Course } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/format"
import { usePreferencesStore } from "@/lib/store"

export default function HomePage() {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([])
  const { currency } = usePreferencesStore()

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/courses")
        const data = await res.json()
        setFeaturedCourses((data.courses || []).slice(0, 3))
      } catch (error) {
        console.error("Failed to load courses:", error)
        setFeaturedCourses([])
      }
    }
    loadCourses()
  }, [])

  const features = [
    {
      title: "Expert-Led Courses",
      description: "Learn from industry professionals with real-world experience.",
      icon: Award,
    },
    {
      title: "Flexible Learning",
      description: "Study at your own pace, anywhere, anytime.",
      icon: Clock,
    },
    {
      title: "Certificates",
      description: "Earn recognized certificates upon course completion.",
      icon: BookOpen,
    },
  ]

  return (
    <div className="flex flex-col">
      <SkillupHero featuredCourses={featuredCourses} currency={currency} />

      <SectionShell className="py-10 md:py-14">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border/80 bg-card/70 p-5 md:grid-cols-4 md:p-6">
          {["Trusted by learners", "Career-focused tracks", "Instructor support", "Practical outcomes"].map((item) => (
            <div key={item} className="text-center text-sm font-medium text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      </SectionShell>

      <SectionShell className="bg-muted/40">
        <motion.div
          variants={sectionStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-10"
        >
          <motion.div variants={fadeUp()} className="max-w-2xl space-y-3">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Why Choose Prompt Care Academy?
            </Badge>
            <h2 className="text-3xl font-bold md:text-4xl">A learning environment designed for real progress</h2>
            <p className="text-muted-foreground">
              Every lesson is structured to move you from theory to practical confidence with clear guidance.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div key={feature.title} variants={fadeUp(0.06 * index)}>
                <Card variant="elevated" interactive className="h-full">
                  <CardContent className="space-y-4 p-6">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </SectionShell>

      <SectionShell>
        <div className="mb-10 flex items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold md:text-4xl">Featured Courses</h2>
            <p className="text-muted-foreground">Start learning with our most popular courses</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/courses">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {featuredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              variants={fadeUp(0.05 * index)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <Link href={`/courses/${course.slug}`}>
                <Card variant="elevated" interactive className="h-full overflow-hidden">
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <img src={course.thumbnail || "/placeholder.svg"} alt={course.title} className="h-full w-full object-cover" />
                    <Badge className="absolute left-4 top-4">{course.level}</Badge>
                  </div>
                  <CardContent className="space-y-4 p-6">
                    <Badge variant="outline">{course.category}</Badge>
                    <h3 className="line-clamp-2 text-lg font-semibold">{course.title}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>

                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{course.rating}</span>
                        <span className="text-muted-foreground">({course.enrollmentCount})</span>
                      </div>
                      <div className="text-lg font-bold text-primary">{formatCurrency(course.price[currency], currency)}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </SectionShell>

      <Testimonials />

      <SectionShell className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-3xl space-y-5 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Ready to Start Learning?</h2>
          <p className="text-primary-foreground/90">
            Join thousands of students and transform your career with our expert-led courses.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Register Now!</Link>
            </Button>
            <Button size="lg" variant="glass" asChild>
              <Link href="/courses">Explore Courses</Link>
            </Button>
          </div>
        </div>
      </SectionShell>
    </div>
  )
}


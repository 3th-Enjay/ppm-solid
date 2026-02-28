"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Award, BookOpen, Clock, TrendingUp, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Course } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/format"
import { fadeUp, scaleIn, sectionStagger } from "@/components/skillup/motion-presets"

interface SkillupHeroProps {
  featuredCourses: Course[]
  currency: "NGN" | "USD" | "EUR" | "GBP"
}

export function SkillupHero({ featuredCourses, currency }: SkillupHeroProps) {
  const topCourse = featuredCourses[0]
  const topCoursePrice =
    topCourse && currency in topCourse.price
      ? topCourse.price[currency as keyof typeof topCourse.price]
      : null

  const stats = [
    { label: "Active Students", value: "10,000+", icon: Users },
    { label: "Expert Instructors", value: "50+", icon: Award },
    { label: "Course Hours", value: "5,000+", icon: Clock },
    { label: "Success Rate", value: "94%", icon: TrendingUp },
  ]

  return (
    <section className="relative overflow-hidden pb-16 pt-10 md:pb-24 md:pt-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklab,var(--primary)_12%,transparent)_0%,transparent_45%),radial-gradient(circle_at_80%_10%,color-mix(in_oklab,var(--accent)_20%,transparent)_0%,transparent_40%)]" />
      <div className="container relative">
        <motion.div
          variants={sectionStagger}
          initial="hidden"
          animate="visible"
          className="grid items-center gap-10 lg:grid-cols-2"
        >
          <div className="space-y-7">
            <motion.div variants={fadeUp()}>
              <Badge variant="info" className="rounded-full px-3 py-1">
                Welcome to Prompt Care Academy
              </Badge>
            </motion.div>

            <motion.h1 variants={fadeUp(0.06)} className="text-4xl font-bold leading-tight md:text-6xl">
              Join thousands of students today to learn and be a caregiver with a difference
            </motion.h1>

            <motion.p variants={fadeUp(0.12)} className="max-w-xl text-lg text-muted-foreground">
              Promptcare Academy offers comprehensive caregivers training through a top-quality curriculum and expert
              instructors. We are dedicated to equipping the heart and hands of caregivers and anyone who desires to
              become one, to deliver compassionate, high-quality care, both locally and internationally.
            </motion.p>

            <motion.div variants={fadeUp(0.18)} className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="cta" asChild>
                <Link href="/courses">
                  Browse Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Register Now!</Link>
              </Button>
            </motion.div>

            <motion.div variants={fadeUp(0.22)} className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.label} variant="elevated" className="gap-3 py-4">
                  <CardContent className="px-4">
                    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <stat.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-lg font-semibold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </div>

          <motion.div variants={scaleIn(0.12)} className="relative lg:pl-4">
            <Card variant="gradient" className="overflow-hidden py-0">
              <div className="relative h-[360px] w-full md:h-[470px]">
                <Image
                  src="/promptcare-hero.jpeg"
                  alt="Learners collaborating online"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </Card>

            <Card variant="elevated" className="absolute -bottom-6 -left-2 w-64 py-4 md:-left-8">
              <CardContent className="space-y-2 px-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Top Pick</p>
                {topCourse ? (
                  <>
                    <p className="line-clamp-2 text-sm font-semibold">{topCourse.title}</p>
                    {topCoursePrice !== null ? (
                      <p className="text-xs text-muted-foreground">{formatCurrency(topCoursePrice, currency)}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">New featured course coming soon.</p>
                )}
              </CardContent>
            </Card>

            <Card variant="elevated" className="absolute -right-2 top-5 w-44 py-3 md:-right-6">
              <CardContent className="px-4">
                <div className="mb-1 text-xs text-muted-foreground">Course Tracks</div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BookOpen className="h-4 w-4 text-primary" />
                  24 Structured Paths
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}


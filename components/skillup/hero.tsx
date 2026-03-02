"use client"

import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Award, BookOpen, Clock, TrendingUp, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Course } from "@/lib/types"
import { fadeUp, sectionStagger } from "@/components/skillup/motion-presets"

interface SkillupHeroProps {
  featuredCourses: Course[]
  currency: "NGN" | "USD" | "EUR" | "GBP"
}

export function SkillupHero({ featuredCourses, currency }: SkillupHeroProps) {
  const reducedMotion = useReducedMotion()
  const heroRef = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 70])

  const stats = [
    { label: "Active Students", value: "10,000+", icon: Users },
    { label: "Expert Instructors", value: "50+", icon: Award },
    { label: "Course Hours", value: "5,000+", icon: Clock },
    { label: "Success Rate", value: "94%", icon: TrendingUp },
  ]

  return (
    <section ref={heroRef} className="relative overflow-hidden pb-16 pt-10 md:pb-24 md:pt-16">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,199,168,0.18)_0%,transparent_48%),radial-gradient(circle_at_82%_5%,rgba(79,70,229,0.14)_0%,transparent_40%)]"
        style={reducedMotion ? undefined : { y: parallaxY }}
      />
      <div className="pointer-events-none absolute inset-0 bg-grain-soft opacity-40" />

      <div className="container relative">
        <motion.div variants={sectionStagger} initial="hidden" animate="visible" className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-7">
            <motion.div variants={fadeUp()}>
              <Badge variant="info" className="rounded-full px-3 py-1">
                Welcome to Prompt Care Academy
              </Badge>
            </motion.div>

            <div className="space-y-3 overflow-hidden">
              <motion.h1
                variants={fadeUp(0.06)}
                className="text-4xl font-bold leading-tight md:text-6xl"
                initial={reducedMotion ? undefined : { y: 42, opacity: 0 }}
                animate={reducedMotion ? undefined : { y: 0, opacity: 1 }}
                transition={reducedMotion ? undefined : { duration: 0.48, ease: "easeOut" }}
              >
                Join thousands of students today to learn and be a{" "}
                <span className="bg-[linear-gradient(110deg,#22c7a8_20%,#10b981_55%,#22c7a8_80%)] bg-clip-text text-transparent">
                  caregiver with a difference
                </span>
              </motion.h1>
            </div>

            <motion.p variants={fadeUp(0.12)} className="max-w-xl text-lg text-muted-foreground">
              Promptcare Academy offers comprehensive caregivers training through a top-quality curriculum and expert
              instructors. We are dedicated to equipping the heart and hands of caregivers and anyone who desires to
              become one, to deliver compassionate, high-quality care, both locally and internationally.
            </motion.p>

            <motion.div variants={fadeUp(0.18)} className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="cta" asChild className="transition-all duration-200 hover:scale-[1.02]">
                <Link href="/courses">
                  Browse Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-accent/40 transition-all duration-200 hover:scale-[1.02] hover:border-accent hover:text-accent"
              >
                <Link href="/register">Register Now!</Link>
              </Button>
            </motion.div>

            <motion.div variants={fadeUp(0.22)} className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.label} variant="elevated" className="gap-3 py-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lifted">
                  <CardContent className="px-4">
                    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 transition-colors duration-200">
                      <stat.icon className="h-4 w-4 text-accent" />
                    </div>
                    <div className="text-lg font-semibold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </div>

          <motion.div variants={fadeUp(0.12)} className="relative lg:pl-4">
            <motion.div
              className="relative overflow-hidden rounded-[24px] border border-border/80 shadow-lifted"
              initial={reducedMotion ? undefined : { clipPath: "inset(0 0 100% 0 round 24px)" }}
              animate={reducedMotion ? undefined : { clipPath: "inset(0 0 0% 0 round 24px)" }}
              transition={reducedMotion ? undefined : { duration: 0.6, ease: "easeOut" }}
            >
              <motion.img
                src="https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=1400&q=80"
                alt="Healthcare trainees in a practical class"
                className="h-[360px] w-full object-cover md:h-[470px]"
                animate={reducedMotion ? undefined : { scale: [1, 1.06, 1] }}
                transition={reducedMotion ? undefined : { duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,9,15,0.05)_0%,rgba(6,9,15,0.55)_100%)]" />
            </motion.div>

            <motion.div
              className="absolute -right-2 top-5 w-44 overflow-hidden rounded-2xl border border-border/80 bg-card/90 py-3 backdrop-blur md:-right-6"
              animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
              transition={reducedMotion ? undefined : { duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <CardContent className="px-4">
                <div className="mb-1 text-xs text-muted-foreground">Course Tracks</div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BookOpen className="h-4 w-4 text-accent" />
                  24 Structured Paths
                </div>
              </CardContent>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

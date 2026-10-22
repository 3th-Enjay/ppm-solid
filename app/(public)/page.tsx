"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2, Code2, GitBranch, Layers, Star, Terminal } from "lucide-react"
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
import { CtaBand } from "@/components/skillup/cta-band"
import { getAcademyName } from "@/lib/brand-config"

export default function HomePage() {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([])
  const { currency } = usePreferencesStore()
  const academyName = getAcademyName()

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
    void loadCourses()
  }, [])

  const features = [
    {
      title: "Hands-On Software Labs",
      description: "Learn by writing, debugging, and testing functional code in every unit.",
      icon: Terminal,
    },
    {
      title: "Structured Engineering Paths",
      description: "Follow curated syllabi from foundational syntax to distributed architectures.",
      icon: Layers,
    },
    {
      title: "Portfolio Capstone Projects",
      description: "Graduate with deployable repositories and verified demonstration of skills.",
      icon: CheckCircle2,
    },
  ]

  const technicalCompetencies = [
    "Full-Stack Web Development",
    "PostgreSQL & Data Modeling",
    "Cloud Architecture & CI/CD",
    "TypeScript & React 19",
    "REST & GraphQL Services",
    "System Design & Scalability",
    "Automated Testing Suites",
    "Clean Code & Refactoring",
  ]

  const learningSteps = [
    {
      step: 1,
      title: "Master the Core Fundamentals",
      text: "Establish rock-solid programming foundations in data structures, algorithms, and clean syntax.",
      tag: "Foundations",
    },
    {
      step: 2,
      title: "Construct Realistic Applications",
      text: "Develop end-to-end full-stack projects with modern frameworks, relational databases, and secure APIs.",
      tag: "Applied Engineering",
    },
    {
      step: 3,
      title: "Automate Testing & Code Quality",
      text: "Enforce type safety, write comprehensive unit and integration tests, and build CI/CD pipelines.",
      tag: "Quality & Reliability",
    },
    {
      step: 4,
      title: "Deliver a Capstone Portfolio",
      text: "Publish production-ready repositories evaluated against comprehensive academic grading rubrics.",
      tag: "Proof of Skill",
    },
  ]

  return (
    <div className="flex flex-col">
      <SkillupHero featuredCourses={featuredCourses} currency={currency} />

      <SectionShell className="py-8 md:py-10" variant="split">
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/70">
          <div className="marquee-track flex gap-3 p-4 md:p-5">
            {[...technicalCompetencies, ...technicalCompetencies].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="inline-flex whitespace-nowrap rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:border-accent/50 hover:text-accent"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell className="bg-muted/30" variant="split" hasParallax hasFloatingAccent divider="wave">
        <motion.div
          variants={sectionStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-10"
        >
          <motion.div variants={fadeUp()} className="max-w-2xl space-y-3">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Why Choose {academyName}?
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">A learning environment designed for real progress</h2>
            <p className="text-muted-foreground">
              Every lesson is structured to move you from theoretical syntax to practical execution with transparent rubrics and instructor feedback.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div key={feature.title} variants={fadeUp(0.06 * index)}>
                <Card variant="elevated" interactive className="h-full border-border/80 bg-card/80 transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lifted">
                  <CardContent className="space-y-4 p-6">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </SectionShell>

      <SectionShell variant="immersive" className="pb-12 pt-10 md:pt-14" id="learning-path">
        <motion.div variants={fadeUp()} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            The Engineering Journey
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">How you grow from beginner to autonomous developer</h2>
          <p className="max-w-2xl text-muted-foreground">
            A milestone-based progression that guarantees verifiable skill demonstration at every level.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {learningSteps.map((step, index) => (
            <motion.article
              key={step.title}
              variants={fadeUp(0.06 * index)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lifted"
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-accent">
                    Step 0{step.step}
                  </span>
                  <Badge variant="outline" className="text-[11px] font-normal">
                    {step.tag}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.text}</p>
              </div>

              <div className="mt-5 border-t border-border/60 pt-3 flex items-center gap-1.5 text-xs text-primary font-medium">
                <Code2 className="h-3.5 w-3.5" />
                <span>Verified Milestones</span>
              </div>
            </motion.article>
          ))}
        </div>
      </SectionShell>

      <SectionShell>
        <div className="mb-10 flex items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Featured Courses</h2>
            <p className="text-muted-foreground">Start building immediately with our most popular technical tracks</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/courses">
              View All Courses
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
                <Card
                  variant="elevated"
                  interactive
                  className="h-full overflow-hidden border-border/70 bg-card/80 transition-all duration-200 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lifted"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <img
                      src={course.thumbnail || "/web-development-course.png"}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.04]"
                      loading="lazy"
                    />
                    <Badge className="absolute left-4 top-4">{course.level}</Badge>
                  </div>
                  <CardContent className="space-y-4 p-6">
                    <Badge variant="outline">{course.category}</Badge>
                    <h3 className="line-clamp-2 text-lg font-semibold">{course.title}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>

                    <div className="flex items-center justify-between border-t border-border/70 pt-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{course.rating.toFixed(1)}</span>
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

      <SectionShell variant="immersive" className="pt-8 md:pt-12">
        <CtaBand
          title="Ready to Build Real Software?"
          description="Explore industry-aligned courses, submit hands-on capstone projects, and advance your engineering capabilities with verified feedback."
        />
      </SectionShell>
    </div>
  )
}

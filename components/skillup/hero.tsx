"use client"

import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Code2, Layers, Terminal as TerminalIcon, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Course } from "@/lib/types"
import { fadeUp, sectionStagger } from "@/components/skillup/motion-presets"
import { getAcademyName } from "@/lib/brand-config"

interface SkillupHeroProps {
  featuredCourses?: Course[]
  currency?: "NGN" | "USD" | "EUR" | "GBP"
}

export function SkillupHero({ featuredCourses: _featuredCourses, currency: _currency }: SkillupHeroProps) {
  const reducedMotion = useReducedMotion()
  const heroRef = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 60])
  const academyName = getAcademyName()

  const learningPillars = [
    { label: "Hands-On Projects", desc: "Build real-world web & cloud applications", icon: Code2 },
    { label: "Rubric Grading", desc: "Clear criteria for code & assignment review", icon: CheckCircle2 },
    { label: "Capstone Portfolios", desc: "Showcase verified deliverables to employers", icon: Layers },
    { label: "Structured Tracks", desc: "Progressive modules from basics to advanced", icon: Sparkles },
  ]

  return (
    <section ref={heroRef} className="relative overflow-hidden pb-16 pt-10 md:pb-24 md:pt-16">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.15)_0%,transparent_50%),radial-gradient(circle_at_85%_10%,rgba(2,132,199,0.12)_0%,transparent_45%)]"
        style={reducedMotion ? undefined : { y: parallaxY }}
      />
      <div className="pointer-events-none absolute inset-0 bg-grain-soft opacity-30" />

      <div className="container relative">
        <motion.div variants={sectionStagger} initial="hidden" animate="visible" className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-7">
            <motion.div variants={fadeUp()}>
              <Badge variant="info" className="gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium">
                <TerminalIcon className="h-3.5 w-3.5 text-accent" />
                <span>Welcome to {academyName}</span>
              </Badge>
            </motion.div>

            <div className="space-y-4">
              <motion.h1
                variants={fadeUp(0.06)}
                className="text-4xl font-extrabold tracking-tight leading-[1.12] sm:text-5xl md:text-6xl"
                initial={reducedMotion ? undefined : { y: 32, opacity: 0 }}
                animate={reducedMotion ? undefined : { y: 0, opacity: 1 }}
                transition={reducedMotion ? undefined : { duration: 0.5, ease: "easeOut" }}
              >
                Learn the Skills.{" "}
                <span className="bg-gradient-to-r from-primary via-accent to-sky-400 bg-clip-text text-transparent">
                  Build the Software.
                </span>{" "}
                Prove What You Can Do.
              </motion.h1>

              <motion.p variants={fadeUp(0.12)} className="max-w-xl text-base text-muted-foreground sm:text-lg">
                Practical technology education designed for engineers, creators, and analysts. Master modern software
                development through structured lessons, hands-on project milestones, and transparent rubric feedback.
              </motion.p>
            </div>

            <motion.div variants={fadeUp(0.18)} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" variant="cta" asChild className="h-12 px-6 font-semibold shadow-md shadow-primary/20 transition-all duration-200 hover:scale-[1.02]">
                <Link href="/courses">
                  Explore Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 border-border/80 px-6 font-medium transition-all duration-200 hover:bg-secondary"
              >
                <Link href="/about">How Learning Works</Link>
              </Button>
            </motion.div>

            <motion.div variants={fadeUp(0.24)} className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
              {learningPillars.map((pillar) => (
                <Card key={pillar.label} variant="elevated" className="border-border/70 bg-card/75 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lifted">
                  <CardContent className="space-y-1.5 px-3 py-1">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <pillar.icon className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-semibold">{pillar.label}</div>
                    <div className="text-[11px] leading-tight text-muted-foreground">{pillar.desc}</div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </div>

          <motion.div variants={fadeUp(0.14)} className="relative lg:pl-2">
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-[#090D16] text-slate-100 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 bg-[#0C1220] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-1 rounded-md bg-slate-900/80 px-3 py-1 text-xs font-mono text-slate-400">
                  <TerminalIcon className="h-3.5 w-3.5 text-accent" />
                  <span>app/milestone.ts</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">TypeScript 5.x</span>
              </div>

              <div className="p-5 font-mono text-xs leading-relaxed sm:text-[13px]">
                <div className="text-slate-500">// Practical project milestone submission</div>
                <div className="mt-2 text-sky-400">
                  import <span className="text-slate-100">&#123; evaluateRubric &#125;</span> from{" "}
                  <span className="text-emerald-300">&quot;@/lib/academic-eval&quot;</span>;
                </div>
                <div className="mt-3 text-purple-400">
                  interface <span className="text-amber-300">CapstoneProject</span> &#123;
                </div>
                <div className="pl-4 text-slate-300">
                  track: <span className="text-emerald-300">&quot;Full-Stack Software Engineering&quot;</span>;
                </div>
                <div className="pl-4 text-slate-300">
                  repository: <span className="text-emerald-300">&quot;https://github.com/student/capstone&quot;</span>;
                </div>
                <div className="pl-4 text-slate-300">
                  testCoverage: <span className="text-amber-400">96</span>;
                </div>
                <div className="text-purple-400">&#125;</div>

                <div className="mt-3 text-purple-400">
                  export async function <span className="text-blue-400">verifySubmission</span>
                  <span className="text-slate-100">(submission: CapstoneProject)</span> &#123;
                </div>
                <div className="pl-4 text-slate-300">
                  <span className="text-purple-400">const</span> review = <span className="text-purple-400">await</span> evaluateRubric(&#123;
                </div>
                <div className="pl-8 text-slate-300">
                  criteria: [<span className="text-emerald-300">&quot;clean_code&quot;</span>, <span className="text-emerald-300">&quot;type_safety&quot;</span>, <span className="text-emerald-300">&quot;db_persistence&quot;</span>],
                </div>
                <div className="pl-4 text-slate-300">&#125;);</div>
                <div className="pl-4 text-purple-400">
                  return <span className="text-slate-100">&#123; status: review.passed ? <span className="text-emerald-300">&quot;approved&quot;</span> : <span className="text-rose-400">&quot;revision&quot;</span> &#125;;</span>
                </div>
                <div className="text-purple-400">&#125;</div>

                <div className="mt-4 rounded-lg border border-slate-800 bg-[#050811] p-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> All automated test suites passed
                    </span>
                    <span className="text-slate-500">PostgreSQL runtime active</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    <span>$ npm run test:academic</span>
                    <span className="ml-2 text-slate-500">&rarr; 16/16 tests passing (8.0s)</span>
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              className="absolute -bottom-4 -left-4 hidden rounded-2xl border border-border/80 bg-card/95 p-3.5 shadow-lifted sm:flex sm:items-center sm:gap-3"
              animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
              transition={reducedMotion ? undefined : { duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-foreground">Portfolio Ready</div>
                <div className="text-muted-foreground">Rubric Verified Deliverable</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

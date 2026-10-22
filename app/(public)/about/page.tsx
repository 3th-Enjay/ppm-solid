"use client"

import { useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2, Code2, Cpu, GitBranch, Laptop, Layers, ShieldCheck, Terminal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SectionShell } from "@/components/skillup/section-shell"
import { fadeUp, hoverLift, maskReveal, sectionStagger, useReducedMotionSafe } from "@/lib/motion"
import { getAcademyName } from "@/lib/brand-config"

export default function AboutPage() {
  const shouldReduceMotion = useReducedMotionSafe()
  const academyName = getAcademyName()

  const coreValues = useMemo(
    () => [
      {
        icon: Code2,
        title: "Active Construction",
        description:
          "We believe the only way to learn software engineering is by writing, running, and debugging real code every single day.",
      },
      {
        icon: ShieldCheck,
        title: "Engineering Rigor",
        description:
          "We emphasize sound type systems, relational database modeling, clean architectural boundaries, and robust automated testing.",
      },
      {
        icon: Terminal,
        title: "Production Tooling",
        description:
          "Learners train with the same developer tooling used in industry: modern IDEs, Git version control, CI/CD workflows, and CLI environments.",
      },
      {
        icon: CheckCircle2,
        title: "Objective Rubrics",
        description:
          "Assessment is never arbitrary. Students understand the exact criteria for code quality, correctness, and architecture before submitting work.",
      },
      {
        icon: GitBranch,
        title: "Portfolio Proof",
        description:
          "Rather than memorizing multiple-choice questions, students build verified repositories that showcase tangible engineering ability.",
      },
      {
        icon: Cpu,
        title: "Modern Stacks",
        description:
          "Our curriculum tracks evolve with industry realities, emphasizing TypeScript, PostgreSQL, cloud architectures, and modern application frameworks.",
      },
    ],
    [],
  )

  const educationalPillars = [
    {
      title: "Interactive Coding Labs",
      description:
        "Every lesson connects theoretical concepts directly to runnable code snippets, interactive exercises, and structured knowledge checks.",
      icon: Laptop,
    },
    {
      title: "Full-Stack Project Builds",
      description:
        "Students build complete web applications, data pipelines, and backend services that integrate persistence, authentication, and external APIs.",
      icon: Layers,
    },
    {
      title: "Automated & Instructor Evaluation",
      description:
        "Submissions undergo multi-stage evaluation including automated testing checks and detailed instructor rubric reviews.",
      icon: ShieldCheck,
    },
    {
      title: "Verifiable Capstone Milestones",
      description:
        "Students complete comprehensive capstone projects that serve as public proof of technical competence when applying for engineering roles.",
      icon: GitBranch,
    },
  ]

  return (
    <div className="flex flex-col">
      <SectionShell
        variant="immersive"
        hasParallax
        hasFloatingAccent
        className="relative overflow-hidden border-b border-border/80 bg-gradient-to-b from-background via-muted/20 to-background py-16 md:py-24"
      >
        <motion.div
          variants={sectionStagger}
          initial="initial"
          animate="animate"
          className="mx-auto max-w-4xl space-y-6 text-center"
        >
          <motion.div variants={fadeUp}>
            <Badge variant="info" className="gap-1.5 rounded-full px-4 py-1 text-xs">
              <Terminal className="h-3.5 w-3.5 text-accent" />
              <span>About {academyName}</span>
            </Badge>
          </motion.div>

          <div className="space-y-3">
            <div className="overflow-hidden">
              <motion.h1 variants={maskReveal} className="text-4xl font-extrabold tracking-tight md:text-6xl">
                Engineering Education Built on{" "}
                <span className="bg-gradient-to-r from-primary via-accent to-sky-400 bg-clip-text text-transparent">
                  Real Software Construction
                </span>
              </motion.h1>
            </div>
            <motion.p variants={fadeUp} className="mx-auto max-w-3xl text-base text-muted-foreground sm:text-lg md:text-xl">
              We bridge the gap between theoretical knowledge and practical software delivery. Our curriculum is engineered to help students build, test, and deploy production-grade software.
            </motion.p>
          </div>

          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" variant="cta" asChild className="h-11">
              <Link href="/courses">
                Explore Curriculum
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-11">
              <Link href="/contact">Speak to Admissions</Link>
            </Button>
          </motion.div>
        </motion.div>
      </SectionShell>

      <SectionShell id="mission" variant="split" hasParallax className="bg-muted/20 py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="space-y-5">
            <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Our Purpose
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight md:text-4xl">
              Closing the gap between tutorial completion and real engineering capability.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground leading-relaxed">
              Traditional courses often rely on passive video lectures that leave students stranded when faced with a blank editor, a failing build, or an unfamiliar API error.
            </motion.p>
            <motion.p variants={fadeUp} className="text-muted-foreground leading-relaxed">
              At {academyName}, we treat programming as an applied craft. Every module requires students to write code, solve edge cases, structure database queries, and submit verified work evaluated against professional standards.
            </motion.p>
            <motion.div variants={fadeUp} className="pt-2">
              <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Our Core Instructional Promise</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No invented placement claims or artificial shortcuts. We guarantee clear learning materials, rigorous academic rubrics, and the direct support required to build genuine technical competence.
                </p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {educationalPillars.map((pillar) => (
              <Card key={pillar.title} variant="elevated" className="border-border/80 bg-card/80 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lifted">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-base mb-1.5">{pillar.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{pillar.description}</p>
              </Card>
            ))}
          </motion.div>
        </div>
      </SectionShell>

      <SectionShell className="py-16">
        <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="space-y-10">
          <motion.div variants={fadeUp} className="max-w-2xl space-y-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
              Operating Principles
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Core Values</h2>
            <p className="text-muted-foreground">The foundational standards guiding our curriculum design and teaching approach.</p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {coreValues.map((value) => (
              <motion.div key={value.title} variants={fadeUp} {...hoverLift()}>
                <Card className="h-full border-border/80 bg-card/75 transition-all duration-200 hover:border-accent/40 hover:shadow-lifted">
                  <CardContent className="space-y-3.5 p-6">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                      <value.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{value.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </SectionShell>

      <SectionShell variant="immersive" className="py-12 bg-muted/20">
        <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="mx-auto max-w-3xl space-y-5 text-center">
          <div className="overflow-hidden">
            <motion.h2 variants={maskReveal} className="text-3xl font-bold tracking-tight md:text-4xl">
              Start building your technical portfolio today.
            </motion.h2>
          </div>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-xl mx-auto">
            Browse our course catalog, enroll in structured curriculum tracks, and prove your capabilities with hands-on projects.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="cta" asChild>
              <Link href="/courses">Browse All Courses</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
          </motion.div>
        </motion.div>
      </SectionShell>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image, { type StaticImageData } from "next/image"
import { motion, useInView, useScroll, useTransform } from "framer-motion"
import { HeartHandshake, ShieldCheck, Anchor, Sparkles, Stethoscope } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SectionShell } from "@/components/skillup/section-shell"
import {
  fadeUp,
  floating,
  hoverLift,
  maskReveal,
  sectionStagger,
  slowZoom,
  useReducedMotionSafe,
} from "@/lib/motion"
import ceoImage from "@/public/ceo-promptcare.jpeg"
import directorImage from "@/public/dr-amara-okoye-director.jpeg"
import euniceImage from "@/public/eunice-tutor-promptcare.jpeg"
import chineduImage from "@/public/Chinedu-Amadi-tutor.jpeg"

type TeamMember = {
  name: string
  role: string
  image: StaticImageData
}

type ImpactStat = {
  label: string
  value: number
  suffix?: string
}

function CountUpStat({ stat, delayMs = 0 }: { stat: ImpactStat; delayMs?: number }) {
  const shouldReduceMotion = useReducedMotionSafe()
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once: true, margin: "-20% 0px -20% 0px" })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (shouldReduceMotion) {
      setCount(stat.value)
      return
    }

    const timeout = setTimeout(() => {
      let frame = 0
      const totalFrames = 42
      const increment = stat.value / totalFrames
      const interval = setInterval(() => {
        frame += 1
        if (frame >= totalFrames) {
          setCount(stat.value)
          clearInterval(interval)
          return
        }
        setCount(Math.round(increment * frame))
      }, 26)
    }, delayMs)

    return () => clearTimeout(timeout)
  }, [inView, shouldReduceMotion, stat.value, delayMs])

  return (
    <div ref={ref} className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-soft">
      <div className="text-4xl font-bold text-accent">
        {count.toLocaleString()}
        {stat.suffix || ""}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
    </div>
  )
}

export default function AboutPage() {
  const shouldReduceMotion = useReducedMotionSafe()
  const storyRef = useRef<HTMLDivElement | null>(null)
  const teamRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress: storyScroll } = useScroll({
    target: storyRef,
    offset: ["start end", "end start"],
  })
  const { scrollYProgress: teamScroll } = useScroll({
    target: teamRef,
    offset: ["start end", "end start"],
  })

  const storyImageY = useTransform(storyScroll, [0, 1], [14, -14])
  const teamAccentY = useTransform(teamScroll, [0, 1], [10, -10])

  const team: TeamMember[] = [
    { name: "Dr Ikechukwu Okoye", role: "Founder & CEO", image: ceoImage },
    { name: "Dr Amara Okoye", role: "Director", image: directorImage },
    { name: "Eunice", role: "Tutor", image: euniceImage },
    { name: "Chinedu Amadi", role: "Tutor", image: chineduImage },
  ]

  const values = useMemo(
    () => [
      {
        icon: HeartHandshake,
        title: "Humanity",
        description: "We train caregivers to honor dignity, empathy, and compassionate service in every interaction.",
      },
      {
        icon: ShieldCheck,
        title: "Excellence",
        description: "Our standards reflect global healthcare benchmarks adapted for practical local impact.",
      },
      {
        icon: Anchor,
        title: "Accountability",
        description: "We uphold integrity and professional responsibility in classroom, clinical, and home care contexts.",
      },
      {
        icon: Sparkles,
        title: "Resilience",
        description: "Learners build emotional and professional strength for high-pressure caregiving scenarios.",
      },
      {
        icon: Stethoscope,
        title: "Technical Mastery",
        description: "Empathy is reinforced with rigorous practical competencies and safety-first execution.",
      },
    ],
    [],
  )

  const impactStats: ImpactStat[] = [
    { label: "Active Students", value: 10000, suffix: "+" },
    { label: "Expert Instructors", value: 50, suffix: "+" },
    { label: "Courses Delivered", value: 200, suffix: "+" },
    { label: "Learner Success Rate", value: 94, suffix: "%" },
  ]

  return (
    <div className="flex flex-col">
      <SectionShell
        variant="immersive"
        hasParallax
        hasFloatingAccent
        backgroundType="image"
        backgroundImageUrl="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1800&q=80"
        backgroundImageAlt="Clinical learning environment with instructor-led training"
        className="text-white"
      >
        {/* Placeholder media intent: real classroom/clinical instruction with warm natural light. */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          variants={slowZoom}
          initial="initial"
          animate={shouldReduceMotion ? "initial" : "animate"}
        />
        <motion.div variants={sectionStagger} initial="initial" animate="animate" className="mx-auto max-w-4xl space-y-6 text-center">
          <Badge className="border-white/30 bg-white/10 text-white">About Prompt Care Academy</Badge>
          <div className="space-y-2">
            <div className="overflow-hidden">
              <motion.h1 variants={maskReveal} className="text-4xl font-bold md:text-6xl">
                Training the hands and hearts of{" "}
                <span className="bg-[linear-gradient(110deg,#22c7a8_10%,#6ee7d8_60%,#22c7a8_95%)] bg-clip-text text-transparent">
                  modern caregivers
                </span>
              </motion.h1>
            </div>
          </div>
          <motion.p variants={fadeUp} className="mx-auto max-w-3xl text-lg text-white/90 md:text-xl">
            We are building a new standard for caregiver education in Nigeria by combining technical mastery, ethical
            discipline, and compassion-led care.
          </motion.p>
          <motion.p variants={fadeUp} className="text-sm font-medium text-white/80">
            Trusted learning pathways shaped by international nursing experience and local healthcare realities.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              href="#our-story"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors duration-200 hover:text-accent"
            >
              Read our story
              <span className="block h-[2px] w-10 bg-accent transition-all duration-200 hover:w-14" />
            </Link>
          </motion.div>
        </motion.div>
      </SectionShell>

      <SectionShell id="our-story" variant="split" hasParallax className="bg-muted/25">
        <div ref={storyRef} className="grid gap-8 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] lg:items-start">
          <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="space-y-5">
            <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Our Story
            </motion.p>
            <motion.h2 variants={fadeUp} className="max-w-xl text-3xl font-bold md:text-4xl">
              Built from lived caregiving realities, not theory alone.
            </motion.h2>
            <motion.p variants={fadeUp} className="max-w-xl text-muted-foreground">
              For a decade in American hospitals, our founder, Dr Ike M. Okoye, trained in clinical systems where
              precision and compassion were inseparable.
            </motion.p>
            <motion.p variants={fadeUp} className="max-w-xl text-muted-foreground">
              In 2009, he returned to Nigeria to care for his father through Alzheimer’s and discovered a major gap:
              families needed skilled caregivers, but access to practical training was limited.
            </motion.p>
            <motion.p variants={fadeUp} className="max-w-xl text-muted-foreground">
              Prompt Care Academy was created to close that gap at scale and produce professionals prepared for real
              patient needs.
            </motion.p>
          </motion.div>

          <div className="relative grid gap-4 sm:grid-cols-2">
            {/* Placeholder media intent: early stage training, small group learning, and hands-on care practice. */}
            {[
              "/prompt-heroimg1.jpeg",
              "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
              "/prompt-heroimg3.jpeg",
            ].map((img, index) => (
              <motion.div
                key={img}
                variants={fadeUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                style={shouldReduceMotion ? undefined : { y: storyImageY }}
                className={index === 2 ? "sm:col-span-2" : ""}
              >
                <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft transition-all duration-200 hover:shadow-lifted">
                  <img
                    src={img}
                    alt={`Training session scene ${index + 1}`}
                    className="h-52 w-full object-cover transition-transform duration-200 hover:scale-[1.03]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell backgroundType="gradient">
        <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid gap-6 md:grid-cols-2">
          {[
            {
              title: "Our Mission",
              text: "Equip caregivers with practical, compassionate, and globally aligned skills that improve patient outcomes and family confidence.",
            },
            {
              title: "Our Vision",
              text: "Become Africa’s most trusted caregiver training authority for technical mastery, ethical leadership, and human-centered care.",
            },
          ].map((block) => (
            <motion.div key={block.title} variants={fadeUp} className="rounded-2xl border border-border/80 bg-card/80 p-6 shadow-soft">
              <h3 className="text-2xl font-semibold">{block.title}</h3>
              <motion.div
                className="mt-3 h-[2px] w-full bg-accent/70"
                initial={{ scaleX: 0, transformOrigin: "left" }}
                whileInView={{ scaleX: 1, transformOrigin: "left" }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
              <p className="mt-4 text-muted-foreground">{block.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </SectionShell>

      <SectionShell>
        <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="space-y-8">
          <motion.div variants={fadeUp} className="max-w-2xl space-y-2">
            <h2 className="text-3xl font-bold md:text-4xl">Core Values</h2>
            <p className="text-muted-foreground">The operating principles behind our teaching and care philosophy.</p>
          </motion.div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {values.map((value) => (
              <motion.div key={value.title} variants={fadeUp} {...hoverLift()}>
                <Card className="h-full border-border/80 transition-all duration-200 hover:border-accent/40 hover:shadow-lifted">
                  <CardContent className="space-y-4 p-6">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/80 bg-muted/50 transition-all duration-200 group-hover:border-accent/40">
                      <value.icon className="h-5 w-5 text-muted-foreground transition-all duration-200 hover:rotate-1 hover:text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </SectionShell>

      <SectionShell hasParallax className="bg-muted/25">
        <div ref={teamRef} className="space-y-8">
          <motion.div variants={fadeUp} initial="initial" whileInView="animate" viewport={{ once: true }} className="max-w-2xl space-y-2">
            <h2 className="text-3xl font-bold md:text-4xl">Leadership & Team</h2>
            <p className="text-muted-foreground">Experienced professionals committed to building healthcare confidence at scale.</p>
          </motion.div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {team.map((member, index) => (
              <motion.article
                key={member.name}
                variants={fadeUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="group overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft"
              >
                <div className="relative h-80 overflow-hidden bg-muted">
                  <Image
                    src={member.image}
                    alt={`${member.name} portrait`}
                    fill
                    className="object-cover object-top grayscale transition-all duration-200 group-hover:scale-[1.02] group-hover:grayscale-0"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
                <div className="space-y-2 p-5">
                  <h3 className="inline-block text-xl font-semibold">
                    {member.name}
                    <span className="mt-1 block h-[2px] w-0 bg-accent transition-all duration-200 group-hover:w-full" />
                  </h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              </motion.article>
            ))}
          </div>
          <motion.p
            variants={fadeUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            style={shouldReduceMotion ? undefined : { y: teamAccentY }}
            className="text-sm text-muted-foreground"
          >
            Our training leadership combines 16+ years of Nigerian home-care operations with global clinical standards.
          </motion.p>
        </div>
      </SectionShell>

      <SectionShell backgroundType="gradient" hasFloatingAccent>
        <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="space-y-8">
          <motion.div variants={fadeUp} className="max-w-2xl space-y-2">
            <h2 className="text-3xl font-bold md:text-4xl">Impact & Outcomes</h2>
            <p className="text-muted-foreground">Measured outcomes that demonstrate educational quality and learner readiness.</p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {impactStats.map((stat, index) => (
              <motion.div key={stat.label} variants={fadeUp}>
                <CountUpStat stat={stat} delayMs={index * 80} />
              </motion.div>
            ))}
          </div>
          <motion.div
            aria-hidden="true"
            variants={floating}
            animate={shouldReduceMotion ? undefined : "animate"}
            className="mx-auto h-16 w-40 rounded-full bg-accent/20 blur-2xl"
          />
        </motion.div>
      </SectionShell>

      <SectionShell variant="immersive" backgroundType="gradient" hasFloatingAccent>
        <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="mx-auto max-w-3xl space-y-5 text-center">
          <div className="overflow-hidden">
            <motion.h2 variants={maskReveal} className="text-3xl font-bold md:text-4xl">
              Join the mission to raise the standard of care.
            </motion.h2>
          </div>
          <motion.p variants={fadeUp} className="text-muted-foreground">
            Build practical caregiving expertise that transforms patient experiences and family confidence.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button className="h-11 bg-accent text-emerald-950 transition-all duration-200 hover:bg-accent/90" asChild>
              <Link href="/courses">Explore Courses</Link>
            </Button>
            <Button variant="outline" className="h-11 border-accent/40 hover:border-accent hover:text-accent" asChild>
              <Link href="/contact">Contact Admissions</Link>
            </Button>
          </motion.div>
        </motion.div>
      </SectionShell>
    </div>
  )
}


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
import { CtaBand } from "@/components/skillup/cta-band"

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
    void loadCourses()
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

  const trustItems = [
    "Trusted by learners",
    "Career-focused tracks",
    "Instructor support",
    "Practical outcomes",
    "Clinical confidence",
    "Global-ready training",
  ]

  const visualStack = [
    {
      imageUrl: "https://images.pexels.com/photos/4989136/pexels-photo-4989136.jpeg?auto=compress&cs=tinysrgb&w=900",
      alt: "African male doctor writing notes in a clinical setting",
    },
    {
      imageUrl: "https://images.pexels.com/photos/5452224/pexels-photo-5452224.jpeg?auto=compress&cs=tinysrgb&w=900",
      alt: "African medical practitioners collaborating over a tablet",
    },
    {
      imageUrl: "https://images.pexels.com/photos/6129154/pexels-photo-6129154.jpeg?auto=compress&cs=tinysrgb&w=900",
      alt: "African doctor and nurse reviewing patient information in a hospital corridor",
    },
    {
      imageUrl: "https://images.pexels.com/photos/4989166/pexels-photo-4989166.jpeg?auto=compress&cs=tinysrgb&w=900",
      alt: "African doctor smiling with a laptop in a bright clinic",
    },
  ]
  const journeySlides = [
    {
      title: "Start with the Fundamentals",
      text: "They start with curiosity and build confidence through practical caregiver foundations.",
      image: "/fundamentals-promptcare.jpeg",
    },
    {
      title: "Learn in Realistic Clinical Contexts",
      text: "Guided modules and hands-on simulations help them apply what matters in real care scenarios.",
      image: "/clinical-situatuion-promptcare.jpeg",
    },
    {
      title: "Practice Communication and Compassion",
      text: "They practice patient-first communication, safety habits, and professional bedside confidence.",
      image: "/practice-communication-promptcare.jpeg",
    },
    {
      title: "Become Career-Ready Caregivers",
      text: "They become ready to support families and healthcare teams with competence, empathy, and integrity.",
      image: "/become-career-ready.jpeg",
    },
  ]

  const heroImageUrl = "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=1600&q=80"

  return (
    <div className="flex flex-col">
      <SkillupHero featuredCourses={featuredCourses} currency={currency} />

      <SectionShell className="py-8 md:py-10" variant="split">
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/70">
          <div className="marquee-track flex gap-3 p-4 md:p-5">
            {[...trustItems, ...trustItems].map((item, index) => (
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
              Why Choose Prompt Care Academy?
            </Badge>
            <h2 className="text-3xl font-bold md:text-4xl">A learning environment designed for real progress</h2>
            <p className="text-muted-foreground">
              Every lesson is structured to move you from theory to practical confidence with clear guidance.
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_minmax(0,0.9fr)]">
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-1">
              {features.map((feature, index) => (
                <motion.div key={feature.title} variants={fadeUp(0.06 * index)}>
                  <Card variant="elevated" interactive className="h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lifted">
                    <CardContent className="space-y-4 p-6">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15">
                        <feature.icon className="h-5 w-5 text-accent" />
                      </div>
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {visualStack.map((image, index) => (
                <motion.div
                  key={image.imageUrl}
                  variants={fadeUp(0.08 * (index + 1))}
                  className="overflow-hidden rounded-2xl border border-border/80 bg-card/80 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lifted"
                >
                  <img
                    src={image.imageUrl}
                    alt={image.alt}
                    className="h-40 w-full object-cover transition-transform duration-500 hover:scale-[1.04]"
                    loading="lazy"
                    decoding="async"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </SectionShell>

      <SectionShell variant="immersive" className="pb-10 pt-10 md:pt-12">
        <motion.div variants={fadeUp()} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            Learner Story Journey
          </Badge>
          <h2 className="text-3xl font-bold md:text-4xl">How learners grow with us into confident caregivers</h2>
          <p className="max-w-2xl text-muted-foreground">
            A visual walkthrough of the transformation process from training to real caregiving impact.
          </p>
        </motion.div>

        <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
          {journeySlides.map((slide, index) => (
            <motion.article
              key={slide.title}
              variants={fadeUp(0.06 * index)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="group relative min-h-[360px] min-w-[85%] snap-center overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft sm:min-w-[60%] lg:min-w-[46%]"
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,18,0.12)_15%,rgba(7,10,18,0.86)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                <div className="mb-2 inline-flex rounded-full border border-accent/45 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                  Step {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-white">{slide.title}</h3>
                <p className="mt-2 text-sm text-white/85">{slide.text}</p>
              </div>
            </motion.article>
          ))}
        </div>
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
                <Card
                  variant="elevated"
                  interactive
                  className="h-full overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:rotate-[0.4deg] hover:border-accent/50 hover:shadow-lifted"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <img
                      src={
                        course.thumbnail ||
                        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80"
                      }
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.05]"
                    />
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

      <SectionShell variant="immersive" className="pt-8 md:pt-12">
        <CtaBand
          title="Ready to Start Learning?"
          description="Join thousands of students and transform your career with expert-led training and practical caregiver pathways."
          backgroundImageUrl={heroImageUrl}
        />
      </SectionShell>
    </div>
  )
}







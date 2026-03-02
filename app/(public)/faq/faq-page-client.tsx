"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Script from "next/script"
import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SectionShell } from "@/components/skillup/section-shell"
import { fadeUp, floating, maskReveal, sectionStagger, useReducedMotionSafe } from "@/lib/motion"
import { cn } from "@/lib/utils"

type FAQItem = {
  question: string
  answer: string
}

type FAQCategory = {
  id: string
  title: string
  intro: string
  questions: FAQItem[]
}

const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: "admissions",
    title: "Admissions",
    intro: "Everything you need to know before joining Prompt Care Academy.",
    questions: [
      {
        question: "Do I need a medical background to enroll?",
        answer:
          "No. Beginner tracks are designed for learners with no prior medical experience, and we guide you from care ethics to technical skill application.",
      },
      {
        question: "Can family caregivers join the program?",
        answer:
          "Yes. We offer practical tracks for sons, daughters, and spouses supporting loved ones at home.",
      },
      {
        question: "Where are your training locations?",
        answer:
          "We train in Abuja and Enugu through practical, hands-on sessions and digital learning support.",
      },
    ],
  },
  {
    id: "courses",
    title: "Courses",
    intro: "Understand course structure, timelines, and learning outcomes.",
    questions: [
      {
        question: "How long do courses take to complete?",
        answer:
          "Beginner programs typically run 2-4 weeks, intermediate 4-6 weeks, and advanced tracks 8+ weeks depending on pace.",
      },
      {
        question: "Do courses include practical sessions?",
        answer:
          "Yes. Programs combine structured online modules with practical care scenarios and assessments.",
      },
      {
        question: "Can I access materials after completion?",
        answer:
          "Yes. Most courses include lifetime access to digital learning materials and review resources.",
      },
    ],
  },
  {
    id: "tuition-payment",
    title: "Tuition & Payment",
    intro: "Clear payment expectations and refund process details.",
    questions: [
      {
        question: "What payment options are available?",
        answer:
          "Tuition can be paid through secure supported channels on our platform. Payment processing is handled by approved third-party providers.",
      },
      {
        question: "Do you offer refunds?",
        answer:
          "Refund requests are reviewed under our published Refund Policy, including eligibility windows and completion thresholds.",
      },
      {
        question: "Can I enroll without creating an account?",
        answer:
          "No. Enrollment is account-gated so your progress, certification, and purchase history remain secure and trackable.",
      },
    ],
  },
  {
    id: "certification",
    title: "Certification",
    intro: "How certification works and what it represents.",
    questions: [
      {
        question: "Will I receive a certificate after completion?",
        answer:
          "Yes. Certificates are issued after completing all required modules and assessments at the required pass mark.",
      },
      {
        question: "Does certification guarantee immediate employment?",
        answer:
          "No. Certification validates professional competency, but hiring outcomes depend on employer requirements and local market conditions.",
      },
    ],
  },
  {
    id: "career-support",
    title: "Career Support",
    intro: "How we help learners grow beyond course completion.",
    questions: [
      {
        question: "Do you support graduates with career opportunities?",
        answer:
          "We provide structured guidance and industry-ready preparation. Employment decisions remain with recruiting organizations.",
      },
      {
        question: "Is this training useful for international opportunities?",
        answer:
          "Our curriculum aligns to global care standards. Additional visa and licensing requirements still apply for each country.",
      },
    ],
  },
]

function highlightMatches(text: string, query: string) {
  if (!query.trim()) return text
  const normalized = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(${normalized})`, "ig")
  const parts = text.split(regex)

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark key={`${part}-${index}`} className="rounded-sm bg-primary/20 px-1 text-primary">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  )
}

export default function FAQPageClient() {
  const shouldReduceMotion = useReducedMotionSafe()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState(FAQ_CATEGORIES[0].id)

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_CATEGORIES
    return FAQ_CATEGORIES.map((category) => ({
      ...category,
      questions: category.questions.filter(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    })).filter((category) => category.questions.length > 0)
  }, [searchQuery])

  useEffect(() => {
    const sections = filteredCategories
      .map((category) => document.getElementById(category.id))
      .filter((node): node is HTMLElement => Boolean(node))

    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target?.id) {
          setActiveCategory(visible[0].target.id)
        }
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0.2, 0.4, 0.6] },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [filteredCategories])

  const faqSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_CATEGORIES.flatMap((category) =>
        category.questions.map((question) => ({
          "@type": "Question",
          name: question.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: question.answer,
          },
        })),
      ),
    }),
    [],
  )

  return (
    <div className="pb-12">
      <Script id="faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <SectionShell variant="immersive" backgroundType="gradient" hasFloatingAccent className="pb-14">
        <motion.div variants={sectionStagger} initial="initial" animate="animate" className="mx-auto max-w-3xl space-y-5 text-center">
          <Badge variant="info" className="mx-auto w-fit rounded-full px-4 py-1">
            Help Center
          </Badge>
          <div className="overflow-hidden">
            <motion.h1 variants={maskReveal} className="text-4xl font-bold md:text-5xl">
              Frequently Asked Questions
            </motion.h1>
          </div>
          <motion.p variants={fadeUp} className="text-muted-foreground">
            Clear answers on admissions, courses, payments, and certification.
          </motion.p>
          <motion.p variants={fadeUp} className="text-sm text-muted-foreground">
            Can&apos;t find what you need? Contact admissions.
          </motion.p>
          <motion.div variants={fadeUp} className="mx-auto w-full max-w-xl">
            <label htmlFor="faq-search" className="sr-only">
              Search FAQs
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="faq-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by keyword"
                className="h-11 rounded-2xl border-border/70 bg-card/80 pl-10"
              />
            </div>
          </motion.div>
        </motion.div>
        <motion.div
          variants={shouldReduceMotion ? undefined : floating}
          animate={shouldReduceMotion ? undefined : "animate"}
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 top-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        />
      </SectionShell>

      <div className="container mt-8">
        <nav className="sticky top-20 z-20 mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-border/70 bg-background/90 p-2 backdrop-blur">
          {filteredCategories.map((category) => (
            <Button
              key={category.id}
              variant="ghost"
              className={cn(
                "h-10 rounded-xl border-b-2 border-transparent whitespace-nowrap px-4",
                activeCategory === category.id ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => {
                const target = document.getElementById(category.id)
                target?.scrollIntoView({ behavior: "smooth", block: "start" })
                setActiveCategory(category.id)
              }}
            >
              {category.title}
            </Button>
          ))}
        </nav>

        {filteredCategories.length === 0 ? (
          <SectionShell>
            <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-border/70 bg-card/60 p-8 text-center">
              <h2 className="text-2xl font-semibold">No matching question found</h2>
              <p className="text-sm text-muted-foreground">
                Try a different keyword or reach out to our admissions team for direct support.
              </p>
              <Button asChild className="h-11 rounded-2xl">
                <Link href="/contact">Contact Admissions</Link>
              </Button>
            </div>
          </SectionShell>
        ) : (
          <div className="space-y-8">
            {filteredCategories.map((category, categoryIndex) => (
              <SectionShell key={category.id}>
                <motion.section
                  id={category.id}
                  variants={sectionStagger}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  className="mx-auto max-w-3xl space-y-4"
                >
                  <motion.div variants={fadeUp} className="space-y-1">
                    <h2 className="text-2xl font-semibold">{category.title}</h2>
                    <p className="text-sm text-muted-foreground">{category.intro}</p>
                  </motion.div>
                  <Accordion type="single" collapsible className="space-y-3">
                    {category.questions.map((faq, index) => (
                      <motion.div
                        key={`${category.id}-${index}`}
                        variants={fadeUp}
                        transition={{ delay: Math.min(categoryIndex * 0.04 + index * 0.03, 0.2) }}
                      >
                        <AccordionItem
                          value={`${category.id}-${index}`}
                          className="overflow-hidden rounded-xl border border-border/70 bg-card/70 px-4 data-[state=open]:border-primary/40"
                        >
                          <AccordionTrigger className="text-left text-sm leading-6 hover:no-underline">
                            {highlightMatches(faq.question, searchQuery)}
                          </AccordionTrigger>
                          <AccordionContent className="pb-4 text-sm leading-7 text-muted-foreground">
                            {highlightMatches(faq.answer, searchQuery)}
                          </AccordionContent>
                        </AccordionItem>
                      </motion.div>
                    ))}
                  </Accordion>
                </motion.section>
              </SectionShell>
            ))}
          </div>
        )}
      </div>

      <SectionShell variant="split" backgroundType="gradient" hasFloatingAccent>
        <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid gap-6 lg:grid-cols-2 lg:items-center">
          <motion.div variants={fadeUp} className="space-y-2">
            <h2 className="text-3xl font-bold">Still have questions?</h2>
            <p className="text-muted-foreground">
              Our admissions team can help you choose the right program and enrollment path.
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex lg:justify-end">
            <Button asChild className="h-11 rounded-2xl">
              <Link href="/contact">Speak to Admissions</Link>
            </Button>
          </motion.div>
        </motion.div>
      </SectionShell>
    </div>
  )
}

"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CtaBandProps {
  title: string
  description: string
  imageUrl?: string
  backgroundImageUrl?: string
}

export function CtaBand({ title, description, imageUrl, backgroundImageUrl }: CtaBandProps) {
  const reducedMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-border/80 bg-gradient-to-br from-[#090D16] via-[#0D1527] to-[#0A192F] p-6 text-white shadow-lifted md:p-12">
      {backgroundImageUrl || imageUrl ? (
        <img
          src={backgroundImageUrl || imageUrl}
          alt="Technology education environment"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] [background-size:32px_32px]" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(37,99,235,0.28)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(2,132,199,0.22)_0%,transparent_50%)]" />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-14 -top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
        animate={reducedMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={reducedMotion ? undefined : { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <div className="relative z-[1]">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-medium text-sky-300">
            <Code2 className="h-3.5 w-3.5" />
            <span>Accelerate Your Technical Career</span>
          </div>

          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">{title}</h2>
          <p className="max-w-2xl text-base text-slate-300 sm:text-lg">{description}</p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <Button
              size="lg"
              className="h-12 rounded-xl bg-primary px-6 font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.02] hover:bg-primary/90"
              asChild
            >
              <Link href="/courses">
                Explore Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-slate-700 bg-slate-900/60 px-6 font-medium text-slate-200 transition-all duration-200 hover:scale-[1.02] hover:bg-slate-800"
              asChild
            >
              <Link href="/register">Create Free Account</Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-12 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white"
              asChild
            >
              <Link href="/contact">Speak to an Advisor</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
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
    <section className="relative overflow-hidden rounded-[24px] border border-white/20 p-6 text-white shadow-lifted md:p-10">
      <img
        src={
          backgroundImageUrl ||
          imageUrl ||
          "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=1600&q=80"
        }
        alt="Healthcare students in practical training"
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(6,11,20,0.88)_0%,rgba(10,68,63,0.76)_45%,rgba(9,47,54,0.84)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.18)_0%,transparent_45%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.25)_0%,transparent_40%)]" />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-14 -top-10 h-44 w-44 rounded-full bg-white/20 blur-3xl"
        animate={reducedMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.35, 0.5, 0.35] }}
        transition={reducedMotion ? undefined : { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <div className="relative z-[1]">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">{title}</h2>
          <p className="max-w-2xl text-white/90">{description}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 rounded-xl bg-white text-emerald-900 transition-all duration-200 hover:scale-[1.02] hover:bg-white/90"
              asChild
            >
              <Link href="/courses">Explore Courses</Link>
            </Button>
            <Button
              size="lg"
              className="h-12 rounded-xl border border-white/70 bg-transparent text-white transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
              asChild
            >
              <Link href="/register">Register Now</Link>
            </Button>
            <Button
              size="lg"
              className="h-12 rounded-xl border border-white/50 bg-transparent text-white transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
              asChild
            >
              <Link href="/contact">Speak to Admissions</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

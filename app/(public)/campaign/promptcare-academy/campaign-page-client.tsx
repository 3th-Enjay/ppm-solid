"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, BadgeCheck, CalendarDays, Clock3, MapPin, MessageCircle, PhoneCall } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { CampaignConfig } from "@/lib/campaign-shared"

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

function normalizeWhatsappNumber(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits.startsWith("0")) {
    return `234${digits.slice(1)}`
  }
  return digits
}

export function PromptCareCampaignClient({ config }: { config: CampaignConfig }) {
  const registrationHref = config.registrationHref.includes("redirect=")
    ? config.registrationHref
    : `${config.registrationHref}${config.registrationHref.includes("?") ? "&" : "?"}redirect=${encodeURIComponent(config.registrationRedirect)}`

  const whatsappHref = `https://wa.me/${normalizeWhatsappNumber(config.whatsappNumber)}?text=${encodeURIComponent(
    "Hello Prompt Care Academy, I would like to learn more about the caregiver training program."
  )}`

  const highlights = [
    {
      icon: Clock3,
      title: config.durationLabel,
      description: config.durationDescription,
    },
    {
      icon: CalendarDays,
      title: config.startDateLabel,
      description: config.dateDescription,
    },
    {
      icon: MapPin,
      title: config.venueLabel,
      description: config.venueDescription,
    },
  ]

  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,#fbfdf9_0%,#eef8f1_45%,#ffffff_100%)]">
      <div className="absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_top_right,rgba(4,44,92,0.18),transparent_40%),radial-gradient(circle_at_top_left,rgba(35,197,94,0.18),transparent_34%)]" />
      <div className="absolute left-0 top-24 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute right-0 top-80 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />

      <section className="container relative py-10 sm:py-14 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.55 }}>
              <Badge className="rounded-full bg-primary/10 px-4 py-1.5 text-primary hover:bg-primary/10">
                {config.heroBadge}
              </Badge>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: 0.6, delay: 0.05 }} className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0c4f2a]">Prompt Home Health</p>
              <h1 className="max-w-3xl text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-950 sm:text-5xl lg:text-7xl">
                {config.heroTitle}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">{config.heroDescription}</p>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: 0.6, delay: 0.1 }} className="flex flex-wrap gap-3">
              <Button variant="cta" size="lg" asChild>
                <Link href={registrationHref}>
                  {config.registrationCtaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href={whatsappHref} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Us
                </Link>
              </Button>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              className="grid gap-4 sm:grid-cols-3"
            >
              <motion.div variants={fadeUp} transition={{ duration: 0.45 }}>
                <Card className="border-primary/15 bg-white/90 shadow-[var(--shadow-soft)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1">
                  <CardContent className="space-y-1 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{config.costLabel}</p>
                    <p className="text-3xl font-black text-[#0d3f78]">{config.costValue}</p>
                    <p className="text-sm text-slate-600">{config.costSuffix}</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={fadeUp} transition={{ duration: 0.45, delay: 0.06 }}>
                <Card className="border-primary/15 bg-white/90 shadow-[var(--shadow-soft)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1">
                  <CardContent className="space-y-1 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{config.cohortLabel}</p>
                    <p className="text-xl font-bold text-slate-900">{config.cohortValue}</p>
                    <p className="text-sm text-slate-600">{config.cohortDescription}</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={fadeUp} transition={{ duration: 0.45, delay: 0.12 }}>
                <Card className="border-primary/15 bg-white/90 shadow-[var(--shadow-soft)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1">
                  <CardContent className="space-y-2 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{config.contactLabel}</p>
                    <a href={`tel:${config.supportPhone}`} className="inline-flex items-center gap-2 text-lg font-bold text-slate-900 hover:text-primary">
                      <PhoneCall className="h-4 w-4" />
                      {config.contactValue}
                    </a>
                    <p className="text-sm text-slate-600">{config.contactDescription}</p>
                    <Link href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex text-sm font-semibold text-primary hover:underline">
                      Chat on WhatsApp
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute -inset-5 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(22,163,74,0.24),transparent_44%),radial-gradient(circle_at_bottom_right,rgba(13,63,120,0.2),transparent_40%)] blur-2xl" />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
              className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white p-3 shadow-[0_28px_90px_rgba(15,23,42,0.16)]"
            >
              <Image
                src={config.campaignImage}
                alt="Prompt Care Academy caregiver campaign poster"
                width={900}
                height={1269}
                className="h-auto w-full rounded-[1.35rem] object-cover"
                priority
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="container relative pb-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-4 lg:grid-cols-3"
        >
          {highlights.map((item, index) => (
            <motion.div key={item.title} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.08 }}>
              <Card className="border-slate-200/80 bg-white/85 shadow-[var(--shadow-soft)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lifted)]">
                <CardContent className="space-y-3 p-6">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0d3f78]/10 text-[#0d3f78]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-950">{item.title}</h2>
                  <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="container py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="overflow-hidden border-0 bg-[#0f8d2e] text-white shadow-[0_22px_80px_rgba(15,141,46,0.28)]">
              <CardContent className="space-y-6 p-7 sm:p-8">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">{config.academySectionDescription}</p>
                  <h2 className="text-3xl font-black leading-tight">{config.academySectionTitle}</h2>
                </div>

                <div className="space-y-3">
                  {config.benefits.map((benefit, index) => (
                    <motion.div
                      key={benefit}
                      initial={{ opacity: 0, x: -14 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#d8ff67]" />
                      <p className="text-sm leading-6 text-white/92 sm:text-base">{benefit}</p>
                    </motion.div>
                  ))}
                </div>

                <Button variant="secondary" size="lg" asChild className="w-full sm:w-auto">
                  <Link href={registrationHref}>
                    {config.registrationCtaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="grid gap-6"
          >
            <Card className="border-0 bg-slate-950 text-white shadow-[0_22px_80px_rgba(15,23,42,0.28)]">
              <CardContent className="space-y-4 p-7 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">{config.upcomingBatchTitle}</p>
                <div className="space-y-3">
                  <p className="text-2xl font-black sm:text-3xl">{config.venueValue}</p>
                  <p className="text-lg text-white/82">Starts: {config.startDateValue}</p>
                  <p className="text-sm text-white/72">Program duration: {config.durationValue}</p>
                  <p className="max-w-2xl text-sm leading-6 text-white/72">{config.upcomingBatchDescription}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#0d3f78]/12 bg-white/92 shadow-[var(--shadow-soft)] backdrop-blur-sm">
              <CardContent className="space-y-5 p-7 sm:p-8">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0d3f78]">Ready to Enroll?</p>
                  <h2 className="text-3xl font-black text-slate-950">Register now or talk with our team</h2>
                  <p className="text-sm leading-6 text-slate-600">
                    Take the next step today. Sign up online or chat with us on WhatsApp if you want quick guidance before registering.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button variant="cta" size="lg" asChild>
                    <Link href={registrationHref}>
                      {config.registrationCtaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href={whatsappHref} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp Us
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/login?redirect=/dashboard/onsite-training">Already have an account?</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

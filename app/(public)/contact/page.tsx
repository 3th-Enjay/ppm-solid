"use client"

import type React from "react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { SectionShell } from "@/components/skillup/section-shell"
import { contactSchema } from "@/lib/validation"
import { fadeUp, floating, hoverLift, maskReveal, sectionStagger, slowZoom, useReducedMotionSafe } from "@/lib/motion"
import { Mail, MapPin, MessageCircle, Phone, ShieldCheck, Clock3, CircleCheckBig } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type ContactFormData = {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

type ContactFormErrors = Partial<Record<keyof ContactFormData, string>>

const defaultForm: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
}

function FloatingField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  required = false,
}: {
  id: keyof ContactFormData
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: "text" | "email" | "tel"
  required?: boolean
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="peer h-12 w-full rounded-xl border border-border bg-background px-3 pt-5 text-sm outline-none transition-all duration-200 focus:border-accent focus:[box-shadow:0_0_0_3px_rgba(34,199,168,0.35)]"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-3 origin-left text-sm text-muted-foreground transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:scale-[0.86] peer-focus:text-accent peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:scale-[0.86]"
      >
        {label}
      </label>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function FloatingTextarea({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: keyof ContactFormData
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  return (
    <div className="relative">
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        rows={6}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="peer w-full rounded-xl border border-border bg-background px-3 pb-3 pt-6 text-sm outline-none transition-all duration-200 focus:border-accent focus:[box-shadow:0_0_0_3px_rgba(34,199,168,0.35)]"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-3 origin-left text-sm text-muted-foreground transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:scale-[0.86] peer-focus:text-accent peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:scale-[0.86]"
      >
        {label}
      </label>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default function ContactPage() {
  const { toast } = useToast()
  const shouldReduceMotion = useReducedMotionSafe()
  const [formData, setFormData] = useState<ContactFormData>(defaultForm)
  const [errors, setErrors] = useState<ContactFormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const contactOptions = useMemo(
    () => [
      {
        icon: Phone,
        title: "Call Admissions",
        description: "Speak directly with admissions support during office hours.",
        cta: "Call now",
        href: "tel:+2349030910091",
      },
      {
        icon: MessageCircle,
        title: "WhatsApp Chat",
        description: "Get quick answers on program options and enrollment support.",
        cta: "Start chat",
        href: "https://wa.me/2349030910091",
      },
      {
        icon: Mail,
        title: "Email Us",
        description: "Send detailed inquiries and receive guidance from our team.",
        cta: "Send email",
        href: "mailto:promptcareacademy.com@gmail.com",
      },
      {
        icon: MapPin,
        title: "Visit Campus",
        description: "Meet the team and explore training opportunities in person.",
        cta: "Get directions",
        href: "https://maps.google.com/?q=Suite+B16,+Area+11+Shopping+Complex,+Ahmadu+Bello+Way,+Garki+Abuja",
      },
    ],
    [],
  )

  const updateField = <T extends keyof ContactFormData>(field: T, value: ContactFormData[T]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitted(false)

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
    }

    const validation = contactSchema.safeParse(payload)
    const nextErrors: ContactFormErrors = {}
    if (!validation.success) {
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as keyof ContactFormData
        nextErrors[path] = issue.message
      }
    }
    if (formData.phone.trim() && !/^[+\d\s()-]{7,20}$/.test(formData.phone.trim())) {
      nextErrors.phone = "Enter a valid phone number."
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSubmitting(false)
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 900))
    setSubmitting(false)
    setSubmitted(true)
    setFormData(defaultForm)
    toast({
      title: "Message sent",
      description: "Our admissions team will respond within 24 hours.",
    })
  }

  return (
    <div className="flex flex-col">
      <SectionShell
        variant="immersive"
        hasParallax
        hasFloatingAccent
        backgroundType="image"
        backgroundImageUrl="/contact-medical-care-kit.svg"
        backgroundImageAlt="Medical caregiver essentials including a clipboard, care cross, and stethoscope"
        className="text-white"
      >
        {/* Inanimate caregiver-themed contact hero artwork. */}
        <motion.div
          aria-hidden="true"
          variants={slowZoom}
          initial="initial"
          animate={shouldReduceMotion ? "initial" : "animate"}
          className="pointer-events-none absolute inset-0"
        />
        <motion.div variants={sectionStagger} initial="initial" animate="animate" className="mx-auto max-w-3xl space-y-5 text-center">
          <Badge className="border-white/20 bg-white/10 text-white">Contact Admissions</Badge>
          <div className="overflow-hidden">
            <motion.h1 variants={maskReveal} className="text-4xl font-bold md:text-6xl">
              Let’s plan your{" "}
              <span className="bg-[linear-gradient(110deg,#22c7a8_10%,#6ee7d8_60%,#22c7a8_95%)] bg-clip-text text-transparent">
                next step
              </span>{" "}
              in healthcare.
            </motion.h1>
          </div>
          <motion.p variants={fadeUp} className="text-lg text-white/90">
            We’re here to help you choose the right program and begin with clarity and confidence.
          </motion.p>
          <motion.p variants={fadeUp} className="text-sm font-medium text-white/80">
            Admissions responses are typically sent within 24 hours.
          </motion.p>
          <motion.div variants={fadeUp}>
            <a href="#contact-form" className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-accent">
              Start your application conversation
              <span className="h-[2px] w-12 bg-accent transition-all duration-200 hover:w-16" />
            </a>
          </motion.div>
        </motion.div>
      </SectionShell>

      <SectionShell>
        <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {contactOptions.map((option) => (
            <motion.a
              key={option.title}
              href={option.href}
              target={option.href.startsWith("http") ? "_blank" : undefined}
              rel={option.href.startsWith("http") ? "noreferrer" : undefined}
              variants={fadeUp}
              {...hoverLift()}
              className="group rounded-2xl border border-border/80 bg-card p-5 shadow-soft transition-all duration-200 hover:border-accent/40 hover:shadow-lifted"
            >
              <option.icon className="h-5 w-5 text-muted-foreground transition-colors duration-200 group-hover:text-accent" />
              <h3 className="mt-3 text-lg font-semibold">{option.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{option.description}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-foreground transition-colors duration-200 group-hover:text-accent">
                {option.cta}
              </span>
            </motion.a>
          ))}
        </motion.div>
      </SectionShell>

      <SectionShell id="contact-form" variant="split" hasParallax className="bg-muted/20">
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,1fr)] lg:items-start">
          <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="space-y-4">
            <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Main Contact Form
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-bold md:text-4xl">
              Tell us what you need. We’ll guide you clearly.
            </motion.h2>
            <motion.p variants={fadeUp} className="max-w-xl text-muted-foreground">
              Share your goals and our admissions team will help you identify the best training path, timelines, and support options.
            </motion.p>
            <motion.ul variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="space-y-3 pt-2">
              {["Fast response", "Confidential support", "No obligation consultation"].map((item) => (
                <motion.li key={item} variants={fadeUp} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  {item}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          <motion.div variants={fadeUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
            <Card className="rounded-2xl border-border/80 bg-card/95 shadow-lifted">
              <div className="h-[2px] w-full rounded-t-2xl bg-accent/80" />
              <CardContent className="p-6 md:p-7">
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <FloatingField
                    id="name"
                    label="Full Name"
                    value={formData.name}
                    onChange={(value) => updateField("name", value)}
                    error={errors.name}
                    required
                  />
                  <FloatingField
                    id="email"
                    type="email"
                    label="Email Address"
                    value={formData.email}
                    onChange={(value) => updateField("email", value)}
                    error={errors.email}
                    required
                  />
                  <FloatingField
                    id="phone"
                    type="tel"
                    label="Phone Number (Optional)"
                    value={formData.phone}
                    onChange={(value) => updateField("phone", value)}
                    error={errors.phone}
                  />

                  <div className="relative">
                    <select
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => updateField("subject", e.target.value)}
                      required
                      aria-invalid={Boolean(errors.subject)}
                      aria-describedby={errors.subject ? "subject-error" : undefined}
                      className="h-12 w-full rounded-xl border border-border bg-background px-3 pt-5 text-sm outline-none transition-all duration-200 focus:border-accent focus:[box-shadow:0_0_0_3px_rgba(34,199,168,0.35)]"
                    >
                      <option value="">Select a subject</option>
                      <option value="Course enrollment">Course enrollment</option>
                      <option value="Program guidance">Program guidance</option>
                      <option value="Payment questions">Payment questions</option>
                      <option value="Campus visit">Campus visit</option>
                    </select>
                    <label htmlFor="subject" className="pointer-events-none absolute left-3 top-1.5 text-xs text-accent">
                      Subject
                    </label>
                    {errors.subject ? (
                      <p id="subject-error" className="mt-1 text-xs text-red-500">
                        {errors.subject}
                      </p>
                    ) : null}
                  </div>

                  <FloatingTextarea
                    id="message"
                    label="Message"
                    value={formData.message}
                    onChange={(value) => updateField("message", value)}
                    error={errors.message}
                  />

                  <Button
                    type="submit"
                    size="lg"
                    className="h-11 w-full bg-accent text-emerald-950 transition-all duration-200 hover:bg-accent/90"
                    disabled={submitting}
                  >
                    {submitting ? "Sending..." : "Send Message"}
                  </Button>

                  <motion.div
                    initial={{ opacity: 0, y: 6, height: 0 }}
                    animate={submitted ? { opacity: 1, y: 0, height: "auto" } : { opacity: 0, y: 6, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                    aria-live="polite"
                  >
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm text-foreground">
                      <CircleCheckBig className="h-4 w-4 text-accent" />
                      Message sent successfully. We will contact you shortly.
                    </div>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </SectionShell>

      <SectionShell backgroundType="gradient">
        <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid gap-6 lg:grid-cols-2">
          <motion.div variants={fadeUp} className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft">
            <iframe
              title="Prompt Care Academy location map"
              src="https://www.google.com/maps?q=Suite+B16,+Area+11+Shopping+Complex,+Ahmadu+Bello+Way,+Garki+Abuja&output=embed"
              className="h-[320px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
          <motion.div variants={fadeUp} className="space-y-4 rounded-2xl border border-border/80 bg-card/90 p-6 shadow-soft">
            <h3 className="text-2xl font-semibold">Visit Our Campus</h3>
            <p className="text-muted-foreground">
              Suite B16, Area 11 Shopping Complex, Ahmadu Bello Way, Garki Abuja.
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4 text-accent" />
              Mon - Fri: 9:00 AM to 5:00 PM
            </p>
            <Button variant="outline" className="border-accent/40 hover:border-accent hover:text-accent" asChild>
              <a
                href="https://maps.google.com/?q=Suite+B16,+Area+11+Shopping+Complex,+Ahmadu+Bello+Way,+Garki+Abuja"
                target="_blank"
                rel="noreferrer"
              >
                Get Directions
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </SectionShell>

      <SectionShell>
        <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="space-y-5">
          <motion.h2 variants={fadeUp} className="text-3xl font-bold md:text-4xl">
            Have a quick question?
          </motion.h2>
          <motion.p variants={fadeUp} className="max-w-2xl text-muted-foreground">
            Here are answers to common admissions questions before you submit a request.
          </motion.p>
          <motion.div variants={fadeUp} className="rounded-2xl border border-border/80 bg-card shadow-soft">
            <Accordion type="single" collapsible>
              <AccordionItem value="faq-1">
                <AccordionTrigger className="px-5 text-left hover:text-accent">
                  How soon will admissions respond?
                </AccordionTrigger>
                <AccordionContent className="px-5 text-muted-foreground">
                  Most inquiries receive a response within 24 hours on business days.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-2">
                <AccordionTrigger className="px-5 text-left hover:text-accent">
                  Can I speak to someone before choosing a course?
                </AccordionTrigger>
                <AccordionContent className="px-5 text-muted-foreground">
                  Yes. You can call, email, or use WhatsApp to get personalized guidance before enrolling.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-3">
                <AccordionTrigger className="px-5 text-left hover:text-accent">
                  Is campus visit available?
                </AccordionTrigger>
                <AccordionContent className="px-5 text-muted-foreground">
                  Yes. We welcome scheduled campus visits for prospective learners and families.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Button variant="outline" className="border-accent/40 hover:border-accent hover:text-accent" asChild>
              <Link href="/faq">View Full FAQ</Link>
            </Button>
          </motion.div>
        </motion.div>
      </SectionShell>

      <SectionShell variant="immersive" backgroundType="gradient" hasFloatingAccent>
        <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="mx-auto max-w-3xl space-y-5 text-center">
          <div className="overflow-hidden">
            <motion.h2 variants={maskReveal} className="text-3xl font-bold md:text-4xl">
              Your healthcare career starts with a conversation.
            </motion.h2>
          </div>
          <motion.p variants={fadeUp} className="text-muted-foreground">
            Talk with admissions and choose the training path that matches your goals.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button className="h-11 bg-accent text-emerald-950 hover:bg-accent/90" asChild>
              <Link href="/courses">Explore Courses</Link>
            </Button>
            <Button variant="outline" className="h-11 border-accent/40 hover:border-accent hover:text-accent" asChild>
              <a href="https://wa.me/2349030910091" target="_blank" rel="noreferrer">
                Speak to Admissions
              </a>
            </Button>
          </motion.div>
          <motion.div
            aria-hidden="true"
            variants={floating}
            animate={shouldReduceMotion ? undefined : "animate"}
            className="mx-auto h-12 w-32 rounded-full bg-accent/20 blur-2xl"
          />
        </motion.div>
      </SectionShell>
    </div>
  )
}


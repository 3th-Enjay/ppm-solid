"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Award, BookOpen, TrendingUp, HeartHandshake, ShieldCheck, Anchor, Sparkles, Stethoscope } from "lucide-react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Testimonials } from "@/components/testimonials"
import Image from "next/image"
import aboutImage from "@/public/promptcare-about.jpeg"
import storyImage from "@/public/promptcare-story.jpeg"
import ceoImage from "@/public/ceo-promptcare.jpeg"
import euniceImage from "@/public/eunice-tutor-promptcare.jpeg"

export default function AboutPage() {
  const [storyExpanded, setStoryExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const visionRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress: visionScroll } = useScroll({
    target: visionRef,
    offset: ["start end", "center start"],
  })
  const visionTextY = useTransform(visionScroll, [0, 1], [60, 0])
  const visionImageY = useTransform(visionScroll, [0, 1], [-60, 0])

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])
  const stats = [
    { label: "Active Students", value: "10,000+", icon: Users },
    { label: "Expert Instructors", value: "50+", icon: Award },
    { label: "Courses Available", value: "200+", icon: BookOpen },
    { label: "Success Rate", value: "94%", icon: TrendingUp },
  ]

  const values = [
    {
      icon: HeartHandshake,
      title: "H – Humanity (Compassion First)",
      description:
        "We believe that caregiving is a sacred trust. We train our students to see the person behind the patient, lead with kindness, and treat every individual with the utmost dignity.",
    },
    {
      icon: ShieldCheck,
      title: "E – Excellence (World-Class Standards)",
      description:
        "We do not settle for good enough. We are committed to the highest global benchmarks in healthcare training, utilizing the best curriculum and techniques available to ensure our caregivers are second to none.",
    },
    {
      icon: Anchor,
      title: "A – Accountability (Integrity in Action)",
      description:
        "In the privacy of a home or the halls of a clinic, our caregivers act with honesty and responsibility. We take pride in being a sister company to a trusted brand, upholding the highest ethical standards in every interaction.",
    },
    {
      icon: Sparkles,
      title: "R – Resilience (The Strength to Care)",
      description:
        "Caregiving is demanding. We equip our students with the mental and emotional strength to remain professional and supportive, even in the most challenging health scenarios.",
    },
    {
      icon: Stethoscope,
      title: "T – Technical Mastery (The Skilled Hand)",
      description:
        "We believe empathy must be backed by competence. Our training ensures that every caregiver possesses the precise clinical skills needed to provide safe, effective, and high-quality medical support.",
    },
  ]

  const team = [
    {
      name: "Dr Ikechukwu Okoye",
      role: "Founder & CEO",
      image: ceoImage,
    },
    {
      name: "Eunice",
      role: "Tutor",
      image: euniceImage,
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <Badge className="mb-2 inline-flex animate-bounce">About Prompt Care Academy</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-balance text-foreground relative overflow-hidden">
              <span className="relative z-0">Training the hands and hearts that care</span>
              <span className="pointer-events-none absolute inset-0 z-10 mix-blend-screen bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.5),transparent)] bg-[length:200%_200%] animate-[sheen_4s_linear_infinite]" />
            </h1>
            <p className="text-xl text-pretty text-foreground">
              <span className="relative z-0">
                We're on a mission to redefine the standard of care in Nigeria by empowering caregivers with world-class clinical expertise and
                a deep-rooted culture of empathy, ensuring every patient and family receives the excellence, dignity, and
                professional support they deserve.
              </span>
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mt-16">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardContent className="p-6 text-center space-y-2">
                    <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="pt-0 pb-16">
        <div className="container" ref={visionRef}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="space-y-4 min-h-[306px] sm:min-h-[357px] lg:min-h-[442px] flex flex-col justify-center"
              style={{ y: isMobile ? 0 : visionTextY }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-foreground relative overflow-hidden">
                <span className="relative z-0">Our Vision</span>
                <span className="pointer-events-none absolute inset-0 z-10 mix-blend-screen bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.5),transparent)] bg-[length:200%_200%] animate-[sheen_4s_linear_infinite]" />
              </h2>
              <p className="text-xl md:text-2xl text-foreground">
                <span className="relative z-0">
                  To be the foremost authority in caregiver education in Africa, recognized for producing healthcare
                  professionals who are sought after globally for their technical mastery, unwavering ethics, and
                  transformative compassion.
                </span>
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
              style={{ y: isMobile ? 0 : visionImageY }}
            >
              <div className="relative w-full h-[320px] sm:h-[380px] lg:h-[460px] rounded-2xl overflow-hidden">
                <Image
                  src={aboutImage}
                  alt="Prompt Care Academy"
                  fill
                  className="object-contain object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enroll CTA */}
      <section className="py-12">
        <div className="container">
          <Card className="bg-muted/50">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <h3 className="text-2xl font-semibold">Ready to enroll and start studying?</h3>
              <p className="text-muted-foreground max-w-2xl">
                Explore our courses to find the right learning path and begin your journey with Prompt Care Academy.
              </p>
              <Button asChild>
                <Link href="/courses">Explore Our Courses</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">The Heart of the Return: The Story of Prompt Care Academy</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  For a decade, I walked the halls of American hospitals, first as a CNA and then as a Registered Nurse. I was
                  immersed in a system of clinical precision and world-class standards, but my heart remained anchored in
                  Nigeria. In 2009, that connection called me home. My father—my hero—had begun his battle with Alzheimer’s
                  disease, and I knew there was only one place I belonged: by his side.
                </p>
                <p>
                  I didn’t just come home to visit; I came home to serve.
                </p>
                <p>
                  Upon my return, I found a void where there should have been a safety net. Professional home care was almost
                  non-existent, leaving families to struggle in silence. I chose not to return to the United States. Instead,
                  I chose to stay and build. I established Prompt Home Health to bridge the gap, bringing the rigorous standards
                  I had mastered abroad to the soil that raised me.
                </p>
                {storyExpanded && (
                  <>
                    <p>
                      For over sixteen years, I have steered that mission through the complexities of the Nigerian healthcare
                      landscape. Since 2009, we have been at the bedsides of parents and grandparents, providing care where there
                      was once only a silence.
                    </p>
                    <p>
                      However, throughout this journey, I faced a recurring heartbreak: the search for caregivers who possessed
                      both the technical skill of a professional nurse and the compassionate heart of a devoted child. I realized
                      that while many had the will to care, they lacked the how.
                    </p>
                    <p>
                      I didn’t wait for a global trend or a government solution. Long before the Japa syndrome began to dominate the
                      national conversation, I was already in the room, personally training my staff for free. I was pouring my
                      American clinical expertise into local hands, driven by the simple belief that our patients deserved better.
                    </p>
                    <p>
                      Prompt Care Academy is the definitive realization of this lifelong odyssey. This Academy stands as a proven
                      standard—a transition from being at the bedside to empowering thousands of others to stand there with
                      confidence. We are scaling a legacy of excellence that has been practiced and refined on Nigerian soil since
                      my return in 2009.
                    </p>
                    <p>
                      Born from the hard-won lessons of a son who served as his father’s primary caregiver, Prompt Care Academy
                      provides the world-class training that only decades of international and local experience can produce. We are
                      here to train the hearts and hands of those who care.
                    </p>
                    <p className="pt-4 font-medium text-foreground">
                      By Dr. Ike M. Okoye
                      <br />
                      Founder and CEO,
                      <br />
                      Prompt Care Academy
                    </p>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => setStoryExpanded((prev) => !prev)}
              >
                {storyExpanded ? "Read less" : "Read more"}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative w-full h-[360px] sm:h-[420px] lg:h-[520px] rounded-2xl overflow-hidden">
                <Image
                  src={storyImage}
                  alt="Our story"
                  fill
                  className="object-contain object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              These core principles guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                viewport={{ once: true }}
              >
                <Card className="h-full origin-center animate-[spin-shake_0.8s_ease-in-out_12,spin-shake_2.4s_ease-in-out_infinite_10s] transition-transform duration-300 hover:animate-none hover:scale-[1.04]">
                  <CardContent className="p-6 space-y-4">
                    <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
                      <value.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">The passionate people behind Prompt Care Academy</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                viewport={{ once: true }}
              >
                <Card className="overflow-hidden">
                  <div className="relative w-full h-[320px] rounded-2xl overflow-hidden bg-muted">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-contain object-top"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <CardContent className="p-6 text-center">
                    <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                    <p className="text-muted-foreground">{member.role}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="bg-primary text-primary-foreground overflow-hidden relative">
            <CardContent className="p-12 text-center relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Learning Journey?</h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of students already learning with Prompt Care Academy
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/register">Register Now!</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

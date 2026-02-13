"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Award, BookOpen, TrendingUp, Target, Heart, Zap } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Testimonials } from "@/components/testimonials"

export default function AboutPage() {
  const stats = [
    { label: "Active Students", value: "10,000+", icon: Users },
    { label: "Expert Instructors", value: "50+", icon: Award },
    { label: "Courses Available", value: "200+", icon: BookOpen },
    { label: "Success Rate", value: "94%", icon: TrendingUp },
  ]

  const values = [
    {
      icon: Target,
      title: "Quality Education",
      description: "We provide world-class education accessible to everyone, everywhere.",
    },
    {
      icon: Heart,
      title: "Student Success",
      description: "Your success is our mission. We're committed to helping you achieve your goals.",
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We continuously innovate to provide the best learning experience possible.",
    },
  ]

  const team = [
    {
      name: "Sarah Johnson",
      role: "Founder & CEO",
      image: "/professional-woman-ceo.png",
    },
    {
      name: "Michael Chen",
      role: "Head of Product",
      image: "/professional-product-manager.png",
    },
    {
      name: "Emily Rodriguez",
      role: "Lead Instructor",
      image: "/professional-woman-instructor.jpg",
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
            <Badge className="mb-2">About Promptcare Academy</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-balance">TRAINING the hands and hearts that care</h1>
            <p className="text-xl text-muted-foreground text-pretty">
              We're on a mission to democratize education and make high-quality learning accessible to everyone,
              everywhere.
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Promptcare Academy was founded in 2020 with a simple yet powerful vision: to make quality education accessible
                  to everyone, regardless of their location or background.
                </p>
                <p>
                  What started as a small platform with just a handful of courses has grown into a thriving community of
                  over 10,000 students and 50+ expert instructors from around the world.
                </p>
                <p>
                  Today, we offer over 200 courses across multiple disciplines, helping students achieve their career
                  goals and transform their lives through education.
                </p>
              </div>
              <Button asChild className="mt-6">
                <Link href="/courses">Explore Our Courses</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl overflow-hidden">
                <img src="/modern-office-team.png" alt="Our team" className="object-cover w-full h-full" />
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
                <Card className="h-full">
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
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">The passionate people behind Promptcare Academy</p>
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
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    <img
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      className="object-cover w-full h-full"
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
                Join thousands of students already learning with Promptcare Academy
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



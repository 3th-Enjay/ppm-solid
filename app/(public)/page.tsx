"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BookOpen, Users, Award, Star, Clock, TrendingUp } from "lucide-react"
import { Testimonials } from "@/components/testimonials"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import type { Course } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/format"
import { usePreferencesStore } from "@/lib/store"

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
    loadCourses()
  }, [])

  const stats = [
    { label: "Active Students", value: "10,000+", icon: Users },
    { label: "Expert Instructors", value: "50+", icon: Award },
    { label: "Course Hours", value: "5,000+", icon: Clock },
    { label: "Success Rate", value: "94%", icon: TrendingUp },
  ]

  const features = [
    {
      title: "Expert-Led Courses",
      description: "Learn from industry professionals with real-world experience",
      icon: Award,
    },
    {
      title: "Flexible Learning",
      description: "Study at your own pace, anywhere, anytime",
      icon: Clock,
    },
    {
      title: "Certificates",
      description: "Earn recognized certificates upon course completion",
      icon: BookOpen,
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <Badge className="mb-2">Welcome to Prompt Care Academy</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-balance">
                Master New Skills with Expert-Led Online Courses
              </h1>
              <p className="text-xl text-muted-foreground text-pretty">
                Join thousands of students learning web development, design, business, and more. Start your journey
                today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/courses">
                    Browse Courses
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/register">Register Now!</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className="text-center"
                  >
                    <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="relative w-full h-[360px] sm:h-[420px] lg:h-[520px] rounded-2xl overflow-hidden">
                  <Image 
                    src="/promptcare-hero.jpeg" 
                    alt="Prompt Care Academy hero"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-lg border">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">10,000+</div>
                    <div className="text-sm text-muted-foreground">Happy Students</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Prompt Care Academy?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We provide the best learning experience with cutting-edge features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-20">
        <div className="container">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Courses</h2>
              <p className="text-xl text-muted-foreground">Start learning with our most popular courses</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/courses">
                View All
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                viewport={{ once: true }}
              >
                <Link href={`/courses/${course.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      <img
                        src={course.thumbnail || "/placeholder.svg"}
                        alt={course.title}
                        className="object-cover w-full h-full"
                      />
                      <Badge className="absolute top-4 left-4">{course.level}</Badge>
                    </div>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {course.category}
                        </Badge>
                        <h3 className="text-xl font-semibold mb-2 line-clamp-2">{course.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{course.rating}</span>
                          <span className="text-sm text-muted-foreground">({course.enrollmentCount})</span>
                        </div>
                        <div className="text-xl font-bold text-primary">
                          {formatCurrency(course.price[currency], currency)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Start Learning?</h2>
            <p className="text-xl opacity-90">
              Join thousands of students and transform your career with our expert-led courses
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
                <Link href="/courses">Explore Courses</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

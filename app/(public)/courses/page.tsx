"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Search, Star, Clock, Users, Filter, Map, Layers, Flag, Heart } from "lucide-react"
import type { Course, Category } from "@/lib/types"
import { formatCurrency, formatDuration } from "@/lib/utils/format"
import { usePreferencesStore, useCartStore, useAuthStore } from "@/lib/store"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("popular")
  const [categories, setCategories] = useState<Category[]>([])

  const { currency } = usePreferencesStore()
  const { addToCart, items } = useCartStore()
  const { user } = useAuthStore()
  const { toast } = useToast()

  const pillars = [
    {
      title: "The Foundation Pillar",
      icon: Map,
      description: "Essential skills for new caregivers and family members.",
    },
    {
      title: "The Clinical Pillar",
      icon: Layers,
      description: "Specialized medical support for complex conditions.",
    },
    {
      title: "The Leadership Pillar",
      icon: Flag,
      description: "Professional ethics and management for elite caregivers.",
    },
    {
      title: "The Family Pillar",
      icon: Heart,
      description: "Short, intensive modules for private individuals caring for loved ones.",
    },
  ]

  const levelGuides = [
    {
      title: "Level 1: Beginner Courses (The Foundation)",
      description:
        "Target: Aspiring caregivers with no prior experience and family members.",
      courses: [
        "Principles of Compassionate Care",
        "The Art of Personal Hygiene",
        "Safety & Infection Control",
        "Vitals & Observation",
        "Family Caregiver Essentials",
      ],
    },
    {
      title: "Level 2: Intermediate Courses (The Skilled Hand)",
      description:
        "Target: Caregivers with 1+ years of experience or those who have completed Level 1.",
      courses: [
        "Dementia & Alzheimer’s Mastery",
        "Mobility & Safe Transfers",
        "Nutritional Support & Feeding",
        "Geriatric Psychology",
        "Diabetes & Hypertension Management",
      ],
    },
    {
      title: "Level 3: Pro Courses (The Elite Professional)",
      description:
        "Target: Seasoned caregivers, nurses looking to specialize, or International Standard aspirants.",
      courses: [
        "Advanced Stroke Rehabilitation Support",
        "Palliative & End-of-Life Care",
        "Medication Safety & Management",
        "Care Team Leadership",
        "The Global Professional Certification",
      ],
    },
  ]

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const [coursesRes, categoriesRes] = await Promise.all([
          fetch("/api/courses"),
          fetch("/api/categories"),
        ])
        const data = await coursesRes.json()
        const categoriesData = await categoriesRes.json()
        const allCourses = data.courses || []
        setCourses(allCourses)
        setFilteredCourses(allCourses)
        setCategories(categoriesData.categories || [])
      } catch (error) {
        console.error("Failed to load courses:", error)
        setCourses([])
        setFilteredCourses([])
      }
    }
    loadCourses()
  }, [])

  useEffect(() => {
    let filtered = [...courses]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((course) => course.category === categoryFilter)
    }

    // Level filter
    if (levelFilter !== "all") {
      filtered = filtered.filter((course) => course.level === levelFilter)
    }

    // Sort
    if (sortBy === "popular") {
      filtered.sort((a, b) => b.enrollmentCount - a.enrollmentCount)
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === "price-low") {
      filtered.sort((a, b) => a.price[currency] - b.price[currency])
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.price[currency] - a.price[currency])
    }

    setFilteredCourses(filtered)
  }, [searchQuery, categoryFilter, levelFilter, sortBy, courses, currency])

  const handleAddToCart = (course: Course) => {
    // Check if already enrolled
    if (user && user.enrolledCourses.includes(course.id)) {
      toast({
        title: "Already Enrolled",
        description: "You are already enrolled in this course",
        variant: "destructive",
      })
      return
    }

    // Check if already in cart
    if (items.find((item) => item.courseId === course.id)) {
      toast({
        title: "Already in Cart",
        description: "This course is already in your cart",
      })
      return
    }

    addToCart({ courseId: course.id, course })
    toast({
      title: "Added to Cart",
      description: `${course.title} has been added to your cart`,
    })
  }

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Explore Our Courses</h1>
        <p className="text-xl text-muted-foreground">
          Discover {courses.length} courses to advance your career and achieve your goals
        </p>
      </div>

      {/* Navigation Guide */}
      <div className="mb-10 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Course Categories</h2>
            <p className="text-sm text-muted-foreground">
              To make the website easy to navigate, we group the curriculum into four main pillars.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {pillars.map((pillar) => {
                const Icon = pillar.icon
                return (
                  <div key={pillar.title} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <Icon className="h-4 w-4 text-primary" />
                      {pillar.title}
                    </div>
                    <p className="text-sm text-muted-foreground">{pillar.description}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xl font-semibold">Where to Start</h3>
            <p className="text-sm text-muted-foreground">
              If you are new to caregiving, begin with the Beginner Courses. Experienced caregivers should start at
              Intermediate, while professionals aiming for global standards should choose Pro Courses.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Beginner</span>
                <span className="text-muted-foreground">Foundation skills</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Intermediate</span>
                <span className="text-muted-foreground">Skilled hand</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Pro</span>
                <span className="text-muted-foreground">Elite professional</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-10 space-y-4">
        <h2 className="text-2xl font-semibold">Levels and What You Will Learn</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {levelGuides.map((level) => (
            <Card key={level.title}>
              <CardContent className="p-6 space-y-3">
                <div className="text-lg font-semibold">{level.title}</div>
                <p className="text-sm text-muted-foreground">{level.description}</p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  {level.courses.map((course) => (
                    <li key={course}>{course}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="grid md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          {/* Level */}
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Level" />
            </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Beginner Courses">Beginner Courses</SelectItem>
                <SelectItem value="Intermediate Courses">Intermediate Courses</SelectItem>
                <SelectItem value="Pro Courses">Pro Courses</SelectItem>
              </SelectContent>
            </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {filteredCourses.length} of {courses.length} courses
          </div>
          {(searchQuery || categoryFilter !== "all" || levelFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setCategoryFilter("all")
                setLevelFilter("all")
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No courses found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * index }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                <Link href={`/courses/${course.slug}`}>
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img
                      src={course.thumbnail || "/placeholder.svg"}
                      alt={course.title}
                      className="object-cover w-full h-full"
                    />
                    <Badge className="absolute top-4 left-4">{course.level}</Badge>
                  </div>
                </Link>
                <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                  <Link href={`/courses/${course.slug}`}>
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">
                        {course.category}
                      </Badge>
                      <h3 className="text-xl font-semibold mb-2 line-clamp-2 hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(course.totalDuration)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.enrollmentCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{course.rating}</span>
                    </div>
                    <div className="text-xl font-bold text-primary">
                      {formatCurrency(course.price[currency], currency)}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.preventDefault()
                      handleAddToCart(course)
                    }}
                    disabled={user?.enrolledCourses.includes(course.id)}
                  >
                    {user?.enrolledCourses.includes(course.id) ? "Enrolled" : "Add to Cart"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

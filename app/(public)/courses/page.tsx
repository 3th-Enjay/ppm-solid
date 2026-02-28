"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { FilterPanel } from "@/components/skillup/filter-panel"
import { CourseCard } from "@/components/skillup/course-card"
import { fadeUp } from "@/components/skillup/motion-presets"
import { useAuthStore, useCartStore, usePreferencesStore } from "@/lib/store"
import type { Category, Course } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("popular")

  const { currency } = usePreferencesStore()
  const { addToCart, items } = useCartStore()
  const { user } = useAuthStore()
  const { toast } = useToast()

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const [coursesRes, categoriesRes] = await Promise.all([fetch("/api/courses"), fetch("/api/categories")])
        const courseData = await coursesRes.json()
        const categoryData = await categoriesRes.json()
        const allCourses = courseData.courses || []

        setCourses(allCourses)
        setFilteredCourses(allCourses)
        setCategories(categoryData.categories || [])
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

    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((course) => course.category === categoryFilter)
    }

    if (levelFilter !== "all") {
      filtered = filtered.filter((course) => course.level === levelFilter)
    }

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

  const clearFilters = () => {
    setSearchQuery("")
    setCategoryFilter("all")
    setLevelFilter("all")
    setSortBy("popular")
  }

  const handleAddToCart = (course: Course) => {
    if (user && user.enrolledCourses.includes(course.id)) {
      toast({
        title: "Already Enrolled",
        description: "You are already enrolled in this course",
        variant: "destructive",
      })
      return
    }

    if (items.find((item) => item.courseId === course.id)) {
      toast({ title: "Already in Cart", description: "This course is already in your cart" })
      return
    }

    addToCart({ courseId: course.id, course })
    toast({ title: "Added to Cart", description: `${course.title} has been added to your cart` })
  }

  const hasActiveFilters = searchQuery.length > 0 || categoryFilter !== "all" || levelFilter !== "all" || sortBy !== "popular"

  return (
    <div className="container py-10 md:py-14">
      <motion.div variants={fadeUp()} initial="hidden" animate="visible" className="space-y-4">
        <Badge variant="info" className="rounded-full px-3 py-1">
          Course Catalog
        </Badge>
        <h1 className="text-4xl font-bold md:text-5xl">Explore Our Courses</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Discover {courses.length} courses to advance your caregiving career with guided, practical learning.
        </p>
      </motion.div>

      <div className="mt-8 flex items-center justify-between lg:hidden">
        <p className="text-sm text-muted-foreground">
          Showing {filteredCourses.length} of {courses.length}
        </p>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Course Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterPanel
                searchQuery={searchQuery}
                categoryFilter={categoryFilter}
                levelFilter={levelFilter}
                sortBy={sortBy}
                categories={categories}
                totalCourses={courses.length}
                shownCourses={filteredCourses.length}
                onSearchChange={setSearchQuery}
                onCategoryChange={setCategoryFilter}
                onLevelChange={setLevelFilter}
                onSortChange={setSortBy}
                onClear={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <FilterPanel
              searchQuery={searchQuery}
              categoryFilter={categoryFilter}
              levelFilter={levelFilter}
              sortBy={sortBy}
              categories={categories}
              totalCourses={courses.length}
              shownCourses={filteredCourses.length}
              onSearchChange={setSearchQuery}
              onCategoryChange={setCategoryFilter}
              onLevelChange={setLevelFilter}
              onSortChange={setSortBy}
              onClear={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </aside>

        <main className="space-y-5">
          <div className="hidden items-center justify-between rounded-xl border border-border/80 bg-card/70 px-4 py-3 text-sm text-muted-foreground lg:flex">
            <span>
              Showing {filteredCourses.length} of {courses.length} courses
            </span>
            {hasActiveFilters ? (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : null}
          </div>

          {filteredCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/60 px-6 py-16 text-center">
              <h3 className="text-xl font-semibold">No courses found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filter selections.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  variants={fadeUp(Math.min(index * 0.03, 0.18))}
                  initial="hidden"
                  animate="visible"
                >
                  <CourseCard
                    course={course}
                    currency={currency}
                    showCartAction
                    isEnrolled={Boolean(user?.enrolledCourses.includes(course.id))}
                    onAddToCart={handleAddToCart}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}


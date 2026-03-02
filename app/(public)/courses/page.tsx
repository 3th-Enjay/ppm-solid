"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AuthGateModal } from "@/components/skillup/auth-gate-modal"
import { CourseCard } from "@/components/skillup/course-card"
import { FilterPanel } from "@/components/skillup/filter-panel"
import { SectionShell } from "@/components/skillup/section-shell"
import { useToast } from "@/hooks/use-toast"
import { usePurchaseGuard } from "@/hooks/use-purchase-guard"
import { fadeUp, floating, maskReveal, sectionStagger, useReducedMotionSafe } from "@/lib/motion"
import { useAuthStore, useCartStore, usePreferencesStore } from "@/lib/store"
import type { Category, Course } from "@/lib/types"

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("popular")
  const shouldReduceMotion = useReducedMotionSafe()

  const { currency } = usePreferencesStore()
  const { addToCart, items } = useCartStore()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const { isAuthGateOpen, setIsAuthGateOpen, loginHref, registerHref, requirePurchaseAuth, consumeStoredIntent } =
    usePurchaseGuard()
  const restoredIntentRef = useRef(false)

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const [coursesRes, categoriesRes] = await Promise.all([fetch("/api/courses"), fetch("/api/categories")])
        const courseData = await coursesRes.json()
        const categoryData = await categoriesRes.json()
        const allCourses = (courseData.courses || []) as Course[]

        setCourses(allCourses)
        setFilteredCourses(allCourses)
        setCategories(categoryData.categories || [])
      } catch {
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

  useEffect(() => {
    if (!user || restoredIntentRef.current) return
    const pending = consumeStoredIntent()
    if (!pending) return

    const matchedCourse = courses.find((course) => course.id === pending.courseId || course.slug === pending.courseSlug)
    if (!matchedCourse) return

    restoredIntentRef.current = true

    if (!items.find((item) => item.courseId === matchedCourse.id)) {
      addToCart({ courseId: matchedCourse.id, course: matchedCourse })
    }
    toast({
      title: "Enrollment resumed",
      description:
        pending.action === "buy_now"
          ? "We added the course to your cart. Continue checkout."
          : "Course added to cart successfully.",
    })
  }, [user, courses, items, addToCart, consumeStoredIntent, toast])

  const clearFilters = () => {
    setSearchQuery("")
    setCategoryFilter("all")
    setLevelFilter("all")
    setSortBy("popular")
  }

  const handleAddToCart = (course: Course) => {
    if (user && user.enrolledCourses.includes(course.id)) {
      toast({
        title: "Already enrolled",
        description: "You are already enrolled in this course.",
        variant: "destructive",
      })
      return
    }

    if (items.find((item) => item.courseId === course.id)) {
      toast({ title: "Already in cart", description: "This course is already in your cart." })
      return
    }

    addToCart({ courseId: course.id, course })
    toast({ title: "Added to cart", description: `${course.title} has been added to your cart.` })
  }

  const handleGuardedAddToCart = (course: Course) => {
    requirePurchaseAuth(
      { action: "add_to_cart", courseId: course.id, courseSlug: course.slug },
      () => handleAddToCart(course),
    )
  }

  const hasActiveFilters = searchQuery.length > 0 || categoryFilter !== "all" || levelFilter !== "all" || sortBy !== "popular"

  const quickCategories = useMemo(() => categories.slice(0, 5), [categories])

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = []

    if (searchQuery) {
      chips.push({ key: "search", label: `Search: ${searchQuery}`, onRemove: () => setSearchQuery("") })
    }
    if (categoryFilter !== "all") {
      chips.push({ key: "category", label: `Category: ${categoryFilter}`, onRemove: () => setCategoryFilter("all") })
    }
    if (levelFilter !== "all") {
      chips.push({ key: "level", label: `Level: ${levelFilter}`, onRemove: () => setLevelFilter("all") })
    }
    if (sortBy !== "popular") {
      const sortMap: Record<string, string> = {
        rating: "Highest Rated",
        "price-low": "Price: Low to High",
        "price-high": "Price: High to Low",
      }
      chips.push({ key: "sort", label: `Sort: ${sortMap[sortBy] || sortBy}`, onRemove: () => setSortBy("popular") })
    }
    return chips
  }, [searchQuery, categoryFilter, levelFilter, sortBy])

  return (
    <div className="pb-12">
      <SectionShell variant="immersive" hasParallax hasFloatingAccent backgroundType="gradient" className="pb-14">
        <motion.div variants={sectionStagger} initial="initial" animate="animate" className="max-w-4xl space-y-6">
          <Badge variant="info" className="w-fit rounded-full px-4 py-1">
            Course Discovery
          </Badge>

          <div className="space-y-2">
            <div className="overflow-hidden">
              <motion.h1 variants={maskReveal} className="text-4xl font-bold leading-tight md:text-5xl">
                Build Your Career in <span className="text-primary">Healthcare</span>
              </motion.h1>
            </div>
            <motion.p variants={fadeUp} className="max-w-2xl text-base text-muted-foreground md:text-lg">
              Discover accredited training built for real caregiving outcomes and long-term career growth.
            </motion.p>
          </div>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-2 text-xs md:text-sm">
            <span className="rounded-full border border-border/70 bg-card/80 px-3 py-1">Accredited training</span>
            <span className="rounded-full border border-border/70 bg-card/80 px-3 py-1">Industry-certified instructors</span>
            <span className="rounded-full border border-border/70 bg-card/80 px-3 py-1">Career support included</span>
          </motion.div>

          <motion.div variants={fadeUp} className="max-w-2xl space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search courses by title or topic"
                className="h-11 rounded-2xl border-border/70 bg-card/80 pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={categoryFilter === "all" ? "cta" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setCategoryFilter("all")}
              >
                All
              </Button>
              {quickCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={categoryFilter === category.name ? "cta" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setCategoryFilter(category.name)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </motion.div>
        </motion.div>
        <motion.div
          variants={shouldReduceMotion ? undefined : floating}
          animate={shouldReduceMotion ? undefined : "animate"}
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 top-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        />
      </SectionShell>

      <div className="container mt-8 space-y-6">
        <div className="flex items-center justify-between lg:hidden">
          <p className="text-sm text-muted-foreground">Showing {filteredCourses.length} programs</p>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-full overflow-y-auto border-border/70 bg-background/95 p-0 backdrop-blur-md">
              <SheetHeader className="border-b border-border/70 px-5 py-4">
                <SheetTitle>Course Filters</SheetTitle>
              </SheetHeader>
              <div className="p-5">
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

        {activeFilterChips.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <motion.div key={chip.key} variants={fadeUp} initial="initial" animate="animate">
                <Badge className="gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-foreground">
                  {chip.label}
                  <button
                    type="button"
                    className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                    onClick={chip.onRemove}
                    aria-label={`Remove ${chip.label} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
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
            <div className="hidden items-center justify-between rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-sm text-muted-foreground lg:flex">
              <span>Showing {filteredCourses.length} programs</span>
              {hasActiveFilters ? (
                <Button size="sm" variant="ghost" onClick={clearFilters}>
                  Clear all filters
                </Button>
              ) : null}
            </div>

            {filteredCourses.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/80 bg-card/60 px-6 py-16 text-center">
                <h3 className="text-xl font-semibold">No courses found</h3>
                <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    variants={fadeUp}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(index * 0.04, 0.2) }}
                  >
                    <CourseCard
                      course={course}
                      currency={currency}
                      showCartAction
                      isEnrolled={Boolean(user?.enrolledCourses.includes(course.id))}
                      onAddToCart={handleGuardedAddToCart}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <AuthGateModal
        open={isAuthGateOpen}
        onOpenChange={setIsAuthGateOpen}
        loginHref={loginHref}
        registerHref={registerHref}
      />
    </div>
  )
}

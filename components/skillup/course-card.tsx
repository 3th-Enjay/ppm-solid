"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Clock, Star, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { hoverLift } from "@/lib/motion"
import type { Course, Currency } from "@/lib/types"
import { formatCurrency, formatDuration } from "@/lib/utils/format"

interface CourseCardProps {
  course: Course
  currency: Currency
  showCartAction?: boolean
  isEnrolled?: boolean
  onAddToCart?: (course: Course) => void
}

export function CourseCard({
  course,
  currency,
  showCartAction = false,
  isEnrolled = false,
  onAddToCart,
}: CourseCardProps) {
  return (
    <motion.div {...hoverLift()}>
      <Card
        variant="elevated"
        interactive
        className="group h-full overflow-hidden rounded-3xl border-border/70 bg-card/80 transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
      >
      <Link href={`/courses/${course.slug}`}>
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={course.thumbnail || "/placeholder.svg"}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-black/15" />
          <Badge variant="outline" className="absolute left-4 top-4 border-white/40 bg-black/45 text-white backdrop-blur-sm">
            {course.category}
          </Badge>
          <Badge variant="level" className="absolute right-4 top-4">
            {course.level}
          </Badge>
          <Badge
            variant="outline"
            className="absolute bottom-4 left-4 border-white/40 bg-black/45 text-white backdrop-blur-sm"
          >
            <Clock className="mr-1 h-3.5 w-3.5" />
            {formatDuration(course.totalDuration)}
          </Badge>
        </div>
      </Link>
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <Link href={`/courses/${course.slug}`} className="space-y-2">
          <h3 className="line-clamp-2 text-lg font-semibold transition-colors duration-200 group-hover:text-primary">
            {course.title}
          </h3>
          <p className="line-clamp-1 text-sm text-muted-foreground">{course.description}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <img
              src={course.instructorAvatar || "/placeholder.svg"}
              alt={course.instructorName || "Instructor"}
              className="h-5 w-5 rounded-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <span className="line-clamp-1">
              {course.instructorName || "Instructor"}
              {course.instructorHeadline ? ` - ${course.instructorHeadline}` : ""}
            </span>
          </div>
        </Link>

        <div className="mt-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">{course.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{course.enrollmentCount}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-lg font-bold text-primary">{formatCurrency(course.price[currency], currency)}</p>
            <p className="text-xs text-muted-foreground">Lifetime access</p>
          </div>

          {showCartAction && onAddToCart ? (
            <Button
              variant={isEnrolled ? "outline" : "cta"}
              className="w-full"
              disabled={isEnrolled}
              onClick={(e) => {
                e.preventDefault()
                onAddToCart(course)
              }}
            >
              {isEnrolled ? "Enrolled" : "Add to Cart"}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
    </motion.div>
  )
}

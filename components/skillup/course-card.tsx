"use client"

import Link from "next/link"
import { Clock, Star, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
    <Card variant="elevated" interactive className="h-full overflow-hidden">
      <Link href={`/courses/${course.slug}`}>
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={course.thumbnail || "/placeholder.svg"}
            alt={course.title}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <Badge variant="level" className="absolute left-4 top-4">
            {course.level}
          </Badge>
        </div>
      </Link>
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <Link href={`/courses/${course.slug}`} className="space-y-2">
          <Badge variant="outline">{course.category}</Badge>
          <h3 className="line-clamp-2 text-lg font-semibold transition-colors hover:text-primary">{course.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
        </Link>

        <div className="mt-auto space-y-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(course.totalDuration)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.enrollmentCount}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{course.rating}</span>
            </div>
            <div className="text-lg font-bold text-primary">{formatCurrency(course.price[currency], currency)}</div>
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
  )
}

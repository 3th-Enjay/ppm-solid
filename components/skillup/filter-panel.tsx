"use client"

import { Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { Category } from "@/lib/types"

interface FilterPanelProps {
  searchQuery: string
  categoryFilter: string
  levelFilter: string
  sortBy: string
  categories: Category[]
  totalCourses: number
  shownCourses: number
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onLevelChange: (value: string) => void
  onSortChange: (value: string) => void
  onClear: () => void
  hasActiveFilters: boolean
}

export function FilterPanel({
  searchQuery,
  categoryFilter,
  levelFilter,
  sortBy,
  categories,
  totalCourses,
  shownCourses,
  onSearchChange,
  onCategoryChange,
  onLevelChange,
  onSortChange,
  onClear,
  hasActiveFilters,
}: FilterPanelProps) {
  return (
    <Card variant="elevated" className="py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base">Filter Courses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Category</label>
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Level</label>
          <Select value={levelFilter} onValueChange={onLevelChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Beginner Courses">Beginner Courses</SelectItem>
              <SelectItem value="Intermediate Courses">Intermediate Courses</SelectItem>
              <SelectItem value="Pro Courses">Pro Courses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Sort By</label>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger>
              <SelectValue placeholder="Most Popular" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground">
          Showing {shownCourses} of {totalCourses} courses
        </div>

        {hasActiveFilters ? (
          <Button variant="outline" className="w-full" onClick={onClear}>
            Clear Filters
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

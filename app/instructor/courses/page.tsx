"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, BookOpen, Settings } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { Course } from "@/lib/types"

export default function InstructorCoursesPage() {
  const { user, token } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const res = await fetch(`/api/courses?instructorId=${user.id}&includeDrafts=true`, {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        })
        const data = await res.json()
        setCourses(data.courses || [])
      } catch (error) {
        console.error("Failed to load courses:", error)
        setCourses([])
      }
    }
    load()
  }, [user])

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground mt-2">Create, edit, and manage your course content</p>
        </div>
        <Button asChild>
          <Link href="/instructor/courses/new">
            <Plus className="h-4 w-4 mr-2" />
            New Course
          </Link>
        </Button>
      </div>

      {courses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  <Badge variant={course.published ? "default" : "secondary"}>
                    {course.published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/courses/${course.slug}`}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      View
                    </Link>
                  </Button>
                  <Button size="sm" asChild className="flex-1">
                    <Link href={`/instructor/courses/${course.id}/content`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Content
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/instructor/courses/${course.id}/edit`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-4">Create your first course to start building content.</p>
            <Button asChild>
              <Link href="/instructor/courses/new">Create Course</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { type NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { getDB } from "@/lib/db"
import { courseCreateSchema } from "@/lib/validation"
import { authService } from "@/lib/auth"
import { maskCourseForUser } from "@/lib/utils/course-masking"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const level = searchParams.get("level")
    const search = searchParams.get("search")
    const instructorId = searchParams.get("instructorId")
    const includeDrafts = searchParams.get("includeDrafts") === "true"

    const db = getDB()
    let courses: any[] = []
    if (instructorId) {
      courses = await db.getCoursesByInstructor(instructorId)
    } else if (includeDrafts && typeof db.getAllCoursesIncludingDrafts === "function") {
      courses = await db.getAllCoursesIncludingDrafts()
    } else {
      courses = await db.getAllCourses()
    }

    // Filter by published and approved status
    courses = courses.filter((c: any) => c.published && (c.approved !== false))

    if (!includeDrafts) {
      courses = courses.filter((c: any) => c.published)
    }

    if (category && category !== "all") {
      courses = courses.filter((c: any) => c.category.toLowerCase() === category.toLowerCase())
    }

    if (level && level !== "all") {
      courses = courses.filter((c: any) => c.level.toLowerCase() === level.toLowerCase())
    }

    if (search) {
      const query = search.toLowerCase()
      courses = courses.filter(
        (c: any) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query),
      )
    }

    // Mask video URLs for unauthenticated/non-privileged users
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    let user = null
    if (token) {
      user = await authService.getCurrentUser(token)
    }

    const safeCourses = courses.map((c: any) => maskCourseForUser(c, user))

    return NextResponse.json({ courses: safeCourses })
  } catch (error) {
    console.error("Get courses error:", error)
    return NextResponse.json({ error: "Failed to get courses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = courseCreateSchema.parse(body)

    const db = getDB()

    // Generate slug from title
    const slug = validated.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Check if slug already exists
    const existingCourse = await db.getCourseBySlug(slug)
    if (existingCourse) {
      return NextResponse.json(
        { error: "A course with this title already exists" },
        { status: 409 }
      )
    }

    // Create course (approved defaults to false, only admin can approve)
    const course = await db.createCourse({
      ...validated,
      slug,
      thumbnail: validated.thumbnail || "/placeholder.jpg",
      published: validated.published ?? false,
      approved: validated.approved ?? false,
      modules: validated.modules ?? [],
      totalDuration: validated.totalDuration ?? 0,
      enrollmentCount: validated.enrollmentCount ?? 0,
      rating: validated.rating ?? 0,
    })

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Create course error:", error)
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 })
  }
}

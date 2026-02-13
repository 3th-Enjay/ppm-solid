import { type NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { authService } from "@/lib/auth"
import { categoryUpdateSchema } from "@/lib/validation"
import { ZodError } from "zod"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const tokenHeader = request.headers.get("authorization")
    const token = tokenHeader?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const user = await authService.getCurrentUser(token)
    if (!user || (user.role !== "admin" && user.role !== "instructor")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validated = categoryUpdateSchema.parse(body)
    const db = getDB()
    const existing = (await db.getCategories()).find(
      (c: any) => c.name.toLowerCase() === validated.name.toLowerCase() && c.id !== id
    )
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 })
    }

    const updated = await db.updateCategory(id, validated.name.trim())
    if (!updated) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }
    return NextResponse.json({ category: updated })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Update category error:", error)
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

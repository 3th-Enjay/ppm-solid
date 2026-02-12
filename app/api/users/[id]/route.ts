import { type NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { userUpdateSchema } from "@/lib/validation"
import { ZodError } from "zod"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = userUpdateSchema.parse(body)

    const db = getDB()
    const updated = await db.updateUser(id, validated)

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { password: _, ...safeUser } = updated
    return NextResponse.json({ user: safeUser })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

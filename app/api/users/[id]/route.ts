import { type NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { userUpdateSchema } from "@/lib/validation"
import { ZodError } from "zod"
import { getTokenFromRequest } from "@/lib/jwt"
import { authService } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = authService.decodeToken(token)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = userUpdateSchema.parse(body)
    const isAdmin = session.role === "admin"
    const isSelf = session.userId === id

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!isAdmin && validated.status) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = authService.decodeToken(token)
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = getDB()
    const user = await db.findUserById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Only unverified users can be deleted" }, { status: 400 })
    }

    const deleted = await db.deleteUser(id)
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

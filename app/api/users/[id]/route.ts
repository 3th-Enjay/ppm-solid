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

    // Check if the current user is the env admin account
    const ADMIN_ACCOUNTS_EMAIL = (process.env.ADMIN_ACCOUNTS_EMAIL || process.env.BOOTSTRAP_ADMIN_EMAIL)?.trim().toLowerCase()
    const currentUserEmail = session.email?.toLowerCase()
    
    if (!ADMIN_ACCOUNTS_EMAIL || currentUserEmail !== ADMIN_ACCOUNTS_EMAIL) {
      return NextResponse.json({ 
        error: "Only the primary admin account can delete users" 
      }, { status: 403 })
    }

    const db = getDB()
    const user = await db.findUserById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent deleting the env admin account itself
    if (user.email.toLowerCase() === ADMIN_ACCOUNTS_EMAIL) {
      return NextResponse.json({ 
        error: "Cannot delete the primary admin account" 
      }, { status: 400 })
    }

    // Allow deleting: instructors, finance, other admins, and unverified users
    const canDelete = 
      user.role === "instructor" || 
      user.role === "finance" || 
      user.role === "admin" || 
      !user.emailVerified

    if (!canDelete) {
      return NextResponse.json({ 
        error: "Only instructors, finance users, admins, and unverified users can be deleted" 
      }, { status: 400 })
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

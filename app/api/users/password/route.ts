import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { getDB } from "@/lib/db"
import { passwordChangeSchema } from "@/lib/validation"
import { getTokenFromRequest } from "@/lib/jwt"
import { ZodError } from "zod"

export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = authService.decodeToken(token)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = passwordChangeSchema.parse(body)

    const updated = await authService.updatePassword(
      session.userId,
      validated.currentPassword,
      validated.newPassword
    )

    if (!updated) {
      return NextResponse.json({ error: "Invalid current password" }, { status: 400 })
    }

    const db = getDB()
    const actor = await db.findUserById(session.userId)
    if (actor && (actor.role === "admin" || actor.role === "finance")) {
      await db.createAdminLog({
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        action: "update_password",
        targetUserId: actor.id,
        targetName: actor.name,
        targetEmail: actor.email,
        targetRole: actor.role,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
  }
}

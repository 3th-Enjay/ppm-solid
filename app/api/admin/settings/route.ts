import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"
import { adminSettingsSchema } from "@/lib/validation"
import { getAdminSettings, updateAdminSettings } from "@/lib/admin-settings"
import { ZodError } from "zod"

function ensureAdmin(request: Request) {
  const token = getTokenFromRequest(request)
  if (!token) return null
  const session = authService.decodeToken(token)
  if (!session || session.role !== "admin") return null
  return session
}

export async function GET(request: Request) {
  try {
    const session = ensureAdmin(request)
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const settings = await getAdminSettings()
    return NextResponse.json({ settings })
  } catch {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = ensureAdmin(request)
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validated = adminSettingsSchema.parse(body)
    const settings = await updateAdminSettings(validated)
    return NextResponse.json({ settings })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}

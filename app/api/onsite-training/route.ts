import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"
import { getOnsiteTrainingConfig, updateOnsiteTrainingConfig } from "@/lib/onsite-training-config"
import { onsiteTrainingConfigSchema } from "@/lib/onsite-training-shared"

function ensureAdmin(request: Request) {
  const token = getTokenFromRequest(request)
  if (!token) return null
  const session = authService.decodeToken(token)
  if (!session || session.role !== "admin") return null
  return session
}

export async function GET() {
  try {
    const config = await getOnsiteTrainingConfig()
    return NextResponse.json({ config })
  } catch {
    return NextResponse.json({ error: "Failed to load onsite training settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = ensureAdmin(request)
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validated = onsiteTrainingConfigSchema.parse(body)
    const config = await updateOnsiteTrainingConfig(validated)
    return NextResponse.json({ config })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to save onsite training settings" }, { status: 500 })
  }
}

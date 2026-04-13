import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"
import { campaignConfigSchema } from "@/lib/campaign-shared"
import { getCampaignConfig, updateCampaignConfig } from "@/lib/campaign-config"

function ensureAdmin(request: Request) {
  const token = getTokenFromRequest(request)
  if (!token) return null
  const session = authService.decodeToken(token)
  if (!session || session.role !== "admin") return null
  return session
}

export async function GET() {
  try {
    const config = await getCampaignConfig()
    return NextResponse.json({ config, serverNow: Date.now() })
  } catch {
    return NextResponse.json({ error: "Failed to load campaign settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = ensureAdmin(request)
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validated = campaignConfigSchema.parse(body)
    const config = await updateCampaignConfig(validated)
    return NextResponse.json({ config, serverNow: Date.now() })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to save campaign settings" }, { status: 500 })
  }
}

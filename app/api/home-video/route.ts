import { NextResponse } from "next/server"
import { getAdminSettings } from "@/lib/admin-settings"

export async function GET() {
  try {
    const settings = await getAdminSettings()
    return NextResponse.json({ homeIntroVideoUrl: settings.homeIntroVideoUrl || "" })
  } catch (error) {
    console.error("GET /api/home-video failed:", error)
    return NextResponse.json({ error: "Failed to load homepage video" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { z } from "zod"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"
import { initializeAuthenticatedOnsiteCheckout, onsiteDashboardInitSchema } from "@/lib/onsite-checkout"

export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json(
        {
          error: "Onsite training payment now starts inside your student dashboard. Sign in and continue from /dashboard/onsite-training.",
        },
        { status: 401 },
      )
    }

    const user = await authService.getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = onsiteDashboardInitSchema.parse(body)
    const result = await initializeAuthenticatedOnsiteCheckout(user, validated)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (error instanceof Error && (error as any).statusCode) {
      return NextResponse.json({ error: error.message }, { status: (error as any).statusCode })
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Failed to initialize onsite payment" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { z } from "zod"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"
import { getRecordedOnboardingEvents, recordOnboardingEvent } from "@/lib/onboarding-event-log"
import type { UserRole } from "@/lib/types"

const onboardingEventSchema = z.object({
  name: z.string().min(1),
  role: z.enum(["student", "instructor", "admin", "finance"]).optional(),
  mode: z.string().optional(),
  source: z.string().optional(),
  step: z.string().optional(),
  stepIndex: z.number().int().optional(),
  status: z.string().optional(),
  reference: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = onboardingEventSchema.parse(body)
    await recordOnboardingEvent({
      name: validated.name,
      role: validated.role as UserRole | undefined,
      mode: validated.mode,
      source: validated.source,
      step: validated.step,
      stepIndex: validated.stepIndex,
      status: validated.status,
      reference: validated.reference,
      metadata: validated.metadata,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to record onboarding event" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const token = getTokenFromRequest(request)
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await authService.getCurrentUser(token)
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const events = await getRecordedOnboardingEvents(500)
  return NextResponse.json({ events })
}

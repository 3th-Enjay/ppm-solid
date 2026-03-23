import { NextResponse } from "next/server"
import { z } from "zod"
import { authService } from "@/lib/auth"
import { getDB } from "@/lib/db"
import { getTokenFromRequest } from "@/lib/jwt"
import { resolveOnboardingState } from "@/lib/onboarding-state"

const onboardingStatePatchSchema = z.object({
  markWelcomeSeen: z.boolean().optional(),
  dismissOnsiteBanner: z.boolean().optional(),
  markOnsiteViewed: z.boolean().optional(),
  markOnsiteCheckoutStarted: z.boolean().optional(),
  markPublishingGuidelinesReviewed: z.boolean().optional(),
})

async function getAuthenticatedUser(request: Request) {
  const token = getTokenFromRequest(request)
  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const user = await authService.getCurrentUser(token)
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  return { user, token }
}

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser(request)
  if ("error" in auth) {
    return auth.error
  }

  const db = getDB()
  const state = await resolveOnboardingState(db, auth.user)
  return NextResponse.json(state)
}

export async function PATCH(request: Request) {
  const auth = await getAuthenticatedUser(request)
  if ("error" in auth) {
    return auth.error
  }

  try {
    const body = await request.json()
    const validated = onboardingStatePatchSchema.parse(body)
    const now = new Date()
    const existing = auth.user.onboardingState || {}

    const nextState = {
      ...existing,
      ...(validated.markWelcomeSeen ? { welcomeSeenAt: existing.welcomeSeenAt || now } : {}),
      ...(validated.dismissOnsiteBanner ? { dismissedOnsiteBannerAt: now } : {}),
      ...(validated.markOnsiteViewed ? { viewedOnsiteTrainingAt: existing.viewedOnsiteTrainingAt || now } : {}),
      ...(validated.markOnsiteCheckoutStarted ? { startedOnsiteCheckoutAt: existing.startedOnsiteCheckoutAt || now } : {}),
      ...(validated.markPublishingGuidelinesReviewed
        ? { reviewedPublishingGuidelinesAt: existing.reviewedPublishingGuidelinesAt || now }
        : {}),
      updatedAt: now,
    }

    const db = getDB()
    const updatedUser = await db.updateUser(auth.user.id, { onboardingState: nextState })
    if (!updatedUser) {
      return NextResponse.json({ error: "Unable to update onboarding state" }, { status: 500 })
    }

    const state = await resolveOnboardingState(db, updatedUser)
    return NextResponse.json(state)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Unable to update onboarding state" }, { status: 500 })
  }
}

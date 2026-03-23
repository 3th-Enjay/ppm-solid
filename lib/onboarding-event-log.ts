import { getDB } from "@/lib/db"
import type { OnboardingEvent, UserRole } from "@/lib/types"

type OnboardingEventInput = Omit<OnboardingEvent, "id" | "createdAt"> & {
  role?: UserRole
}

export async function recordOnboardingEvent(event: OnboardingEventInput) {
  try {
    const db = getDB() as any
    if (typeof db.createOnboardingEvent !== "function") {
      return null
    }

    return await db.createOnboardingEvent({
      ...event,
      metadata: event.metadata || undefined,
    })
  } catch (error) {
    console.error("Failed to record onboarding event:", error)
    return null
  }
}

export async function getRecordedOnboardingEvents(limit = 500) {
  const db = getDB() as any
  if (typeof db.getOnboardingEvents !== "function") {
    return [] as OnboardingEvent[]
  }
  return (await db.getOnboardingEvents(limit)) as OnboardingEvent[]
}

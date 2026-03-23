"use client"

import { track } from "@vercel/analytics"
import { getOnboardingFeatureFlags } from "@/lib/onboarding-flow"

type OnboardingAnalyticsValue = string | number | boolean | null | undefined

type OnboardingAnalyticsPayload = Record<string, OnboardingAnalyticsValue>

function sanitizePayload(payload: OnboardingAnalyticsPayload): Record<string, string | number | boolean | null> {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Record<
    string,
    string | number | boolean | null
  >
}

export function trackOnboardingEvent(name: string, payload: OnboardingAnalyticsPayload = {}): void {
  if (typeof window === "undefined") {
    return
  }

  if (!getOnboardingFeatureFlags().onboardingAnalytics) {
    return
  }

  try {
    track(name, sanitizePayload(payload))
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to track onboarding event", name, error)
    }
  }
}
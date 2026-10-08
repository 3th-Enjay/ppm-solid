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

function persistOnboardingEvent(name: string, payload: Record<string, string | number | boolean | null>) {
  if (typeof window === "undefined") {
    return
  }

  try {
    const body = JSON.stringify({ name, ...payload })
    fetch("/api/onboarding/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    // no-op
  }
}

export function trackOnboardingEvent(name: string, payload: OnboardingAnalyticsPayload = {}): void {
  if (typeof window === "undefined") {
    return
  }

  if (!getOnboardingFeatureFlags().onboardingAnalytics) {
    return
  }

  const sanitized = sanitizePayload(payload)

  try {
    track(name, sanitized)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to track onboarding event", name, error)
    }
  }

  persistOnboardingEvent(name, sanitized)
}

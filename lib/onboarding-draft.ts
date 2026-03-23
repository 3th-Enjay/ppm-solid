export type OnboardingDraft<T> = {
  data: T
  step: number
  updatedAt: number
}

const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000

function hasWindow(): boolean {
  return typeof window !== "undefined"
}

export function loadOnboardingDraft<T>(key: string, maxAgeMs: number = DEFAULT_MAX_AGE_MS): OnboardingDraft<T> | null {
  if (!hasWindow()) return null

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw) as OnboardingDraft<T>
    if (!parsed || typeof parsed !== "object") {
      return null
    }

    if (typeof parsed.updatedAt !== "number" || Date.now() - parsed.updatedAt > maxAgeMs) {
      window.localStorage.removeItem(key)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function saveOnboardingDraft<T>(key: string, data: T, step: number): void {
  if (!hasWindow()) return

  try {
    const payload: OnboardingDraft<T> = {
      data,
      step,
      updatedAt: Date.now(),
    }
    window.localStorage.setItem(key, JSON.stringify(payload))
  } catch {
    // no-op
  }
}

export function clearOnboardingDraft(key: string): void {
  if (!hasWindow()) return

  try {
    window.localStorage.removeItem(key)
  } catch {
    // no-op
  }
}

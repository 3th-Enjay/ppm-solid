export type ProfileTab = "training" | "general" | "security"
export type ProfileRouteSuccess = "setup-complete" | "profile-saved" | "password-updated"
export type ProfileRouteState = {
  tab?: ProfileTab | null
  highlight?: string | null
  success?: ProfileRouteSuccess | null
  setup?: "complete" | null
  updated?: string | null
}

const PROFILE_ROUTE_KEYS: (keyof ProfileRouteState)[] = ["tab", "highlight", "success", "setup", "updated"]

export function parseProfileRouteState(searchParams: URLSearchParams): ProfileRouteState {
  const success = searchParams.get("success")
  const normalizedSuccess = success === "setup-complete" || success === "profile-saved" || success === "password-updated" ? (success as ProfileRouteSuccess) : null
  return {
    tab: (searchParams.get("tab") as ProfileTab) || null,
    highlight: searchParams.get("highlight") || null,
    success: normalizedSuccess,
    setup: searchParams.get("setup") === "complete" ? "complete" : null,
    updated: searchParams.get("updated") || null,
  }
}

export function buildProfileRouteQuery(base?: URLSearchParams, overrides?: Partial<ProfileRouteState>): string {
  const params = new URLSearchParams(base?.toString() || "")
  if (!overrides) {
    return params.toString()
  }

  PROFILE_ROUTE_KEYS.forEach((key) => {
    const value = overrides[key]
    if (value === undefined || value === null) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
  })

  return params.toString()
}
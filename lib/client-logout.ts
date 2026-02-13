export async function clientLogout() {
  try {
    // Best-effort: clear the httpOnly auth cookie.
    await fetch("/api/auth/logout", { method: "POST" })
  } catch {
    // Ignore network errors; local state will still be cleared by caller.
  }
}

export function makeLogoutGuard() {
  let loggingOut = false
  return {
    isLoggingOut: () => loggingOut,
    start: () => {
      loggingOut = true
    },
  }
}

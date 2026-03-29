"use client"

import { useEffect, useRef } from "react"
import { useAuthStore } from "@/lib/store"

export function AuthSessionBootstrap() {
  const { hydrated, user, token, setAuth } = useAuthStore()
  const attemptedRef = useRef(false)

  useEffect(() => {
    if (!hydrated) return
    if (user && token) return
    if (attemptedRef.current) return

    attemptedRef.current = true

    const restoreSession = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        })

        if (!res.ok) {
          return
        }

        const data = await res.json()
        if (!data?.user || !data?.token) {
          return
        }

        setAuth(data.user, data.token)
      } catch {
        // Best-effort bootstrap only.
      }
    }

    void restoreSession()
  }, [hydrated, setAuth, token, user])

  return null
}

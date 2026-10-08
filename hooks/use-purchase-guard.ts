"use client"

import { useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/store"

export type PurchaseIntentAction = "add_to_cart" | "buy_now"

export interface PurchaseIntent {
  action: PurchaseIntentAction
  courseId: string
  courseSlug: string
}

const PURCHASE_INTENT_KEY = "pending-purchase-intent"

function getStoredIntent() {
  if (typeof window === "undefined") return null
  const raw = window.sessionStorage.getItem(PURCHASE_INTENT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PurchaseIntent
  } catch {
    return null
  }
}

export function usePurchaseGuard() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuthStore()
  const [isAuthGateOpen, setIsAuthGateOpen] = useState(false)

  const redirectParam = useMemo(() => {
    const query = searchParams?.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParams])

  const loginHref = `/login?redirect=${encodeURIComponent(redirectParam)}`
  const registerHref = `/register?redirect=${encodeURIComponent(redirectParam)}`

  const requirePurchaseAuth = (intent: PurchaseIntent, onAuthorized: () => void) => {
    if (isAuthenticated()) {
      onAuthorized()
      return true
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(PURCHASE_INTENT_KEY, JSON.stringify(intent))
    }
    setIsAuthGateOpen(true)
    return false
  }

  const consumeStoredIntent = () => {
    const intent = getStoredIntent()
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(PURCHASE_INTENT_KEY)
    }
    return intent
  }

  return {
    isAuthGateOpen,
    setIsAuthGateOpen,
    loginHref,
    registerHref,
    requirePurchaseAuth,
    consumeStoredIntent,
  }
}


"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuthStore } from "@/lib/store"

export function OnsiteTrainingBanner() {
  const { user, token } = useAuthStore()
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  const isOnsitePaid = Boolean(user?.studentProfile?.paymentStatus === "yes")
  const isStudent = user?.role === "student"

  useEffect(() => {
    if (!isStudent || !token || isOnsitePaid) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const res = await fetch("/api/onboarding/state", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        setDismissed(Boolean(data?.onboardingState?.dismissedOnsiteBannerAt))
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [isOnsitePaid, isStudent, token])

  const handleDismiss = async () => {
    setDismissed(true)
    try {
      await fetch("/api/onboarding/state", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ dismissOnsiteBanner: true }),
      })
    } catch {
      // no-op
    }
  }

  if (!isStudent || isOnsitePaid || loading || dismissed) {
    return null
  }

  return (
    <Card variant="elevated" className="border-primary/20 bg-gradient-to-r from-primary/10 via-background to-accent/10">
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Onsite Training</p>
          <h2 className="text-xl font-semibold">
            Register for <span className="underline underline-offset-4">onsite training</span> now
          </h2>
          <p className="text-sm text-muted-foreground">
            Upgrade from your dashboard, pay securely with Paystack, and unlock full onsite access.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <Button asChild variant="cta">
            <Link href="/dashboard/onsite-training">View onsite training</Link>
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={handleDismiss} aria-label="Dismiss onsite banner">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

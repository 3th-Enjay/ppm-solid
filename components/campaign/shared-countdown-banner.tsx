"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CampaignConfig } from "@/lib/campaign-shared"

function formatTimeUnit(value: number) {
  return value.toString().padStart(2, "0")
}

export function SharedCampaignCountdownBanner({
  config,
  serverNow,
  placement,
}: {
  config: CampaignConfig
  serverNow: number
  placement: "home" | "campaign"
}) {
  const isVisible = placement === "home" ? config.showCountdownOnHomePage : config.showCountdownOnCampaignPage
  const countdownEndMs = useMemo(() => new Date(config.countdownEndsAt).getTime(), [config.countdownEndsAt])
  const initialRemainingMs = useMemo(() => Math.max(countdownEndMs - serverNow, 0), [countdownEndMs, serverNow])
  const [timeLeftMs, setTimeLeftMs] = useState(initialRemainingMs)

  useEffect(() => {
    const startedAt = Date.now()
    setTimeLeftMs(initialRemainingMs)

    const interval = window.setInterval(() => {
      const elapsedMs = Date.now() - startedAt
      const remainingMs = Math.max(initialRemainingMs - elapsedMs, 0)
      setTimeLeftMs(remainingMs)

      if (remainingMs <= 0) {
        window.clearInterval(interval)
      }
    }, 1000)

    return () => window.clearInterval(interval)
  }, [initialRemainingMs])

  const countdownParts = useMemo(() => {
    const totalSeconds = Math.floor(timeLeftMs / 1000)
    const days = Math.floor(totalSeconds / (24 * 60 * 60))
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
    const seconds = totalSeconds % 60

    return [
      { label: "Days", value: formatTimeUnit(days) },
      { label: "Hours", value: formatTimeUnit(hours) },
      { label: "Minutes", value: formatTimeUnit(minutes) },
      { label: "Seconds", value: formatTimeUnit(seconds) },
    ]
  }, [timeLeftMs])

  const countdownEndsAtText = useMemo(() => {
    const countdownEndDate = new Date(config.countdownEndsAt)
    return Number.isNaN(countdownEndDate.getTime())
      ? "Deadline unavailable"
      : countdownEndDate.toLocaleString("en-NG", {
          dateStyle: "medium",
          timeStyle: "short",
        })
  }, [config.countdownEndsAt])

  if (!isVisible) {
    return null
  }

  const isHome = placement === "home"

  return (
    <section className={isHome ? "px-4 pt-6 sm:px-6 lg:px-8" : "container relative pt-6 sm:pt-8"}>
      <div className="overflow-hidden rounded-[2rem] border border-[#0d3f78]/10 bg-slate-950 text-white shadow-[0_22px_80px_rgba(15,23,42,0.2)]">
        <div className="bg-[linear-gradient(90deg,rgba(13,63,120,0.94),rgba(15,141,46,0.92))] px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Application Window</p>
              <h2 className="text-2xl font-black sm:text-3xl">
                {isHome ? "Campaign deadline is live on the home page" : "Shared campaign countdown is live"}
              </h2>
              <p className="text-sm leading-6 text-white/80 sm:text-base">
                {isHome
                  ? "The caregiver campaign timer is now visible here too. Click below to register with the Google Form before the deadline closes."
                  : "Every visitor sees the same server-backed deadline. Fill the form first, then receive the LMS registration link by email to complete sign up."}
              </p>
              <p className="text-sm font-semibold text-[#d8ff67]">Deadline: {countdownEndsAtText}</p>
              {isHome ? (
                <Button variant="secondary" size="lg" asChild className="mt-2">
                  <Link href={config.registrationHref} target="_blank" rel="noreferrer">
                    Click Here To Register
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {countdownParts.map((item) => (
                <div key={item.label} className="min-w-[92px] rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
                  <p className="text-3xl font-black tabular-nums sm:text-4xl">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CalendarDays, CheckCircle2, CreditCard, Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthStore } from "@/lib/store"
import { getTrainingLocationLabel, ONSITE_TRAINING } from "@/lib/student-registration"

export default function DashboardOnsiteTrainingPage() {
  const { user, token } = useAuthStore()
  const [preferredLocation, setPreferredLocation] = useState<"enugu" | "abuja">(
    user?.studentProfile?.preferredLocation || "enugu",
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isPaid = user?.studentProfile?.paymentStatus === "yes"

  useEffect(() => {
    if (!token) return
    void fetch("/api/onboarding/state", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ markOnsiteViewed: true }),
    })
  }, [token])

  const locationSummary = useMemo(() => {
    return `${getTrainingLocationLabel(preferredLocation)} - ${preferredLocation === "enugu" ? "March 9, 2026" : "March 23, 2026"}`
  }, [preferredLocation])

  const handleCheckout = async () => {
    if (!token) return
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/payments/initialize-onsite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferredLocation }),
      })
      const data = await res.json()
      if (!res.ok || !data?.authorization_url) {
        throw new Error(data?.error || "Unable to start onsite payment")
      }
      window.location.href = data.authorization_url
    } catch (checkoutError: any) {
      setError(checkoutError?.message || "Unable to start onsite payment")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold md:text-4xl">Onsite Training</h1>
        <p className="text-muted-foreground">
          Upgrade from your student dashboard, complete payment with Paystack, and unlock the full onsite training experience.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card variant="elevated" className="border-primary/20">
          <CardHeader>
            <CardTitle>{ONSITE_TRAINING.formTitle}</CardTitle>
            <CardDescription>{ONSITE_TRAINING.formDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Duration</p>
                <p className="mt-2 text-lg font-semibold">{ONSITE_TRAINING.durationDays} Days</p>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Hours</p>
                <p className="mt-2 text-lg font-semibold">{ONSITE_TRAINING.hours}+ Hours</p>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Price</p>
                <p className="mt-2 text-lg font-semibold">NGN {ONSITE_TRAINING.registrationFeeNgn.toLocaleString("en-NG")}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">What you get</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Internationally recognized certification</p>
                  <p>Training scrubs and practical materials</p>
                  <p>Transcript and recommendation letter</p>
                  <p>Internship and career support</p>
                  <p>CPR and First Aid certification</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Choose location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredLocation">Training location</Label>
                    <Select value={preferredLocation} onValueChange={(value) => setPreferredLocation(value as "enugu" | "abuja")}>
                      <SelectTrigger id="preferredLocation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enugu">Enugu</SelectItem>
                        <SelectItem value="abuja">Abuja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                    <p className="inline-flex items-center gap-2 font-medium text-foreground"><MapPin className="h-4 w-4 text-primary" /> {locationSummary}</p>
                    <p className="mt-2 inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> Payment return goes back to your dashboard context.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="cta" onClick={handleCheckout} disabled={loading || isPaid}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing checkout...
                  </>
                ) : isPaid ? (
                  "Onsite Training Active"
                ) : (
                  "Register & Pay"
                )}
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/payments">View payments</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-primary/15">
            <CardHeader>
              <CardTitle className="text-base">Access model</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2 font-medium text-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> Onsite paid</p>
              <p>All courses unlock after payment verification succeeds.</p>
              <p className="inline-flex items-center gap-2 font-medium text-foreground"><CreditCard className="h-4 w-4 text-primary" /> Regular student</p>
              <p>Buy courses individually when you want access to paid content.</p>
            </CardContent>
          </Card>

          <Card className="border-primary/15">
            <CardHeader>
              <CardTitle className="text-base">Current status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Training mode: <span className="font-medium text-foreground capitalize">{user?.studentProfile?.trainingMode || "online"}</span></p>
              <p>Payment status: <span className="font-medium text-foreground">{isPaid ? "Paid" : "Not yet paid"}</span></p>
              <p>Support: <span className="font-medium text-foreground">{ONSITE_TRAINING.supportPhone}</span></p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


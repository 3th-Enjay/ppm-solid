"use client"

import { useEffect, useMemo, useState } from "react"
import { RotateCcw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/store"
import { DEFAULT_CAMPAIGN_CONFIG, type CampaignConfig } from "@/lib/campaign-shared"

function padTime(value: number) {
  return value.toString().padStart(2, "0")
}

function formatDateTimeLocal(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const year = date.getFullYear()
  const month = padTime(date.getMonth() + 1)
  const day = padTime(date.getDate())
  const hours = padTime(date.getHours())
  const minutes = padTime(date.getMinutes())

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function toIsoFromDateTimeLocal(value: string) {
  if (!value) return new Date().toISOString()
  return new Date(value).toISOString()
}

function buildCountdownDuration(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

export default function AdminCampaignPage() {
  const { toast } = useToast()
  const { token } = useAuthStore()
  const [config, setConfig] = useState<CampaignConfig>(DEFAULT_CAMPAIGN_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [serverNow, setServerNow] = useState(Date.now())
  const countdownEndMs = useMemo(() => new Date(config.countdownEndsAt).getTime(), [config.countdownEndsAt])
  const initialPreviewMs = useMemo(() => Math.max(countdownEndMs - serverNow, 0), [countdownEndMs, serverNow])
  const [previewMs, setPreviewMs] = useState(0)

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/campaign")
        const data = await res.json()
        if (!res.ok || !data.config) {
          throw new Error(data.error || "Failed to load campaign settings")
        }
        setConfig(data.config)
        setServerNow(typeof data.serverNow === "number" ? data.serverNow : Date.now())
      } catch (error: any) {
        toast({
          title: "Campaign settings load failed",
          description: error.message || "Using current default campaign values.",
          variant: "destructive",
        })
        setConfig(DEFAULT_CAMPAIGN_CONFIG)
        setServerNow(Date.now())
      } finally {
        setLoading(false)
      }
    }

    void loadConfig()
  }, [toast])

  useEffect(() => {
    if (Number.isNaN(countdownEndMs)) {
      setPreviewMs(0)
      return
    }

    const startedAt = Date.now()
    setPreviewMs(initialPreviewMs)

    const interval = window.setInterval(() => {
      const elapsedMs = Date.now() - startedAt
      const remainingMs = Math.max(initialPreviewMs - elapsedMs, 0)
      setPreviewMs(remainingMs)

      if (remainingMs <= 0) {
        window.clearInterval(interval)
      }
    }, 1000)

    return () => window.clearInterval(interval)
  }, [countdownEndMs, initialPreviewMs])

  const countdownParts = useMemo(() => {
    const totalSeconds = Math.floor(previewMs / 1000)
    const days = Math.floor(totalSeconds / (24 * 60 * 60))
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
    const seconds = totalSeconds % 60

    return [
      { label: "Days", value: padTime(days) },
      { label: "Hours", value: padTime(hours) },
      { label: "Minutes", value: padTime(minutes) },
      { label: "Seconds", value: padTime(seconds) },
    ]
  }, [previewMs])

  const countdownEndsAtText = useMemo(() => {
    const countdownEndDate = new Date(config.countdownEndsAt)
    if (Number.isNaN(countdownEndDate.getTime())) return "Invalid deadline"
    return countdownEndDate.toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }, [config.countdownEndsAt])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/campaign", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (!res.ok || !data.config) {
        throw new Error(data.error || "Failed to save campaign settings")
      }
      setConfig(data.config)
      setServerNow(typeof data.serverNow === "number" ? data.serverNow : Date.now())
      toast({
        title: "Campaign settings saved",
        description: "Your public campaign page, home page timer, and shared countdown now reflect the updated values.",
      })
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Could not save campaign settings.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading campaign settings...</div>
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-balance">Campaign</h1>
        <p className="mt-2 text-muted-foreground">
          Manage the public Prompt Care Academy campaign page, including CTA links, offer details, and the shared countdown visibility on both home and campaign pages.
        </p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-slate-950 via-[#0d3f78] to-[#0f8d2e] text-white shadow-[0_22px_80px_rgba(15,23,42,0.18)]">
        <CardHeader>
          <CardTitle>Campaign Countdown</CardTitle>
          <CardDescription className="text-white/75">
            This timer is stored on the server, and you can choose whether it appears on the campaign page while keeping the timing configuration updated centrally.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm md:grid-cols-2">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
              <div>
                <p className="font-semibold text-white">Show On Home Page</p>
                <p className="text-sm text-white/70">Homepage display is currently disabled, but this toggle remains available for future use.</p>
              </div>
              <Switch checked={config.showCountdownOnHomePage} onCheckedChange={(checked) => setConfig({ ...config, showCountdownOnHomePage: checked })} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
              <div>
                <p className="font-semibold text-white">Show On Campaign Page</p>
                <p className="text-sm text-white/70">Display the countdown banner at the top of the campaign landing page.</p>
              </div>
              <Switch checked={config.showCountdownOnCampaignPage} onCheckedChange={(checked) => setConfig({ ...config, showCountdownOnCampaignPage: checked })} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="countdownDurationDays" className="text-white">Countdown Duration in Days</Label>
                <Input
                  id="countdownDurationDays"
                  type="number"
                  min={1}
                  max={365}
                  value={config.countdownDurationDays}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      countdownDurationDays: Math.max(1, Number.parseInt(e.target.value || "1", 10)),
                    })
                  }
                  className="border-white/20 bg-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="countdownEndsAt" className="text-white">Countdown Ends At</Label>
                <Input
                  id="countdownEndsAt"
                  type="datetime-local"
                  value={formatDateTimeLocal(config.countdownEndsAt)}
                  onChange={(e) => setConfig({ ...config, countdownEndsAt: toIsoFromDateTimeLocal(e.target.value) })}
                  className="border-white/20 bg-white/10 text-white"
                />
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setConfig({
                      ...config,
                      countdownEndsAt: buildCountdownDuration(config.countdownDurationDays),
                    })
                  }
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Countdown From Now
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={() =>
                    setConfig({
                      ...config,
                      countdownDurationDays: 7,
                      countdownEndsAt: buildCountdownDuration(7),
                    })
                  }
                >
                  Reset to 7 Days
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Live Preview</p>
              <p className="mt-2 text-sm text-white/80">Deadline: {countdownEndsAtText}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {countdownParts.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/15 bg-black/10 px-4 py-3 text-center">
                    <p className="text-3xl font-black tabular-nums">{item.value}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hero Content</CardTitle>
            <CardDescription>These values appear at the top of the campaign page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heroBadge">Badge</Label>
              <Input id="heroBadge" value={config.heroBadge} onChange={(e) => setConfig({ ...config, heroBadge: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroTitle">Hero Title</Label>
              <Textarea id="heroTitle" rows={3} value={config.heroTitle} onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroDescription">Hero Description</Label>
              <Textarea id="heroDescription" rows={5} value={config.heroDescription} onChange={(e) => setConfig({ ...config, heroDescription: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaignImage">Campaign Image Path</Label>
              <Input id="campaignImage" value={config.campaignImage} onChange={(e) => setConfig({ ...config, campaignImage: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CTA and Contact</CardTitle>
            <CardDescription>Update where signup buttons go, plus contact numbers kept for admin operations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="registrationCtaLabel">CTA Label</Label>
              <Input id="registrationCtaLabel" value={config.registrationCtaLabel} onChange={(e) => setConfig({ ...config, registrationCtaLabel: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationHref">CTA Link</Label>
              <Input id="registrationHref" value={config.registrationHref} onChange={(e) => setConfig({ ...config, registrationHref: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationRedirect">Post-verification Redirect</Label>
              <Input id="registrationRedirect" value={config.registrationRedirect} onChange={(e) => setConfig({ ...config, registrationRedirect: e.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supportPhone">Phone Number</Label>
                <Input id="supportPhone" value={config.supportPhone} onChange={(e) => setConfig({ ...config, supportPhone: e.target.value, contactValue: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input id="whatsappNumber" value={config.whatsappNumber} onChange={(e) => setConfig({ ...config, whatsappNumber: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactDescription">Contact Description</Label>
              <Textarea id="contactDescription" rows={3} value={config.contactDescription} onChange={(e) => setConfig({ ...config, contactDescription: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offer Cards</CardTitle>
            <CardDescription>Edit the summary cards shown under the hero section.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Cost Label</Label>
                <Input value={config.costLabel} onChange={(e) => setConfig({ ...config, costLabel: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Cost Value</Label>
                <Input value={config.costValue} onChange={(e) => setConfig({ ...config, costValue: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Cost Suffix</Label>
                <Input value={config.costSuffix} onChange={(e) => setConfig({ ...config, costSuffix: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cohort Label</Label>
              <Input value={config.cohortLabel} onChange={(e) => setConfig({ ...config, cohortLabel: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cohort Value</Label>
              <Input value={config.cohortValue} onChange={(e) => setConfig({ ...config, cohortValue: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cohort Description</Label>
              <Textarea rows={3} value={config.cohortDescription} onChange={(e) => setConfig({ ...config, cohortDescription: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location and Timing</CardTitle>
            <CardDescription>Update venue, date, and duration without touching code.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Venue Label</Label>
              <Input value={config.venueLabel} onChange={(e) => setConfig({ ...config, venueLabel: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Venue Value</Label>
              <Textarea rows={3} value={config.venueValue} onChange={(e) => setConfig({ ...config, venueValue: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Venue Description</Label>
              <Textarea rows={3} value={config.venueDescription} onChange={(e) => setConfig({ ...config, venueDescription: e.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date Label</Label>
                <Input value={config.startDateLabel} onChange={(e) => setConfig({ ...config, startDateLabel: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Start Date Value</Label>
                <Input value={config.startDateValue} onChange={(e) => setConfig({ ...config, startDateValue: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date Description</Label>
              <Textarea rows={3} value={config.dateDescription} onChange={(e) => setConfig({ ...config, dateDescription: e.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Duration Label</Label>
                <Input value={config.durationLabel} onChange={(e) => setConfig({ ...config, durationLabel: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Duration Value</Label>
                <Input value={config.durationValue} onChange={(e) => setConfig({ ...config, durationValue: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Duration Description</Label>
              <Textarea rows={3} value={config.durationDescription} onChange={(e) => setConfig({ ...config, durationDescription: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Section Copy</CardTitle>
            <CardDescription>Control the lower sections of the page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Academy Section Eyebrow</Label>
              <Input value={config.academySectionDescription} onChange={(e) => setConfig({ ...config, academySectionDescription: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Academy Section Title</Label>
              <Textarea rows={3} value={config.academySectionTitle} onChange={(e) => setConfig({ ...config, academySectionTitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Upcoming Batch Title</Label>
              <Input value={config.upcomingBatchTitle} onChange={(e) => setConfig({ ...config, upcomingBatchTitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Upcoming Batch Description</Label>
              <Textarea rows={4} value={config.upcomingBatchDescription} onChange={(e) => setConfig({ ...config, upcomingBatchDescription: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
            <CardDescription>One benefit per line.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={10}
              value={config.benefits.join("\n")}
              onChange={(e) =>
                setConfig({
                  ...config,
                  benefits: e.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
                })
              }
            />
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} className="w-full" disabled={saving}>
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Saving..." : "Save Campaign Settings"}
      </Button>
    </div>
  )
}


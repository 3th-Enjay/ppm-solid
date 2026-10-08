"use client"

import { useEffect, useState } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/store"
import {
  DEFAULT_ONSITE_TRAINING_CONFIG,
  type OnsiteTrainingConfig,
} from "@/lib/onsite-training-shared"

export default function AdminOnsiteTrainingPage() {
  const { toast } = useToast()
  const { token } = useAuthStore()
  const [config, setConfig] = useState<OnsiteTrainingConfig>(DEFAULT_ONSITE_TRAINING_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/onsite-training", {
          headers: { Authorization: `Bearer ${token || ""}` },
        })
        const data = await res.json()
        if (!res.ok || !data.config) {
          throw new Error(data.error || "Failed to load onsite training settings")
        }
        setConfig(data.config)
      } catch (error: any) {
        toast({
          title: "Onsite settings load failed",
          description: error.message || "Using current default onsite settings.",
          variant: "destructive",
        })
        setConfig(DEFAULT_ONSITE_TRAINING_CONFIG)
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      void loadConfig()
    } else {
      setLoading(false)
    }
  }, [token, toast])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/onsite-training", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (!res.ok || !data.config) {
        throw new Error(data.error || "Failed to save onsite training settings")
      }
      setConfig(data.config)
      toast({
        title: "Onsite settings saved",
        description: "Students will see these updates on the onsite training page.",
      })
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Could not save onsite training settings.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading onsite training settings...</div>
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-balance">Onsite Training</h1>
        <p className="mt-2 text-muted-foreground">Manage the onsite offer details students see in the dashboard, including price, dates, locations, and proof points.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Core Offer</CardTitle>
            <CardDescription>These values power the student onsite training page and payment initialization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="formTitle">Offer Title</Label>
              <Input id="formTitle" value={config.formTitle} onChange={(e) => setConfig({ ...config, formTitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formDescription">Offer Description</Label>
              <Textarea id="formDescription" rows={4} value={config.formDescription} onChange={(e) => setConfig({ ...config, formDescription: e.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="durationDays">Duration (days)</Label>
                <Input id="durationDays" type="number" min={1} value={config.durationDays} onChange={(e) => setConfig({ ...config, durationDays: Number(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Training Hours</Label>
                <Input id="hours" type="number" min={1} value={config.hours} onChange={(e) => setConfig({ ...config, hours: Number(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationFeeNgn">Price (NGN)</Label>
                <Input id="registrationFeeNgn" type="number" min={1} value={config.registrationFeeNgn} onChange={(e) => setConfig({ ...config, registrationFeeNgn: Number(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportPhone">Support Phone</Label>
                <Input id="supportPhone" value={config.supportPhone} onChange={(e) => setConfig({ ...config, supportPhone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentProviderHint">Payment Provider Hint</Label>
              <Input id="paymentProviderHint" value={config.paymentProviderHint} onChange={(e) => setConfig({ ...config, paymentProviderHint: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
            <CardDescription>Students will see the date, venue, slots left, and enrollment count for each cohort.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(["enugu", "abuja"] as const).map((locationKey) => {
              const location = config.locations[locationKey]
              return (
                <div key={locationKey} className="space-y-4 rounded-2xl border p-4">
                  <h3 className="font-semibold capitalize">{locationKey}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input value={location.label} onChange={(e) => setConfig({ ...config, locations: { ...config.locations, [locationKey]: { ...location, label: e.target.value } } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input value={location.startsOn} onChange={(e) => setConfig({ ...config, locations: { ...config.locations, [locationKey]: { ...location, startsOn: e.target.value } } })} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Venue</Label>
                      <Input value={location.venue} onChange={(e) => setConfig({ ...config, locations: { ...config.locations, [locationKey]: { ...location, venue: e.target.value } } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Slots Left</Label>
                      <Input type="number" min={0} value={location.slotsLeft} onChange={(e) => setConfig({ ...config, locations: { ...config.locations, [locationKey]: { ...location, slotsLeft: Number(e.target.value) || 0 } } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Enrolled Count</Label>
                      <Input type="number" min={0} value={location.enrolledCount} onChange={(e) => setConfig({ ...config, locations: { ...config.locations, [locationKey]: { ...location, enrolledCount: Number(e.target.value) || 0 } } })} />
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
            <CardDescription>One benefit per line.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={8}
              value={config.benefits.join("\n")}
              onChange={(e) => setConfig({
                ...config,
                benefits: e.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
              })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Testimonials</CardTitle>
            <CardDescription>These show as social proof on the student onsite training page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {config.testimonials.map((testimonial, index) => (
              <div key={`${testimonial.name}-${index}`} className="space-y-4 rounded-2xl border p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={testimonial.name} onChange={(e) => {
                      const next = [...config.testimonials]
                      next[index] = { ...testimonial, name: e.target.value }
                      setConfig({ ...config, testimonials: next })
                    }} />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input value={testimonial.role} onChange={(e) => {
                      const next = [...config.testimonials]
                      next[index] = { ...testimonial, role: e.target.value }
                      setConfig({ ...config, testimonials: next })
                    }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Quote</Label>
                  <Textarea rows={3} value={testimonial.quote} onChange={(e) => {
                    const next = [...config.testimonials]
                    next[index] = { ...testimonial, quote: e.target.value }
                    setConfig({ ...config, testimonials: next })
                  }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} className="w-full" disabled={saving}>
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Saving..." : "Save Onsite Training Settings"}
      </Button>
    </div>
  )
}


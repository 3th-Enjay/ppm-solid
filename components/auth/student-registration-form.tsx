"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ONLINE_TRAINING, ONSITE_TRAINING } from "@/lib/student-registration"
import { onlineRegisterSchema, onsiteRegisterSchema } from "@/lib/validation"

type RegistrationMode = "onsite" | "online"

type FormData = {
  registrationType: RegistrationMode
  name: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber: string
  whatsappNumber: string
  gender: "male" | "female" | "other" | "prefer_not_to_say"
  dateOfBirth: string
  currentAddress: string
  isHealthcareProfessional: "yes" | "no"
  currentRoleOrField: string
  preferredLocation: "enugu" | "abuja"
  trainingInterest: string
  agreedSlotSecured: boolean
  agreedDetailsCorrect: boolean
  acceptTerms: boolean
}

export function StudentRegistrationForm({ mode }: { mode: RegistrationMode }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showBenefitsModal, setShowBenefitsModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    registrationType: mode,
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    whatsappNumber: "",
    gender: "male",
    dateOfBirth: "",
    currentAddress: "",
    isHealthcareProfessional: "no",
    currentRoleOrField: "",
    preferredLocation: "enugu",
    trainingInterest: "",
    agreedSlotSecured: mode === "online",
    agreedDetailsCorrect: false,
    acceptTerms: false,
  })

  const submitRegistration = async (payload: Record<string, any>) => {
    setLoading(true)
    setError("")
    try {
      const endpoint = mode === "onsite" ? "/api/payments/initialize-onsite" : "/api/auth/register"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result?.error || "Registration failed")
      }
      if (mode === "onsite") {
        if (!result?.authorization_url) {
          throw new Error("Unable to initialize onsite payment.")
        }
        if (typeof window !== "undefined") {
          sessionStorage.setItem("pending-otp-email", formData.email)
          window.location.href = result.authorization_url
        }
        return
      }
      if (!result?.pendingRegistration) {
        throw new Error(result?.error || "Registration failed")
      }
      toast({
        title: "Registration submitted",
        description: "A verification code has been sent to your email.",
      })
      setShowSuccessModal(true)
      const nextUrl = `/verify-otp?email=${encodeURIComponent(formData.email)}`
      if (typeof window !== "undefined") {
        sessionStorage.setItem("pending-otp-email", formData.email)
        window.setTimeout(() => {
          router.replace(nextUrl)
          router.refresh()
        }, 1200)
      }
    } catch (submissionError: unknown) {
      if (submissionError instanceof Error) {
        setError(submissionError.message || "Please check your information and try again")
      } else {
        setError("Please check your information and try again")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const validated =
        mode === "onsite"
          ? onsiteRegisterSchema.parse({ ...formData, registrationType: "onsite" })
          : onlineRegisterSchema.parse({ ...formData, registrationType: "online" })
      await submitRegistration(validated)
    } catch (schemaError: any) {
      setError(schemaError?.issues?.[0]?.message || schemaError?.message || "Invalid registration details")
    }
  }

  const title = mode === "onsite" ? ONSITE_TRAINING.formTitle : ONLINE_TRAINING.formTitle
  const description = mode === "onsite" ? ONSITE_TRAINING.formDescription : ONLINE_TRAINING.formDescription

  return (
    <div className="w-full max-w-4xl py-8">
      <Card className="overflow-hidden border-primary/15 shadow-lg">
        <div className="bg-gradient-to-r from-primary/95 via-primary to-accent p-6 text-primary-foreground">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-background/20 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            {mode === "onsite" ? "On-Site Training Registration" : "Online Training Registration"}
          </p>
          <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-primary-foreground/90">{description}</p>
        </div>

        <CardContent className="space-y-5 pt-6">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={loading} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={loading} required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} disabled={loading} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input id="whatsappNumber" value={formData.whatsappNumber} onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })} disabled={loading} required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value as FormData["gender"] })} disabled={loading}>
                  <SelectTrigger id="gender"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} disabled={loading} required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    disabled={loading}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentAddress">Current Address</Label>
              <Textarea id="currentAddress" value={formData.currentAddress} onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })} disabled={loading} required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="isHealthcareProfessional">Are you a healthcare professional?</Label>
                <Select value={formData.isHealthcareProfessional} onValueChange={(value) => setFormData({ ...formData, isHealthcareProfessional: value as "yes" | "no" })} disabled={loading}>
                  <SelectTrigger id="isHealthcareProfessional"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentRoleOrField">Current Role or Field</Label>
                <Input id="currentRoleOrField" value={formData.currentRoleOrField} onChange={(e) => setFormData({ ...formData, currentRoleOrField: e.target.value })} disabled={loading} required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preferredLocation">Preferred Location</Label>
                <Select value={formData.preferredLocation} onValueChange={(value) => setFormData({ ...formData, preferredLocation: value as "enugu" | "abuja" })} disabled={loading}>
                  <SelectTrigger id="preferredLocation"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enugu">Enugu - Starts March 9, 2026</SelectItem>
                    <SelectItem value="abuja">Abuja - Starts March 23, 2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trainingInterest">Why are you interested in this training?</Label>
              <Textarea id="trainingInterest" rows={3} value={formData.trainingInterest} onChange={(e) => setFormData({ ...formData, trainingInterest: e.target.value })} disabled={loading} required />
            </div>

            {mode === "onsite" ? (
              <>
                <div className="rounded-lg border border-dashed border-primary/35 p-4 text-sm">
                  <p>Registration Fee: <span className="font-semibold">NGN {ONSITE_TRAINING.registrationFeeNgn.toLocaleString("en-NG")}</span></p>
                  <p className="mt-2 text-muted-foreground">You will be redirected to secure Paystack checkout after registration.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="agreedSlotSecured" checked={formData.agreedSlotSecured} onCheckedChange={(checked) => setFormData({ ...formData, agreedSlotSecured: checked === true })} />
                  <Label htmlFor="agreedSlotSecured" className="text-sm font-normal">I understand my slot is only secured after payment</Label>
                </div>
              </>
            ) : null}

            <Card className="border-primary/20 bg-muted/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">What You Get</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>150+ Hours (Theory & Practical)</p>
                <p>Internationally Recognized Certification</p>
                <p>Training Scrubs & Materials</p>
                <p>Transcript & Recommendation Letter</p>
                <p>Internship Support</p>
                <p>CPR & First Aid Certification</p>
                <Button type="button" variant="outline" className="mt-3" onClick={() => setShowBenefitsModal(true)}>
                  View Program Benefits
                </Button>
              </CardContent>
            </Card>

            <div className="flex items-start gap-2">
              <Checkbox id="agreedDetailsCorrect" checked={formData.agreedDetailsCorrect} onCheckedChange={(checked) => setFormData({ ...formData, agreedDetailsCorrect: checked === true })} />
              <Label htmlFor="agreedDetailsCorrect" className="text-sm font-normal">I confirm my details are correct</Label>
            </div>
            <div className="flex items-start gap-2 border-t pt-3">
              <Checkbox id="acceptTerms" checked={formData.acceptTerms} onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked === true })} />
              <Label htmlFor="acceptTerms" className="text-sm font-normal leading-relaxed">
                I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </Label>
            </div>

            <Button type="submit" variant="cta" disabled={loading} className="w-full">
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
              ) : mode === "onsite" ? "Continue to Paystack Checkout" : "Complete Online Registration"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showBenefitsModal} onOpenChange={setShowBenefitsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Training Benefits</DialogTitle>
            <DialogDescription>What you get after joining Prompt Care Academy training.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 px-6 pb-2 text-sm">
            <p>150+ Hours (Theory & Practical)</p>
            <p>Internationally Recognized Certification</p>
            <p>Training Scrubs & Materials</p>
            <p>Transcript & Recommendation Letter</p>
            <p>Internship Support</p>
            <p>CPR & First Aid Certification</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowBenefitsModal(false)}>Continue Registration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Registration Received
            </DialogTitle>
            <DialogDescription>Your registration is pending email verification. A verification code has been sent.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 px-6 pb-1 text-sm">
            <p>Thank you for registering for Prompt Care Academy.</p>
            <p>{mode === "onsite" ? "Your slot will only be confirmed after payment." : "You can purchase courses from your dashboard after verification."}</p>
            <p className="inline-flex items-center gap-2 text-muted-foreground"><ShieldCheck className="h-4 w-4" />For inquiries: {ONSITE_TRAINING.supportPhone}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSuccessModal(false)}>Continue to Verification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

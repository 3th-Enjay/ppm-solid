"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck, Sparkles } from "lucide-react"
import { OnboardingPreview, type OnboardingPreviewSection } from "@/components/auth/onboarding-preview"
import { OnboardingShell, type OnboardingShellStep } from "@/components/auth/onboarding-shell"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { trackOnboardingEvent } from "@/lib/onboarding-analytics"
import { buildVerifyOtpRoute } from "@/lib/onboarding-flow"
import { studentRegisterSchema } from "@/lib/validation"

export function GuidedStudentRegistrationForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    registrationType: "online" as const,
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    whatsappNumber: "",
    acceptTerms: false,
  })

  const steps = useMemo<OnboardingShellStep[]>(
    () => [
      {
        id: "account",
        title: "Create account",
        description: "Start with the essentials. This is the email and password you will verify next.",
      },
      {
        id: "contact",
        title: "Basic info",
        description: "Add the fastest way for Prompt Care to reach you after activation.",
      },
      {
        id: "review",
        title: "Review and continue",
        description: "Confirm your details, accept the terms, and continue to email verification.",
      },
    ],
    [],
  )

  const stepFields = useMemo<Record<string, string[]>>(
    () => ({
      account: ["name", "email", "password", "confirmPassword"],
      contact: ["phoneNumber", "whatsappNumber"],
      review: ["acceptTerms"],
    }),
    [],
  )

  useEffect(() => {
    trackOnboardingEvent("signup_step_viewed", {
      role: "student",
      mode: "online",
      step: steps[currentStep]?.id,
      stepIndex: currentStep + 1,
    })
  }, [currentStep, steps])

  const validateStep = (stepIndex: number) => {
    const result = studentRegisterSchema.safeParse(formData)

    if (result.success) {
      setError("")
      return true
    }

    const fields = new Set(stepFields[steps[stepIndex].id] || [])
    const relevantIssue = result.error.issues.find((issue) => issue.path.some((pathPart) => fields.has(String(pathPart))))

    if (!relevantIssue) {
      setError("")
      return true
    }

    setError(relevantIssue.message)
    return false
  }

  const goToStep = (stepIndex: number) => {
    setError("")
    setCurrentStep(stepIndex)
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return
    }

    trackOnboardingEvent("signup_step_completed", {
      role: "student",
      mode: "online",
      step: steps[currentStep]?.id,
      stepIndex: currentStep + 1,
    })
    setCurrentStep((previous) => Math.min(previous + 1, steps.length - 1))
  }

  const handleBack = () => {
    setError("")
    setCurrentStep((previous) => Math.max(previous - 1, 0))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const validated = studentRegisterSchema.parse(formData)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      })
      const result = await res.json()

      if (!res.ok || !result?.pendingRegistration) {
        throw new Error(result?.error || "Registration failed")
      }

      const nextUrl =
        result?.nextRoute ||
        buildVerifyOtpRoute({
          email: validated.email,
          role: "student",
          source: "signup",
        })

      trackOnboardingEvent("signup_submitted", {
        role: "student",
        mode: "online",
        nextRoute: nextUrl,
      })

      toast({
        title: "Verification code sent",
        description: "Check your inbox and complete the final email verification step.",
      })

      if (typeof window !== "undefined") {
        sessionStorage.setItem("pending-otp-email", validated.email)
      }

      router.replace(nextUrl)
      router.refresh()
    } catch (submitError: any) {
      trackOnboardingEvent("signup_submit_failed", {
        role: "student",
        mode: "online",
      })
      setError(submitError?.issues?.[0]?.message || submitError?.message || "Please review your details and try again")
    } finally {
      setLoading(false)
    }
  }

  const reviewSections = useMemo<OnboardingPreviewSection[]>(
    () => [
      {
        id: "account",
        title: "Account",
        onEdit: () => goToStep(0),
        items: [
          { label: "Full name", value: formData.name },
          { label: "Email", value: formData.email },
          { label: "Password", value: formData.password ? "********" : "Not set" },
        ],
      },
      {
        id: "contact",
        title: "Basic info",
        onEdit: () => goToStep(1),
        items: [
          { label: "Phone number", value: formData.phoneNumber },
          { label: "WhatsApp", value: formData.whatsappNumber || "Not provided" },
        ],
      },
    ],
    [formData],
  )

  const aside = (
    <>
      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle className="text-base">What happens next</CardTitle>
          <CardDescription>A faster signup now, the rest of your profile after activation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-2 font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> 1-minute entry
          </p>
          <p>We only collect the essentials here so you can get to OTP verification quickly.</p>
          <p>Profile details like address, training preferences, and background can be completed later from your account.</p>
        </CardContent>
      </Card>

      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle className="text-base">Verification rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-2 font-medium text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> OTP must be verified before your account is created.
          </p>
          <p>Your email must receive the OTP successfully before we save the pending registration.</p>
        </CardContent>
      </Card>
    </>
  )

  const footer = (
    <p>
      Already have an account?{" "}
      <Link href="/login" className="font-medium text-primary hover:underline">
        Sign in
      </Link>
      {" "}or{" "}
      <Link href="/register-instructor" className="font-medium text-primary hover:underline">
        register as instructor
      </Link>
    </p>
  )

  return (
    <OnboardingShell
      badge="Student Registration"
      title="Create your student account"
      description="A guided signup that keeps the entry light, then moves you straight into OTP verification."
      currentStep={currentStep}
      steps={steps}
      aside={aside}
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {currentStep === 0 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" autoFocus value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={loading} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={loading} required />
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
                    onClick={() => setShowPassword((previous) => !previous)}
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
                    onClick={() => setShowConfirmPassword((previous) => !previous)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {currentStep === 1 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input id="phoneNumber" autoFocus value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} disabled={loading} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number (optional)</Label>
              <Input id="whatsappNumber" value={formData.whatsappNumber} onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })} disabled={loading} />
            </div>
            <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">
              Use the email above for OTP delivery. After verification, we will guide you through the rest of your profile inside the product.
            </div>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="space-y-5">
            <OnboardingPreview sections={reviewSections} />
            <div className="flex items-start gap-2 rounded-2xl border bg-muted/30 p-4">
              <Checkbox id="acceptTerms" checked={formData.acceptTerms} onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked === true })} />
              <Label htmlFor="acceptTerms" className="text-sm font-normal leading-relaxed">
                I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </Label>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={handleBack} disabled={loading || currentStep === 0}>
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button type="button" variant="cta" onClick={handleNext} disabled={loading}>
              Continue
            </Button>
          ) : (
            <Button type="submit" variant="cta" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit and Verify Email"
              )}
            </Button>
          )}
        </div>
      </form>
    </OnboardingShell>
  )
}

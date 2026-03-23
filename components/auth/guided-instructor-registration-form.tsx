"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AlertCircle, Eye, EyeOff, GraduationCap, Loader2, Sparkles } from "lucide-react"
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
import { instructorRegisterSchema } from "@/lib/validation"

export function GuidedInstructorRegistrationForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    professionalHeadline: "",
    specialties: "",
    yearsOfExperience: "0",
    acceptTerms: false,
  })

  const steps = useMemo<OnboardingShellStep[]>(
    () => [
      {
        id: "account",
        title: "Create account",
        description: "Set up the instructor login you will verify next.",
      },
      {
        id: "basics",
        title: "Teaching basics",
        description: "Capture the essential instructor details we need before verification.",
      },
      {
        id: "review",
        title: "Review and submit",
        description: "Check your details, confirm the terms, and continue to OTP verification.",
      },
    ],
    [],
  )

  const stepFields = useMemo<Record<string, string[]>>(
    () => ({
      account: ["name", "email", "password", "confirmPassword"],
      basics: ["phoneNumber", "professionalHeadline", "yearsOfExperience", "specialties"],
      review: ["acceptTerms"],
    }),
    [],
  )

  useEffect(() => {
    trackOnboardingEvent("signup_step_viewed", {
      role: "instructor",
      step: steps[currentStep]?.id,
      stepIndex: currentStep + 1,
    })
  }, [currentStep, steps])

  const validateStep = (stepIndex: number) => {
    const result = instructorRegisterSchema.safeParse({
      ...formData,
      yearsOfExperience: Number(formData.yearsOfExperience),
    })

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
      role: "instructor",
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
    setError("")
    setLoading(true)

    try {
      const validated = instructorRegisterSchema.parse({
        ...formData,
        yearsOfExperience: Number(formData.yearsOfExperience),
      })

      const res = await fetch("/api/auth/register-instructor", {
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
          role: "instructor",
          source: "signup",
        })

      trackOnboardingEvent("signup_submitted", {
        role: "instructor",
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
        role: "instructor",
      })
      setError(submitError?.issues?.[0]?.message || submitError?.message || "Please review the form and try again")
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
        id: "basics",
        title: "Teaching basics",
        onEdit: () => goToStep(1),
        items: [
          { label: "Phone number", value: formData.phoneNumber },
          { label: "Professional headline", value: formData.professionalHeadline },
          { label: "Specialties", value: formData.specialties },
          { label: "Years of experience", value: formData.yearsOfExperience },
        ],
      },
    ],
    [formData],
  )

  const aside = (
    <>
      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle className="text-base">Instructor onboarding</CardTitle>
          <CardDescription>
            Instructor signup now collects only the essentials. Bio, avatar, and profile polish continue after verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-2 font-medium text-foreground">
            <GraduationCap className="h-4 w-4 text-primary" /> What happens after verification
          </p>
          <p>You will land in the instructor welcome flow and can finish your public teaching profile from settings.</p>
          <p>OTP is still required before any real instructor account is stored.</p>
        </CardContent>
      </Card>

      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle className="text-base">What to prepare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Your strongest professional headline.</p>
          <p>Specialties students should recognize immediately.</p>
          <p>Bio and avatar can be added after activation.</p>
        </CardContent>
      </Card>
    </>
  )

  const footer = (
    <p>
      Already have an instructor account?{" "}
      <Link href="/login" className="font-medium text-primary hover:underline">
        Sign in
      </Link>
    </p>
  )

  return (
    <OnboardingShell
      badge="Instructor Registration"
      title="Create your instructor account"
      description="The backend verification rules stay the same, but signup is now reduced to the essentials before OTP."
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" autoFocus value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} disabled={loading} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <Input id="yearsOfExperience" type="number" min={0} max={60} value={formData.yearsOfExperience} onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })} disabled={loading} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="professionalHeadline">Professional Headline</Label>
              <Input
                id="professionalHeadline"
                placeholder="e.g. Registered Nurse and Geriatric Care Trainer"
                value={formData.professionalHeadline}
                onChange={(e) => setFormData({ ...formData, professionalHeadline: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties (comma separated)</Label>
              <Input
                id="specialties"
                placeholder="Elder care, CPR, Patient safety"
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">
              Bio, avatar, and other public profile details can be completed after email verification inside your instructor settings.
            </div>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="space-y-5">
            <OnboardingPreview sections={reviewSections} />
            <div className="flex items-start gap-2 rounded-2xl border bg-muted/30 p-4">
              <Checkbox id="acceptTerms" checked={formData.acceptTerms} onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked === true })} />
              <Label htmlFor="acceptTerms" className="text-sm font-normal leading-relaxed">
                I agree to the <Link href="/terms" className="text-primary hover:underline">Terms</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
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

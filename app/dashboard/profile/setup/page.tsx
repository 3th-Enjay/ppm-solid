"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2, Sparkles, Target } from "lucide-react"
import { OnboardingPreview, type OnboardingPreviewSection } from "@/components/auth/onboarding-preview"
import { OnboardingShell, type OnboardingShellStep } from "@/components/auth/onboarding-shell"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/lib/store"
import type { StudentGender, TrainingLocation } from "@/lib/types"

type ProfileCompletionTracker = {
  percent: number
  completedCount: number
  totalCount: number
  remainingLabels: string[]
}

const GENDER_OPTIONS: StudentGender[] = ["male", "female", "other", "prefer_not_to_say"]
const LOCATION_OPTIONS: TrainingLocation[] = ["enugu", "abuja"]

export default function ProfileSetupPage() {
  const router = useRouter()
  const { user, token, setAuth, hydrated } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [trackerLoading, setTrackerLoading] = useState(false)
  const [error, setError] = useState("")
  const [initialized, setInitialized] = useState(false)
  const [profileTracker, setProfileTracker] = useState<ProfileCompletionTracker | null>(null)

  const [formData, setFormData] = useState({
    gender: (user?.studentProfile?.gender || "prefer_not_to_say") as StudentGender,
    dateOfBirth: user?.studentProfile?.dateOfBirth || "",
    currentAddress: user?.studentProfile?.currentAddress || "",
    isHealthcareProfessional: user?.studentProfile?.isHealthcareProfessional ? "yes" : "no",
    currentRoleOrField: user?.studentProfile?.currentRoleOrField || "",
    preferredLocation: (user?.studentProfile?.preferredLocation || "enugu") as TrainingLocation,
    trainingInterest: user?.studentProfile?.trainingInterest || "",
    bio: user?.bio || "",
  })

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.replace("/login?redirect=/dashboard/profile/setup")
      return
    }
    if (user.role !== "student") {
      router.replace("/dashboard")
    }
  }, [hydrated, router, user])

  useEffect(() => {
    if (!user || initialized) return
    setFormData({
      gender: (user.studentProfile?.gender || "prefer_not_to_say") as StudentGender,
      dateOfBirth: user.studentProfile?.dateOfBirth || "",
      currentAddress: user.studentProfile?.currentAddress || "",
      isHealthcareProfessional: user.studentProfile?.isHealthcareProfessional ? "yes" : "no",
      currentRoleOrField: user.studentProfile?.currentRoleOrField || "",
      preferredLocation: (user.studentProfile?.preferredLocation || "enugu") as TrainingLocation,
      trainingInterest: user.studentProfile?.trainingInterest || "",
      bio: user.bio || "",
    })
    setInitialized(true)
  }, [initialized, user])

  useEffect(() => {
    if (!token || !user || user.role !== "student") return

    const loadTracker = async () => {
      setTrackerLoading(true)
      try {
        const res = await fetch("/api/onboarding/state", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        if (data?.profileCompletion) {
          setProfileTracker(data.profileCompletion as ProfileCompletionTracker)
        }
      } finally {
        setTrackerLoading(false)
      }
    }

    void loadTracker()
  }, [token, user])

  const steps = useMemo<OnboardingShellStep[]>(
    () => [
      {
        id: "personal",
        title: "Personal info",
        description: "Share the basic details that complete your learner profile.",
      },
      {
        id: "preferences",
        title: "Preferences",
        description: "Tell us more about your background and training goals.",
      },
      {
        id: "optional",
        title: "Optional details",
        description: "Add a short bio to personalize your student profile.",
      },
      {
        id: "review",
        title: "Review",
        description: "Confirm everything before saving to your profile.",
      },
    ],
    [],
  )

  const validateStep = (stepIndex: number) => {
    setError("")
    const stepId = steps[stepIndex]?.id

    if (stepId === "personal") {
      if (!formData.dateOfBirth || formData.currentAddress.trim().length < 5) {
        setError("Please complete your date of birth and address.")
        return false
      }
    }

    if (stepId === "preferences") {
      if (!formData.currentRoleOrField.trim() || formData.trainingInterest.trim().length < 10) {
        setError("Please complete your role and training interest.")
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setError("")
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    if (!user || !token) return
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/profile/setup", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok || !data?.user) {
        throw new Error(data?.error || "Unable to update profile")
      }

      setAuth(data.user, token)
      router.push("/dashboard/profile?setup=complete")
    } catch (updateError: any) {
      setError(updateError?.message || "Unable to update profile")
    } finally {
      setLoading(false)
    }
  }

  const reviewSections = useMemo<OnboardingPreviewSection[]>(
    () => [
      {
        id: "personal",
        title: "Personal info",
        onEdit: () => setCurrentStep(0),
        items: [
          { label: "Gender", value: formData.gender.replace(/_/g, " ") },
          { label: "Date of birth", value: formData.dateOfBirth },
          { label: "Address", value: formData.currentAddress },
        ],
      },
      {
        id: "preferences",
        title: "Preferences",
        onEdit: () => setCurrentStep(1),
        items: [
          { label: "Healthcare professional", value: formData.isHealthcareProfessional === "yes" ? "Yes" : "No" },
          { label: "Current role", value: formData.currentRoleOrField },
          { label: "Preferred location", value: formData.preferredLocation },
          { label: "Training interest", value: formData.trainingInterest },
        ],
      },
      {
        id: "optional",
        title: "Optional",
        onEdit: () => setCurrentStep(2),
        items: [{ label: "Bio", value: formData.bio || "Not provided" }],
      },
    ],
    [formData],
  )

  const remainingLabels = profileTracker?.remainingLabels || []

  if (!hydrated || !user || user.role !== "student") {
    return null
  }

  return (
    <OnboardingShell
      badge="Profile Setup"
      title="Complete your learner profile"
      description="Finish the deferred fields from signup so your learning experience can be personalized."
      currentStep={currentStep}
      steps={steps}
      aside={
        <div className="space-y-4">
          <Card className="border-primary/15">
            <CardHeader>
              <CardTitle className="text-base">Completion tracker</CardTitle>
              <CardDescription>See exactly what is left before your learner profile is fully complete.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">Current progress</span>
                  <span className="font-semibold text-primary">
                    {trackerLoading ? "..." : `${profileTracker?.percent ?? 0}%`}
                  </span>
                </div>
                <Progress value={profileTracker?.percent ?? 0} aria-label="Profile completion progress" />
                <p className="text-xs text-muted-foreground">
                  {trackerLoading
                    ? "Checking your current completion state..."
                    : `${profileTracker?.completedCount ?? 0} of ${profileTracker?.totalCount ?? 0} profile items complete.`}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="inline-flex items-center gap-2 font-medium text-foreground">
                  <Target className="h-4 w-4 text-primary" /> Remaining items
                </p>
                {remainingLabels.length > 0 ? (
                  remainingLabels.slice(0, 5).map((label) => (
                    <div key={label} className="flex items-start gap-2 rounded-xl border bg-background p-3 text-muted-foreground">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{label}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-2 rounded-xl border bg-background p-3 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Your profile is already complete. Review and update anything you want.</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/15">
            <CardHeader>
              <CardTitle className="text-base">Why this matters</CardTitle>
              <CardDescription>Completing your profile helps us tailor your experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2 font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-primary" /> Better recommendations
              </p>
              <p>We use these details to match you with the right courses, learning paths, and onsite cohorts.</p>
            </CardContent>
          </Card>
        </div>
      }
      footer={
        <p>
          Prefer to finish later? <Link href="/dashboard">Return to dashboard</Link>
        </p>
      }
    >
      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-6 rounded-2xl border bg-primary/5 p-4 text-sm">
        <p className="font-medium text-foreground">Profile setup funnel</p>
        <p className="mt-1 text-muted-foreground">
          We kept these heavier questions out of signup so you could create your account faster. This setup flow finishes the rest in one guided pass.
        </p>
      </div>

      {currentStep === 0 ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value as StudentGender })}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((gender) => (
                  <SelectItem key={gender} value={gender}>
                    {gender.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentAddress">Current address</Label>
            <Textarea
              id="currentAddress"
              value={formData.currentAddress}
              onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      ) : null}

      {currentStep === 1 ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="isHealthcareProfessional">Healthcare professional</Label>
            <Select
              value={formData.isHealthcareProfessional}
              onValueChange={(value) => setFormData({ ...formData, isHealthcareProfessional: value as "yes" | "no" })}
            >
              <SelectTrigger id="isHealthcareProfessional">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentRoleOrField">Current role or field</Label>
            <Input
              id="currentRoleOrField"
              value={formData.currentRoleOrField}
              onChange={(e) => setFormData({ ...formData, currentRoleOrField: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredLocation">Preferred location</Label>
            <Select
              value={formData.preferredLocation}
              onValueChange={(value) => setFormData({ ...formData, preferredLocation: value as TrainingLocation })}
            >
              <SelectTrigger id="preferredLocation">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_OPTIONS.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="trainingInterest">Why are you interested in this training?</Label>
            <Textarea
              id="trainingInterest"
              value={formData.trainingInterest}
              onChange={(e) => setFormData({ ...formData, trainingInterest: e.target.value })}
              rows={4}
            />
          </div>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio (optional)</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              placeholder="Tell us about yourself"
            />
          </div>
        </div>
      ) : null}

      {currentStep === 3 ? (
        <div className="space-y-5">
          <OnboardingPreview sections={reviewSections} />
          <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            Review your profile details and save to complete onboarding.
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 0 || loading}>
          Back
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button type="button" variant="cta" onClick={handleNext} disabled={loading}>
            Continue
          </Button>
        ) : (
          <Button type="button" variant="cta" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save profile"
            )}
          </Button>
        )}
      </div>
    </OnboardingShell>
  )
}

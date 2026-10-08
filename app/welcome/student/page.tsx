"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, CheckCircle2, Loader2, Sparkles, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getRoleHomePath } from "@/lib/role-routing"
import { useAuthStore } from "@/lib/store"

type StudentOnboardingState = {
  welcomeSeen: boolean
  profileCompletionPercent: number
  profileCompletion?: {
    percent: number
    completedCount: number
    totalCount: number
    remainingLabels: string[]
  }
  checklist: {
    completeProfile: boolean
    exploreCourses: boolean
    viewOnsiteTraining: boolean
  }
}

export default function StudentWelcomePage() {
  const router = useRouter()
  const { user, token, hydrated } = useAuthStore()
  const [state, setState] = useState<StudentOnboardingState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.replace("/login?redirect=/welcome/student")
      return
    }
    if (user.role !== "student") {
      router.replace(getRoleHomePath(user.role))
      return
    }

    const load = async () => {
      try {
        const [stateRes, patchRes] = await Promise.all([
          fetch("/api/onboarding/state", {
            headers: { Authorization: `Bearer ${token || ""}` },
          }),
          fetch("/api/onboarding/state", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token || ""}`,
            },
            body: JSON.stringify({ markWelcomeSeen: true }),
          }),
        ])

        const patched = patchRes.ok ? await patchRes.json() : null
        const current = stateRes.ok ? await stateRes.json() : null
        setState((patched || current) as StudentOnboardingState)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [hydrated, router, token, user])

  if (!hydrated || !user || user.role !== "student") {
    return null
  }

  if (loading || !state) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-5xl items-center justify-center px-4 py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const remainingLabels = state.profileCompletion?.remainingLabels || []
  const isProfileComplete = state.checklist.completeProfile

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-primary/15 shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl">
          <CardHeader className="space-y-4 border-b bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <p className="inline-flex w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Student Welcome
            </p>
            <div className="space-y-2">
              <CardTitle className="text-3xl">Welcome, {user.name}</CardTitle>
              <CardDescription className="max-w-2xl text-base">
                Your email is verified and your account is active. Start by finishing your learner record, then use the dashboard and profile hub to keep everything in sync.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="rounded-2xl border bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Profile completion</p>
                  <p className="text-sm text-muted-foreground">
                    {isProfileComplete
                      ? "Your learner hub is complete and ready to guide your next step."
                      : "Finish the rest of your learner record from guided setup so the profile hub and training record stay aligned."}
                  </p>
                </div>
                <p className="text-sm font-semibold text-primary">{state.profileCompletionPercent}%</p>
              </div>
              <Progress value={state.profileCompletionPercent} aria-label={`Profile completion ${state.profileCompletionPercent}%`} />
              <p className="mt-3 text-xs text-muted-foreground">
                {state.profileCompletion?.completedCount ?? 0} of {state.profileCompletion?.totalCount ?? 0} profile items complete.
              </p>
              {!isProfileComplete && remainingLabels.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {remainingLabels.slice(0, 4).map((label) => (
                    <span key={label} className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-primary/10 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-4 w-4 text-primary" /> Complete profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>{isProfileComplete ? "Review your learner record anytime from the profile hub." : "Finish the deferred learner questions and unlock tailored recommendations."}</p>
                  <Button asChild variant="cta" className="h-auto w-full whitespace-normal px-4 py-3 text-center leading-snug">
                    <Link href={isProfileComplete ? "/dashboard/profile" : "/dashboard/profile/setup"}>{isProfileComplete ? "Open learner hub" : "Continue guided setup"}</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary/10 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-primary" /> Explore courses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>Browse the course catalog and begin your learning path.</p>
                  <Button asChild variant="outline" className="h-auto w-full whitespace-normal bg-transparent px-4 py-3 text-center leading-snug">
                    <Link href="/courses">Browse courses</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary/10 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> Explore onsite pathway</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>Compare the premium onsite pathway from inside your dashboard without losing your online learner progress.</p>
                  <Button asChild variant="cta" className="h-auto w-full whitespace-normal px-4 py-3 text-center leading-snug">
                    <Link href="/dashboard/onsite-training">Open onsite pathway</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-primary/15">
            <CardHeader>
              <CardTitle className="text-base">Learner journey</CardTitle>
              <CardDescription>Use this as your first progress checklist.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3 rounded-2xl border bg-background p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Email verified</p>
                  <p className="text-muted-foreground">Your account has been activated successfully.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-background p-3">
                <CheckCircle2 className={`mt-0.5 h-4 w-4 ${state.checklist.completeProfile ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-medium">Complete profile</p>
                  <p className="text-muted-foreground">Current learner-record completion: {state.profileCompletionPercent}%.</p>
                </div>
              </div>
              {!state.checklist.completeProfile && remainingLabels.length > 0 ? (
                <div className="rounded-2xl border bg-muted/30 p-3 text-xs text-muted-foreground">
                  Still to finish: {remainingLabels.slice(0, 3).join(", ")}.
                </div>
              ) : null}
              <div className="flex items-start gap-3 rounded-2xl border bg-background p-3">
                <CheckCircle2 className={`mt-0.5 h-4 w-4 ${state.checklist.viewOnsiteTraining ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-medium">Explore onsite pathway</p>
                  <p className="text-muted-foreground">Optional premium upgrade that stays visible inside your authenticated learner hub.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button asChild variant="outline" className="h-auto w-full whitespace-normal bg-transparent px-4 py-3 text-center leading-snug">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}


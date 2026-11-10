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

type InstructorOnboardingState = {
  welcomeSeen: boolean
  profileCompletionPercent: number
  checklist: {
    completeProfile: boolean
    reviewPublishingGuidelines: boolean
    createFirstCourse: boolean
  }
}

export default function InstructorWelcomePage() {
  const router = useRouter()
  const { user, token, hydrated } = useAuthStore()
  const [state, setState] = useState<InstructorOnboardingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingGuidelines, setMarkingGuidelines] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.replace("/login?redirect=/welcome/instructor")
      return
    }
    if (user.role !== "instructor") {
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
        setState((patched || current) as InstructorOnboardingState)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [hydrated, router, token, user])

  const handleReviewGuidelines = async () => {
    setMarkingGuidelines(true)
    try {
      const res = await fetch("/api/onboarding/state", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ markPublishingGuidelinesReviewed: true }),
      })
      if (res.ok) {
        const data = await res.json()
        setState(data as InstructorOnboardingState)
      }
      router.push("/instructor")
    } finally {
      setMarkingGuidelines(false)
    }
  }

  if (!hydrated || !user || user.role !== "instructor") {
    return null
  }

  if (loading || !state) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-5xl items-center justify-center px-4 py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-primary/15 shadow-xl">
          <CardHeader className="space-y-4 border-b bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <p className="inline-flex w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Faculty Workspace Onboarding
            </p>
            <div className="space-y-2">
              <CardTitle className="text-3xl">Welcome to the Faculty Workspace, {user.name}</CardTitle>
              <CardDescription className="max-w-2xl text-base">
                Your instructor account is active. Prepare syllabus modules, author practical coding assignments, and publish high-impact technology courses.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="rounded-2xl border bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Teaching profile completion</p>
                  <p className="text-sm text-muted-foreground">Add your engineering bio, technical specialties, and avatar to complete your public profile.</p>
                </div>
                <p className="text-sm font-semibold text-primary">{state.profileCompletionPercent}%</p>
              </div>
              <Progress value={state.profileCompletionPercent} aria-label={`Profile completion ${state.profileCompletionPercent}%`} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-primary/10 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-4 w-4 text-primary" /> Complete profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>Add your technical bio, engineering specialties, and avatar from settings.</p>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/instructor/settings">Open settings</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary/10 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> Review guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>Confirm syllabus standards, practical coding lab requirements, and rubric expectations.</p>
                  <Button variant="outline" className="w-full bg-transparent" onClick={handleReviewGuidelines} disabled={markingGuidelines}>
                    {markingGuidelines ? "Continuing..." : "Review and continue"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary/10 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-primary" /> Author first course</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>Create a course structure, add curriculum modules, and configure assignments.</p>
                  <Button asChild variant="cta" className="w-full">
                    <Link href="/instructor/courses/new">Create course</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-primary/15">
            <CardHeader>
              <CardTitle className="text-base">First steps</CardTitle>
              <CardDescription>Your progression checklist as an academy instructor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3 rounded-2xl border bg-background p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">1. Email verified</p>
                  <p className="text-muted-foreground">Your instructor account is now active.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-background p-3">
                <CheckCircle2 className={`mt-0.5 h-4 w-4 ${state.checklist.completeProfile ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-medium">2. Teaching profile</p>
                  <p className="text-muted-foreground">Profile completion: {state.profileCompletionPercent}%.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-background p-3">
                <CheckCircle2 className={`mt-0.5 h-4 w-4 ${state.checklist.reviewPublishingGuidelines ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-medium">3. Publishing guidelines</p>
                  <p className="text-muted-foreground">Review technical expectations before publishing.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-background p-3">
                <CheckCircle2 className={`mt-0.5 h-4 w-4 ${state.checklist.createFirstCourse ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-medium">4. Author first course</p>
                  <p className="text-muted-foreground">Draft syllabus lessons and hands-on coding labs.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button asChild variant="cta" className="h-auto w-full whitespace-normal px-4 py-3 text-center leading-snug">
            <Link href="/instructor">Go to Instructor Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BadgeCheck, Save, Settings2, UserRound } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useAuthStore } from "@/lib/store"

export default function InstructorSettingsPage() {
  const { user, token, setAuth } = useAuthStore()
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [avatar, setAvatar] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [professionalHeadline, setProfessionalHeadline] = useState("")
  const [specialties, setSpecialties] = useState("")
  const [yearsOfExperience, setYearsOfExperience] = useState("0")
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!user) return
    setName(user.name || "")
    setBio(user.bio || "")
    setAvatar(user.avatar || "")
    setPhoneNumber(user.instructorProfile?.phoneNumber || "")
    setProfessionalHeadline(user.instructorProfile?.professionalHeadline || "")
    setSpecialties((user.instructorProfile?.specialties || []).join(", "))
    setYearsOfExperience(String(user.instructorProfile?.yearsOfExperience || 0))
  }, [user])

  const completion = useMemo(() => {
    const checks = [
      Boolean(name.trim()),
      Boolean(bio.trim()),
      Boolean(avatar.trim()),
      Boolean(phoneNumber.trim()),
      Boolean(professionalHeadline.trim()),
      Boolean(specialties.trim()),
      Number(yearsOfExperience || 0) > 0,
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [avatar, bio, name, phoneNumber, professionalHeadline, specialties, yearsOfExperience])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setSuccessMessage("")
    setErrorMessage("")
    try {
      const parsedSpecialties = specialties
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
      const includeInstructorProfile =
        phoneNumber.trim().length > 0 &&
        professionalHeadline.trim().length > 0 &&
        parsedSpecialties.length > 0

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          name: name.trim() || undefined,
          bio: bio.trim() || undefined,
          avatar: avatar.trim() || undefined,
          instructorProfile: includeInstructorProfile
            ? {
                phoneNumber: phoneNumber.trim(),
                professionalHeadline: professionalHeadline.trim(),
                specialties: parsedSpecialties,
                yearsOfExperience: Number(yearsOfExperience || 0),
              }
            : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile")
      }
      if (data.user) {
        setAuth(data.user, token || "")
      }
      setSuccessMessage("Profile updated successfully.")
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to update profile.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="space-y-4">
        <Link href="/instructor">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Card variant="elevated" className="overflow-hidden border-sky-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_36%),linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(248,250,252,0.92)_56%,rgba(240,249,255,0.88)_100%)]">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.4fr_1fr] lg:p-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
                <Settings2 className="h-4 w-4" />
                Instructor settings
              </div>
              <div>
                <h1 className="text-3xl font-bold md:text-4xl">Complete your teaching profile</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Finish the public profile details that were deferred until after verification. This is the profile learners see when they decide whether to trust your courses.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Profile strength</p>
              <p className="mt-2 text-3xl font-semibold">{completion}%</p>
              <Progress value={completion} className="mt-3 h-2" />
              <p className="mt-3 text-sm text-muted-foreground">
                Fill in your bio, specialties, and teaching credentials so the instructor side feels complete and trustworthy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {successMessage ? (
        <Alert>
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>These details appear on your instructor profile and round out the post-verification onboarding flow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell students about your background" className="min-h-32" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input id="avatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+234..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <Input id="yearsOfExperience" type="number" min={0} max={60} value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="professionalHeadline">Professional Headline</Label>
              <Input id="professionalHeadline" value={professionalHeadline} onChange={(e) => setProfessionalHeadline(e.target.value)} placeholder="Registered Nurse and Caregiving Instructor" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="specialties">Specialties (comma separated)</Label>
              <Input id="specialties" value={specialties} onChange={(e) => setSpecialties(e.target.value)} placeholder="Elder care, CPR, Patient safety" />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserRound className="h-4 w-4 text-primary" />
                What learners need to trust
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">A clear headline helps learners immediately understand your teaching strength.</div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">Your bio should explain why your background makes this course credible.</div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">Specialties help surface the right expertise when learners compare instructors.</div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
                Profile checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2">
                <span>Public identity</span>
                <span className="text-muted-foreground">{name.trim() && avatar.trim() ? "Ready" : "Needs work"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2">
                <span>Teaching credibility</span>
                <span className="text-muted-foreground">{professionalHeadline.trim() && Number(yearsOfExperience || 0) > 0 ? "Ready" : "Needs work"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2">
                <span>Specialty clarity</span>
                <span className="text-muted-foreground">{specialties.trim() ? "Ready" : "Needs work"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2">
                <span>Contact readiness</span>
                <span className="text-muted-foreground">{phoneNumber.trim() ? "Ready" : "Needs work"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

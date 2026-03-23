"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
    <div className="p-8">
      <div className="mb-6">
        <Link href="/instructor">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Instructor Settings</h1>
        <p className="text-muted-foreground mt-2">Finish the public profile details that were deferred until after verification.</p>
      </div>

      {successMessage && (
        <Alert className="mb-6">
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="mb-6" variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>These details appear on your instructor profile and complete the post-verification onboarding flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell students about your background"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+234..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="yearsOfExperience">Years of Experience</Label>
              <Input
                id="yearsOfExperience"
                type="number"
                min={0}
                max={60}
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="professionalHeadline">Professional Headline</Label>
            <Input
              id="professionalHeadline"
              value={professionalHeadline}
              onChange={(e) => setProfessionalHeadline(e.target.value)}
              placeholder="Registered Nurse and Caregiving Instructor"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="specialties">Specialties (comma separated)</Label>
            <Input
              id="specialties"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              placeholder="Elder care, CPR, Patient safety"
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}


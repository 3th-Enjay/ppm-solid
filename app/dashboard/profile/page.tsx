"use client"

import Link from "next/link"
import { useState } from "react"
import { motion } from "framer-motion"
import { CalendarDays, CreditCard, Eye, EyeOff, Save, ShieldCheck, UserIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuthStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { getTrainingLocationLabel, ONSITE_TRAINING } from "@/lib/student-registration"

export default function ProfilePage() {
  const { user, token, setAuth } = useAuthStore()
  const { toast } = useToast()
  const [savingProfile, setSavingProfile] = useState(false)
  const [showTrainingModal, setShowTrainingModal] = useState(false)
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const studentProfile = user?.studentProfile
  const isOnsiteProfile = Boolean(
    studentProfile &&
      (studentProfile.trainingMode === "onsite" ||
        (!studentProfile.trainingMode && (studentProfile.registrationFeeNgn || 0) > 0)),
  )

  const handleSave = async () => {
    if (!user || !token) return
    setSavingProfile(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name.trim(),
          bio: profile.bio.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.user) {
        throw new Error(data?.error || "Failed to update profile")
      }

      setAuth(data.user, token)
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordUpdate = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await fetch("/api/users/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password")
      }

      toast({
        title: "Password updated",
        description: "Your password was updated successfully.",
      })
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update password",
        variant: "destructive",
      })
    }
  }

  return (
    <motion.div
      className="space-y-8 p-4 md:p-6 lg:p-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div>
        <h1 className="text-3xl font-bold text-balance">Student Profile</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account and view your registration details.
        </p>
      </div>

      <Tabs defaultValue="training" className="max-w-4xl">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="training">Training Profile</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="training">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>{studentProfile?.formTitle || ONSITE_TRAINING.formTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {studentProfile ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Full Name</p>
                      <p className="font-medium">{user?.name}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Phone Number</p>
                      <p className="font-medium">{studentProfile.phoneNumber}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">WhatsApp Number</p>
                      <p className="font-medium">{studentProfile.whatsappNumber}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">{studentProfile.gender.replace(/_/g, " ")}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{studentProfile.dateOfBirth}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Preferred Location</p>
                      <p className="font-medium">
                        {getTrainingLocationLabel(studentProfile.preferredLocation)} -{" "}
                        {studentProfile.preferredLocationStartDate}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Healthcare Professional</p>
                      <p className="font-medium">
                        {studentProfile.isHealthcareProfessional ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground">Current Role or Field</p>
                    <p className="font-medium">{studentProfile.currentRoleOrField}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground">Current Address</p>
                    <p className="font-medium">{studentProfile.currentAddress}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground">Why Interested</p>
                    <p className="font-medium">{studentProfile.trainingInterest}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {isOnsiteProfile ? (
                      <>
                        <div className="rounded-lg border p-3">
                          <p className="text-muted-foreground">Payment Status</p>
                          <p className="font-medium">
                            {studentProfile.paymentStatus === "yes" ? "Paid" : "Not yet paid"}
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-muted-foreground">Payment Reference</p>
                          <p className="font-medium">{studentProfile.paymentReference || "Not provided"}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-muted-foreground">Registration Fee</p>
                          <p className="font-medium">NGN {studentProfile.registrationFeeNgn.toLocaleString("en-NG")}</p>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground">Access Model</p>
                        <p className="font-medium">Online students purchase courses to unlock paid content.</p>
                      </div>
                    )}
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Submitted</p>
                      <p className="font-medium">
                        {new Date(studentProfile.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setShowTrainingModal(true)} variant="outline">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      View Program Summary
                    </Button>
                    {isOnsiteProfile && studentProfile.paymentLink ? (
                      <Button asChild variant="cta">
                        <Link href="/dashboard/onsite-training">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Open Payment Link
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No training registration details found for this account.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <UserIcon className="h-10 w-10 text-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profile.email} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <Button onClick={handleSave} className="w-full" disabled={savingProfile}>
                <Save className="mr-2 h-4 w-4" />
                {savingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button onClick={handlePasswordUpdate} className="w-full">
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showTrainingModal} onOpenChange={setShowTrainingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Program Summary</DialogTitle>
            <DialogDescription>
              Your submitted registration details for Prompt Care Academy.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 px-6 pb-2 text-sm">
            <p>{ONSITE_TRAINING.durationDays} Days Intensive Training</p>
            <p>{ONSITE_TRAINING.hours}+ Hours (Theory & Practical)</p>
            <p>International Certification</p>
            <p>Internship Support</p>
            <p className="inline-flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Support: {ONSITE_TRAINING.supportPhone}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTrainingModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}



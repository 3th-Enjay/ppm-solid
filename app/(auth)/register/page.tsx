"use client"

import type React from "react"

import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ONSITE_TRAINING, getTrainingLocationLabel } from "@/lib/student-registration"
import { registerSchema } from "@/lib/validation"

type RegisterFormData = {
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
  paymentStatus: "yes" | "no"
  paymentReference: string
  agreedSlotSecured: boolean
  agreedDetailsCorrect: boolean
  acceptTerms: boolean
}

const STEPS = [
  "Personal Information",
  "Quick Background",
  "Training Details",
  "Payment & Agreement",
] as const

const CARD_ANIMATION = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.25 },
}

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [stepIndex, setStepIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showBenefitsModal, setShowBenefitsModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<RegisterFormData>({
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
    paymentStatus: "no",
    paymentReference: "",
    agreedSlotSecured: false,
    agreedDetailsCorrect: false,
    acceptTerms: false,
  })

  const selectedLocationLabel = useMemo(
    () => getTrainingLocationLabel(formData.preferredLocation),
    [formData.preferredLocation],
  )

  const validateStep = () => {
    if (stepIndex === 0) {
      if (
        !formData.name.trim() ||
        !formData.email.trim() ||
        !formData.phoneNumber.trim() ||
        !formData.whatsappNumber.trim() ||
        !formData.dateOfBirth ||
        !formData.currentAddress.trim()
      ) {
        setError("Please complete all personal information fields.")
        return false
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.")
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords don't match.")
        return false
      }
    }

    if (stepIndex === 1 && !formData.currentRoleOrField.trim()) {
      setError("Please enter your current role or field.")
      return false
    }

    if (stepIndex === 2 && formData.trainingInterest.trim().length < 10) {
      setError("Tell us why you are interested in this training.")
      return false
    }

    if (stepIndex === 3) {
      if (!formData.agreedSlotSecured || !formData.agreedDetailsCorrect) {
        setError("Please accept both agreement checkboxes.")
        return false
      }
      if (!formData.acceptTerms) {
        setError("Please accept the terms and privacy policy.")
        return false
      }
    }

    setError("")
    return true
  }

  const goNext = () => {
    if (!validateStep()) return
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1))
  }

  const goBack = () => {
    setError("")
    setStepIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep()) return
    setLoading(true)
    setError("")

    try {
      const validated = registerSchema.parse({
        ...formData,
        role: "student",
      })

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      })
      const result = await res.json()

      if (!res.ok || !result?.user) {
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
        }, 1400)
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl py-8"
    >
      <Card className="overflow-hidden border-primary/15 shadow-lg">
        <div className="bg-gradient-to-r from-primary/95 via-primary to-accent p-6 text-primary-foreground">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-background/20 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            On-Site Training Registration Form
          </p>
          <h1 className="text-2xl font-bold md:text-3xl">{ONSITE_TRAINING.formTitle}</h1>
          <p className="mt-2 max-w-3xl text-sm text-primary-foreground/90">{ONSITE_TRAINING.formDescription}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-background/20 px-3 py-1">Enugu & Abuja</span>
            <span className="rounded-full bg-background/20 px-3 py-1">21 Days Intensive Training</span>
            <span className="rounded-full bg-background/20 px-3 py-1">International Certification</span>
            <span className="rounded-full bg-background/20 px-3 py-1">
              ₦{ONSITE_TRAINING.registrationFeeNgn.toLocaleString("en-NG")}
            </span>
            <span className="rounded-full bg-background/20 px-3 py-1">Limited Slots Available</span>
          </div>
        </div>

        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Step {stepIndex + 1} of {STEPS.length}</CardTitle>
          <CardDescription>{STEPS[stepIndex]}</CardDescription>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {STEPS.map((label, idx) => (
              <div
                key={label}
                className={`h-1.5 rounded-full ${idx <= stepIndex ? "bg-primary" : "bg-muted"}`}
                aria-hidden
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              <motion.div key={stepIndex} {...CARD_ANIMATION} className="space-y-4">
                {stepIndex === 0 ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          disabled={loading}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          disabled={loading}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                        <Input
                          id="whatsappNumber"
                          value={formData.whatsappNumber}
                          onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              gender: value as RegisterFormData["gender"],
                            })
                          }
                          disabled={loading}
                        >
                          <SelectTrigger id="gender">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
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
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentAddress">Current Address</Label>
                      <Textarea
                        id="currentAddress"
                        value={formData.currentAddress}
                        onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                        disabled={loading}
                        required
                      />
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
                            onChange={(e) =>
                              setFormData({ ...formData, confirmPassword: e.target.value })
                            }
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
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}

                {stepIndex === 1 ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="isHealthcareProfessional">Are you a healthcare professional?</Label>
                      <Select
                        value={formData.isHealthcareProfessional}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            isHealthcareProfessional: value as "yes" | "no",
                          })
                        }
                        disabled={loading}
                      >
                        <SelectTrigger id="isHealthcareProfessional">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentRoleOrField">
                        Your current role or field (Student, Nurse, Caregiver, Other)
                      </Label>
                      <Input
                        id="currentRoleOrField"
                        value={formData.currentRoleOrField}
                        onChange={(e) =>
                          setFormData({ ...formData, currentRoleOrField: e.target.value })
                        }
                        disabled={loading}
                        required
                      />
                    </div>
                    <Card className="border-accent/30 bg-accent/5">
                      <CardContent className="p-4 text-sm">
                        <p className="font-medium">Quick and simple onboarding.</p>
                        <p className="mt-1 text-muted-foreground">
                          No stress, no long form. You are almost done.
                        </p>
                      </CardContent>
                    </Card>
                  </>
                ) : null}

                {stepIndex === 2 ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="preferredLocation">Preferred Location</Label>
                      <Select
                        value={formData.preferredLocation}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            preferredLocation: value as "enugu" | "abuja",
                          })
                        }
                        disabled={loading}
                      >
                        <SelectTrigger id="preferredLocation">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enugu">Enugu - Starts March 9, 2026</SelectItem>
                          <SelectItem value="abuja">Abuja - Starts March 23, 2026</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trainingInterest">Why are you interested in this training?</Label>
                      <Textarea
                        id="trainingInterest"
                        rows={4}
                        value={formData.trainingInterest}
                        onChange={(e) =>
                          setFormData({ ...formData, trainingInterest: e.target.value })
                        }
                        disabled={loading}
                        required
                      />
                    </div>
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
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-3"
                          onClick={() => setShowBenefitsModal(true)}
                        >
                          View Program Benefits
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                ) : null}

                {stepIndex === 3 ? (
                  <>
                    <Card className="border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Payment</CardTitle>
                        <CardDescription>
                          Your registration is only confirmed after payment.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-lg border border-dashed border-primary/35 p-4 text-sm">
                          <p>
                            Registration Fee:{" "}
                            <span className="font-semibold text-foreground">
                              ₦{ONSITE_TRAINING.registrationFeeNgn.toLocaleString("en-NG")}
                            </span>
                          </p>
                          <a
                            href={ONSITE_TRAINING.paymentLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex text-primary underline-offset-4 hover:underline"
                          >
                            Open {ONSITE_TRAINING.paymentProviderHint} Payment Link
                          </a>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="paymentStatus">Have you made payment?</Label>
                          <Select
                            value={formData.paymentStatus}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                paymentStatus: value as "yes" | "no",
                              })
                            }
                            disabled={loading}
                          >
                            <SelectTrigger id="paymentStatus">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="paymentReference">Payment Reference (Optional)</Label>
                          <Input
                            id="paymentReference"
                            value={formData.paymentReference}
                            onChange={(e) =>
                              setFormData({ ...formData, paymentReference: e.target.value })
                            }
                            placeholder="e.g. PSTK_123456789"
                            disabled={loading}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-accent/35 bg-accent/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Agreement</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id="agreedSlotSecured"
                            checked={formData.agreedSlotSecured}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                agreedSlotSecured: checked === true,
                              })
                            }
                          />
                          <Label htmlFor="agreedSlotSecured" className="text-sm font-normal">
                            I understand my slot is only secured after payment
                          </Label>
                        </div>
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id="agreedDetailsCorrect"
                            checked={formData.agreedDetailsCorrect}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                agreedDetailsCorrect: checked === true,
                              })
                            }
                          />
                          <Label htmlFor="agreedDetailsCorrect" className="text-sm font-normal">
                            I confirm my details are correct
                          </Label>
                        </div>
                        <div className="flex items-start gap-2 border-t pt-3">
                          <Checkbox
                            id="acceptTerms"
                            checked={formData.acceptTerms}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                acceptTerms: checked === true,
                              })
                            }
                          />
                          <Label htmlFor="acceptTerms" className="text-sm font-normal leading-relaxed">
                            I agree to the{" "}
                            <Link href="/terms" className="text-primary hover:underline">
                              Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" className="text-primary hover:underline">
                              Privacy Policy
                            </Link>
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Selected location: {selectedLocationLabel}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={goBack} disabled={stepIndex === 0 || loading}>
                  Back
                </Button>
                {stepIndex < STEPS.length - 1 ? (
                  <Button type="button" onClick={goNext} disabled={loading}>
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
                      "Complete Registration"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>

      <Dialog open={showBenefitsModal} onOpenChange={setShowBenefitsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Training Benefits</DialogTitle>
            <DialogDescription>
              What you get after joining Prompt Care Academy&apos;s on-site training.
            </DialogDescription>
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
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Registration Received
            </DialogTitle>
            <DialogDescription>
              Your account was created and verification code has been sent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 px-6 pb-1 text-sm">
            <p>Thank you for registering for Prompt Care Academy.</p>
            <p>Your slot will only be confirmed after payment.</p>
            <p className="inline-flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              For inquiries: {ONSITE_TRAINING.supportPhone}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSuccessModal(false)}>Continue to Verification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

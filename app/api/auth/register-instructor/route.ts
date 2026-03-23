import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { authService } from "@/lib/auth"
import { recordOnboardingEvent } from "@/lib/onboarding-event-log"
import { buildVerifyOtpRoute, getOtpResendCooldownSeconds } from "@/lib/onboarding-flow"
import { instructorRegisterSchema } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = instructorRegisterSchema.parse(body)

    const specialties = validated.specialties
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)

    const result = await authService.registerWithOtp(
      validated.email,
      validated.password,
      validated.name,
      "instructor",
      undefined,
      {
        instructorProfile: {
          phoneNumber: validated.phoneNumber,
          professionalHeadline: validated.professionalHeadline,
          specialties,
          yearsOfExperience: Number(validated.yearsOfExperience),
        },
      },
    )

    const otpResendCooldownSeconds = getOtpResendCooldownSeconds()
    await recordOnboardingEvent({
      name: "signup_submitted",
      role: "instructor",
      mode: "online",
      source: "signup",
      status: "pending_otp",
    })

    return NextResponse.json({
      success: true,
      pendingRegistration: result.pendingRegistration,
      message: "OTP sent to email",
      email: validated.email.trim().toLowerCase(),
      role: "instructor",
      nextRoute: buildVerifyOtpRoute({
        email: validated.email,
        role: "instructor",
        source: "signup",
        cooldownSeconds: otpResendCooldownSeconds,
      }),
      otpResendCooldownSeconds,
    })
  } catch (error) {
    console.error("Instructor register error:", error)
    if (error instanceof Error && error.message === "User already exists") {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in or reset your password instead." },
        { status: 409 },
      )
    }
    if (error instanceof Error && error.message === "Failed to save pending registration") {
      return NextResponse.json({ error: "Registration failed after OTP dispatch. Please try again." }, { status: 500 })
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof Error && /send/i.test(error.message) && /otp|email/i.test(error.message)) {
      return NextResponse.json({ error: "Unable to send OTP email. No account was created." }, { status: 502 })
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { authService } from "@/lib/auth"
import { getDB } from "@/lib/db"
import { recordOnboardingEvent } from "@/lib/onboarding-event-log"
import { getOtpResendCooldownSeconds, maskEmailAddress } from "@/lib/onboarding-flow"
import { otpResendSchema } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = otpResendSchema.parse(body)
    const normalizedEmail = validated.email.trim().toLowerCase()
    const db = getDB() as any
    const pendingRegistration = typeof db.findPendingRegistrationByEmail === "function"
      ? await db.findPendingRegistrationByEmail(normalizedEmail)
      : undefined
    const existingUser = typeof db.findUserByEmail === "function" ? await db.findUserByEmail(normalizedEmail) : undefined
    const resolvedRole = pendingRegistration?.role || existingUser?.role

    const result = await authService.resendOtp(normalizedEmail)
    if (!result.ok) {
      if (result.reason === "not_found_or_verified") {
        const isVerified = Boolean(existingUser?.emailVerified)
        await recordOnboardingEvent({
          name: "otp_resend_requested",
          role: resolvedRole,
          source: "signup",
          status: isVerified ? "already_verified" : "not_found",
          metadata: { email: normalizedEmail },
        })
        return NextResponse.json({
          success: true,
          email: normalizedEmail,
          message: isVerified
            ? "This email is already verified. Sign in instead of requesting another OTP."
            : "No pending verification was found for this email.",
          otpResendCooldownSeconds: 0,
        })
      }
      await recordOnboardingEvent({
        name: "otp_resend_requested",
        role: resolvedRole,
        source: "signup",
        status: "email_send_failed",
        metadata: { email: normalizedEmail },
      })
      return NextResponse.json(
        { error: "OTP email could not be sent. Please try again shortly." },
        { status: 502 },
      )
    }

    await recordOnboardingEvent({
      name: "otp_resend_requested",
      role: resolvedRole,
      source: "signup",
      status: "resent",
      metadata: { email: normalizedEmail },
    })

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      message: "OTP resent",
      maskedDestination: maskEmailAddress(normalizedEmail),
      otpResendCooldownSeconds: getOtpResendCooldownSeconds(),
    })
  } catch (error) {
    console.error("Resend OTP error:", error)
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Failed to resend OTP" }, { status: 500 })
  }
}


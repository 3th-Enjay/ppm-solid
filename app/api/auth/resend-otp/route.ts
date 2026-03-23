import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { authService } from "@/lib/auth"
import { getOtpResendCooldownSeconds, maskEmailAddress } from "@/lib/onboarding-flow"
import { otpResendSchema } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = otpResendSchema.parse(body)
    const normalizedEmail = validated.email.trim().toLowerCase()

    const result = await authService.resendOtp(normalizedEmail)
    if (!result.ok) {
      if (result.reason === "not_found_or_verified") {
        return NextResponse.json({
          success: true,
          email: normalizedEmail,
          message: "Account is already verified or unavailable for OTP resend.",
          otpResendCooldownSeconds: 0,
        })
      }
      return NextResponse.json(
        { error: "OTP email could not be sent. Please try again shortly." },
        { status: 502 },
      )
    }

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
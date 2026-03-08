import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { otpResendSchema } from "@/lib/validation"
import { ZodError } from "zod"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = otpResendSchema.parse(body)

    const result = await authService.resendOtp(validated.email)
    if (!result.ok) {
      if (result.reason === "not_found_or_verified") {
        // Avoid noisy client-facing 400s during OTP UX retries.
        return NextResponse.json({
          success: true,
          message: "Account is already verified or unavailable for OTP resend.",
        })
      }
      return NextResponse.json(
        { error: "OTP email could not be sent. Please try again shortly." },
        { status: 502 },
      )
    }

    return NextResponse.json({ success: true })
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

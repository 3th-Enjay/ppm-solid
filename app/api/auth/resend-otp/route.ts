import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { otpResendSchema } from "@/lib/validation"
import { ZodError } from "zod"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = otpResendSchema.parse(body)

    const success = await authService.resendOtp(validated.email)
    if (!success) {
      return NextResponse.json({ error: "Unable to resend OTP" }, { status: 400 })
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

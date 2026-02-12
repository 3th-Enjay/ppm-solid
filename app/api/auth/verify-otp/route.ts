import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { otpVerifySchema } from "@/lib/validation"
import { ZodError } from "zod"
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = otpVerifySchema.parse(body)

    const result = await authService.verifyOtp(validated.email, validated.otp)

    if (!result) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Send welcome email (non-blocking if it fails)
    try {
      await sendWelcomeEmail({ to: result.user.email, name: result.user.name, role: result.user.role })
    } catch (err) {
      console.error("Failed to send welcome email:", err)
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

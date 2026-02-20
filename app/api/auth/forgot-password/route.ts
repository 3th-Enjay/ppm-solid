import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { forgotPasswordSchema } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = forgotPasswordSchema.parse(body)

    await authService.requestPasswordReset(validated.email)

    // Always return success to not reveal if user exists
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}




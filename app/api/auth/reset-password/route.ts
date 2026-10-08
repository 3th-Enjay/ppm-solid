import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { resetPasswordSchema } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = resetPasswordSchema.parse(body)

    const success = await authService.resetPassword(
      validated.email,
      validated.token,
      validated.newPassword
    )

    if (!success) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully.",
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}





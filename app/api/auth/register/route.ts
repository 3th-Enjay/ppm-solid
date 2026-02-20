import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { registerSchema } from "@/lib/validation"
import { ZodError } from "zod"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validated = registerSchema.parse(body)

    // Attempt registration
    const role = validated.role || "student"
    if (role === "admin" || role === "finance") {
      return NextResponse.json(
        { error: "Admin and Finance accounts must be created by an administrator." },
        { status: 403 }
      )
    }

    const result = await authService.registerWithOtp(
      validated.email,
      validated.password,
      validated.name,
      role
    )

    return NextResponse.json({
      success: true,
      user: result.user,
      message: "OTP sent to email",
    })
  } catch (error) {
    console.error("Register error:", error)
    if (error instanceof Error && error.message === "User already exists") {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}

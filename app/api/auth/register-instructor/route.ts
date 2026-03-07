import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { authService } from "@/lib/auth"
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
        bio: validated.bio,
        avatar: validated.avatar?.trim() || undefined,
        instructorProfile: {
          phoneNumber: validated.phoneNumber,
          professionalHeadline: validated.professionalHeadline,
          specialties,
          yearsOfExperience: Number(validated.yearsOfExperience),
        },
      },
    )

    return NextResponse.json({
      success: true,
      user: result.user,
      message: "OTP sent to email",
    })
  } catch (error) {
    console.error("Instructor register error:", error)
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

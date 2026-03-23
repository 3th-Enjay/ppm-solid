import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { authService } from "@/lib/auth"
import { buildVerifyOtpRoute, getOtpResendCooldownSeconds } from "@/lib/onboarding-flow"
import { getTrainingLocationStartDate, ONLINE_TRAINING } from "@/lib/student-registration"
import { studentRegisterSchema } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = studentRegisterSchema.parse(body)
    const role = "student"

    const result = await authService.registerWithOtp(validated.email, validated.password, validated.name, role, {
      trainingMode: "online",
      formTitle: ONLINE_TRAINING.formTitle,
      phoneNumber: validated.phoneNumber,
      whatsappNumber: validated.whatsappNumber?.trim() || validated.phoneNumber,
      gender: "prefer_not_to_say",
      dateOfBirth: "",
      currentAddress: "",
      isHealthcareProfessional: false,
      currentRoleOrField: "",
      preferredLocation: "enugu",
      preferredLocationStartDate: getTrainingLocationStartDate("enugu"),
      trainingInterest: "",
      registrationFeeNgn: 0,
      paymentStatus: "no",
      paymentLink: "",
      agreedSlotSecured: false,
      agreedDetailsCorrect: true,
    })

    const otpResendCooldownSeconds = getOtpResendCooldownSeconds()

    return NextResponse.json({
      success: true,
      pendingRegistration: result.pendingRegistration,
      message: "OTP sent to email",
      email: validated.email.trim().toLowerCase(),
      role,
      mode: "online",
      nextRoute: buildVerifyOtpRoute({
        email: validated.email,
        role,
        source: "signup",
        cooldownSeconds: otpResendCooldownSeconds,
      }),
      otpResendCooldownSeconds,
    })
  } catch (error) {
    console.error("Register error:", error)
    if (error instanceof Error && error.message === "User already exists") {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
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

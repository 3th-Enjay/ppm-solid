import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { registerSchema } from "@/lib/validation"
import { ZodError } from "zod"
import {
  getTrainingLocationStartDate,
  ONSITE_TRAINING,
} from "@/lib/student-registration"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validated = registerSchema.parse(body)

    // Public registration for this flow is student-only.
    const role = "student"

    const result = await authService.registerWithOtp(
      validated.email,
      validated.password,
      validated.name,
      role,
      {
        formTitle: ONSITE_TRAINING.formTitle,
        phoneNumber: validated.phoneNumber,
        whatsappNumber: validated.whatsappNumber,
        gender: validated.gender,
        dateOfBirth: validated.dateOfBirth,
        currentAddress: validated.currentAddress,
        isHealthcareProfessional: validated.isHealthcareProfessional === "yes",
        currentRoleOrField: validated.currentRoleOrField,
        preferredLocation: validated.preferredLocation,
        preferredLocationStartDate: getTrainingLocationStartDate(validated.preferredLocation),
        trainingInterest: validated.trainingInterest,
        registrationFeeNgn: ONSITE_TRAINING.registrationFeeNgn,
        paymentStatus: validated.paymentStatus,
        paymentReference: validated.paymentReference?.trim() || undefined,
        paymentLink: ONSITE_TRAINING.paymentLink,
        agreedSlotSecured: validated.agreedSlotSecured,
        agreedDetailsCorrect: validated.agreedDetailsCorrect,
      }
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

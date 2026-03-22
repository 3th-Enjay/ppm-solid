import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { registerSchema } from "@/lib/validation"
import { ZodError } from "zod"
import {
  getTrainingLocationStartDate,
  ONLINE_TRAINING,
  ONSITE_TRAINING,
} from "@/lib/student-registration"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = registerSchema.parse(body)
    const role = "student"

    const result =
      validated.registrationType === "onsite"
        ? await authService.registerWithOtp(validated.email, validated.password, validated.name, role, {
            trainingMode: "onsite",
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
            paymentStatus: "no",
            paymentReference: undefined,
            paymentLink: ONSITE_TRAINING.paymentLink,
            agreedSlotSecured: validated.agreedSlotSecured,
            agreedDetailsCorrect: validated.agreedDetailsCorrect,
          })
        : await authService.registerWithOtp(validated.email, validated.password, validated.name, role, {
            trainingMode: "online",
            formTitle: ONLINE_TRAINING.formTitle,
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
            registrationFeeNgn: 0,
            paymentStatus: "no",
            paymentLink: "",
            agreedSlotSecured: false,
            agreedDetailsCorrect: validated.agreedDetailsCorrect,
          })

    return NextResponse.json({
      success: true,
      pendingRegistration: result.pendingRegistration,
      message: "OTP sent to email",
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

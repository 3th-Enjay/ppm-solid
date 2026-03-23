import { NextResponse } from "next/server"
import { z } from "zod"
import { authService } from "@/lib/auth"
import { getDB } from "@/lib/db"
import { getTokenFromRequest } from "@/lib/jwt"
import { getTrainingLocationStartDate, ONLINE_TRAINING } from "@/lib/student-registration"
import type { StudentRegistrationProfile } from "@/lib/types"

const profileSetupSchema = z.object({
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  currentAddress: z.string().min(5, "Current address is required"),
  isHealthcareProfessional: z.enum(["yes", "no"]),
  currentRoleOrField: z.string().min(2, "Current role or field is required"),
  preferredLocation: z.enum(["enugu", "abuja"]),
  trainingInterest: z.string().min(10, "Tell us why you are interested in this training"),
  bio: z.string().optional(),
})

export async function PATCH(request: Request) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await authService.getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validated = profileSetupSchema.parse(body)

    const existingStudentProfile = user.studentProfile as StudentRegistrationProfile | undefined
    const existingProfile = existingStudentProfile || {
      trainingMode: "online",
      formTitle: ONLINE_TRAINING.formTitle,
      phoneNumber: user.email,
      whatsappNumber: user.email,
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
      agreedDetailsCorrect: true,
      submittedAt: new Date(),
    }

    const updatedProfile = {
      ...existingProfile,
      gender: validated.gender,
      dateOfBirth: validated.dateOfBirth,
      currentAddress: validated.currentAddress,
      isHealthcareProfessional: validated.isHealthcareProfessional === "yes",
      currentRoleOrField: validated.currentRoleOrField,
      preferredLocation: validated.preferredLocation,
      preferredLocationStartDate: getTrainingLocationStartDate(validated.preferredLocation),
      trainingInterest: validated.trainingInterest,
    }

    const db = getDB()
    const updatedUser = await db.updateUser(user.id, {
      bio: validated.bio?.trim() || user.bio,
      studentProfile: updatedProfile,
    })

    if (!updatedUser) {
      return NextResponse.json({ error: "Unable to update profile" }, { status: 500 })
    }

    const { password: _, ...safeUser } = updatedUser
    return NextResponse.json({ user: safeUser })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Unable to update profile" }, { status: 500 })
  }
}


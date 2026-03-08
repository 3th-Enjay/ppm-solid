import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { authService } from "@/lib/auth"
import { getDB } from "@/lib/db"
import { paystackService } from "@/lib/paystack"
import { ONSITE_TRAINING, getTrainingLocationStartDate } from "@/lib/student-registration"
import { onsiteRegisterSchema } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = onsiteRegisterSchema.parse(body)
    const role = "student"

    const registration = await authService.registerWithOtp(
      validated.email,
      validated.password,
      validated.name,
      role,
      {
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
      },
    )

    const db = getDB()
    const allCourses = await db.getAllCourses()
    const allCourseIds = (allCourses || []).map((course: any) => course.id)
    const callbackUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/register-onsite/success`
      : undefined
    const invoiceNumber = `ONSITE-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`

    const paymentInit = await paystackService.initializePayment({
      email: validated.email,
      amount: ONSITE_TRAINING.registrationFeeNgn,
      currency: "NGN",
      metadata: {
        userId: registration.user.id,
        paymentType: "onsite_registration",
        registrationType: "onsite",
        preferredLocation: validated.preferredLocation,
        invoiceNumber,
      },
      callbackUrl,
    })

    const payment = await db.createPayment({
      userId: registration.user.id,
      paymentType: "onsite_registration",
      courseId: allCourseIds[0] || "onsite-registration-fee",
      courseIds: allCourseIds,
      amount: ONSITE_TRAINING.registrationFeeNgn,
      currency: "NGN",
      status: "pending",
      reference: paymentInit.reference,
      invoiceNumber,
      paymentMethod: "paystack",
      gatewayStatus: "pending",
      gatewayMessage: "Awaiting onsite registration payment authorization on Paystack.",
      verificationAttempts: 0,
      verificationLocked: false,
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      user: registration.user,
      payment,
      authorization_url: paymentInit.authorizationUrl,
      message: "Registration saved. Complete Paystack payment to activate onsite access.",
    })
  } catch (error) {
    console.error("Initialize onsite payment error:", error)
    if (error instanceof Error && error.message === "User already exists") {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Failed to initialize onsite payment" }, { status: 500 })
  }
}

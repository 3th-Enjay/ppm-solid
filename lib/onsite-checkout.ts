import { z } from "zod"
import { getDB } from "@/lib/db"
import { paystackService } from "@/lib/paystack"
import type { User } from "@/lib/types"
import { getOnsiteTrainingConfig } from "@/lib/onsite-training-config"

export const onsiteDashboardInitSchema = z.object({
  preferredLocation: z.enum(["enugu", "abuja"]),
  returnUrl: z.string().optional(),
})

export async function initializeAuthenticatedOnsiteCheckout(user: User, input: z.infer<typeof onsiteDashboardInitSchema>) {
  if (user.role !== "student") {
    throw new Error("Forbidden")
  }

  const db = getDB()
  const onsiteConfig = await getOnsiteTrainingConfig()
  const selectedLocation = onsiteConfig.locations[input.preferredLocation]
  const existingPayments = await db.getPaymentsByUserId(user.id)
  const completedOnsitePayment = existingPayments.find(
    (payment: any) =>
      payment.paymentType === "onsite_registration" &&
      (payment.status === "completed" || payment.status === "success"),
  )

  if (completedOnsitePayment) {
    const error = new Error("Onsite training is already active for this account.")
    ;(error as any).statusCode = 409
    throw error
  }

  const allCourses = await db.getAllCourses()
  const allCourseIds = (allCourses || []).map((course: any) => course.id)
  const callbackUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/onsite-training/success`
    : input.returnUrl || undefined
  const invoiceNumber = `ONSITE-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`

  const paymentInit = await paystackService.initializePayment({
    email: user.email,
    amount: onsiteConfig.registrationFeeNgn,
    currency: "NGN",
    metadata: {
      userId: user.id,
      paymentType: "onsite_registration",
      registrationType: "onsite",
      preferredLocation: input.preferredLocation,
      invoiceNumber,
    },
    callbackUrl,
  })

  const profile = user.studentProfile
  await db.updateUser(user.id, {
    studentProfile: {
      trainingMode: "onsite",
      formTitle: onsiteConfig.formTitle,
      phoneNumber: profile?.phoneNumber || "",
      whatsappNumber: profile?.whatsappNumber || profile?.phoneNumber || "",
      gender: profile?.gender || "prefer_not_to_say",
      dateOfBirth: profile?.dateOfBirth || "",
      currentAddress: profile?.currentAddress || "",
      isHealthcareProfessional: profile?.isHealthcareProfessional || false,
      currentRoleOrField: profile?.currentRoleOrField || "",
      preferredLocation: input.preferredLocation,
      preferredLocationStartDate: selectedLocation.startsOn,
      trainingInterest: profile?.trainingInterest || "",
      registrationFeeNgn: onsiteConfig.registrationFeeNgn,
      paymentStatus: "no",
      paymentReference: paymentInit.reference,
      paymentLink: "/dashboard/onsite-training",
      agreedSlotSecured: profile?.agreedSlotSecured || false,
      agreedDetailsCorrect: profile?.agreedDetailsCorrect || true,
      submittedAt: profile?.submittedAt || new Date(),
    },
    onboardingState: {
      ...(user.onboardingState || {}),
      viewedOnsiteTrainingAt: user.onboardingState?.viewedOnsiteTrainingAt || new Date(),
      startedOnsiteCheckoutAt: new Date(),
      updatedAt: new Date(),
    },
  })

  const payment = await db.createPayment({
    userId: user.id,
    paymentType: "onsite_registration",
    courseId: allCourseIds[0] || "onsite-registration-fee",
    courseIds: allCourseIds,
    amount: onsiteConfig.registrationFeeNgn,
    currency: "NGN",
    status: "pending",
    reference: paymentInit.reference,
    invoiceNumber,
    paymentMethod: "paystack",
    gatewayStatus: "pending",
    gatewayMessage: "Awaiting onsite registration payment authorization on Paystack.",
    customerEmail: user.email.trim().toLowerCase(),
    verificationAttempts: 0,
    verificationLocked: false,
    createdAt: new Date(),
  })

  return {
    success: true,
    payment,
    authorization_url: paymentInit.authorizationUrl,
    message: "Continue to Paystack to complete your onsite training payment.",
  }
}

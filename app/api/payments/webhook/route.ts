import { NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { paystackService } from "@/lib/paystack"
import { notifyManualReviewAlert } from "@/lib/payment-alerts"
import { evaluateVerification } from "@/lib/payments/verification"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-paystack-signature")

  if (!paystackService.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const reference = event?.data?.reference
  if (!reference) {
    return NextResponse.json({ received: true })
  }

  const db = getDB()
  const payment = await db.getPaymentByReference(reference)
  if (!payment) {
    return NextResponse.json({ received: true })
  }

  const updatePayment = async (updates: Record<string, unknown>) => {
    await db.updatePaymentByReference(reference, updates)
  }

  switch (event?.event) {
    case "charge.success": {
      if (payment.status === "completed" || payment.status === "success") {
        return NextResponse.json({ received: true })
      }

      const amount = event?.data?.amount
      const currency = event?.data?.currency || payment.currency
      const paidAt = event?.data?.paid_at || event?.data?.paidAt
      const gatewayMessage = event?.data?.gateway_response || "Payment successful"
      const transactionId = event?.data?.id ? String(event.data.id) : undefined
      const channel = event?.data?.channel
      const amountInMajorUnit =
        typeof amount === "number" ? paystackService.fromSubunit(amount, currency) : payment.amount

      const paystackEmail = event?.data?.customer?.email
      const user = await db.findUserById(payment.userId)
      const evaluation = evaluateVerification({
        verification: {
          status: "success",
          amount: amountInMajorUnit,
          currency,
          customerEmail: paystackEmail ? String(paystackEmail) : undefined,
        },
        payment: {
          amount: payment.amount,
          currency: payment.currency,
        },
        userEmail: user?.email,
        source: "webhook",
      })

      if (evaluation.targetStatus === "manual_review") {
        const reason = evaluation.reason || "Webhook mismatch."
        await updatePayment({
          status: "manual_review",
          verificationLocked: false,
          gatewayStatus: "success",
          gatewayMessage: reason,
          transactionId,
          gatewayChannel: channel,
          manualReviewReason: reason,
          manualReviewSource: "webhook",
          manualReviewCreatedAt: payment.manualReviewCreatedAt || new Date(),
          manualReviewUpdatedAt: new Date(),
          reviewedAt: new Date(),
        })
        await notifyManualReviewAlert({
          reference,
          paymentType: payment.paymentType,
          amount: payment.amount,
          currency: payment.currency,
          userEmail: user?.email,
          source: "webhook",
          reason,
        })
        return NextResponse.json({ received: true })
      }

      await updatePayment({
        status: "completed",
        completedAt: paidAt ? new Date(paidAt) : new Date(),
        amount: amountInMajorUnit,
        currency,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        gatewayStatus: "success",
        gatewayMessage,
        transactionId,
        gatewayChannel: channel,
        verificationLocked: false,
      })

      const isOnsiteRegistration = payment.paymentType === "onsite_registration"
      let courseIds = payment.courseIds && payment.courseIds.length > 0 ? payment.courseIds : [payment.courseId]
      if (isOnsiteRegistration) {
        const allCourses = await db.getAllCourses()
        courseIds = (allCourses || []).map((course: any) => course.id)
      }
      for (const courseId of courseIds) {
        const existing = await db.getEnrollment(payment.userId, courseId)
        if (!existing) {
          await db.createEnrollment({
            userId: payment.userId,
            courseId,
            progress: 0,
            completedLessons: [],
            status: "active",
            enrolledAt: new Date(),
          })
        }
      }

      const currentUser = await db.findUserById(payment.userId)
      if (currentUser) {
        const updatedCourses = Array.from(new Set([...(currentUser.enrolledCourses || []), ...courseIds]))
        const profile = currentUser.studentProfile
        await db.updateUser(payment.userId, {
          enrolledCourses: updatedCourses,
          ...(isOnsiteRegistration && profile
            ? {
                studentProfile: {
                  ...profile,
                  paymentStatus: "yes",
                  paymentReference: reference,
                },
              }
            : {}),
        })
      }
      break
    }
    case "charge.failed": {
      await updatePayment({
        status: "failed",
        gatewayStatus: "failed",
        gatewayMessage: event?.data?.gateway_response || "Payment failed",
        transactionId: event?.data?.id ? String(event.data.id) : undefined,
        gatewayChannel: event?.data?.channel,
        verificationLocked: false,
      })
      break
    }
    case "refund.processed": {
      await updatePayment({
        status: "refunded",
        refundedAt: new Date(),
        gatewayMessage: "Refund processed by Paystack.",
      })
      break
    }
    case "refund.failed": {
      // Keep existing status, just acknowledge.
      break
    }
    default:
      break
  }

  return NextResponse.json({ received: true })
}

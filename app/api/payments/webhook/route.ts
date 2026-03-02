import { NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { paystackService } from "@/lib/paystack"

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
      const amount = event?.data?.amount
      const currency = event?.data?.currency || payment.currency
      const paidAt = event?.data?.paid_at || event?.data?.paidAt
      const gatewayMessage = event?.data?.gateway_response || "Payment successful"
      const transactionId = event?.data?.id ? String(event.data.id) : undefined
      const channel = event?.data?.channel

      await updatePayment({
        status: "completed",
        completedAt: paidAt ? new Date(paidAt) : new Date(),
        amount: typeof amount === "number" ? paystackService.fromSubunit(amount, currency) : payment.amount,
        currency,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        gatewayStatus: "success",
        gatewayMessage,
        transactionId,
        gatewayChannel: channel,
      })

      const courseIds = payment.courseIds && payment.courseIds.length > 0 ? payment.courseIds : [payment.courseId]
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

      const user = await db.findUserById(payment.userId)
      if (user) {
        const updatedCourses = Array.from(new Set([...(user.enrolledCourses || []), ...courseIds]))
        await db.updateUser(payment.userId, { enrolledCourses: updatedCourses })
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

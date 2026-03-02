import { type NextRequest, NextResponse } from "next/server"
import { paystackService } from "@/lib/paystack"
import { getDB } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 })
    }

    const db = getDB()
    // Get payment details first
    const payment = await db.getPaymentByReference(reference)

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Verify payment with Paystack
    const verification = await paystackService.verifyPayment(reference)

    if (verification.status === "success") {
      // Update payment status
      await db.updatePaymentByReference(reference, {
        status: "completed",
        completedAt: new Date(),
        amount: verification.amount,
        currency: verification.currency,
        paidAt: verification.paidAt || new Date(),
        transactionId: verification.transactionId,
        gatewayStatus: verification.gatewayStatus || "success",
        gatewayMessage: verification.gatewayMessage || "Payment verified successfully.",
        gatewayChannel: verification.channel,
      })

      // Auto-enroll user in course if not already enrolled
      const courseIds = payment.courseIds && payment.courseIds.length > 0
        ? payment.courseIds
        : [payment.courseId]

      for (const courseId of courseIds) {
        const enrollment = await db.getEnrollment(payment.userId, courseId)
        if (!enrollment) {
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
    } else {
      await db.updatePaymentByReference(reference, {
        status: "failed",
        gatewayStatus: verification.gatewayStatus || "failed",
        gatewayMessage: verification.gatewayMessage || "Payment verification failed.",
        transactionId: verification.transactionId,
        gatewayChannel: verification.channel,
      })
    }

    const updatedPayment = await db.getPaymentByReference(reference)

    return NextResponse.json({
      success: true,
      verified: verification.status === "success",
      paystackMessage: verification.gatewayMessage,
      payment: updatedPayment,
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}

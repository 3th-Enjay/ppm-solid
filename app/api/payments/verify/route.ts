import { type NextRequest, NextResponse } from "next/server"
import { paystackService } from "@/lib/paystack"
import { getDB } from "@/lib/db"
import { notifyManualReviewAlert } from "@/lib/payment-alerts"
import { evaluateVerification } from "@/lib/payments/verification"

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

    if (payment.status === "completed" || payment.status === "success") {
      return NextResponse.json({
        success: true,
        verified: true,
        paystackMessage: payment.gatewayMessage,
        payment,
      })
    }

    if (payment.verificationLocked) {
      return NextResponse.json(
        {
          success: true,
          verified: payment.status === "completed" || payment.status === "success",
          message: "Payment verification is already in progress.",
          payment,
        },
        { status: 202 },
      )
    }

    await db.updatePaymentByReference(reference, {
      verificationLocked: true,
      verificationAttempts: (payment.verificationAttempts || 0) + 1,
      lastVerificationAt: new Date(),
      status: payment.status === "pending" ? "processing" : payment.status,
    })

    // Verify payment with Paystack
    const verification = await paystackService.verifyPayment(reference)

    const paymentUser = await db.findUserById(payment.userId)
    const evaluation = evaluateVerification({
      verification: {
        status: verification.status,
        amount: verification.amount,
        currency: verification.currency,
        customerEmail: verification.customerEmail,
      },
      payment: {
        amount: payment.amount,
        currency: payment.currency,
      },
      userEmail: paymentUser?.email,
      source: "verify",
    })

    if (evaluation.targetStatus === "manual_review") {
        const reason = evaluation.reason || "Verification mismatch."
        await db.updatePaymentByReference(reference, {
          status: "manual_review",
          verificationLocked: false,
          gatewayStatus: verification.gatewayStatus || "success",
          gatewayMessage: reason,
          transactionId: verification.transactionId,
          gatewayChannel: verification.channel,
          manualReviewReason: reason,
          manualReviewSource: "verify",
          manualReviewCreatedAt: payment.manualReviewCreatedAt || new Date(),
          manualReviewUpdatedAt: new Date(),
          reviewedAt: new Date(),
        })
        await notifyManualReviewAlert({
          reference,
          paymentType: payment.paymentType,
          amount: payment.amount,
          currency: payment.currency,
          userEmail: paymentUser?.email,
          source: "verify",
          reason,
        })

        const flaggedPayment = await db.getPaymentByReference(reference)
        return NextResponse.json(
          {
            success: true,
            verified: false,
            paystackMessage: "Payment flagged for manual review.",
            payment: flaggedPayment,
          },
          { status: 409 },
        )
    } else if (evaluation.targetStatus === "completed") {
      // Update payment status
      await db.updatePaymentByReference(reference, {
        status: "completed",
        verificationLocked: false,
        completedAt: new Date(),
        amount: verification.amount,
        currency: verification.currency,
        paidAt: verification.paidAt || new Date(),
        transactionId: verification.transactionId,
        gatewayStatus: verification.gatewayStatus || "success",
        gatewayMessage: verification.gatewayMessage || "Payment verified successfully.",
        gatewayChannel: verification.channel,
      })

      const isOnsiteRegistration = payment.paymentType === "onsite_registration"
      let courseIds =
        payment.courseIds && payment.courseIds.length > 0 ? payment.courseIds : [payment.courseId]
      if (isOnsiteRegistration) {
        const allCourses = await db.getAllCourses()
        courseIds = (allCourses || []).map((course: any) => course.id)
      }

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

      const enrolledUser = paymentUser || (await db.findUserById(payment.userId))
      if (enrolledUser) {
        const updatedCourses = Array.from(new Set([...(enrolledUser.enrolledCourses || []), ...courseIds]))
        const profile = enrolledUser.studentProfile
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
    } else {
      await db.updatePaymentByReference(reference, {
        status: "failed",
        verificationLocked: false,
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
    try {
      const reference = request.nextUrl.searchParams.get("reference")
      if (reference) {
        const db = getDB()
        await db.updatePaymentByReference(reference, {
          verificationLocked: false,
          status: "pending",
          gatewayMessage: "Verification failed unexpectedly. Please retry.",
        })
      }
    } catch {
      // no-op
    }
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}

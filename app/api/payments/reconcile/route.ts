import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { getDB } from "@/lib/db"
import { getTokenFromRequest } from "@/lib/jwt"
import { paystackService } from "@/lib/paystack"
import { notifyManualReviewAlert } from "@/lib/payment-alerts"
import { expirePaymentIfStale, logPaymentEvent } from "@/lib/payments/runtime"
import { evaluateVerification } from "@/lib/payments/verification"

function canRunReconciliation(request: Request) {
  const token = getTokenFromRequest(request)
  const secret = process.env.PAYMENT_RECONCILE_SECRET || process.env.CRON_SECRET
  if (token && secret && token === secret) return true
  if (token) {
    const session = authService.decodeToken(token)
    if (session && session.role === "admin") return true
  }

  const headerSecret = request.headers.get("x-reconcile-key")
  if (secret && headerSecret && headerSecret === secret) return true

  // Allow external schedulers (e.g. cron-job.org) to authenticate via query key.
  const url = new URL(request.url)
  const querySecret = url.searchParams.get("key") || url.searchParams.get("secret")
  if (secret && querySecret && querySecret === secret) return true
  return false
}

async function grantAccessForPayment(db: any, payment: any, reference: string) {
  const isOnsiteRegistration = payment.paymentType === "onsite_registration"
  let courseIds = payment.courseIds && payment.courseIds.length > 0 ? payment.courseIds : [payment.courseId]
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

  const user = await db.findUserById(payment.userId)
  if (!user) return

  const updatedCourses = Array.from(new Set([...(user.enrolledCourses || []), ...courseIds]))
  const profile = user.studentProfile
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

async function runReconciliation(request: Request) {
  try {
    if (!canRunReconciliation(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const url = new URL(request.url)
    const olderThanMinutes = Number(url.searchParams.get("olderThanMinutes") || "30")
    const limit = Math.min(Number(url.searchParams.get("limit") || "100"), 500)
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000)

    const db = getDB()
    const stalePending =
      typeof db.getStalePayments === "function"
        ? await db.getStalePayments({ statuses: ["pending", "processing"], cutoff, limit })
        : (await db.getAllPayments())
            .filter((payment: any) => payment.status === "pending" || payment.status === "processing")
            .filter((payment: any) => new Date(payment.createdAt).getTime() <= cutoff.getTime())
            .slice(0, limit)

    const summary = {
      scanned: stalePending.length,
      completed: 0,
      failed: 0,
      manualReview: 0,
      skippedLocked: 0,
      errors: 0,
      details: [] as Array<{ reference: string; result: string; note?: string }>,
    }

    for (const rawPayment of stalePending) {
      const payment = await expirePaymentIfStale(db, rawPayment, "reconcile")
      if (payment.status === "expired") {
        summary.details.push({ reference: payment.reference, result: "expired" })
        continue
      }
      try {
        if ((payment.verificationAttempts || 0) >= 5) {
          const reason = "Verification attempts exceeded safe limit."
          await db.updatePaymentByReference(payment.reference, {
            status: "manual_review",
            verificationLocked: false,
            manualReviewReason: reason,
            manualReviewSource: "reconcile",
            manualReviewCreatedAt: payment.manualReviewCreatedAt || new Date(),
            manualReviewUpdatedAt: new Date(),
            reviewedAt: new Date(),
            gatewayMessage: reason,
          })
          await logPaymentEvent(db, {
            reference: payment.reference,
            paymentId: payment.id,
            type: "manual_review",
            source: "api/payments/reconcile",
            status: "manual_review",
            message: reason,
          })
          summary.manualReview += 1
          summary.details.push({ reference: payment.reference, result: "manual_review", note: reason })
          continue
        }

        let lockedPayment: any = undefined
        if (typeof db.acquirePaymentVerificationLock === "function") {
          lockedPayment = await db.acquirePaymentVerificationLock(payment.reference, 5)
        } else if (!payment.verificationLocked) {
          lockedPayment = await db.updatePaymentByReference(payment.reference, {
            verificationLocked: true,
            verificationAttempts: (payment.verificationAttempts || 0) + 1,
            lastVerificationAt: new Date(),
            status: payment.status === "pending" ? "processing" : payment.status,
          })
        }

        if (!lockedPayment) {
          summary.skippedLocked += 1
          summary.details.push({ reference: payment.reference, result: "skipped_locked" })
          continue
        }

        const verification = await paystackService.verifyPayment(payment.reference)
        if (verification.status !== "success") {
          await db.updatePaymentByReference(payment.reference, {
            status: "failed",
            verificationLocked: false,
            verificationLockToken: undefined,
            verificationLockExpiresAt: undefined,
            gatewayStatus: verification.gatewayStatus || "failed",
            gatewayMessage: verification.gatewayMessage || "Reconciliation verification failed.",
            transactionId: verification.transactionId,
            gatewayChannel: verification.channel,
            gatewayFee: verification.gatewayFee,
            customerEmail: verification.customerEmail,
            customerCode: verification.customerCode,
          })
          await logPaymentEvent(db, {
            reference: payment.reference,
            paymentId: payment.id,
            type: "reconcile",
            source: "api/payments/reconcile",
            status: "failed",
            message: verification.gatewayMessage || "Reconciliation verification failed.",
          })
          summary.failed += 1
          summary.details.push({ reference: payment.reference, result: "failed" })
          continue
        }

        const user = await db.findUserById(payment.userId)
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
          userEmail: user?.email,
          source: "reconcile",
        })

        if (evaluation.targetStatus === "manual_review") {
          const reason = evaluation.reason || "Reconciliation mismatch."
          await db.updatePaymentByReference(payment.reference, {
            status: "manual_review",
            verificationLocked: false,
            verificationLockToken: undefined,
            verificationLockExpiresAt: undefined,
            gatewayStatus: verification.gatewayStatus || "success",
            gatewayMessage: reason,
            transactionId: verification.transactionId,
            gatewayChannel: verification.channel,
            gatewayFee: verification.gatewayFee,
            customerEmail: verification.customerEmail,
            customerCode: verification.customerCode,
            manualReviewReason: reason,
            manualReviewSource: "reconcile",
            manualReviewCreatedAt: payment.manualReviewCreatedAt || new Date(),
            manualReviewUpdatedAt: new Date(),
            reviewedAt: new Date(),
          })
          await notifyManualReviewAlert({
            reference: payment.reference,
            paymentType: payment.paymentType,
            amount: payment.amount,
            currency: payment.currency,
            userEmail: user?.email,
            source: "reconcile",
            reason,
          })
          await logPaymentEvent(db, {
            reference: payment.reference,
            paymentId: payment.id,
            type: "manual_review",
            source: "api/payments/reconcile",
            status: "manual_review",
            message: reason,
            metadata: { mismatches: evaluation.mismatches },
          })
          summary.manualReview += 1
          summary.details.push({
            reference: payment.reference,
            result: "manual_review",
            note: evaluation.mismatches.join(", "),
          })
          continue
        }

        const completed = await db.updatePaymentByReference(payment.reference, {
          status: "completed",
          verificationLocked: false,
          verificationLockToken: undefined,
          verificationLockExpiresAt: undefined,
          completedAt: new Date(),
          amount: verification.amount,
          currency: verification.currency,
          paidAt: verification.paidAt || new Date(),
          transactionId: verification.transactionId,
          gatewayStatus: verification.gatewayStatus || "success",
          gatewayMessage: verification.gatewayMessage || "Payment reconciled successfully.",
          gatewayChannel: verification.channel,
          gatewayFee: verification.gatewayFee,
          customerEmail: verification.customerEmail,
          customerCode: verification.customerCode,
        })

        if (completed) {
          await grantAccessForPayment(db, completed, payment.reference)
        }
        await logPaymentEvent(db, {
          reference: payment.reference,
          paymentId: payment.id,
          type: "reconcile",
          source: "api/payments/reconcile",
          status: "completed",
          message: "Payment reconciled successfully.",
        })

        summary.completed += 1
        summary.details.push({ reference: payment.reference, result: "completed" })
      } catch (reconcileError: any) {
        summary.errors += 1
        if (typeof db.releasePaymentVerificationLock === "function") {
          await db.releasePaymentVerificationLock(payment.reference)
        } else {
          await db.updatePaymentByReference(payment.reference, {
            verificationLocked: false,
            verificationLockToken: undefined,
            verificationLockExpiresAt: undefined,
            status: "pending",
            gatewayMessage: "Reconciliation encountered an unexpected error.",
          })
        }
        await logPaymentEvent(db, {
          reference: payment.reference,
          paymentId: payment.id,
          type: "reconcile",
          source: "api/payments/reconcile",
          status: "error",
          message: reconcileError?.message || "unknown error",
        })
        summary.details.push({
          reference: payment.reference,
          result: "error",
          note: reconcileError?.message || "unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      olderThanMinutes,
      limit,
      cutoff,
      summary,
    })
  } catch (error) {
    console.error("Payment reconciliation error:", error)
    return NextResponse.json({ error: "Failed to reconcile payments" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return runReconciliation(request)
}

export async function GET(request: Request) {
  return runReconciliation(request)
}

import type { Payment } from "@/lib/types"

const PAYMENT_EXPIRY_MS = 2 * 60 * 60 * 1000

export async function logPaymentEvent(
  db: any,
  event: {
    reference: string
    paymentId?: string
    type: "initialize" | "webhook" | "verify" | "reconcile" | "manual_review"
    source: string
    status?: string
    message?: string
    metadata?: Record<string, unknown>
  },
) {
  try {
    if (typeof db.createPaymentEvent === "function") {
      await db.createPaymentEvent(event)
    }
  } catch (error) {
    console.error("Failed to write payment event log:", error)
  }
}

export function isExpiredPayment(payment: Pick<Payment, "status" | "createdAt">) {
  if (payment.status !== "pending" && payment.status !== "processing") return false
  const createdAt = new Date(payment.createdAt).getTime()
  return Date.now() - createdAt >= PAYMENT_EXPIRY_MS
}

export async function expirePaymentIfStale(db: any, payment: Payment, source: string) {
  if (!isExpiredPayment(payment)) return payment
  const updated = await db.updatePaymentByReference(payment.reference, {
    status: "expired",
    verificationLocked: false,
    gatewayMessage: "Payment expired after 2 hours without successful verification.",
  })
  await logPaymentEvent(db, {
    reference: payment.reference,
    paymentId: payment.id,
    type: "manual_review",
    source,
    status: "expired",
    message: "Payment auto-expired due to stale pending/processing state.",
  })
  return (updated || payment) as Payment
}


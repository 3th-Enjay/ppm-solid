import "server-only"

import { sendPaymentManualReviewAlert } from "./email"

type ManualReviewAlertInput = {
  reference: string
  paymentType?: string
  amount: number
  currency: string
  userEmail?: string
  source: "verify" | "webhook" | "reconcile" | "admin"
  reason: string
}

export async function notifyManualReviewAlert(input: ManualReviewAlertInput) {
  const alertEmail =
    process.env.PAYMENT_ALERT_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    process.env.ADMIN_ACCOUNTS_EMAIL ||
    ""

  if (!alertEmail) return

  try {
    await sendPaymentManualReviewAlert({
      to: alertEmail,
      reference: input.reference,
      paymentType: input.paymentType,
      amount: input.amount,
      currency: input.currency,
      userEmail: input.userEmail,
      source: input.source,
      reason: input.reason,
    })
  } catch (error) {
    console.error("Failed to send manual review alert:", error)
  }
}

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
  const recipients = collectAlertRecipients()
  if (recipients.length === 0) return

  try {
    await Promise.all(
      recipients.map((to) =>
        sendPaymentManualReviewAlert({
          to,
          reference: input.reference,
          paymentType: input.paymentType,
          amount: input.amount,
          currency: input.currency,
          userEmail: input.userEmail,
          source: input.source,
          reason: input.reason,
        }),
      ),
    )
  } catch (error) {
    console.error("Failed to send manual review alert:", error)
  }
}

function collectAlertRecipients() {
  const sources = [
    process.env.PAYMENT_ALERT_EMAIL,
    process.env.SUPPORT_EMAIL,
    process.env.ADMIN_ACCOUNTS_EMAIL,
    process.env.BOOTSTRAP_ADMIN_EMAIL,
    process.env.FINANCE_ACCOUNTS_EMAIL,
    process.env.FINANCE_ACCOUNTS_EMAILS,
  ]

  const recipients = new Set<string>()
  for (const source of sources) {
    if (!source) continue
    for (const candidate of source.split(/[,\s;]+/)) {
      const email = candidate.trim().toLowerCase()
      if (email) recipients.add(email)
    }
  }
  return Array.from(recipients)
}

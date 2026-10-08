import { getAdminSettings } from "./admin-settings"
import { getDB } from "./db"
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
  const recipients = await collectAlertRecipients()
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

async function collectAlertRecipients() {
  const recipients = new Set<string>()

  const excluded = new Set<string>()
  const superAdminEnv = [process.env.ADMIN_ACCOUNTS_EMAIL, process.env.BOOTSTRAP_ADMIN_EMAIL]
  for (const source of superAdminEnv) {
    if (!source) continue
    for (const candidate of source.split(/[,\s;]+/)) {
      const email = candidate.trim().toLowerCase()
      if (email) excluded.add(email)
    }
  }

  try {
    const db = getDB()
    if (typeof db.getAllUsers === "function") {
      const users = await db.getAllUsers()
      for (const user of users || []) {
        const role = String(user?.role || "").toLowerCase()
        const email = String(user?.email || "").trim().toLowerCase()
        const status = String(user?.status || "active").toLowerCase()
        if (!email || status === "suspended") continue
        if (role === "admin" || role === "finance") {
          if (!excluded.has(email)) recipients.add(email)
        }
      }
    }
  } catch (error) {
    console.error("Failed to load admin/finance recipients from DB:", error)
  }

  try {
    const settings = await getAdminSettings()
    const supportEmail = settings?.supportEmail?.trim().toLowerCase()
    if (supportEmail && !excluded.has(supportEmail)) {
      recipients.add(supportEmail)
    }
  } catch (error) {
    console.error("Failed to load support email from settings:", error)
  }

  return Array.from(recipients)
}

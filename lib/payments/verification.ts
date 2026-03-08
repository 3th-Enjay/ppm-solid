export type VerificationSource = "verify" | "webhook" | "reconcile" | "admin"

export type VerificationResult = {
  status: "success" | "failed"
  amount: number
  currency: string
  customerEmail?: string
}

export type StoredPaymentSnapshot = {
  amount: number
  currency: string
}

export type VerificationEvaluation = {
  targetStatus: "completed" | "failed" | "manual_review"
  mismatches: string[]
  reason?: string
}

export function evaluateVerification(params: {
  verification: VerificationResult
  payment: StoredPaymentSnapshot
  userEmail?: string
  source: VerificationSource
}): VerificationEvaluation {
  const { verification, payment, userEmail, source } = params

  if (verification.status !== "success") {
    return { targetStatus: "failed", mismatches: [] }
  }

  const mismatches: string[] = []
  if (verification.currency !== payment.currency) mismatches.push("currency mismatch")
  if (Math.abs(verification.amount - payment.amount) > 0.000001) mismatches.push("amount mismatch")
  if (
    userEmail &&
    verification.customerEmail &&
    userEmail.toLowerCase() !== verification.customerEmail.toLowerCase()
  ) {
    mismatches.push("customer email mismatch")
  }

  if (mismatches.length > 0) {
    return {
      targetStatus: "manual_review",
      mismatches,
      reason: `${capitalizeSource(source)} mismatch: ${mismatches.join(", ")}.`,
    }
  }

  return { targetStatus: "completed", mismatches: [] }
}

function capitalizeSource(source: VerificationSource) {
  return source.charAt(0).toUpperCase() + source.slice(1)
}

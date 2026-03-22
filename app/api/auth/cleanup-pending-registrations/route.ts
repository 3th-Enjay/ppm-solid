import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { getDB } from "@/lib/db"
import { getTokenFromRequest } from "@/lib/jwt"

const ACTIVE_PAYMENT_STATUSES = new Set(["pending", "processing", "manual_review", "completed", "success"])

function canRunCleanup(request: Request) {
  const token = getTokenFromRequest(request)
  const secret = process.env.AUTH_MAINTENANCE_SECRET || process.env.CRON_SECRET

  if (token && secret && token === secret) return true
  if (token) {
    const session = authService.decodeToken(token)
    if (session && session.role === "admin") return true
  }

  const headerSecret = request.headers.get("x-maintenance-key")
  if (secret && headerSecret && headerSecret === secret) return true

  const url = new URL(request.url)
  const querySecret = url.searchParams.get("key") || url.searchParams.get("secret")
  if (secret && querySecret && querySecret === secret) return true

  return false
}

async function runCleanup(request: Request) {
  if (!canRunCleanup(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(request.url)
  const olderThanHours = Number(url.searchParams.get("olderThanHours") || "48")
  const dryRun = url.searchParams.get("dryRun") === "true"
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)

  const db = getDB()
  const expiredRegistrations =
    typeof (db as any).getExpiredPendingRegistrations === "function"
      ? await (db as any).getExpiredPendingRegistrations(cutoff)
      : []

  const summary = {
    scanned: expiredRegistrations.length,
    deleted: 0,
    skippedWithPayments: 0,
    dryRun,
    cutoff,
    details: [] as Array<{ email: string; action: "deleted" | "skipped"; reason: string }>,
  }

  for (const registration of expiredRegistrations) {
    const payments = await db.getPaymentsByUserId(registration.id)
    const hasProtectedPayment = (payments || []).some((payment: any) => ACTIVE_PAYMENT_STATUSES.has(payment.status))

    if (hasProtectedPayment) {
      summary.skippedWithPayments += 1
      summary.details.push({
        email: registration.email,
        action: "skipped",
        reason: "pending registration retained because it has active or successful payment records",
      })
      continue
    }

    if (!dryRun) {
      const deleted = await db.deletePendingRegistration(registration.id)
      if (deleted) {
        summary.deleted += 1
      }
    }

    summary.details.push({
      email: registration.email,
      action: "deleted",
      reason: dryRun ? "eligible for deletion" : "expired pending registration removed",
    })
  }

  return NextResponse.json({
    success: true,
    olderThanHours,
    summary,
  })
}

export async function GET(request: Request) {
  return runCleanup(request)
}

export async function POST(request: Request) {
  return runCleanup(request)
}

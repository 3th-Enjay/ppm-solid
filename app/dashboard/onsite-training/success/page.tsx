"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { trackOnboardingEvent } from "@/lib/onboarding-analytics"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { AlertCircle, CheckCircle, Loader2, RefreshCcw, SearchCheck, XCircle } from "lucide-react"

type OnsitePayment = {
  reference: string
  amount: number
  currency: string
  status: string
  invoiceNumber?: string
  transactionId?: string
  gatewayMessage?: string
  gatewayStatus?: string
  gatewayChannel?: string
  customerEmail?: string
  createdAt: string | Date
}

function DashboardOnsiteSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reference = searchParams.get("reference")
  const trxref = searchParams.get("trxref")
  const paymentReference = reference || trxref
  const [payment, setPayment] = useState<OnsitePayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [gatewayMessage, setGatewayMessage] = useState("")

  const loadPayment = useCallback(async (isRefresh = false) => {
    if (!paymentReference) {
      router.push("/dashboard/onsite-training")
      return
    }

    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const verifyRes = await fetch(`/api/payments/verify?reference=${encodeURIComponent(paymentReference)}`)
      const verifyData = await verifyRes.json()
      setGatewayMessage(verifyData.paystackMessage || verifyData.message || "")

      const paymentRes = await fetch(`/api/payments?reference=${encodeURIComponent(paymentReference)}&includeDetails=true`)
      const paymentData = await paymentRes.json()
      const resolvedPayment = (paymentData.payments || [])[0] || null
      setPayment(resolvedPayment)

      if (resolvedPayment) {
        trackOnboardingEvent("onsite_payment_result_viewed", {
          role: "student",
          mode: "onsite",
          source: "dashboard_success",
          status: resolvedPayment.status,
          reference: resolvedPayment.reference,
        })
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [paymentReference, router])

  useEffect(() => {
    void loadPayment(false)
  }, [loadPayment])

  const paymentState = useMemo(() => {
    if (!payment) return "missing"
    if (payment.status === "completed" || payment.status === "success") return "success"
    if (payment.status === "manual_review") return "manual_review"
    if (payment.status === "pending" || payment.status === "processing") return "pending"
    return "failed"
  }, [payment])

  const stateCopy = useMemo(() => {
    if (paymentState === "success") {
      return {
        title: "Onsite payment successful",
        description: "Your onsite payment was verified and your student access will reflect the onsite entitlement automatically.",
        icon: <CheckCircle className="h-12 w-12 text-green-600" />,
        iconClass: "bg-green-100",
        badgeVariant: "default" as const,
      }
    }

    if (paymentState === "manual_review") {
      return {
        title: "Payment is under review",
        description: "We received your transaction, but it needs a manual review before we can unlock your onsite access. Keep your reference handy and check back shortly.",
        icon: <SearchCheck className="h-12 w-12 text-amber-600" />,
        iconClass: "bg-amber-100",
        badgeVariant: "secondary" as const,
      }
    }

    if (paymentState === "pending") {
      return {
        title: "Payment is still being verified",
        description: "Your transaction has not finished syncing yet. Recheck the status in a moment or review the receipt details below.",
        icon: <Loader2 className="h-12 w-12 animate-spin text-primary" />,
        iconClass: "bg-primary/10",
        badgeVariant: "secondary" as const,
      }
    }

    return {
      title: "Onsite payment not completed",
      description: "Your onsite payment could not be confirmed yet. You can retry from the onsite page or review the transaction details first.",
      icon: <XCircle className="h-12 w-12 text-red-600" />,
      iconClass: "bg-red-100",
      badgeVariant: "destructive" as const,
    }
  }, [paymentState])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Verifying onsite payment</h2>
            <p className="text-sm text-muted-foreground">Please wait while we verify your Paystack payment.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="space-y-4 p-10 text-center">
            <h2 className="text-xl font-semibold">Payment record not found</h2>
            <p className="text-sm text-muted-foreground">We could not load your onsite payment details yet.</p>
            <Button asChild>
              <Link href="/dashboard/onsite-training">Back to onsite training</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="space-y-6 p-10">
          <div className="text-center">
            <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${stateCopy.iconClass}`}>
              {stateCopy.icon}
            </div>
            <h1 className="text-3xl font-bold">{stateCopy.title}</h1>
            <p className="mt-2 text-muted-foreground">{stateCopy.description}</p>
          </div>

          {(paymentState === "pending" || paymentState === "manual_review") ? (
            <Card className="border-primary/15 bg-primary/5">
              <CardContent className="flex flex-col gap-3 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-primary" />
                  <span>
                    {paymentState === "pending"
                      ? "Verification can take a little time after Paystack redirects back. Recheck the status before retrying payment."
                      : "Manual review usually means the payment details need an extra confirmation step from the team."}
                  </span>
                </div>
                <Button variant="outline" onClick={() => void loadPayment(true)} disabled={refreshing}>
                  {refreshing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rechecking
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Recheck status
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">Payment Summary</span>
              <Badge variant={stateCopy.badgeVariant}>{payment.status}</Badge>
            </div>
            <div className="space-y-2">
              <p><span className="text-muted-foreground">Reference:</span> {payment.reference}</p>
              <p><span className="text-muted-foreground">Amount:</span> {formatCurrency(payment.amount, payment.currency as any)}</p>
              <p><span className="text-muted-foreground">Invoice:</span> {payment.invoiceNumber || "N/A"}</p>
              <p><span className="text-muted-foreground">Date:</span> {formatDate(payment.createdAt as any)}</p>
              <p><span className="text-muted-foreground">Gateway Status:</span> {payment.gatewayStatus || "N/A"}</p>
              <p><span className="text-muted-foreground">Gateway Message:</span> {gatewayMessage || payment.gatewayMessage || "N/A"}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild>
              <Link href="/dashboard">Return to dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/payments/${payment.reference}`}>View transaction receipt</Link>
            </Button>
            {paymentState !== "success" ? (
              <Button variant="outline" asChild className="sm:col-span-2">
                <Link href="/dashboard/onsite-training">Return to onsite training</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DashboardOnsiteSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Loading onsite payment result...
            </CardContent>
          </Card>
        </div>
      }
    >
      <DashboardOnsiteSuccessContent />
    </Suspense>
  )
}

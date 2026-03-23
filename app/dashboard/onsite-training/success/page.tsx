"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { CheckCircle, Loader2, XCircle } from "lucide-react"

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
  const [gatewayMessage, setGatewayMessage] = useState("")

  useEffect(() => {
    if (!paymentReference) {
      router.push("/dashboard/onsite-training")
      return
    }

    const load = async () => {
      setLoading(true)
      try {
        const verifyRes = await fetch(`/api/payments/verify?reference=${encodeURIComponent(paymentReference)}`)
        const verifyData = await verifyRes.json()
        setGatewayMessage(verifyData.paystackMessage || "")

        const paymentRes = await fetch(`/api/payments?reference=${encodeURIComponent(paymentReference)}&includeDetails=true`)
        const paymentData = await paymentRes.json()
        setPayment((paymentData.payments || [])[0] || null)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [paymentReference, router])

  const isSuccess = useMemo(
    () => payment && (payment.status === "completed" || payment.status === "success"),
    [payment],
  )

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
            <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${isSuccess ? "bg-green-100" : "bg-red-100"}`}>
              {isSuccess ? <CheckCircle className="h-12 w-12 text-green-600" /> : <XCircle className="h-12 w-12 text-red-600" />}
            </div>
            <h1 className="text-3xl font-bold">{isSuccess ? "Onsite Payment Successful" : "Onsite Payment Not Completed"}</h1>
            <p className="mt-2 text-muted-foreground">
              {isSuccess
                ? "Your onsite payment was verified. Your student access will reflect the onsite entitlement automatically."
                : "Your onsite payment could not be confirmed yet. You can retry or review the transaction details."}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">Payment Summary</span>
              <Badge variant={isSuccess ? "default" : "destructive"}>{payment.status}</Badge>
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
            {!isSuccess ? (
              <Button variant="outline" asChild className="sm:col-span-2">
                <Link href="/dashboard/onsite-training">Retry onsite payment</Link>
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

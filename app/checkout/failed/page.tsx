"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Printer, RefreshCcw, XCircle } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils/format"

type FailedPayment = {
  id: string
  reference: string
  amount: number
  currency: string
  status: string
  invoiceNumber?: string
  gatewayMessage?: string
  createdAt: string | Date
}

function CheckoutFailedContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const message = searchParams.get("message")
  const [payment, setPayment] = useState<FailedPayment | null>(null)

  useEffect(() => {
    if (!reference) return
    const load = async () => {
      try {
        const res = await fetch(`/api/payments?reference=${encodeURIComponent(reference)}`)
        const data = await res.json()
        setPayment((data.payments || [])[0] || null)
      } catch (error) {
        console.error("Failed to load failed payment:", error)
      }
    }
    void load()
  }, [reference])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-10 space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold">Payment Failed</h1>
            <p className="mt-2 text-muted-foreground">
              Your Paystack transaction did not complete. Review details below and try again.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/40 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Transaction Information</h2>
              <Badge variant="destructive">failed</Badge>
            </div>
            <div className="space-y-2 text-sm">
              {payment ? (
                <>
                  <div className="flex justify-between rounded border bg-background p-3">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono">{payment.reference}</span>
                  </div>
                  <div className="flex justify-between rounded border bg-background p-3">
                    <span className="text-muted-foreground">Amount</span>
                    <span>{formatCurrency(payment.amount, payment.currency as any)}</span>
                  </div>
                  <div className="flex justify-between rounded border bg-background p-3">
                    <span className="text-muted-foreground">Invoice</span>
                    <span>{payment.invoiceNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between rounded border bg-background p-3">
                    <span className="text-muted-foreground">Created</span>
                    <span>{formatDate(payment.createdAt as any)}</span>
                  </div>
                </>
              ) : (
                <p className="rounded border bg-background p-3 text-muted-foreground">
                  No payment record available yet.
                </p>
              )}
              <div className="rounded border bg-background p-3">
                <p className="text-muted-foreground">Paystack message</p>
                <p className="mt-1">{message || payment?.gatewayMessage || "Payment was not successful."}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-2" />
              Save as PDF
            </Button>
            {payment?.id ? (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/payments/${payment.id}`}>View Transaction</Link>
              </Button>
            ) : null}
            <Button asChild>
              <Link href="/checkout">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Try Again
              </Link>
            </Button>
            <Button variant="outline" asChild className="sm:col-span-2">
              <Link href="/cart">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cart
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">Loading transaction result...</CardContent>
          </Card>
        </div>
      }
    >
      <CheckoutFailedContent />
    </Suspense>
  )
}

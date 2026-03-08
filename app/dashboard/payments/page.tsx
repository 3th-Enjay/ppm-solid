"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { Payment } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils/format"

type EnrichedPayment = Payment & {
  courses?: Array<{ id: string; title: string }>
}

export default function PaymentsPage() {
  const { user } = useAuthStore()
  const [payments, setPayments] = useState<EnrichedPayment[]>([])

  useEffect(() => {
    if (!user) return
    const loadPayments = async () => {
      try {
        const res = await fetch(`/api/payments?userId=${user.id}&includeDetails=true`)
        const data = await res.json()
        setPayments((data.payments || []) as EnrichedPayment[])
      } catch (error) {
        console.error("Failed to load payments:", error)
        setPayments([])
      }
    }
    void loadPayments()
  }, [user])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-balance">Payment History</h1>
        <p className="text-muted-foreground mt-2">View all your transactions and invoices</p>
      </div>

      {payments.length > 0 ? (
        <div className="space-y-4">
          {payments.map((payment) => {
            const purchasedCourseNames =
              payment.courses && payment.courses.length > 0
                ? payment.courses.map((course) => course.title).join(", ")
                : payment.courseId

            return (
              <Card key={payment.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 truncate font-semibold">{purchasedCourseNames}</h3>
                      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(payment.createdAt)}</span>
                        <span>•</span>
                        <span className="truncate">{payment.reference}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={payment.status === "completed" ? "default" : "secondary"}>{payment.status}</Badge>
                        {payment.invoiceNumber ? <Badge variant="outline">{payment.invoiceNumber}</Badge> : null}
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="text-2xl font-bold">{formatCurrency(payment.amount, payment.currency)}</div>
                      <p className="text-sm text-muted-foreground">{payment.paymentMethod}</p>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/payments/${payment.reference}`}>View Transaction</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No payments yet</h3>
            <p className="text-muted-foreground">Your payment history will appear here</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

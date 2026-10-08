"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CreditCard } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { Payment } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils/format"

type EnrichedPayment = Payment & {
  courses?: Array<{ id: string; title: string }>
}

export default function PaymentsPage() {
  const { user, token } = useAuthStore()
  const [payments, setPayments] = useState<EnrichedPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const loadPayments = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/payments?userId=${user.id}&includeDetails=true`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        const data = await res.json()
        setPayments((data.payments || []) as EnrichedPayment[])
      } catch (error) {
        console.error("Failed to load payments:", error)
        setPayments([])
      } finally {
        setLoading(false)
      }
    }
    void loadPayments()
  }, [user, token])

  const completedCount = useMemo(
    () => payments.filter((payment) => payment.status === "completed" || payment.status === "success").length,
    [payments],
  )

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-balance">Payment History</h1>
        <p className="text-muted-foreground">View all your transactions and invoices.</p>
      </div>

      {loading ? (
        <Card variant="elevated">
          <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
            <Clock className="h-5 w-5 animate-pulse" />
            <span>Loading your payment history...</span>
          </CardContent>
        </Card>
      ) : null}

      {payments.length > 0 ? (
        <>
          <Card variant="elevated">
            <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payments overview</p>
                <h2 className="text-xl font-semibold">{completedCount} completed transaction{completedCount === 1 ? "" : "s"}</h2>
              </div>
              <Button variant="outline" asChild>
                <Link href="/courses">Browse courses</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {payments.map((payment) => {
              const purchasedCourseNames =
                payment.courses && payment.courses.length > 0
                  ? payment.courses.map((course) => course.title).join(", ")
                  : payment.courseId

              return (
                <Card key={payment.id} variant="elevated">
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
        </>
      ) : loading ? null : (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No payments yet</h3>
            <p className="text-muted-foreground">Your payment history will appear here once you purchase a course.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

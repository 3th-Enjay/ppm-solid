"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { Course, Payment } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils/format"

export default function PaymentsPage() {
  const { user } = useAuthStore()
  const [payments, setPayments] = useState<Payment[]>([])
  const [courseTitles, setCourseTitles] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user) return
    const loadPayments = async () => {
      try {
        const res = await fetch(`/api/payments?userId=${user.id}`)
        const data = await res.json()
        setPayments((data.payments || []) as Payment[])
      } catch (error) {
        console.error("Failed to load payments:", error)
        setPayments([])
      }
    }
    loadPayments()
  }, [user])

  useEffect(() => {
    if (payments.length === 0) return
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/courses?includeDrafts=true")
        const data = await res.json()
        const map: Record<string, string> = {}
        const courses: Course[] = data.courses || []
        for (const course of courses) {
          map[course.id] = course.title
        }
        setCourseTitles(map)
      } catch (error) {
        console.error("Failed to load courses:", error)
      }
    }
    loadCourses()
  }, [payments.length])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-balance">Payment History</h1>
        <p className="text-muted-foreground mt-2">View all your transactions and invoices</p>
      </div>

      {payments.length > 0 ? (
        <div className="space-y-4">
          {payments.map((payment) => {
            const hasMultiple = payment.courseIds && payment.courseIds.length > 1
            const courseTitle = hasMultiple
              ? `Multiple courses (${payment.courseIds?.length})`
              : courseTitles[payment.courseId] || payment.courseId
            return (
              <Card key={payment.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{courseTitle}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>{formatDate(payment.createdAt)}</span>
                        <span>•</span>
                        <span>{payment.reference}</span>
                      </div>
                      <Badge variant={payment.status === "completed" ? "default" : "secondary"}>{payment.status}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{formatCurrency(payment.amount, payment.currency)}</div>
                      <p className="text-sm text-muted-foreground">{payment.paymentMethod}</p>
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

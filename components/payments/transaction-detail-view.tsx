"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink, FileText, Loader2, Printer } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { getCourseDetailPathForRole } from "@/lib/role-routing"

interface TransactionDetailViewProps {
  paymentIdentifier: string
  role: "student" | "finance" | "admin"
  backHref: string
  backLabel: string
}

type EnrichedPayment = {
  id: string
  userId: string
  amount: number
  currency: string
  status: string
  reference: string
  paymentMethod: string
  invoiceNumber?: string
  transactionId?: string
  gatewayStatus?: string
  gatewayMessage?: string
  gatewayChannel?: string
  createdAt: string | Date
  completedAt?: string | Date
  paidAt?: string | Date
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
  customerEmail?: string
  courses?: Array<{
    id: string
    title: string
    slug?: string
    thumbnail?: string
    category?: string
    level?: string
  }>
}

function getStatusVariant(status: string) {
  if (status === "completed" || status === "success") return "default" as const
  if (status === "failed") return "destructive" as const
  if (status === "refunded") return "secondary" as const
  return "outline" as const
}

export function TransactionDetailView({ paymentIdentifier, role, backHref, backLabel }: TransactionDetailViewProps) {
  const [payment, setPayment] = useState<EnrichedPayment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true)
      try {
        const byIdRes = await fetch(`/api/payments?id=${encodeURIComponent(paymentIdentifier)}&includeDetails=true`)
        const byIdData = await byIdRes.json()
        const byIdPayment = (byIdData.payments || [])[0] || null
        if (byIdPayment) {
          setPayment(byIdPayment)
          return
        }

        const byReferenceRes = await fetch(
          `/api/payments?reference=${encodeURIComponent(paymentIdentifier)}&includeDetails=true`,
        )
        const byReferenceData = await byReferenceRes.json()
        setPayment((byReferenceData.payments || [])[0] || null)
      } catch (error) {
        console.error("Failed to load transaction details:", error)
        setPayment(null)
      } finally {
        setLoading(false)
      }
    }

    void loadDetails()
  }, [paymentIdentifier])

  const resolvedCourses = useMemo(() => payment?.courses || [], [payment])

  if (loading) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex items-center justify-center gap-3 p-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading transaction details...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <p className="text-sm text-muted-foreground">Transaction not found.</p>
            <Button asChild>
              <Link href={backHref}>Back to Transactions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button variant="ghost" asChild className="w-fit">
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transaction Details
          </CardTitle>
          <CardDescription>Reference: {payment.reference}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <div className="flex justify-between gap-3 rounded border p-3">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={getStatusVariant(payment.status)}>{payment.status}</Badge>
          </div>
          <div className="flex justify-between gap-3 rounded border p-3">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{formatCurrency(payment.amount, payment.currency as any)}</span>
          </div>
          <div className="flex justify-between gap-3 rounded border p-3">
            <span className="text-muted-foreground">Invoice</span>
            <span>{payment.invoiceNumber || "N/A"}</span>
          </div>
          <div className="flex justify-between gap-3 rounded border p-3">
            <span className="text-muted-foreground">Transaction ID</span>
            <span>{payment.transactionId || "N/A"}</span>
          </div>
          <div className="flex justify-between gap-3 rounded border p-3">
            <span className="text-muted-foreground">Channel</span>
            <span>{payment.gatewayChannel || "N/A"}</span>
          </div>
          <div className="flex justify-between gap-3 rounded border p-3">
            <span className="text-muted-foreground">Created</span>
            <span>{formatDate(payment.createdAt as any)}</span>
          </div>
          <div className="flex justify-between gap-3 rounded border p-3 md:col-span-2">
            <span className="text-muted-foreground">Paystack Message</span>
            <span className="text-right">{payment.gatewayMessage || "No gateway message available."}</span>
          </div>
          {payment.user ? (
            <div className="flex justify-between gap-3 rounded border p-3 md:col-span-2">
              <span className="text-muted-foreground">Customer</span>
              <span>
                {payment.user.name} ({payment.user.email})
              </span>
            </div>
          ) : payment.customerEmail ? (
            <div className="flex justify-between gap-3 rounded border p-3 md:col-span-2">
              <span className="text-muted-foreground">Customer</span>
              <span>Pending verification ({payment.customerEmail})</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Courses Purchased</CardTitle>
          <CardDescription>Select a course to open its details page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {resolvedCourses.length > 0 ? (
            resolvedCourses.map((course) => (
              <Link
                key={course.id}
                href={getCourseDetailPathForRole(role, { id: course.id, slug: course.slug })}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{course.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.category || "Course"}{course.level ? ` - ${course.level}` : ""}
                  </p>
                </div>
                <span className="flex items-center text-sm text-primary">
                  View
                  <ExternalLink className="ml-2 h-4 w-4" />
                </span>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No course details were attached to this transaction.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

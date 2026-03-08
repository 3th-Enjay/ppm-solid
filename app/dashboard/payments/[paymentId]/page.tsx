"use client"

import { useParams } from "next/navigation"
import { TransactionDetailView } from "@/components/payments/transaction-detail-view"

export default function StudentTransactionDetailPage() {
  const params = useParams()
  const paymentId = params.paymentId as string

  return (
    <TransactionDetailView
      paymentIdentifier={paymentId}
      role="student"
      backHref="/dashboard/payments"
      backLabel="Back to Payment History"
    />
  )
}

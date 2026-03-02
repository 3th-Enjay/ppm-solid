"use client"

import { useParams } from "next/navigation"
import { TransactionDetailView } from "@/components/payments/transaction-detail-view"

export default function AdminTransactionDetailPage() {
  const params = useParams()
  const paymentId = params.paymentId as string

  return (
    <TransactionDetailView
      paymentId={paymentId}
      role="admin"
      backHref="/admin/payments"
      backLabel="Back to Payments"
    />
  )
}

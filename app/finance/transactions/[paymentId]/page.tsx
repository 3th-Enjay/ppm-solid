"use client"

import { useParams } from "next/navigation"
import { TransactionDetailView } from "@/components/payments/transaction-detail-view"

export default function FinanceTransactionDetailPage() {
  const params = useParams()
  const paymentId = params.paymentId as string

  return (
    <TransactionDetailView
      paymentId={paymentId}
      role="finance"
      backHref="/finance/transactions"
      backLabel="Back to Transactions"
    />
  )
}

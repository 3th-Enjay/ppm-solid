"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Filter,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react"
import type { Payment } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/format"

export default function FinanceTransactionsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currencyFilter, setCurrencyFilter] = useState<string>("all")

  useEffect(() => {
    loadPayments()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [payments, searchQuery, statusFilter, currencyFilter])

  const loadPayments = async () => {
    try {
      const res = await fetch("/api/payments")
      const data = await res.json()
      const allPayments: Payment[] = data.payments || []
      setPayments(allPayments)
    } catch (error) {
      console.error("Error loading payments:", error)
    }
  }

  const filterPayments = () => {
    let filtered = [...payments]

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.userId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => {
        if (statusFilter === "completed") {
          return p.status === "completed" || p.status === "success"
        }
        return p.status === statusFilter
      })
    }

    if (currencyFilter !== "all") {
      filtered = filtered.filter((p) => p.currency === currencyFilter)
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })

    setFilteredPayments(filtered)
  }

  const totals = useMemo(() => {
    const completed = payments.filter((p) => p.status === "completed" || p.status === "success")
    const pending = payments.filter((p) => p.status === "pending")
    const failed = payments.filter((p) => p.status === "failed")
    const refunded = payments.filter((p) => p.status === "refunded")

    const totalRevenue = completed.reduce((sum, p) => {
      if (p.currency === "NGN") return sum + p.amount
      if (p.currency === "USD") return sum + p.amount * 1250
      if (p.currency === "GBP") return sum + p.amount * 1580
      return sum
    }, 0)

    return {
      totalRevenue,
      completed: completed.length,
      pending: pending.length,
      failed: failed.length,
      refunded: refunded.length,
      total: payments.length,
    }
  }, [payments])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "refunded":
        return <RotateCcw className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
        return <Badge className="bg-green-500">Completed</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "refunded":
        return <Badge className="bg-blue-500">Refunded</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const exportCSV = () => {
    const header = [
      "reference",
      "payment_id",
      "user_id",
      "course_id",
      "amount",
      "currency",
      "status",
      "payment_method",
      "created_at",
    ]
    const rows = filteredPayments.map((p) => [
      p.reference,
      p.id,
      p.userId,
      p.courseId,
      String(p.amount),
      p.currency,
      p.status,
      p.paymentMethod,
      new Date(p.createdAt).toISOString(),
    ])

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "transactions.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/finance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Transactions</h1>
          <p className="text-muted-foreground mt-2">
            Review, filter, and export all payment transactions
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">â‚¦{totals.totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">{totals.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{totals.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className="text-2xl font-bold text-red-600">{totals.failed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Refunded</p>
            <p className="text-2xl font-bold text-blue-600">{totals.refunded}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search by reference or filter by status/currency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                <SelectItem value="NGN">NGN</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
                setCurrencyFilter("all")
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                Showing {filteredPayments.length} of {payments.length} total transactions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Reference</th>
                    <th className="text-left p-3 font-semibold">Student ID</th>
                    <th className="text-left p-3 font-semibold">Amount</th>
                    <th className="text-left p-3 font-semibold">Currency</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-accent/50 transition-colors">
                      <td className="p-3">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {payment.reference}
                        </code>
                      </td>
                      <td className="p-3 font-medium">{payment.userId}</td>
                      <td className="p-3 font-semibold">
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{payment.currency}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          {getStatusBadge(payment.status)}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

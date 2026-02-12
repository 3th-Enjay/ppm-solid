"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Calendar, TrendingUp, DollarSign } from "lucide-react"
import type { Payment } from "@/lib/types"
import Link from "next/link"

export default function ReportsPage() {
  const [reports, setReports] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
  })

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const res = await fetch("/api/payments")
      const data = await res.json()
      const allPayments: Payment[] = data.payments || []
      
      const successfulPayments = allPayments.filter(
        (p) => p.status === "completed" || p.status === "success"
      )

      const totalRevenue = successfulPayments.reduce((sum, p) => {
        if (p.currency === "NGN") return sum + p.amount
        if (p.currency === "USD") return sum + p.amount * 1250
        if (p.currency === "GBP") return sum + p.amount * 1580
        return sum
      }, 0)

      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const thisYear = new Date(now.getFullYear(), 0, 1)

      const monthlyPayments = successfulPayments.filter((p) => {
        const date = new Date(p.createdAt)
        return date >= thisMonth
      })

      const yearlyPayments = successfulPayments.filter((p) => {
        const date = new Date(p.createdAt)
        return date >= thisYear
      })

      const monthlyRevenue = monthlyPayments.reduce((sum, p) => {
        if (p.currency === "NGN") return sum + p.amount
        if (p.currency === "USD") return sum + p.amount * 1250
        if (p.currency === "GBP") return sum + p.amount * 1580
        return sum
      }, 0)

      const yearlyRevenue = yearlyPayments.reduce((sum, p) => {
        if (p.currency === "NGN") return sum + p.amount
        if (p.currency === "USD") return sum + p.amount * 1250
        if (p.currency === "GBP") return sum + p.amount * 1580
        return sum
      }, 0)

      setReports({
        totalRevenue,
        monthlyRevenue,
        yearlyRevenue,
        totalTransactions: allPayments.length,
        successfulTransactions: successfulPayments.length,
        failedTransactions: allPayments.length - successfulPayments.length,
      })
    } catch (error) {
      console.error("Error loading reports:", error)
    }
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

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground mt-2">Generate and view financial reports</p>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₦{reports.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₦{reports.monthlyRevenue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Yearly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₦{reports.yearlyRevenue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">This year</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Transaction Summary</CardTitle>
          <CardDescription>Overview of all payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold">{reports.totalTransactions}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Successful</p>
              <p className="text-2xl font-bold text-green-600">{reports.successfulTransactions}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-red-600">{reports.failedTransactions}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
          <CardDescription>Export financial data in various formats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">Monthly Revenue Report</h3>
                <p className="text-sm text-muted-foreground">Export monthly revenue data as CSV</p>
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">Transaction Report</h3>
                <p className="text-sm text-muted-foreground">Export all transactions as Excel</p>
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">Financial Summary PDF</h3>
                <p className="text-sm text-muted-foreground">Generate comprehensive PDF report</p>
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Generate PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


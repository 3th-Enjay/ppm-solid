"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, CreditCard, DollarSign, Download, TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RoleAnalyticsCard } from "@/components/skillup/role-analytics-card"
import type { Payment } from "@/lib/types"
import { buildAdminRevenueTrend, buildFinanceCurrencyRevenue, buildFinanceStatusMix } from "@/lib/analytics/adapters"
import { roleAnalyticsRegistry } from "@/lib/analytics/registry"

export default function ReportsPage() {
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await fetch("/api/payments")
        const data = await res.json()
        setPayments(data.payments || [])
      } catch (error) {
        console.error("Error loading reports:", error)
      }
    }

    void loadReports()
  }, [])

  const stats = useMemo(() => {
    const successful = payments.filter((p) => p.status === "completed" || p.status === "success")
    const totalRevenueNgn = successful.reduce((sum, p) => {
      if (p.currency === "NGN") return sum + p.amount
      if (p.currency === "USD") return sum + p.amount * 1250
      if (p.currency === "GBP") return sum + p.amount * 1580
      return sum
    }, 0)

    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyRevenueNgn = successful
      .filter((p) => new Date(p.createdAt) >= thisMonth)
      .reduce((sum, p) => {
        if (p.currency === "NGN") return sum + p.amount
        if (p.currency === "USD") return sum + p.amount * 1250
        if (p.currency === "GBP") return sum + p.amount * 1580
        return sum
      }, 0)

    return {
      totalRevenueNgn,
      monthlyRevenueNgn,
      totalTransactions: payments.length,
      successfulTransactions: successful.length,
    }
  }, [payments])

  const currencyRevenue = buildFinanceCurrencyRevenue(payments)
  const statusMix = buildFinanceStatusMix(payments)
  const revenueTrend = buildAdminRevenueTrend(payments)
  const [currencyMeta, statusMeta] = roleAnalyticsRegistry.finance
  const pieColors = ["#4f46e5", "#22c7a8", "#f59e0b", "#ef4444", "#64748b"]

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="space-y-4">
        <Link href="/finance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Financial Reports</h1>
            <p className="mt-1 text-muted-foreground">Revenue and transaction analytics across all payment rails.</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (NGN est.)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">N{stats.totalRevenueNgn.toLocaleString()}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">N{stats.monthlyRevenueNgn.toLocaleString()}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.totalTransactions}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.successfulTransactions}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RoleAnalyticsCard title={currencyMeta.title} subtitle={currencyMeta.subtitle}>
          {currencyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currencyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="currency" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="total" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No revenue data.</div>
          )}
        </RoleAnalyticsCard>

        <RoleAnalyticsCard title={statusMeta.title} subtitle={statusMeta.subtitle}>
          {statusMix.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusMix} dataKey="total" nameKey="status" outerRadius={95} label>
                  {statusMix.map((item, index) => (
                    <Cell key={item.status} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No status data.</div>
          )}
        </RoleAnalyticsCard>
      </div>

      <RoleAnalyticsCard title="Monthly Revenue Trend" subtitle="Completed transactions converted to NGN estimate">
        {revenueTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No trend data.</div>
        )}
      </RoleAnalyticsCard>

      <Card>
        <CardHeader>
          <CardTitle>Report Export Queue</CardTitle>
          <CardDescription>Placeholder actions for CSV, Excel, and PDF exports.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Button variant="outline" className="h-11">Export Monthly CSV</Button>
          <Button variant="outline" className="h-11">Export Transactions Excel</Button>
          <Button variant="outline" className="h-11">Generate Summary PDF</Button>
        </CardContent>
      </Card>
    </div>
  )
}

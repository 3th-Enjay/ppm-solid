"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Users, 
  Download, 
  Filter, 
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  LockKeyhole
} from "lucide-react"
import type { Payment } from "@/lib/types"
import Link from "next/link"
import { useAuthStore } from "@/lib/store"

export default function FinanceDashboard() {
  const { token } = useAuthStore()
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currencyFilter, setCurrencyFilter] = useState<string>("all")
  const [stats, setStats] = useState({
    totalRevenueNGN: 0,
    totalRevenueUSD: 0,
    totalRevenueGBP: 0,
    successfulTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    totalStudents: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

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

      // Calculate stats
      const successfulPayments = allPayments.filter((p) => p.status === "completed" || p.status === "success")
      const pendingPayments = allPayments.filter((p) => p.status === "pending")
      const failedPayments = allPayments.filter((p) => p.status === "failed")

      const totalRevenueNGN = successfulPayments
        .filter((p) => p.currency === "NGN")
        .reduce((sum, p) => sum + p.amount, 0)

      const totalRevenueUSD = successfulPayments
        .filter((p) => p.currency === "USD")
        .reduce((sum, p) => sum + p.amount, 0)

      const totalRevenueGBP = successfulPayments
        .filter((p) => p.currency === "GBP")
        .reduce((sum, p) => sum + p.amount, 0)

      const uniqueStudents = new Set(allPayments.map((p) => p.userId)).size

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayPayments = successfulPayments.filter((p) => {
        const paymentDate = new Date(p.createdAt)
        return paymentDate >= today
      })
      const todayRevenue = todayPayments.reduce((sum, p) => {
        if (p.currency === "NGN") return sum + p.amount
        if (p.currency === "USD") return sum + p.amount * 1250 // Approx conversion
        if (p.currency === "GBP") return sum + p.amount * 1580
        return sum
      }, 0)

      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)
      const monthlyPayments = successfulPayments.filter((p) => {
        const paymentDate = new Date(p.createdAt)
        return paymentDate >= thisMonth
      })
      const monthlyRevenue = monthlyPayments.reduce((sum, p) => {
        if (p.currency === "NGN") return sum + p.amount
        if (p.currency === "USD") return sum + p.amount * 1250
        if (p.currency === "GBP") return sum + p.amount * 1580
        return sum
      }, 0)

      setStats({
        totalRevenueNGN,
        totalRevenueUSD,
        totalRevenueGBP,
        successfulTransactions: successfulPayments.length,
        pendingTransactions: pendingPayments.length,
        failedTransactions: failedPayments.length,
        totalStudents: uniqueStudents,
        todayRevenue,
        monthlyRevenue,
      })
    } catch (error) {
      console.error("Error loading payments:", error)
    }
  }

  const filterPayments = () => {
    let filtered = [...payments]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => {
        if (statusFilter === "success") return p.status === "completed" || p.status === "success"
        return p.status === statusFilter
      })
    }

    // Currency filter
    if (currencyFilter !== "all") {
      filtered = filtered.filter((p) => p.currency === currencyFilter)
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })

    setFilteredPayments(filtered)
  }

  const handlePasswordUpdate = async () => {
    setPasswordError("")
    setPasswordSuccess("")
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.")
      return
    }
    setPasswordLoading(true)
    try {
      const res = await fetch("/api/users/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password")
      }
      setPasswordSuccess("Password updated successfully.")
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password")
    } finally {
      setPasswordLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
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
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "NGN") return `₦${amount.toLocaleString()}`
    if (currency === "USD") return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (currency === "GBP") return `£${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return `${amount} ${currency}`
  }

  const statCards = [
    {
      title: "Total Revenue (NGN)",
      value: `₦${stats.totalRevenueNGN.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+12.5%",
      trend: "up",
    },
    {
      title: "Total Revenue (USD)",
      value: `$${stats.totalRevenueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+8.2%",
      trend: "up",
    },
    {
      title: "Successful Transactions",
      value: stats.successfulTransactions,
      icon: CheckCircle2,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      subtitle: `${stats.pendingTransactions} pending`,
    },
    {
      title: "Unique Students",
      value: stats.totalStudents,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      subtitle: "Total paying customers",
    },
    {
      title: "Today's Revenue",
      value: `₦${stats.todayRevenue.toLocaleString()}`,
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      change: "+5.3%",
      trend: "up",
    },
    {
      title: "Monthly Revenue",
      value: `₦${stats.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      change: "+15.7%",
      trend: "up",
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Finance Dashboard</h1>
          <p className="text-muted-foreground mt-2">Monitor revenue, transactions, and financial analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/finance/transactions">
              <CreditCard className="h-4 w-4 mr-2" />
              View All Transactions
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bgColor} opacity-20 rounded-full -mr-16 -mt-16`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-2xl font-bold mb-1">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                )}
                {stat.change && (
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground">vs last period</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Transaction Filters</CardTitle>
          <CardDescription>Filter and search through payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference..."
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
                <SelectItem value="success">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
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

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Showing {filteredPayments.length} of {payments.length} transactions
              </CardDescription>
            </div>
            <Link href="/finance/transactions">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
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
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.slice(0, 15).map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-accent/50 transition-colors">
                      <td className="p-3">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {payment.reference.slice(0, 16)}...
                        </code>
                      </td>
                      <td className="p-3 font-medium">{payment.userId.slice(0, 8)}...</td>
                      <td className="p-3 font-semibold">{formatCurrency(payment.amount, payment.currency)}</td>
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
                      <td className="p-3">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4" />
              Change Password
            </CardTitle>
            <CardDescription>Update your finance account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            {passwordSuccess && (
              <Alert>
                <AlertDescription>{passwordSuccess}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="finance-current-password">Current Password</Label>
              <Input
                id="finance-current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finance-new-password">New Password</Label>
              <Input
                id="finance-new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finance-confirm-password">Confirm New Password</Label>
              <Input
                id="finance-confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
              />
            </div>
            <Button onClick={handlePasswordUpdate} className="w-full" disabled={passwordLoading}>
              {passwordLoading ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

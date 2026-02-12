"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  BarChart3,
  BookOpen,
  CreditCard,
  TrendingUp,
  Users,
  UserPlus,
  History,
  LockKeyhole,
} from "lucide-react"
import type { Payment, User, Course, Enrollment, AdminLog } from "@/lib/types"
import { formatDate } from "@/lib/utils/format"
import { useAuthStore } from "@/lib/store"

export default function AdminDashboardPage() {
  const { token } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    role: "admin",
    password: "",
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState("")
  const [createSuccess, setCreateSuccess] = useState("")
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  useEffect(() => {
    loadAdminData()
  }, [])

  useEffect(() => {
    if (token) {
      loadAdminLogs()
    }
  }, [token])

  const loadAdminData = async () => {
    try {
      const [usersRes, enrollmentsRes, paymentsRes, coursesRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/enrollments?all=true"),
        fetch("/api/payments"),
        fetch("/api/courses?includeDrafts=true"),
      ])

      const usersData = await usersRes.json()
      const enrollmentsData = await enrollmentsRes.json()
      const paymentsData = await paymentsRes.json()
      const coursesData = await coursesRes.json()

      setUsers(usersData.users || [])
      setEnrollments(enrollmentsData.enrollments || [])
      setPayments(paymentsData.payments || [])
      setCourses(coursesData.courses || [])
    } catch (error) {
      console.error("Error loading admin data:", error)
    }
  }

  const loadAdminLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await fetch("/api/admin/logs", {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      })
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error("Error loading admin logs:", error)
    } finally {
      setLogsLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError("")
    setCreateSuccess("")
    setCreateLoading(true)
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(createForm),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user")
      }
      setCreateSuccess(`Created ${createForm.role} for ${createForm.email}`)
      setCreateForm({ name: "", email: "", role: "admin", password: "" })
      loadAdminData()
      loadAdminLogs()
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user")
    } finally {
      setCreateLoading(false)
    }
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

  const stats = useMemo(() => {
    const students = users.filter((u) => u.role === "student")
    const instructors = users.filter((u) => u.role === "instructor")
    const completedPayments = payments.filter((p) => p.status === "completed")
    const pendingPayments = payments.filter((p) => p.status === "pending")

    const totalRevenue = completedPayments.reduce((sum, p) => {
      if (p.currency === "NGN") return sum + p.amount
      if (p.currency === "USD") return sum + p.amount * 1250
      if (p.currency === "GBP") return sum + p.amount * 1580
      return sum
    }, 0)

    return {
      totalUsers: users.length,
      totalStudents: students.length,
      totalInstructors: instructors.length,
      totalCourses: courses.length,
      totalEnrollments: enrollments.length,
      totalRevenue,
      pendingPayments: pendingPayments.length,
    }
  }, [users, courses, enrollments, payments])

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Platform overview and operational metrics</p>
        </div>
        <div className="flex gap-2">
          <Sheet open={createOpen} onOpenChange={setCreateOpen}>
            <SheetTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Admin/Finance
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Create Admin or Finance Account</SheetTitle>
                <SheetDescription>
                  New users can log in immediately and change their password.
                </SheetDescription>
              </SheetHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 px-4 pb-6">
                {createError && (
                  <Alert variant="destructive">
                    <AlertDescription>{createError}</AlertDescription>
                  </Alert>
                )}
                {createSuccess && (
                  <Alert>
                    <AlertDescription>{createSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="create-name">Full Name</Label>
                  <Input
                    id="create-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={createForm.role}
                    onValueChange={(value) => setCreateForm({ ...createForm, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-password">Temporary Password</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={createLoading}>
                  {createLoading ? "Creating..." : "Create Account"}
                </Button>
              </form>
            </SheetContent>
          </Sheet>
          <Button variant="outline" asChild>
            <Link href="/admin/courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Manage Courses
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/payments">
              <CreditCard className="h-4 w-4 mr-2" />
              View Payments
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalStudents} students â€¢ {stats.totalInstructors} instructors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">Active learners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">â‚¦{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingPayments} pending payments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest transactions across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <div className="text-sm font-semibold">{payment.reference}</div>
                      <div className="text-xs text-muted-foreground">
                        {payment.userId} â€¢ {formatDate(payment.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{payment.currency} {payment.amount}</div>
                      <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>New accounts created recently</CardDescription>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users found.</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Admin Activity Log
            </CardTitle>
            <CardDescription>Track admin and finance account actions</CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <p className="text-sm text-muted-foreground">Loading logs...</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No admin activity yet.</p>
            ) : (
              <div className="space-y-3">
                {logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-start justify-between gap-3 border rounded-lg p-3">
                    <div>
                      <div className="text-sm font-semibold">
                        {log.action === "create_user" && (
                          <>
                            {log.actorName} created {log.targetRole}
                          </>
                        )}
                        {log.action === "update_password" && (
                          <>
                            {log.actorName} updated their password
                          </>
                        )}
                        {log.action === "other" && (
                          <>
                            {log.actorName} performed an action
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.actorEmail}
                        {log.targetEmail ? ` â€¢ ${log.targetEmail}` : ""}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4" />
              Change Password
            </CardTitle>
            <CardDescription>Update your admin password</CardDescription>
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
              <Label htmlFor="admin-current-password">Current Password</Label>
              <Input
                id="admin-current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-new-password">New Password</Label>
              <Input
                id="admin-new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-confirm-password">Confirm New Password</Label>
              <Input
                id="admin-confirm-password"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/courses">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Course Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Approve, edit, or archive courses.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/students">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Student Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Monitor student activity and status.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/payments">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Oversight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Review transactions and handle refunds.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

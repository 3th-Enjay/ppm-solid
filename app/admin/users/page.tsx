"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Mail, Search, ShieldCheck, Trash2, UserCog, UserRound, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Enrollment, User, UserRole } from "@/lib/types"
import { formatDate } from "@/lib/utils/format"
import { useAuthStore } from "@/lib/store"
import { AdminActionDialog } from "@/components/admin/AdminActionDialog"

const ROLE_LABEL: Record<UserRole, string> = {
  student: "Students",
  instructor: "Instructors",
  admin: "Admins",
  finance: "Finance",
}

const ROLE_ICON: Record<UserRole, typeof Users> = {
  student: Users,
  instructor: UserRound,
  admin: ShieldCheck,
  finance: UserCog,
}

export default function AdminUsersPage() {
  const { user: currentUser, token } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all")
  const [showUnverifiedOnly, setShowUnverifiedOnly] = useState(false)
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null)
  const [statusDialogUser, setStatusDialogUser] = useState<User | null>(null)
  const [deleteDialogUser, setDeleteDialogUser] = useState<User | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [usersRes, enrollmentsRes] = await Promise.all([
          fetch("/api/users", {
            headers: {
              Authorization: `Bearer ${token || ""}`,
            },
          }),
          fetch("/api/enrollments?all=true"),
        ])
        const usersData = await usersRes.json()
        const enrollmentsData = await enrollmentsRes.json()
        setUsers(usersData.users || [])
        setEnrollments(enrollmentsData.enrollments || [])
      } catch (error) {
        console.error("Failed to load users:", error)
        setUsers([])
        setEnrollments([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [token])

  const enrollmentByUserId = useMemo(() => {
    return enrollments.reduce<Record<string, number>>((acc, enrollment) => {
      acc[enrollment.userId] = (acc[enrollment.userId] || 0) + 1
      return acc
    }, {})
  }, [enrollments])

  const filteredUsers = useMemo(() => {
    let result = [...users]

    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter)
    }

    if (statusFilter !== "all") {
      result = result.filter((u) => (u.status || "active") === statusFilter)
    }

    if (showUnverifiedOnly) {
      result = result.filter((u) => !u.emailVerified)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q),
      )
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [users, roleFilter, statusFilter, searchQuery, showUnverifiedOnly])

  const groupedUsers = useMemo(() => {
    const roles: UserRole[] =
      roleFilter === "all" ? ["student", "instructor", "admin", "finance"] : [roleFilter]

    return roles.map((role) => ({
      role,
      users: filteredUsers.filter((u) => u.role === role),
    }))
  }, [filteredUsers, roleFilter])

  const stats = useMemo(() => {
    return {
      total: users.length,
      student: users.filter((u) => u.role === "student").length,
      instructor: users.filter((u) => u.role === "instructor").length,
      admin: users.filter((u) => u.role === "admin").length,
      finance: users.filter((u) => u.role === "finance").length,
    }
  }, [users])

  const toggleUserStatus = async (target: User) => {
    if (target.role === "admin" && target.id === currentUser?.id) {
      return
    }

    const nextStatus = (target.status || "active") === "active" ? "suspended" : "active"
    const actionKey = `status-${target.id}`
    setPendingActionKey(actionKey)
    try {
      const res = await fetch(`/api/users/${target.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) {
        throw new Error("Failed to update user status")
      }
      const data = await res.json()
      setUsers((prev) => prev.map((u) => (u.id === target.id ? data.user : u)))
    } catch (error) {
      console.error("Failed to update user:", error)
      throw error
    } finally {
      setPendingActionKey(null)
    }
  }

  const deleteUser = async (target: User) => {
    const canDelete =
      target.role === "instructor" || 
      target.role === "finance" || 
      target.role === "admin" || 
      !target.emailVerified

    if (!canDelete) {
      throw new Error("Only instructors, finance users, admins, and unverified users can be deleted")
    }

    const actionKey = `delete-${target.id}`
    setPendingActionKey(actionKey)
    try {
      const res = await fetch(`/api/users/${target.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete user")
      }
      
      setUsers((prev) => prev.filter((u) => u.id !== target.id))
    } catch (error) {
      console.error("Failed to delete user:", error)
      throw error
    } finally {
      setPendingActionKey(null)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage all account categories and control user access across the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">All Users</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Students</p><p className="text-2xl font-bold">{stats.student}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Instructors</p><p className="text-2xl font-bold">{stats.instructor}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Admins</p><p className="text-2xl font-bold">{stats.admin}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Finance</p><p className="text-2xl font-bold">{stats.finance}</p></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Find users by name/email and filter by role or status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant={showUnverifiedOnly ? "default" : "outline"}
              onClick={() => setShowUnverifiedOnly((prev) => !prev)}
            >
              {showUnverifiedOnly ? "Showing Unverified" : "Show Unverified"}
            </Button>
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as "all" | UserRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="instructor">Instructors</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "suspended")}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Loading users...</CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedUsers.map(({ role, users: roleUsers }) => {
            const Icon = ROLE_ICON[role]
            return (
              <Card key={role}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {ROLE_LABEL[role]} ({roleUsers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {roleUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users in this category.</p>
                  ) : (
                    <div className="space-y-3">
                      {roleUsers.map((u) => {
                        const status = u.status || "active"
                        const isSelfAdmin = u.role === "admin" && u.id === currentUser?.id
                        const canToggle = !(u.role === "admin" && isSelfAdmin)
                        const canDelete = 
                          u.role === "instructor" || 
                          u.role === "finance" || 
                          u.role === "admin" || 
                          !u.emailVerified
                        return (
                          <div key={u.id} className="rounded-lg border p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{u.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="capitalize">{u.role}</Badge>
                                <Badge variant={status === "active" ? "default" : "destructive"}>{status}</Badge>
                                <Badge variant="secondary">Enrollments: {enrollmentByUserId[u.id] || 0}</Badge>
                                <Badge variant="secondary">Joined: {formatDate(u.createdAt)}</Badge>
                                {!u.emailVerified && <Badge variant="destructive">Unverified</Badge>}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <a href={`mailto:${u.email}`}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Email
                                </a>
                              </Button>
                              {canDelete && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setDeleteDialogUser(u)}
                                  disabled={pendingActionKey === `delete-${u.id}` || Boolean(statusDialogUser)}
                                >
                                  {pendingActionKey === `delete-${u.id}` ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                  )}
                                  {pendingActionKey === `delete-${u.id}` ? "Deleting..." : "Delete"}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant={status === "active" ? "destructive" : "default"}
                                disabled={!canToggle || pendingActionKey === `status-${u.id}` || Boolean(deleteDialogUser)}
                                onClick={() => setStatusDialogUser(u)}
                              >
                                {pendingActionKey === `status-${u.id}` ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                  </>
                                ) : status === "active" ? (
                                  "Suspend"
                                ) : (
                                  "Activate"
                                )}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AdminActionDialog
        open={Boolean(statusDialogUser)}
        onOpenChange={(open) => {
          if (!open) setStatusDialogUser(null)
        }}
        title={statusDialogUser?.status === "suspended" ? "Activate user" : "Suspend user"}
        description={
          statusDialogUser
            ? `${statusDialogUser.name} (${statusDialogUser.email}) will be ${statusDialogUser.status === "suspended" ? "activated" : "suspended"}.`
            : "Confirm status update."
        }
        warningBadge="Access Control"
        secondaryDescription="This action immediately changes account access permissions."
        confirmLabel={statusDialogUser?.status === "suspended" ? "Activate User" : "Suspend User"}
        successToast="User status updated."
        errorToast="Failed to update user status."
        executeAction={async () => {
          if (!statusDialogUser) return
          await toggleUserStatus(statusDialogUser)
        }}
      />

      <AdminActionDialog
        open={Boolean(deleteDialogUser)}
        onOpenChange={(open) => {
          if (!open) setDeleteDialogUser(null)
        }}
        title="Delete user"
        description={
          deleteDialogUser
            ? `Delete ${deleteDialogUser.name} (${deleteDialogUser.email}). This action cannot be undone.`
            : "Delete selected user."
        }
        warningBadge="Destructive Action"
        secondaryDescription="Only eligible accounts can be deleted."
        confirmLabel="Delete User"
        successToast="User deleted successfully."
        errorToast="Failed to delete user."
        executeAction={async () => {
          if (!deleteDialogUser) return
          await deleteUser(deleteDialogUser)
        }}
      />
    </div>
  )
}

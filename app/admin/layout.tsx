"use client"

import type React from "react"
import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, BookOpen, CreditCard, Settings, Users } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import { getRoleHomePath } from "@/lib/role-routing"
import { clientLogout, makeLogoutGuard } from "@/lib/client-logout"
import { RoleDashboardShell } from "@/components/skillup/role-dashboard-shell"
import type { DashboardNavItem } from "@/components/skillup/dashboard-nav"

const adminNavItems: DashboardNavItem[] = [
  { name: "Dashboard", href: "/admin", icon: BarChart3 },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Courses", href: "/admin/courses", icon: BookOpen },
  { name: "Students", href: "/admin/students", icon: Users },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, clearAuth, hydrated } = useAuthStore()
  const logoutGuard = useMemo(() => makeLogoutGuard(), [])

  useEffect(() => {
    if (logoutGuard.isLoggingOut()) return
    if (!hydrated) return
    if (!user) {
      router.replace("/login?redirect=/admin")
    } else if (user.role !== "admin") {
      router.replace(getRoleHomePath(user.role))
    }
  }, [user, hydrated, router, logoutGuard])

  if (!hydrated || !user || user.role !== "admin") return null

  const handleLogout = async () => {
    logoutGuard.start()
    await clientLogout()
    router.replace("/")
    clearAuth()
  }

  return (
    <RoleDashboardShell
      roleLabel="Admin"
      userName={user.name}
      userAvatar={user.avatar}
      navItems={adminNavItems}
      onLogout={handleLogout}
      homeHref="/admin"
    >
      {children}
    </RoleDashboardShell>
  )
}


"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, BookOpen, CreditCard, MapPinned, Megaphone, Settings, Users } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import { getRoleHomePath } from "@/lib/role-routing"
import { clientLogout, makeLogoutGuard } from "@/lib/client-logout"
import { RoleDashboardShell } from "@/components/skillup/role-dashboard-shell"
import type { DashboardNavItem } from "@/components/skillup/dashboard-nav"

const adminNavItems: DashboardNavItem[] = [
  { name: "Dashboard", href: "/admin", icon: BarChart3 },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Onsite Training", href: "/admin/onsite-training", icon: MapPinned },
  { name: "Campaign", href: "/admin/campaign", icon: Megaphone },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Courses", href: "/admin/courses", icon: BookOpen },
  { name: "Students", href: "/admin/students", icon: Users },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, token, setAuth, clearAuth, hydrated } = useAuthStore()
  const logoutGuard = useMemo(() => makeLogoutGuard(), [])
  const [accessVerified, setAccessVerified] = useState(false)

  useEffect(() => {
    if (logoutGuard.isLoggingOut()) return
    if (!hydrated) return

    let cancelled = false

    const redirectToLogin = () => {
      clearAuth()
      router.replace("/login?redirect=/admin")
    }

    const verifyAccess = async () => {
      setAccessVerified(false)

      if (!token) {
        redirectToLogin()
        return
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          if (!cancelled) {
            redirectToLogin()
          }
          return
        }

        const data = await res.json()
        const currentUser = data?.user

        if (!currentUser) {
          if (!cancelled) {
            redirectToLogin()
          }
          return
        }

        setAuth(currentUser, token)

        if (currentUser.role !== "admin") {
          if (!cancelled) {
            router.replace(getRoleHomePath(currentUser.role))
          }
          return
        }

        if (!cancelled) {
          setAccessVerified(true)
        }
      } catch {
        if (!cancelled) {
          redirectToLogin()
        }
      }
    }

    void verifyAccess()

    return () => {
      cancelled = true
    }
  }, [hydrated, token, setAuth, clearAuth, router, logoutGuard])

  if (!hydrated || !user || user.role !== "admin" || !accessVerified) return null

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

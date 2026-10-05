"use client"

import type React from "react"
import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { getRoleHomePath } from "@/lib/role-routing"
import { clientLogout, makeLogoutGuard } from "@/lib/client-logout"
import { RoleDashboardShell } from "@/components/skillup/role-dashboard-shell"
import { studentNavItems } from "@/components/skillup/dashboard-nav"
import { toDisplayName } from "@/lib/utils/name"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, clearAuth, hydrated } = useAuthStore()
  const logoutGuard = useMemo(() => makeLogoutGuard(), [])

  useEffect(() => {
    if (logoutGuard.isLoggingOut()) return
    if (!hydrated) return
    if (!user) {
      router.push("/login?redirect=/dashboard")
    } else if (user.role !== "student") {
      router.replace(getRoleHomePath(user.role))
    }
  }, [user, hydrated, router, logoutGuard])

  if (!hydrated || !user || user.role !== "student") {
    return null
  }

  const displayName = toDisplayName(user.name)

  const handleLogout = async () => {
    logoutGuard.start()
    await clientLogout()
    router.replace("/")
    clearAuth()
  }

  return (
    <RoleDashboardShell
      roleLabel="Student"
      userName={displayName}
      userAvatar={user.avatar}
      navItems={studentNavItems}
      onLogout={handleLogout}
      homeHref="/dashboard"
      settingsHref="/dashboard/profile?tab=settings"
      headerTitle="Student Dashboard"
    >
      {children}
    </RoleDashboardShell>
  )
}

"use client"

import type React from "react"
import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, CreditCard, Home, Settings } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import { getRoleHomePath } from "@/lib/role-routing"
import { clientLogout, makeLogoutGuard } from "@/lib/client-logout"
import { RoleDashboardShell } from "@/components/skillup/role-dashboard-shell"
import type { DashboardNavItem } from "@/components/skillup/dashboard-nav"

const financeNavItems: DashboardNavItem[] = [
  { name: "Dashboard", href: "/finance", icon: Home },
  { name: "Transactions", href: "/finance/transactions", icon: CreditCard },
  { name: "Reports", href: "/finance/reports", icon: BarChart3 },
  { name: "Settings", href: "/finance/settings", icon: Settings },
]

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, clearAuth, hydrated } = useAuthStore()
  const logoutGuard = useMemo(() => makeLogoutGuard(), [])

  useEffect(() => {
    if (logoutGuard.isLoggingOut()) return
    if (!hydrated) return
    if (!user) {
      router.push("/login")
    } else if (user.role !== "finance") {
      router.replace(getRoleHomePath(user.role))
    }
  }, [user, hydrated, router, logoutGuard])

  if (!hydrated || !user || user.role !== "finance") return null

  const handleLogout = async () => {
    logoutGuard.start()
    await clientLogout()
    router.replace("/")
    clearAuth()
  }

  return (
    <RoleDashboardShell
      roleLabel="Finance"
      userName={user.name}
      userAvatar={user.avatar}
      navItems={financeNavItems}
      onLogout={handleLogout}
      homeHref="/finance"
    >
      {children}
    </RoleDashboardShell>
  )
}


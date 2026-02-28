// app/dashboard/layout.tsx
"use client"

import type React from "react"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRoleHomePath } from "@/lib/role-routing"
import { clientLogout, makeLogoutGuard } from "@/lib/client-logout"
import Image from "next/image"
import { DashboardNav } from "@/components/skillup/dashboard-nav"
import { DashboardHeader } from "@/components/skillup/dashboard-header"
import { UserAvatar } from "@/components/skillup/user-avatar"
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
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-72 border-r border-border/80 bg-card/80 p-4 lg:block">
        <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-2xl border border-border/80 bg-card p-4 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex items-center gap-3 border-b border-border/80 pb-4">
            <Image src="/promptcare-icon.png" alt="Prompt Care Academy" width={48} height={48} className="h-10 w-10" />
            <div>
              <p className="text-sm font-semibold">Prompt Care Academy</p>
              <p className="text-xs text-muted-foreground">Learning App</p>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-border/80 bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Level up, champion!</p>
            <div className="mt-2 flex items-center gap-2">
              <UserAvatar name={displayName} imageUrl={user.avatar || null} size="sm" />
              <p className="truncate text-sm font-semibold">Welcome, {displayName}</p>
            </div>
          </div>

          <DashboardNav className="flex-1" />

          <div className="mt-4 border-t border-border/80 pt-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-semibold text-primary">{displayName.charAt(0)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <DashboardHeader user={{ name: displayName, avatar: user.avatar }} onLogout={handleLogout} />
        {children}
      </main>
    </div>
  )
}

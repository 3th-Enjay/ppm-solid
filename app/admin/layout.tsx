"use client"

import type React from "react"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { BookOpen, Users, BarChart3, Settings, CreditCard, LogOut } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getRoleHomePath } from "@/lib/role-routing"
import { clientLogout, makeLogoutGuard } from "@/lib/client-logout"
import Image from "next/image"

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

  if (!hydrated || !user || user.role !== "admin") {
    return null
  }

  const handleLogout = async () => {
    logoutGuard.start()
    await clientLogout()
    router.replace("/")
    clearAuth()
  }

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: BarChart3 },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Courses", href: "/admin/courses", icon: BookOpen },
    { name: "Students", href: "/admin/students", icon: Users },
    { name: "Payments", href: "/admin/payments", icon: CreditCard },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Image
              src="/promptcare-icon.png"
              alt="Prompt Care Academy"
              width={72}
              height={72}
              className="h-14 w-14"
            />
            <span className="ml-2 text-lg font-bold">Admin</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">{user.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}


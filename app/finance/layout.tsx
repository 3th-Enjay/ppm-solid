"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { DollarSign, Home, BarChart3, Settings, LogOut, CreditCard } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getRoleHomePath } from "@/lib/role-routing"

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, clearAuth, hydrated } = useAuthStore()

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.push("/login")
    } else if (user.role !== "finance") {
      router.replace(getRoleHomePath(user.role))
    }
  }, [user, hydrated, router])

  if (!hydrated || !user || user.role !== "finance") {
    return null
  }

  const handleLogout = () => {
    clearAuth()
    router.push("/")
  }

  const navigation = [
    { name: "Dashboard", href: "/finance", icon: Home },
    { name: "Transactions", href: "/finance/transactions", icon: CreditCard },
    { name: "Reports", href: "/finance/reports", icon: BarChart3 },
    { name: "Settings", href: "/finance/settings", icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <DollarSign className="h-6 w-6 text-primary" />
            <span className="ml-2 text-lg font-bold">Prompt Care Academy</span>
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
                <p className="text-xs text-muted-foreground">Finance</p>
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
      <main className="flex-1 overflow-auto">
        <div className="bg-background">{children}</div>
      </main>
    </div>
  )
}


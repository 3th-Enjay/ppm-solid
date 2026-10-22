"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardNav, type DashboardNavItem } from "@/components/skillup/dashboard-nav"
import { UserAvatar } from "@/components/skillup/user-avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import { toDisplayName } from "@/lib/utils/name"
import { Logo, LogoMark } from "@/components/ui/logo"
import { getAcademyName } from "@/lib/brand-config"

interface RoleDashboardShellProps {
  roleLabel: string
  userName: string
  userAvatar?: string | null
  navItems: DashboardNavItem[]
  children: ReactNode
  onLogout: () => Promise<void> | void
  homeHref: string
  settingsHref?: string
  headerTitle?: string
}

export function RoleDashboardShell({
  roleLabel,
  userName,
  userAvatar,
  navItems,
  children,
  onLogout,
  homeHref,
  settingsHref,
  headerTitle,
}: RoleDashboardShellProps) {
  const [open, setOpen] = useState(false)
  const displayName = toDisplayName(userName)
  const resolvedSettingsHref = settingsHref || `${homeHref}/settings`
  const resolvedHeaderTitle = headerTitle || `${roleLabel} Dashboard`
  const academyName = getAcademyName()

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-72 border-r border-border/80 bg-card/80 p-4 lg:block">
        <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-2xl border border-border/80 bg-card p-4 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex items-center gap-3 border-b border-border/80 pb-4">
            <LogoMark size={36} className="h-9 w-9 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{academyName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel} Console</p>
            </div>
          </div>

          <div className="mb-4 rounded-2xl border border-border/80 bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <div className="mt-2 flex items-center gap-3">
              <UserAvatar name={displayName} imageUrl={userAvatar || null} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
          </div>

          <DashboardNav className="flex-1" items={navItems} />

          <div className="mt-4 border-t border-border/80 pt-4">
            <div className="mb-3 flex items-center gap-3">
              <UserAvatar name={displayName} imageUrl={userAvatar || null} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={() => onLogout()}>
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-xl">
          <div className="px-4 py-3 md:px-6 lg:px-8">
            <div className="hidden min-h-11 items-center justify-between md:flex">
              <h1 className="text-lg font-semibold">{resolvedHeaderTitle}</h1>
              <DropdownMenu>
                <UserAvatar name={displayName} imageUrl={userAvatar || null} size="md" dropdownTrigger />
                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                  <DropdownMenuItem asChild>
                    <Link href={homeHref}>Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={resolvedSettingsHref}>Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onLogout()}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid min-h-11 grid-cols-[44px_1fr_44px] items-center md:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button size="icon" variant="outline" aria-label="Open navigation" className="size-11 rounded-2xl">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[88%] max-w-sm rounded-r-3xl">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-left">
                      <LogoMark size={24} className="h-6 w-6 shrink-0" />
                      <span className="truncate">{academyName}</span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-border/80 bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Welcome back</p>
                      <p className="truncate text-sm font-semibold">{displayName}</p>
                    </div>
                    <DashboardNav items={navItems} onItemClick={() => setOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center justify-center">
                <Logo variant="compact" href={homeHref} academyName={academyName} />
              </div>

              <div className="flex justify-end">
                <DropdownMenu>
                  <UserAvatar name={displayName} imageUrl={userAvatar || null} size="sm" dropdownTrigger />
                  <DropdownMenuContent align="end" className="w-44 rounded-xl">
                    <DropdownMenuItem asChild>
                      <Link href={homeHref}>Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={resolvedSettingsHref}>Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onLogout()}>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}

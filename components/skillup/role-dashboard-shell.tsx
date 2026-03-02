"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardNav, type DashboardNavItem } from "@/components/skillup/dashboard-nav"
import { UserAvatar } from "@/components/skillup/user-avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import { toDisplayName } from "@/lib/utils/name"

interface RoleDashboardShellProps {
  roleLabel: string
  userName: string
  userAvatar?: string | null
  navItems: DashboardNavItem[]
  children: ReactNode
  onLogout: () => Promise<void> | void
  homeHref: string
}

export function RoleDashboardShell({
  roleLabel,
  userName,
  userAvatar,
  navItems,
  children,
  onLogout,
  homeHref,
}: RoleDashboardShellProps) {
  const [open, setOpen] = useState(false)
  const displayName = toDisplayName(userName)

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-72 border-r border-border/80 bg-card/80 p-4 lg:block">
        <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-2xl border border-border/80 bg-card p-4 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex items-center gap-3 border-b border-border/80 pb-4">
            <Image src="/promptcare-icon.png" alt="Prompt Care Academy" width={44} height={44} className="h-10 w-10" />
            <div>
              <p className="text-sm font-semibold">Prompt Care Academy</p>
              <p className="text-xs text-muted-foreground">{roleLabel} Console</p>
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
              <h1 className="text-lg font-semibold">{roleLabel} Dashboard</h1>
              <DropdownMenu>
                <UserAvatar name={displayName} imageUrl={userAvatar || null} size="md" dropdownTrigger />
                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                  <DropdownMenuItem asChild>
                    <Link href={homeHref}>Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`${homeHref}/settings`}>Settings</Link>
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
                    <SheetTitle className="flex items-center gap-2">
                      <Image
                        src="/promptcare-icon.png"
                        alt="Prompt Care Academy"
                        width={24}
                        height={24}
                        className="h-6 w-6"
                      />
                      Prompt Care Academy
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

              <div className="flex items-center justify-center gap-2">
                <Image src="/promptcare-icon.png" alt="Prompt Care Academy" width={18} height={18} className="h-5 w-5" />
                <span className="text-center text-xs uppercase tracking-wide text-foreground">
                  <span className="font-bold">PROMPT</span> <span className="font-normal">CARE</span>{" "}
                  <span className="font-normal">ACADEMY</span>
                </span>
              </div>

              <div className="flex justify-end">
                <DropdownMenu>
                  <UserAvatar name={displayName} imageUrl={userAvatar || null} size="sm" dropdownTrigger />
                  <DropdownMenuContent align="end" className="w-44 rounded-xl">
                    <DropdownMenuItem asChild>
                      <Link href={homeHref}>Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`${homeHref}/settings`}>Settings</Link>
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

// components/skillup/dashboard-header.tsx
"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardNav } from "@/components/skillup/dashboard-nav"
import { UserAvatar } from "@/components/skillup/user-avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { User } from "@/lib/types"
import Image from "next/image"

interface DashboardHeaderProps {
  user: Pick<User, "name" | "avatar">
  onLogout: () => Promise<void> | void
}

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard"
  if (pathname.startsWith("/dashboard/courses")) return "My Courses"
  if (pathname.startsWith("/dashboard/certificates")) return "Certificates"
  if (pathname.startsWith("/dashboard/payments")) return "Payments"
  if (pathname.startsWith("/dashboard/profile")) return "Profile"
  return "Dashboard"
}

export function DashboardHeader({ user, onLogout }: DashboardHeaderProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  const title = useMemo(() => getPageTitle(pathname), [pathname])

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="px-4 py-3 md:px-6 lg:px-8">
        <div className="hidden min-h-11 items-center justify-between md:flex">
          <h1 className="text-lg font-semibold">{title}</h1>
          <DropdownMenu>
            <UserAvatar name={user.name} imageUrl={user.avatar || null} size="md" dropdownTrigger />
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile?tab=settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onLogout()}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid min-h-11 grid-cols-[44px_1fr_44px] items-center md:hidden">
          {/* Top-level mobile pages use menu toggle, not a back button. */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                aria-label="Open dashboard navigation"
                className="size-11 rounded-2xl"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[88%] max-w-sm rounded-r-3xl">
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
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
                    <p className="text-xs text-muted-foreground">Ready to win today's streak?</p>
                    <p className="truncate text-sm font-semibold">Welcome, {user.name}</p>
                  </div>
                  <DashboardNav onItemClick={() => setMobileOpen(false)} />
                </div>
              </motion.div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center justify-center gap-2">
            <Image src="/promptcare-icon.png" alt="Prompt Care Academy" width={18} height={18} className="h-5 w-5" />
            <h1 className="text-center text-sm font-semibold">Prompt Care Academy</h1>
          </div>

          <div className="flex justify-end">
            <DropdownMenu>
              <UserAvatar name={user.name} imageUrl={user.avatar || null} size="sm" dropdownTrigger />
              <DropdownMenuContent align="end" className="w-44 rounded-xl">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile?tab=settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLogout()}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

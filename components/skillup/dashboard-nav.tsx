"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Award, BookOpen, CreditCard, Home, MapPinned, User } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DashboardNavItem {
  name: string
  href: string
  icon: LucideIcon
}

export const studentNavItems: DashboardNavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "My Courses", href: "/dashboard/courses", icon: BookOpen },
  { name: "Onsite Training", href: "/dashboard/onsite-training", icon: MapPinned },
  { name: "Certificates", href: "/dashboard/certificates", icon: Award },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { name: "Profile", href: "/dashboard/profile", icon: User },
]

interface DashboardNavProps {
  className?: string
  onItemClick?: () => void
  iconOnly?: boolean
  items?: DashboardNavItem[]
}

export function DashboardNav({
  className,
  onItemClick,
  iconOnly = false,
  items = studentNavItems,
}: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("space-y-1", className)}>
      {items.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            title={iconOnly ? item.name : undefined}
            className={cn(
              "flex items-center rounded-xl text-sm font-medium transition-colors",
              iconOnly ? "justify-center px-0 py-3 min-h-11" : "gap-3 px-3 py-2",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className={cn(iconOnly ? "sr-only" : "")}>{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}

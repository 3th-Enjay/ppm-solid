"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RoleAnalyticsCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}

export function RoleAnalyticsCard({ title, subtitle, children, className }: RoleAnalyticsCardProps) {
  return (
    <Card variant="elevated" className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </CardHeader>
      <CardContent className="h-[280px]">{children}</CardContent>
    </Card>
  )
}


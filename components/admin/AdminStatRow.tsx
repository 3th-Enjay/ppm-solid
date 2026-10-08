"use client"

import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type AdminStatItem = {
  key: string
  label: string
  value: string | number
  icon: LucideIcon
  delta?: string
  windowLabel?: string
}

interface AdminStatRowProps {
  items: AdminStatItem[]
  columnsClassName?: string
}

export function AdminStatRow({ items, columnsClassName = "grid-cols-1 md:grid-cols-4" }: AdminStatRowProps) {
  return (
    <div className={`grid gap-4 ${columnsClassName}`}>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.key}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{item.value}</p>
              <div className="mt-2 flex items-center gap-2">
                {item.delta ? <Badge variant="outline">{item.delta}</Badge> : null}
                {item.windowLabel ? <span className="text-xs text-muted-foreground">{item.windowLabel}</span> : null}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

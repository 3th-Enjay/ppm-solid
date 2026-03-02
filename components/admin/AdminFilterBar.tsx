"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"

interface AdminFilterBarProps {
  title?: string
  description?: string
  onClear?: () => void
  children: ReactNode
}

export function AdminFilterBar({ title = "Filters", description, onClear, children }: AdminFilterBarProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {onClear ? (
          <Button variant="outline" size="sm" onClick={onClear}>
            <Filter className="mr-2 h-4 w-4" />
            Clear
          </Button>
        ) : null}
      </div>
      {children}
    </div>
  )
}

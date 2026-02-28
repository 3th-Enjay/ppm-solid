import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface MetricCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  toneClass?: string
  helperText?: string
}

export function MetricCard({ title, value, icon: Icon, toneClass = "text-primary", helperText }: MetricCardProps) {
  return (
    <Card variant="elevated" className="py-0">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="rounded-lg bg-secondary p-2">
            <Icon className={`h-4 w-4 ${toneClass}`} />
          </div>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
      </CardContent>
    </Card>
  )
}

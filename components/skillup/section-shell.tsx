import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SectionShellProps {
  children: ReactNode
  className?: string
  containerClassName?: string
  contained?: boolean
}

export function SectionShell({
  children,
  className,
  containerClassName,
  contained = true,
}: SectionShellProps) {
  if (!contained) {
    return <section className={cn("py-16 md:py-24", className)}>{children}</section>
  }

  return (
    <section className={cn("py-16 md:py-24", className)}>
      <div className={cn("container", containerClassName)}>{children}</div>
    </section>
  )
}

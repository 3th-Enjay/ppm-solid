import type { ReactNode } from "react"
import Link from "next/link"
import { Link2 } from "lucide-react"

interface LegalSectionProps {
  id: string
  title: string
  children: ReactNode
}

export function LegalSection({ id, title, children }: LegalSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3 rounded-2xl border border-border/70 bg-card/50 p-5" aria-labelledby={`${id}-title`}>
      <div className="group flex items-center gap-2">
        <h2 id={`${id}-title`} tabIndex={-1} className="text-xl font-semibold outline-none">
          {title}
        </h2>
        <Link
          href={`#${id}`}
          className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity duration-200 hover:text-primary focus-visible:opacity-100 group-hover:opacity-100"
          aria-label={`Link to ${title}`}
        >
          <Link2 className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-3 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  )
}

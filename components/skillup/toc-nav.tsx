"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type TOCSection = {
  id: string
  label: string
}

interface TOCNavProps {
  sections: TOCSection[]
}

export function TOCNav({ sections }: TOCNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "")

  useEffect(() => {
    const nodes = sections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => Boolean(node))

    if (!nodes.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0.2, 0.4, 0.6] },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [sections])

  const scrollToSection = (id: string) => {
    const node = document.getElementById(id)
    if (!node) return
    node.scrollIntoView({ behavior: "smooth", block: "start" })
    const target = node.querySelector("h2")
    if (target instanceof HTMLElement) {
      target.focus()
    }
    setActiveId(id)
  }

  return (
    <div className="space-y-3">
      <label htmlFor="legal-toc-mobile" className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:hidden">
        Sections
      </label>
      <select
        id="legal-toc-mobile"
        className="h-11 w-full rounded-2xl border border-border/80 bg-background px-3 text-sm lg:hidden"
        value={activeId}
        onChange={(event) => scrollToSection(event.target.value)}
      >
        {sections.map((section) => (
          <option key={section.id} value={section.id}>
            {section.label}
          </option>
        ))}
      </select>

      <nav aria-label="Table of contents" className="hidden rounded-2xl border border-border/80 bg-card/70 p-3 lg:block">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">On this page</p>
        <ul className="space-y-1">
          {sections.map((section) => (
            <li key={section.id}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "h-9 w-full justify-start rounded-xl border-l-2 border-transparent px-3 text-sm",
                  activeId === section.id ? "border-l-primary text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {section.label}
              </Button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}


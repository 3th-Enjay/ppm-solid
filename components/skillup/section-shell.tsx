import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SectionShellProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  className?: string
  containerClassName?: string
  contained?: boolean
  variant?: "default" | "split" | "immersive"
  hasParallax?: boolean
  hasFloatingAccent?: boolean
  divider?: "none" | "wave" | "curve"
  backgroundType?: "none" | "gradient" | "image"
  backgroundImageUrl?: string
  backgroundImageAlt?: string
}

export function SectionShell({
  children,
  className,
  containerClassName,
  contained = true,
  variant = "default",
  hasParallax = false,
  hasFloatingAccent = false,
  divider = "none",
  backgroundType = "none",
  backgroundImageUrl,
  backgroundImageAlt = "",
  ...rest
}: SectionShellProps) {
  const variantClass =
    variant === "immersive"
      ? "py-20 md:py-28"
      : variant === "split"
        ? "py-14 md:py-20"
        : "py-16 md:py-24"

  const sectionBody = (
    <>
      {hasParallax ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,color-mix(in_oklab,var(--accent)_14%,transparent)_0%,transparent_42%),radial-gradient(circle_at_86%_4%,color-mix(in_oklab,var(--primary)_10%,transparent)_0%,transparent_38%)]"
        />
      ) : null}
      {backgroundType === "gradient" ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,color-mix(in_oklab,var(--primary)_8%,transparent)_0%,color-mix(in_oklab,var(--accent)_12%,transparent)_55%,transparent_100%)]"
        />
      ) : null}
      {backgroundType === "image" && backgroundImageUrl ? (
        <>
          <img
            src={backgroundImageUrl}
            alt={backgroundImageAlt}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,20,0.68)_0%,rgba(8,11,20,0.72)_100%)]"
          />
        </>
      ) : null}
      {hasFloatingAccent ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 top-8 h-40 w-40 rounded-full bg-accent/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-10 bottom-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl"
          />
        </>
      ) : null}
      {contained ? <div className={cn("container relative z-[1]", containerClassName)}>{children}</div> : children}
      {divider !== "none" ? (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-10",
            divider === "wave"
              ? "bg-[radial-gradient(50%_90%_at_50%_100%,color-mix(in_oklab,var(--accent)_20%,transparent)_0%,transparent_70%)]"
              : "bg-[linear-gradient(180deg,transparent_0%,color-mix(in_oklab,var(--primary)_10%,transparent)_100%)]",
          )}
        />
      ) : null}
    </>
  )

  if (!contained) {
    return (
      <section className={cn("relative overflow-hidden", variantClass, className)} {...rest}>
        {sectionBody}
      </section>
    )
  }

  return (
    <section className={cn("relative overflow-hidden", variantClass, className)} {...rest}>
      {sectionBody}
    </section>
  )
}

// components/skillup/user-avatar.tsx
"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type AvatarSize = "sm" | "md" | "lg"

interface UserAvatarProps {
  name: string
  imageUrl?: string | null
  size?: AvatarSize
  className?: string
  // When true, renders as a dropdown trigger for shadcn DropdownMenu.
  dropdownTrigger?: boolean
}

const sizeClasses: Record<AvatarSize, { root: string; text: string }> = {
  sm: { root: "h-9 w-9", text: "text-sm" },
  md: { root: "h-11 w-11", text: "text-base" },
  lg: { root: "h-14 w-14", text: "text-lg" },
}

// Controlled palette so colors are consistent, accessible, and brand-safe.
const colorPalette = [
  "bg-blue-500/15 text-blue-700 ring-blue-500/20 dark:text-blue-300",
  "bg-indigo-500/15 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300",
  "bg-sky-500/15 text-sky-700 ring-sky-500/20 dark:text-sky-300",
  "bg-amber-500/15 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  "bg-rose-500/15 text-rose-700 ring-rose-500/20 dark:text-rose-300",
  "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
]

function getInitial(name: string): string {
  const first = name.trim().split(/\s+/)[0] || "U"
  return first.charAt(0).toUpperCase()
}

function getDeterministicColorClass(name: string): string {
  const normalized = name.trim().toLowerCase()
  let hash = 0
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0
  }
  return colorPalette[hash % colorPalette.length]
}

function AvatarContent({ name, imageUrl, size = "md", className }: Omit<UserAvatarProps, "dropdownTrigger">) {
  const prefersReducedMotion = useReducedMotion()
  const initials = getInitial(name)
  const toneClass = getDeterministicColorClass(name)
  const dimensions = sizeClasses[size]

  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { scale: 1.04, y: -1 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className={cn("inline-flex rounded-full", className)}
      role="img"
      aria-label={`${name} avatar`}
    >
      <Avatar
        className={cn(
          dimensions.root,
          "rounded-full ring-1 ring-border/70 shadow-sm transition-shadow hover:shadow-[var(--shadow-soft)]",
        )}
      >
        {imageUrl ? <AvatarImage src={imageUrl} alt={`${name}'s avatar`} /> : null}
        <AvatarFallback className={cn("font-semibold", dimensions.text, toneClass)}>{initials}</AvatarFallback>
      </Avatar>
    </motion.div>
  )
}

export function UserAvatar({
  name,
  imageUrl = null,
  size = "md",
  className,
  dropdownTrigger = false,
}: UserAvatarProps) {
  if (dropdownTrigger) {
    return (
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${name} account menu`}
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <AvatarContent name={name} imageUrl={imageUrl} size={size} className={className} />
        </button>
      </DropdownMenuTrigger>
    )
  }

  return <AvatarContent name={name} imageUrl={imageUrl} size={size} className={className} />
}

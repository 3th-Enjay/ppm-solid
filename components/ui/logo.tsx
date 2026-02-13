import Link from "next/link"
import Image from "next/image"

interface LogoProps {
  className?: string
  variant?: "full" | "icon"
}

export function Logo({ className, variant = "full" }: LogoProps) {
  if (variant === "icon") {
    return (
      <Link href="/" className={`flex items-center ${className}`}>
        <Image
          src="/promptcare-icon.png"
          alt="Promptcare Academy"
          width={40}
          height={40}
          priority
          className="h-10 w-10"
        />
      </Link>
    )
  }

  return (
    <Link href="/" className={`flex items-center gap-3 font-bold text-xl ${className}`}>
      <Image
        src="/promptcare-icon.png"
        alt="Prompt Care Academy"
        width={72}
        height={72}
        priority
        className="h-14 w-14"
      />
      <span className="hidden sm:inline bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold text-lg">
        Promptcare Academy
      </span>
    </Link>
  )
}


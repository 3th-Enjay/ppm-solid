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
          alt="Prompt Care Academy"
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
      <span className="hidden sm:inline text-lg uppercase tracking-wide text-foreground">
        <span className="font-bold">PROMPT</span>{" "}
        <span className="font-normal">CARE</span>{" "}
        <span className="font-normal">ACADEMY</span>
      </span>
    </Link>
  )
}

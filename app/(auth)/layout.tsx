import type React from "react"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { getAcademyName } from "@/lib/brand-config"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const academyName = getAcademyName()

  return (
    <>
      <AnimatedBackground />
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(2,132,199,0.08),transparent_26%)]">
        <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,255,255,0))] dark:bg-[linear-gradient(180deg,rgba(9,13,22,0.84),rgba(9,13,22,0))]" />
        <div className="relative flex min-h-screen flex-col">
          <header className="border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between gap-4">
              <Logo />
              <div className="hidden items-center gap-3 text-sm text-muted-foreground md:flex">
                <Link href="/login" className="hover:text-foreground">
                  Login
                </Link>
                <span>&bull;</span>
                <Link href="/register" className="hover:text-foreground">
                  Student Signup
                </Link>
                <span>&bull;</span>
                <Link href="/register-instructor" className="hover:text-foreground">
                  Instructor Signup
                </Link>
              </div>
            </div>
          </header>

          <main className="flex flex-1 items-center justify-center px-4 py-8 md:px-6 md:py-10">{children}</main>

          <footer className="border-t border-border/70 bg-background/70 py-6 backdrop-blur-xl">
            <div className="container text-center text-sm text-muted-foreground">
              <p>
                &copy; {new Date().getFullYear()} {academyName}. All rights reserved.{" "}
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy
                </Link>{" "}
                &bull;{" "}
                <Link href="/terms" className="hover:text-foreground">
                  Terms
                </Link>
              </p>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}

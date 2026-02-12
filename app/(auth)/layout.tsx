import type React from "react"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"
import { AnimatedBackground } from "@/components/ui/animated-background"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center">
            <Logo />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">{children}</main>
        <footer className="border-t py-6">
          <div className="container text-center text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} Prompt Care Academy. All rights reserved.{" "}
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>{" "}
              •{" "}
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}



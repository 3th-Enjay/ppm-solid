"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Menu, ShoppingCart, X } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { clientLogout } from "@/lib/client-logout"
import { useAuthStore, useCartStore } from "@/lib/store"

export function PublicHeader() {
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const { items } = useCartStore()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    clearAuth()
    await clientLogout()
    router.replace("/")
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/courses", label: "Courses" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />

          <nav className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/80 p-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/cart" aria-label="Cart">
            <Button variant="glass" size="icon" className="relative rounded-full border-border/70">
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {items.length}
                </span>
              )}
            </Button>
          </Link>

          {isAuthenticated() && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="glass" className="h-10 w-10 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={
                      user.role === "admin" || user.role === "instructor" || user.role === "finance"
                        ? "/admin"
                        : "/dashboard"
                    }
                  >
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                Login
              </Button>
              <Button variant="cta" size="sm" asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 border-l border-border bg-card p-0">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b p-4">
                  <span className="text-sm font-semibold">Menu</span>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                </div>

                <div className="flex-1 p-4">
                  <nav className="space-y-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                          isActive(link.href)
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </div>

                {!isAuthenticated() && (
                  <div className="space-y-2 border-t p-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        router.push("/login")
                      }}
                    >
                      Login
                    </Button>
                    <Button variant="cta" className="w-full" asChild>
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        Sign Up
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}


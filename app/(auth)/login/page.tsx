"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { buildVerifyOtpRoute } from "@/lib/onboarding-flow"
import { getSafeRedirectForRole } from "@/lib/role-routing"
import { useAuthStore } from "@/lib/store"
import type { User } from "@/lib/types"
import { loginSchema } from "@/lib/validation"

export default function LoginPage() {
  const router = useRouter()
  const { setAuth, user, token, hydrated, lastLogin, clearLastLogin } = useAuthStore()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState("")
  const [activeSessionUser, setActiveSessionUser] = useState<User | null>(null)

  const requestedRedirect = useMemo(() => {
    if (typeof window === "undefined") return null
    return new URLSearchParams(window.location.search).get("redirect")
  }, [])

  useEffect(() => {
    if (!hydrated) return

    let cancelled = false

    const restoreSession = async () => {
      if (user && token) {
        if (!cancelled) {
          setActiveSessionUser(user)
          setCheckingSession(false)
        }
        return
      }

      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        })

        if (!res.ok) {
          if (!cancelled) {
            setCheckingSession(false)
          }
          return
        }

        const data = await res.json()
        if (!data?.user || !data?.token) {
          if (!cancelled) {
            setCheckingSession(false)
          }
          return
        }

        setAuth(data.user, data.token)

        if (!cancelled) {
          setActiveSessionUser(data.user)
          setCheckingSession(false)
        }
      } catch {
        if (!cancelled) {
          setCheckingSession(false)
        }
      }
    }

    void restoreSession()

    return () => {
      cancelled = true
    }
  }, [hydrated, setAuth, token, user])

  useEffect(() => {
    if (!activeSessionUser) return

    const timeout = window.setTimeout(() => {
      router.replace(getSafeRedirectForRole(activeSessionUser.role, requestedRedirect))
    }, 1400)

    return () => window.clearTimeout(timeout)
  }, [activeSessionUser, requestedRedirect, router])

  const handleContinueToDashboard = () => {
    if (!activeSessionUser) return
    router.replace(getSafeRedirectForRole(activeSessionUser.role, requestedRedirect))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const validated = loginSchema.parse({
        email: formData.email,
        password: formData.password,
      })

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validated, remember: formData.remember }),
      })
      const result = await res.json()

      if (!res.ok || !result?.user) {
        if (result?.requiresVerification) {
          const verifyRoute = buildVerifyOtpRoute({
            email: result?.email || formData.email,
            role: result?.role || "student",
            source: "login",
            redirect: requestedRedirect,
          })
          router.push(verifyRoute)
          toast({
            title: "Email verification required",
            description: "Please verify your email to continue. Use the code from signup, or tap Resend on the verify page.",
          })
          setLoading(false)
          return
        }
        setError(result?.error || "Invalid email or password")
        setLoading(false)
        return
      }

      setAuth(result.user, result.token)

      toast({
        title: "Welcome back!",
        description: formData.remember
          ? `Logged in as ${result.user.name}. Your session will be remembered for 30 days.`
          : `Logged in as ${result.user.name}.`,
      })

      const destination = getSafeRedirectForRole(result.user.role, requestedRedirect)
      router.replace(destination)
      router.refresh()
    } catch {
      setError("Please check your credentials and try again")
      setLoading(false)
    }
  }

  const loginDescription = lastLogin
    ? `Welcome back, ${lastLogin.name}. Enter your password to continue with your account.`
    : "Enter your credentials to access your account."

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-xl py-6 md:py-8">
      <Card className="border-primary/15 shadow-xl">
        <CardHeader className="space-y-5 border-b bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="space-y-2 text-center">
            <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Returning User Login
            </p>
            <CardTitle className="text-2xl md:text-3xl">Welcome back</CardTitle>
            <CardDescription className="mx-auto max-w-2xl text-sm md:text-base">{loginDescription}</CardDescription>
          </div>

          <div className="mx-auto w-full max-w-2xl rounded-2xl border bg-background/80 p-4">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-foreground">Fast return, simple sign in</p>
                <p>If a valid session exists, we help you continue immediately. If not, the form stays simple and focused.</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="mx-auto w-full max-w-2xl p-6 md:p-7">
          {!hydrated || checkingSession ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center text-sm text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>If you&apos;re already signed in, we&apos;ll get you moving in a moment.</p>
            </div>
          ) : activeSessionUser ? (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{activeSessionUser.email}</p>
                <p className="mt-1 capitalize">Role: {activeSessionUser.role}</p>
              </div>

              <Button type="button" variant="cta" className="w-full" onClick={handleContinueToDashboard}>
                Go to dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Redirecting automatically in a moment if you do nothing.
              </p>
            </div>
          ) : (
            <>
              {lastLogin && !formData.email && (
                <div className="mb-4 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">Welcome back, {lastLogin.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{lastLogin.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Enter your password to continue with this account.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setFormData((previous) => ({ ...previous, email: lastLogin.email }))}
                      >
                        Use
                      </Button>
                      <Button type="button" size="sm" variant="outline" className="bg-transparent" onClick={clearLastLogin}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.remember}
                    onCheckedChange={(checked) => setFormData({ ...formData, remember: checked as boolean })}
                  />
                  <Label htmlFor="remember" className="cursor-pointer text-sm font-normal">
                    Remember me for 30 days
                  </Label>
                </div>

                <p className="text-xs text-muted-foreground">
                  When unchecked, your sign-in lasts for this browser session. When checked, we keep you signed in for 30 days.
                </p>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <div className="mt-6 border-t pt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Sign up as student
                </Link>{" "}
                or{" "}
                <Link href="/register-instructor" className="font-medium text-primary hover:underline">
                  register as instructor
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

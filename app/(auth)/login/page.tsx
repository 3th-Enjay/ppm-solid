"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { useState } from "react"
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
import { loginSchema } from "@/lib/validation"

export default function LoginPage() {
  const router = useRouter()
  const { setAuth, lastLogin, clearLastLogin } = useAuthStore()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
        body: JSON.stringify(validated),
      })
      const result = await res.json()

      const requestedRedirect =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null

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
        description: `Logged in as ${result.user.name}`,
      })

      const destination = getSafeRedirectForRole(result.user.role, requestedRedirect)
      router.replace(destination)
      router.refresh()
    } catch {
      setError("Please check your credentials and try again")
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {lastLogin && !formData.email && (
            <div className="mb-4 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">Continue as {lastLogin.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{lastLogin.email}</p>
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Sign up as student
            </Link>{" "}
            or{" "}
            <Link href="/register-instructor" className="font-medium text-primary hover:underline">
              register as instructor
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
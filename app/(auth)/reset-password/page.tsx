"use client"

import type React from "react"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { motion } from "framer-motion"
import { Loader2, CheckCircle2, ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

function ResetPasswordPageContent() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const emailParam = searchParams.get("email")
    const tokenParam = searchParams.get("token")
    
    if (emailParam) setEmail(decodeURIComponent(emailParam))
    if (tokenParam) setToken(tokenParam)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (!email || !token) {
      setError("Invalid reset link. Please request a new password reset.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          newPassword: password,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Failed to reset password")
      }

      setSuccess(true)
      toast({
        title: "Password reset successful!",
        description: "Your password has been reset. You can now log in with your new password.",
      })

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to reset password. Please try again.")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-md py-6 md:py-8">
        <Card className="border-primary/15 shadow-xl">
          <CardHeader className="space-y-4 border-b bg-gradient-to-br from-primary/5 via-background to-accent/5 text-center">
            <div className="space-y-2">
              <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Security &amp; Access
              </p>
              <CardTitle className="text-2xl md:text-3xl font-bold">Password Reset Successful</CardTitle>
              <CardDescription>Your password has been updated. You can now sign in with your new credentials.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-7 space-y-4">
            <Alert className="border-primary/30 bg-primary/5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription>
                Your password has been reset successfully. Redirecting you to login...
              </AlertDescription>
            </Alert>
            <Button variant="cta" className="w-full" asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-md py-6 md:py-8">
      <Card className="border-primary/15 shadow-xl">
        <CardHeader className="space-y-4 border-b bg-gradient-to-br from-primary/5 via-background to-accent/5 text-center">
          <div className="space-y-2">
            <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Security &amp; Access
            </p>
            <CardTitle className="text-2xl md:text-3xl font-bold">Reset password</CardTitle>
            <CardDescription className="text-sm md:text-base">Enter your new secure password below to regain account access.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!email && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            {!token && (
              <div className="space-y-2">
                <Label htmlFor="token">Reset Code</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="Enter reset code from email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="cta" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Resetting..." : "Reset Password"}
            </Button>

            <Button variant="ghost" className="w-full" asChild>
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-md py-6 md:py-8">
          <Card className="border-primary/15 shadow-xl">
            <CardHeader className="space-y-4 border-b bg-gradient-to-br from-primary/5 via-background to-accent/5 text-center">
              <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
              <CardDescription>Loading reset details...</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  )
}


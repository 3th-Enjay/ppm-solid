"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { motion } from "framer-motion"
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Failed to send reset link")
      }

      setSuccess(true)
      toast({
        title: "Reset link sent!",
        description: "If an account exists with this email, a password reset link has been sent.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reset link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-md py-6 md:py-8">
      <Card className="border-primary/15 shadow-xl">
        <CardHeader className="space-y-4 border-b bg-gradient-to-br from-primary/5 via-background to-accent/5 text-center">
          <div className="space-y-2">
            <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Account Recovery
            </p>
            <CardTitle className="text-2xl md:text-3xl font-bold">Forgot password?</CardTitle>
            <CardDescription className="text-sm md:text-base">
              {success
                ? "We have dispatched password reset instructions to your email."
                : "Enter your registered email and we will send you secure reset instructions."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-7">
          {success ? (
            <div className="space-y-6">
              <Alert className="border-primary/30 bg-primary/5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertDescription>
                  Password reset link sent to <strong>{email}</strong>. Please check your inbox and spam folder.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button variant="cta" className="w-full" onClick={() => setSuccess(false)}>
                  Send another link
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
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

              <Button type="submit" variant="cta" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Sending link..." : "Send reset link"}
              </Button>

              <Button variant="ghost" className="w-full" asChild>
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

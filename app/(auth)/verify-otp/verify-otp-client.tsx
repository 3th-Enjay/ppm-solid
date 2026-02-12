"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { getRoleHomePath } from "@/lib/role-routing"

export default function VerifyOtpClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const { setAuth } = useAuthStore()
  const { toast } = useToast()

  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState("")

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Invalid OTP")
      }
      setAuth(data.user, data.token)
      toast({
        title: "Email verified",
        description: "Your account is now active.",
      })
      const role = data.user?.role || "student"
      router.push(getRoleHomePath(role))
    } catch (err: any) {
      setError(err.message || "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) return
    setResending(true)
    setError("")
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend OTP")
      }
      toast({ title: "OTP resent", description: "Check your email for the new code." })
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
          <CardDescription>Enter the 6-digit code sent to {email || "your email"}.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Email
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Didn't receive a code?</span>
            <Button variant="ghost" size="sm" onClick={handleResend} disabled={resending}>
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Resending
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-3 w-3" />
                  Resend
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

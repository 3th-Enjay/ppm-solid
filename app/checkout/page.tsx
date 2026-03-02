"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore, useCartStore, usePreferencesStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils/format"
import { CreditCard, Loader2, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CheckoutPage() {
  const router = useRouter()
  const { user, hydrated: authHydrated } = useAuthStore()
  const { items, clearCart, hydrated: cartHydrated } = useCartStore()
  const { currency, hydrated: preferencesHydrated } = usePreferencesStore()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [billingInfo, setBillingInfo] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
  })
  const storesHydrated = authHydrated && cartHydrated && preferencesHydrated

  useEffect(() => {
    if (!storesHydrated) return

    if (!user) {
      router.push("/login?redirect=/checkout")
    }
    if (items.length === 0) {
      router.push("/courses")
    }
  }, [storesHydrated, user, items.length, router])

  const courses = items.map((item) => item.course).filter(Boolean)
  const subtotal = courses.reduce((sum, course) => sum + course.price[currency], 0)
  const discount = 0
  const total = subtotal - discount

  const handlePayment = async () => {
    if (!user || loading) return

    setLoading(true)

    try {
      // Initialize payment
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          courseIds: items.map((item) => item.courseId),
          amount: total,
          email: billingInfo.email,
          currency,
        }),
      })
      const paymentResult = await response.json()

      if (!response.ok) {
        throw new Error(paymentResult.error || "Payment initialization failed")
      }

      if (paymentResult.authorization_url) {
        window.location.href = paymentResult.authorization_url
        return
      }

      // Fallback: verify directly if no authorization URL returned
      const verifyRes = await fetch(`/api/payments/verify?reference=${paymentResult.payment.reference}`)
      const verified = await verifyRes.json()
      if (verified?.verified) {
        clearCart()
        router.push(`/checkout/success?reference=${paymentResult.payment.reference}`)
      } else {
        router.push("/checkout/failed")
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment initialization failed",
        description: "Unable to initialize Paystack payment. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  if (!storesHydrated) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-5xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading checkout details...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!user || items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-background py-12">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-6 py-5">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Fetching payment details...</p>
          </div>
        </div>
      )}
      <div className="container max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 text-balance">Checkout</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Billing Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={billingInfo.name}
                    onChange={(e) => setBillingInfo({ ...billingInfo, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={billingInfo.email}
                    onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={billingInfo.phone}
                    onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
                    placeholder="+234 800 000 0000"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">Paystack Payment Gateway</p>
                    <p className="text-sm text-muted-foreground">Secure payment powered by Paystack</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Your payment information is secure and encrypted</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div key={course?.id} className="flex justify-between text-sm">
                      <span className="line-clamp-1">{course?.title}</span>
                      <span className="font-medium">{formatCurrency(course.price[currency], currency)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount</span>
                    <span className="text-green-600">-{formatCurrency(discount, currency)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(total, currency)}</span>
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={handlePayment} disabled={loading}>
                  {loading ? "Processing..." : "Complete Payment"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By completing this purchase, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

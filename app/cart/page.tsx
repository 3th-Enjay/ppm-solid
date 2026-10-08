"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { X, ShoppingBag, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useCartStore, usePreferencesStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils/format"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"

export default function CartPage() {
  const { items, removeFromCart, clearCart, getTotal } = useCartStore()
  const { currency } = usePreferencesStore()

  const total = getTotal(currency)

  if (items.length === 0) {
    return (
      <>
        <AnimatedBackground />
        <div className="flex min-h-screen flex-col">
          <PublicHeader />
          <main className="flex-1 flex items-center justify-center">
            <div className="container py-12">
              <Card className="max-w-md mx-auto">
                <CardContent className="p-12 text-center space-y-4">
                  <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold">Your cart is empty</h2>
                  <p className="text-muted-foreground">Start adding courses to your cart to see them here</p>
                  <Button asChild className="mt-4">
                    <Link href="/courses">Browse Courses</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
          <PublicFooter />
        </div>
      </>
    )
  }

  return (
    <>
      <AnimatedBackground />
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex-1">
          <div className="container py-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-8">Shopping Cart</h1>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-muted-foreground">
                    {items.length} {items.length === 1 ? "course" : "courses"} in cart
                  </p>
                  {items.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={clearCart}>
                      Clear all
                    </Button>
                  )}
                </div>

                {items.map((item) => (
                  <Card key={item.courseId}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-32 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={item.course.thumbnail || "/placeholder.svg"}
                            alt={item.course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <Link
                                href={`/courses/${item.course.slug}`}
                                className="font-semibold hover:text-primary transition-colors line-clamp-1"
                              >
                                {item.course.title}
                              </Link>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {item.course.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.course.category}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {item.course.level}
                                </Badge>
                              </div>
                            </div>

                            <div className="text-right space-y-2">
                              <div className="text-xl font-bold text-primary">
                                {formatCurrency(item.course.price[currency], currency)}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.courseId)}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-20">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">Order Summary</h3>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatCurrency(total, currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Discount</span>
                          <span className="text-green-600">-{formatCurrency(0, currency)}</span>
                        </div>

                        <Separator />

                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span className="text-primary">{formatCurrency(total, currency)}</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full" size="lg" asChild>
                      <Link href="/checkout">
                        Proceed to Checkout
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>

                    <div className="text-center">
                      <Link href="/courses" className="text-sm text-primary hover:underline">
                        Continue Shopping
                      </Link>
                    </div>

                    <Separator />

                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        <span>30-day money-back guarantee</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        <span>Lifetime access to courses</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        <span>Certificate of completion</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    </>
  )
}

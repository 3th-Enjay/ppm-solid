"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle2, Lock, ShieldCheck, ShoppingCart, Award, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { fadeUp, hoverLift } from "@/lib/motion"
import type { Currency } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/format"

interface EnrollmentCardProps {
  price: number
  currency: Currency
  isEnrolled: boolean
  isInCart: boolean
  onBuyNow: () => void
  onAddToCart: () => void
}

export function EnrollmentCard({
  price,
  currency,
  isEnrolled,
  isInCart,
  onBuyNow,
  onAddToCart,
}: EnrollmentCardProps) {
  return (
    <motion.div variants={fadeUp} initial="initial" animate="animate">
      <Card variant="gradient" className="rounded-3xl border-border/70 py-0">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-1 text-center">
            <p className="text-4xl font-bold text-primary">{formatCurrency(price, currency)}</p>
            <p className="text-sm text-muted-foreground">One-time payment • Lifetime access</p>
          </div>

          <p className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-center text-xs font-medium text-primary">
            Limited seats per cohort
          </p>

          {isEnrolled ? (
            <Button variant="cta" size="lg" className="h-11 w-full rounded-2xl" asChild>
              <Link href="/dashboard">Continue Learning</Link>
            </Button>
          ) : (
            <div className="space-y-3">
              <motion.div {...hoverLift()}>
                <Button variant="cta" size="lg" className="h-11 w-full rounded-2xl" onClick={onBuyNow}>
                  {isInCart ? "Go to Checkout" : "Buy Now"}
                </Button>
              </motion.div>
              {!isInCart ? (
                <Button variant="outline" size="lg" className="h-11 w-full rounded-2xl" onClick={onAddToCart}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              ) : null}
            </div>
          )}

          <div className="space-y-2 border-t border-border/70 pt-4 text-sm">
            <p className="font-semibold">This enrollment includes:</p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Certification included
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Instructor support and career guidance
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Lifetime learning access
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              30-day money-back guarantee
            </p>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              SSL secure
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-3.5 w-3.5" />
              Accredited
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" />
              Certified instructors
            </span>
          </div>

          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Secure enrollment. Track progress. Access from any device.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}


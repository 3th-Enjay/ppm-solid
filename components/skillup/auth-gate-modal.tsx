"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DURATION_FAST, fadeUp, useReducedMotionSafe } from "@/lib/motion"

interface AuthGateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loginHref: string
  registerHref: string
}

export function AuthGateModal({ open, onOpenChange, loginHref, registerHref }: AuthGateModalProps) {
  const shouldReduceMotion = useReducedMotionSafe()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-border/70 bg-background/95 p-0 backdrop-blur-md sm:max-w-md">
        <motion.div
          variants={fadeUp}
          initial={shouldReduceMotion ? false : "initial"}
          animate={shouldReduceMotion ? undefined : "animate"}
          exit={shouldReduceMotion ? undefined : "exit"}
          transition={shouldReduceMotion ? undefined : { duration: DURATION_FAST }}
        >
          <DialogHeader className="space-y-3 border-b border-border/70 p-6">
            <DialogTitle>Create an account to continue</DialogTitle>
            <DialogDescription>
              To securely enroll and track your progress, please create an account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 p-6">
            <Button asChild variant="cta" className="h-11 w-full rounded-2xl">
              <Link href={registerHref}>Register</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 w-full rounded-2xl">
              <Link href={loginHref}>Login</Link>
            </Button>
            <Button
              variant="ghost"
              className="h-11 w-full rounded-2xl text-muted-foreground hover:text-foreground"
              onClick={() => onOpenChange(false)}
            >
              Continue browsing
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}


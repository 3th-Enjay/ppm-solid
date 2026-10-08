"use client"

import type { ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export type OnboardingShellStep = {
  id: string
  title: string
  description: string
}

type OnboardingShellProps = {
  badge?: string
  title: string
  description: string
  currentStep: number
  steps: OnboardingShellStep[]
  children: ReactNode
  aside?: ReactNode
  footer?: ReactNode
  showSidebar?: boolean
  expanded?: boolean
  progressValue?: number
  completedStepIds?: string[]
}

export function OnboardingShell({
  badge,
  title,
  description,
  currentStep,
  steps,
  children,
  aside,
  footer,
  showSidebar = true,
  expanded = false,
  progressValue,
  completedStepIds = [],
}: OnboardingShellProps) {
  const activeStep = steps[currentStep]
  const resolvedProgressValue = progressValue ?? ((currentStep + 1) / steps.length) * 100
  const completedStepSet = new Set(completedStepIds)
  const showRightRail = showSidebar

  return (
    <div className={cn("w-full py-6 md:py-8", expanded ? "mx-auto max-w-6xl" : "mx-auto max-w-5xl")}>
      <div className={cn(showRightRail ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]" : "mx-auto max-w-2xl")}>
        <Card className={cn("border-primary/15 shadow-xl", !showRightRail && "mx-auto w-full")}>
          <CardHeader className="space-y-5 border-b bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <div className="space-y-2 text-center">
              {badge ? (
                <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {badge}
                </p>
              ) : null}
              <CardTitle className="text-2xl md:text-3xl">{title}</CardTitle>
              <CardDescription className="mx-auto max-w-2xl text-sm md:text-base">{description}</CardDescription>
            </div>

            <div className="mx-auto w-full max-w-2xl rounded-2xl border bg-background/80 p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                  <p className="text-sm text-muted-foreground">{activeStep.description}</p>
                </div>
                <p className="text-sm font-medium text-primary">{Math.round(resolvedProgressValue)}% complete</p>
              </div>
              <Progress value={resolvedProgressValue} aria-label={`Progress: ${Math.round(resolvedProgressValue)} percent complete`} />
            </div>
          </CardHeader>

          <CardContent className={cn("p-6", expanded ? "md:p-8" : "mx-auto w-full max-w-2xl md:p-7")}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeStep.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>

            {footer ? <div className="mt-6 border-t pt-6 text-sm text-muted-foreground">{footer}</div> : null}
          </CardContent>
        </Card>

        {showRightRail ? (
          <div className="space-y-4">
            <Card className="border-primary/15">
              <CardHeader>
                <CardTitle className="text-base">Progress map</CardTitle>
                <CardDescription>Each step keeps your current signup flow focused and recoverable.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {steps.map((step, index) => {
                  const isComplete = completedStepSet.has(step.id)
                  const isActive = index === currentStep

                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-start gap-3 rounded-2xl border p-3 transition-colors",
                        isActive ? "border-primary/40 bg-primary/5" : "border-border bg-background",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          isComplete
                            ? "bg-primary text-primary-foreground"
                            : isActive
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-sm font-semibold", isActive ? "text-foreground" : "text-muted-foreground")}>
                          {step.title}
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <AnimatePresence initial={false}>
              {aside ? (
                <motion.div
                  key="aside"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 18 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {aside}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}
      </div>
    </div>
  )
}

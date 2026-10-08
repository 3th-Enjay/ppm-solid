import { useReducedMotion, type Variants } from "framer-motion"

// Shared easing and duration tokens for calm, premium SaaS motion.
export const EASE_OUT = [0.22, 1, 0.36, 1] as const
export const DURATION_FAST = 0.2
export const DURATION_MEDIUM = 0.5
export const DURATION_SLOW = 1.2
export const DURATION_AMBIENT = 10

// Standard reveal for sections and content blocks.
// Use for first-view reveals, not continuous ambient motion.
export const fadeUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION_MEDIUM,
      ease: EASE_OUT,
    },
  },
  exit: {
    opacity: 0,
    y: 12,
    transition: {
      duration: DURATION_FAST,
      ease: EASE_OUT,
    },
  },
}

// Parent stagger wrapper for section children.
// Use on containers that own child variants.
export const sectionStagger: Variants = {
  initial: { opacity: 1 },
  animate: {
    opacity: 1,
    transition: {
      ease: EASE_OUT,
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

// Headline/text mask reveal.
// Text must be wrapped in an overflow-hidden container.
export const maskReveal: Variants = {
  initial: { y: "100%" },
  animate: {
    y: "0%",
    transition: {
      duration: DURATION_MEDIUM,
      ease: EASE_OUT,
    },
  },
}

// Ambient background zoom for hero/media backdrops only.
// Do not apply to foreground text/content.
export const slowZoom: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: 1.06,
    transition: {
      duration: 12,
      ease: "linear",
      repeat: Number.POSITIVE_INFINITY,
      repeatType: "reverse",
    },
  },
}

// Subtle hover depth for cards and interactive panels.
// Intentionally avoids scale bounce.
export const hoverLift = () => ({
  whileHover: { y: -6 },
  transition: {
    duration: DURATION_FAST,
    ease: EASE_OUT,
  },
})

// Soft floating loop for decorative accents/background objects only.
export const floating: Variants = {
  animate: {
    y: [-8, 8],
    transition: {
      duration: 6,
      repeat: Number.POSITIVE_INFINITY,
      repeatType: "reverse",
      ease: "easeInOut",
    },
  },
}

// If true, disable parallax, zoom, floating, and long animations.
export const useReducedMotionSafe = () => {
  const shouldReduceMotion = useReducedMotion()
  return shouldReduceMotion
}

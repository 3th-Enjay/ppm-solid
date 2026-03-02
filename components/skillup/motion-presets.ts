import type { Variants } from "framer-motion"
import {
  DURATION_MEDIUM,
  EASE_OUT,
  fadeUp as fadeUpVariant,
  sectionStagger as sectionStaggerVariant,
} from "@/lib/motion"

// Backward-compatible wrappers while pages migrate to `@/lib/motion`.
export const sectionStagger: Variants = {
  hidden: sectionStaggerVariant.initial,
  visible: sectionStaggerVariant.animate,
}

export const fadeUp = (delay = 0): Variants => ({
  hidden: fadeUpVariant.initial,
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION_MEDIUM,
      ease: EASE_OUT,
      delay,
    },
  },
})

export const scaleIn = (delay = 0): Variants => ({
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATION_MEDIUM,
      ease: EASE_OUT,
      delay,
    },
  },
})

import type { Metadata } from "next"
import FAQPageClient from "./faq-page-client"
import { getAcademyName } from "@/lib/brand-config"

export const metadata: Metadata = {
  title: `FAQ | ${getAcademyName()}`,
  description: "Frequently asked questions regarding technical curriculum tracks, programming prerequisites, assessments, tuition, and certification.",
}

export default function FAQPage() {
  return <FAQPageClient />
}

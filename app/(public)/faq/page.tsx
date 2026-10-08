import type { Metadata } from "next"
import FAQPageClient from "./faq-page-client"

export const metadata: Metadata = {
  title: "FAQ | Prompt Care Academy",
  description: "Answers to admissions, tuition, certification, and caregiver training questions.",
}

export default function FAQPage() {
  return <FAQPageClient />
}


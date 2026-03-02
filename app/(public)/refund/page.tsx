import type { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionShell } from "@/components/skillup/section-shell"
import { LegalSection } from "@/components/skillup/legal-section"
import { TOCNav, type TOCSection } from "@/components/skillup/toc-nav"

export const metadata: Metadata = {
  title: "Refund Policy | Prompt Care Academy",
  description: "Review eligibility, exclusions, and processing timelines for refunds.",
}

const sections: TOCSection[] = [
  { id: "general-policy", label: "General Policy" },
  { id: "refund-eligibility", label: "Refund Eligibility" },
  { id: "non-refundable", label: "Non-Refundable Items" },
  { id: "request-procedure", label: "Request Procedure" },
]

export default function RefundPage() {
  return (
    <div className="pb-12">
      <a href="#legal-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2">
        Skip to legal content
      </a>

      <SectionShell backgroundType="gradient">
        <header className="mx-auto max-w-3xl space-y-2 text-center">
          <Badge variant="info" className="rounded-full px-4 py-1">
            Legal
          </Badge>
          <h1 className="text-4xl font-bold md:text-5xl">Refund &amp; Cancellation Policy</h1>
          <p className="text-sm text-muted-foreground">We value transparency and your data protection.</p>
        </header>
      </SectionShell>

      <SectionShell>
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <TOCNav sections={sections} />
          </aside>
          <article id="legal-content" className="max-w-3xl space-y-4">
            <LegalSection id="general-policy" title="1. General Policy">
              <p>
                Prompt Care Academy is committed to educational excellence. We encourage learners to review course details
                before purchase to ensure the program aligns with career goals.
              </p>
            </LegalSection>

            <LegalSection id="refund-eligibility" title="2. Refund Eligibility">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Full refund may be requested within 48 hours of purchase if less than 10% of course content has been
                  accessed.
                </li>
                <li>
                  If a verified platform technical failure blocks access for more than 7 consecutive working days, partial
                  or full refund review may apply.
                </li>
              </ul>
            </LegalSection>

            <LegalSection id="non-refundable" title="3. Non-Refundable Items">
              <ul className="list-disc space-y-1 pl-5">
                <li>Administrative and registration fees.</li>
                <li>Courses after a certificate or digital credential has been issued.</li>
                <li>
                  Physical, hands-on assessment fees once attendance has been recorded at Enugu or partner facilities.
                </li>
              </ul>
            </LegalSection>

            <LegalSection id="request-procedure" title="4. Request Procedure">
              <p>
                Submit all refund requests by email to{" "}
                <Link href="mailto:promptcareacademy.org2@gmail.com" className="font-medium text-primary hover:underline">
                  promptcareacademy.org2@gmail.com
                </Link>
                . Include your full name, transaction receipt, and reason for request.
              </p>
              <p>Approved refunds are processed to the original payment channel within 7-14 business days.</p>
            </LegalSection>
          </article>
        </div>
      </SectionShell>

      <SectionShell backgroundType="gradient">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <h2 className="text-2xl font-semibold">Questions About Our Policies?</h2>
          <p className="text-sm text-muted-foreground">Reach out to our admissions and support team for clarification.</p>
          <Button asChild className="h-11 rounded-2xl">
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      </SectionShell>
    </div>
  )
}


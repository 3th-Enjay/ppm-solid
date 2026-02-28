import Link from "next/link"

export default function RefundPage() {
  return (
    <div className="container py-10 md:py-14">
      <article className="mx-auto max-w-4xl space-y-8 rounded-2xl border border-border/80 bg-card/70 p-6 md:p-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold md:text-4xl">Refund &amp; Cancellation Policy</h1>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. General Policy</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Prompt Care Academy is committed to educational excellence. We encourage all prospective students to review
            course outlines thoroughly before purchase to ensure the program meets their career goals.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Refund Eligibility</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
            <li>
              Full Refund: A student may request a full refund within 48 hours of the initial purchase, provided they
              have not accessed or completed more than 10% of the course content.
            </li>
            <li>
              Technical Barriers: If a verified technical failure on the Academy's platform prevents a student from
              accessing materials for more than 7 consecutive working days, and our support team cannot provide a
              resolution, a partial or full refund may be considered.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Non-Refundable Items</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
            <li>Administrative and registration fees.</li>
            <li>Any course once a Certificate of Completion or digital credential has been issued.</li>
            <li>
              Fees for physical, hands-on assessment sessions once the student has attended the session at our Enugu
              office or a partner facility.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Request Procedure</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            All refund requests must be submitted formally via email to{" "}
            <Link href="mailto:promptcareacademy.org2@gmail.com" className="text-primary hover:underline">
              promptcareacademy.org2@gmail.com
            </Link>
            . Please include your full name, transaction receipt, and the reason for the request. Approved refunds
            will be processed via the original payment channel within 7-14 business days.
          </p>
        </section>
      </article>
    </div>
  )
}


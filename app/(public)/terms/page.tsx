export default function TermsPage() {
  return (
    <div className="container py-10 md:py-14">
      <article className="mx-auto max-w-4xl space-y-8 rounded-2xl border border-border/80 bg-card/70 p-6 md:p-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold md:text-4xl">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Effective Date: Feb 24 2006</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Welcome to Prompt Care Academy, a subsidiary of Prompt Home Health. By accessing our website, enrolling in
            our courses, or utilizing our training services, you agree to comply with and be bound by these Terms of
            Service. These terms constitute a legally binding agreement between the student and the Academy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Eligibility and Enrollment</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Our programs are professional vocational courses designed for individuals aged 18 and above. By enrolling,
            you represent that all information provided is accurate and that you possess the foundational requirements
            to undergo caregiver training.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Intellectual Property Rights</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            All course materials including but not limited to video lectures, digital manuals, curriculum outlines, and
            assessment tools are the exclusive intellectual property of Prompt Care Academy.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
            <li>
              Restrictions: Users are strictly prohibited from recording, downloading (unless explicitly authorized), or
              redistributing any content without prior written permission from Prompt Care Academy. Unauthorized use may
              lead to immediate termination of access and potential legal action.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Academic Integrity and Conduct</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Students are expected to maintain the highest level of professionalism during online forums and live
            sessions. Any form of harassment, plagiarism, or sharing of login credentials will result in permanent
            expulsion from the Academy without a refund.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Certification Disclaimer</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Certification is awarded only upon the successful completion of all modules and required pass marks in
            assessments. While Prompt Care Academy provides industry-standard training, we do not guarantee immediate
            employment; the certificate serves as a validation of professional competency.
          </p>
        </section>
      </article>
    </div>
  )
}


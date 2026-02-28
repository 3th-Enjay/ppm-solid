export default function PrivacyPage() {
  return (
    <div className="container py-10 md:py-14">
      <article className="mx-auto max-w-4xl space-y-8 rounded-2xl border border-border/80 bg-card/70 p-6 md:p-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold md:text-4xl">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last Updated: [Insert Date]</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Data Collection</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            In accordance with the Nigeria Data Protection Regulation (NDPR), we collect only the information necessary
            to facilitate your education:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
            <li>Personal Information: Name, contact details, and identification for certification.</li>
            <li>Academic Progress: Quiz results, attendance in virtual classes, and assignment submissions.</li>
            <li>
              Payment Processing: Financial transactions are handled via secure third-party processors (e.g.,
              Paystack/Flutterwave). Prompt Care Academy does not store sensitive credit card information.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Use of Information</h2>
          <p className="text-sm leading-7 text-muted-foreground">Your data is used solely to:</p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
            <li>Administer your training and provide technical support.</li>
            <li>Verify your credentials to third-party employers upon your explicit request.</li>
            <li>Communicate essential updates regarding your course or the Academy’s services.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Data Protection and Security</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            We employ industry-standard encryption and security protocols to protect your personal information from
            unauthorized access or disclosure. We do not sell or lease student data to third-party marketers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Your Rights</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            You reserve the right to access your stored data, request corrections to your academic record, or request
            the deletion of your account following the completion of your program.
          </p>
        </section>
      </article>
    </div>
  )
}


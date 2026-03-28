import { Suspense } from "react"
import Link from "next/link"
import { StudentRegistrationForm } from "@/components/auth/student-registration-form"

export default function RegisterPage() {
  return (
    <div className="flex w-full flex-col items-center">
      <Suspense fallback={<div className="w-full py-16 text-center text-sm text-muted-foreground">Loading registration...</div>}>
        <StudentRegistrationForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Want to teach instead?{" "}
        <Link href="/register-instructor" className="font-medium text-primary hover:underline">
          Create an instructor account
        </Link>
      </p>
    </div>
  )
}

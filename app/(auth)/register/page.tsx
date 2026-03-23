import Link from "next/link"
import { StudentRegistrationForm } from "@/components/auth/student-registration-form"

export default function RegisterPage() {
  return (
    <div className="w-full">
      <StudentRegistrationForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Want to teach instead?{" "}
        <Link href="/register-instructor" className="font-medium text-primary hover:underline">
          Create an instructor account
        </Link>
      </p>
    </div>
  )
}

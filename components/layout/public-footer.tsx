import Link from "next/link"
import { Facebook, Instagram, Youtube } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { getAcademyName, getAcademyDescription } from "@/lib/brand-config"

export function PublicFooter() {
  const year = new Date().getFullYear()
  const academyName = getAcademyName()

  return (
    <footer className="border-t border-border/80 bg-card/70">
      <div className="container py-14">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Logo variant="compact" />
            <p className="max-w-md text-sm text-muted-foreground">
              {getAcademyDescription()}
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Learn</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/courses" className="hover:text-foreground">
                  Browse Courses
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-foreground">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Get Started</h3>
            <p className="mb-4 text-sm text-muted-foreground">Teach learners and publish courses with your profile.</p>
            <Link href="/register-instructor" className="text-sm font-semibold text-primary hover:underline">
              Register as an Instructor
            </Link>
          </div>
        </div>

        <div className="mt-10 border-t border-border/80 pt-6 text-sm text-muted-foreground">
          <p>&copy; {year} {academyName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}


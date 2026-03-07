import Link from "next/link"
import { Facebook, Instagram, Youtube } from "lucide-react"
import { Logo } from "@/components/ui/logo"

export function PublicFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/80 bg-card/70">
      <div className="container py-14">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Logo />
            <p className="max-w-md text-sm text-muted-foreground">
              Prompt Care Academy provides practical caregiver education with expert instruction and flexible learning
              paths.
            </p>
            <div className="flex items-center gap-2">
              <Link
                href="https://www.youtube.com/@Promptcareacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border/70 p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </Link>
              <Link
                href="https://www.instagram.com/promptcareacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border/70 p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </Link>
              <Link
                href="https://www.facebook.com/share/186ZGSXgVR/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border/70 p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </Link>
            </div>
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
          <p>&copy; {year} Prompt Care Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}


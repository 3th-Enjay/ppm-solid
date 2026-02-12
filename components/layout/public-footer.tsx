import { Logo } from "@/components/ui/logo"
import Link from "next/link"
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react"

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground">
              Empowering learners worldwide with high-quality online education.
            </p>
            <div className="flex gap-2">
              <Link href="#" className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Facebook className="w-4 h-4" />
              </Link>
              <Link href="#" className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Twitter className="w-4 h-4" />
              </Link>
              <Link href="#" className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Linkedin className="w-4 h-4" />
              </Link>
              <Link href="#" className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Instagram className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/courses" className="hover:text-foreground transition-colors">
                  Browse Courses
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/help" className="hover:text-foreground transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-foreground transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to our newsletter for course updates and special offers.
            </p>
            <Link href="/newsletter" className="text-sm text-primary hover:underline">
              Subscribe Now →
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Prompt Care Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}



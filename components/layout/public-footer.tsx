import { Logo } from "@/components/ui/logo"
import Link from "next/link"
import { Facebook, Instagram, Youtube } from "lucide-react"

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
              <Link 
                href="https://www.youtube.com/@Promptcareacademy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </Link>
              <Link 
                href="https://www.instagram.com/promptcareacademy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </Link>
              <Link 
                href="https://www.tiktok.com/@promptcareacademy7" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="TikTok"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </Link>
              <Link 
                href="https://www.facebook.com/share/186ZGSXgVR/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
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
          <p>&copy; {currentYear} Promptcare Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}



import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { AuthSessionBootstrap } from "@/components/auth/auth-session-bootstrap"
import { Toaster } from "@/components/ui/toaster"
import { CurrencyModal } from "@/components/ui/currency-modal"
import { brandConfig } from "@/lib/brand-config"
import "./globals.css"

const metadataBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: {
    default: `${brandConfig.name} — ${brandConfig.tagline}`,
    template: `%s | ${brandConfig.name}`,
  },
  description: brandConfig.description,
  icons: {
    icon: [
      { url: "/tech-academy-icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: `${brandConfig.name} — ${brandConfig.tagline}`,
    description: brandConfig.description,
    type: "website",
    locale: "en_US",
    siteName: brandConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: brandConfig.name,
    description: brandConfig.description,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthSessionBootstrap />
        {children}
        <Toaster />
        <CurrencyModal />
        <Analytics />
      </body>
    </html>
  )
}

import type React from "react"
import type { Metadata } from "next"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { CurrencyModal } from "@/components/ui/currency-modal"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
})

export const metadata: Metadata = {
  title: "Prompt Care Academy - Premium Online Learning Platform",
  description:
    "Transform your career with Prompt Care Academy. Learn web development, UI/UX design, digital marketing, data analytics and more from industry experts. Join 10,000+ students today.",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/promptcare-icon.png", sizes: "32x32", type: "image/png" },
      { url: "/promptcare-icon.png", sizes: "48x48", type: "image/png" },
      { url: "/promptcare-icon.png", sizes: "64x64", type: "image/png" },
      { url: "/promptcare-icon.png", sizes: "96x96", type: "image/png" },
      { url: "/promptcare-icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/promptcare-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Prompt Care Academy - Premium Online Learning",
    description: "Transform your career with expert-led courses and certification programs",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Care Academy",
    description: "Premium online learning platform for professional development",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${plusJakartaSans.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        <CurrencyModal />
        <Analytics />
      </body>
    </html>
  )
}


import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { CurrencyModal } from "@/components/ui/currency-modal"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PromptCare Academy - Premium Online Learning Platform",
  description:
    "Transform your career with PromptCare Academy. Learn web development, UI/UX design, digital marketing, data analytics and more from industry experts. Join 10,000+ students today.",
  generator: "v0.app",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "PromptCare Academy - Premium Online Learning",
    description: "Transform your career with expert-led courses and certification programs",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptCare Academy",
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
      <body className={`font-sans antialiased`}>
        {children}
        <Toaster />
        <CurrencyModal />
        <Analytics />
      </body>
    </html>
  )
}

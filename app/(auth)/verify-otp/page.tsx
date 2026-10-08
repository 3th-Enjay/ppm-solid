import { Suspense } from "react"
import VerifyOtpClient from "./verify-otp-client"

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <VerifyOtpClient />
    </Suspense>
  )
}

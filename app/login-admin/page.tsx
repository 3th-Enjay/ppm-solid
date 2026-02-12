"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginPageRedirect() {
  const router = useRouter()
  useEffect(() => {
    // Redirect any visitor of /login-admin to the main login page
    router.replace("/login")
  }, [router])

  return null
}


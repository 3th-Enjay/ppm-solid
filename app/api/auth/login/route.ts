import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { loginSchema } from "@/lib/validation"
import { getDB } from "@/lib/db"

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function withAuthCookie(token: string, body: unknown) {
  const response = NextResponse.json(body)
  response.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  })
  return response
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      const firstMessage = Object.values(fieldErrors).flat().find(Boolean) || "Invalid login payload"
      return NextResponse.json({ error: firstMessage, details: fieldErrors }, { status: 400 })
    }

    const validated = parsed.data

    // Attempt login (this handles both env admin and regular users)
    const result = await authService.login(validated.email, validated.password)

    if (!result) {
      // Only report verification required when credentials are valid.
      const status = await authService.validateCredentials(validated.email, validated.password)
      if (status === "unverified") {
        return NextResponse.json({ 
          error: "Email not verified. Please check your email for the verification code.",
          requiresVerification: true 
        }, { status: 403 })
      }
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    return withAuthCookie(result.token, {
      success: true,
      user: result.user,
      token: result.token,
    })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

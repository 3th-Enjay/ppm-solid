import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { getDB } from "@/lib/db"
import { buildVerifyOtpRoute } from "@/lib/onboarding-flow"
import { loginSchema } from "@/lib/validation"

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

    const result = await authService.login(validated.email, validated.password)

    if (!result) {
      const status = await authService.validateCredentials(validated.email, validated.password)
      if (status === "unverified") {
        const db = getDB()
        const user = await db.findUserByEmail(validated.email.trim().toLowerCase())
        const role = user?.role || "student"

        return NextResponse.json(
          {
            error: "Email not verified. Please check your email for the verification code.",
            requiresVerification: true,
            email: validated.email.trim().toLowerCase(),
            role,
            nextRoute: buildVerifyOtpRoute({
              email: validated.email,
              role,
              source: "login",
            }),
          },
          { status: 403 },
        )
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
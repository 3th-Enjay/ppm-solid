import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { loginSchema } from "@/lib/validation"
import jwt from "jsonwebtoken"

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

    // Explicit bypass: check env ADMIN_ACCOUNTS credentials first
    const ADMIN_ACCOUNTS_EMAIL = (process.env.ADMIN_ACCOUNTS_EMAIL || process.env.BOOTSTRAP_ADMIN_EMAIL)?.trim().toLowerCase()
    const ADMIN_ACCOUNTS_PASSWORD = (process.env.ADMIN_ACCOUNTS_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD)?.trim()
    const normalizedInputEmail = validated.email.trim().toLowerCase()

    if (
      ADMIN_ACCOUNTS_EMAIL &&
      ADMIN_ACCOUNTS_PASSWORD &&
      normalizedInputEmail === ADMIN_ACCOUNTS_EMAIL &&
      validated.password === ADMIN_ACCOUNTS_PASSWORD
    ) {
      // Generate token for admin account from env
      const adminUser = {
        id: "admin-bootstrap",
        email: validated.email,
        name: "Admin Account",
        role: "admin" as const,
        status: "active" as const,
        emailVerified: true,
        enrolledCourses: [],
      }
      const JWT_SECRET = (process.env.JWT_SECRET || "your-secret-key-change-in-production").trim()
      const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d").trim()
      const payload = {
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      }
      const options: any = { expiresIn: JWT_EXPIRES_IN }
      const generatedToken = jwt.sign(payload as any, JWT_SECRET as string, options)

      return withAuthCookie(generatedToken, {
        success: true,
        user: adminUser,
        token: generatedToken,
      })
    }

    // Attempt login
    const result = await authService.login(validated.email, validated.password)

    if (!result) {
      return NextResponse.json({ error: "Invalid credentials or email not verified" }, { status: 401 })
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


import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { loginSchema } from "@/lib/validation"
import jwt from "jsonwebtoken"

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
    const ADMIN_ACCOUNTS_EMAIL = process.env.ADMIN_ACCOUNTS_EMAIL?.trim().toLowerCase()
    const ADMIN_ACCOUNTS_PASSWORD = process.env.ADMIN_ACCOUNTS_PASSWORD?.trim()
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

      return NextResponse.json({
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

    // Allow admins to log in via the normal /login route too.
    // (Previously required /login-admin; that page is being removed.)

    return NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
    })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

// Authentication utilities with bcrypt and JWT
import { getDB } from "./db"
import type { PendingRegistration, StudentRegistrationProfile, User } from "./types"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { sendOtpEmail, sendPasswordResetEmail } from "./email"

export interface SessionData {
  userId: string
  email: string
  role: string
}

export type ResendOtpResult =
  | { ok: true }
  | { ok: false; reason: "not_found_or_verified" | "email_send_failed" }

type PendingRegistrationInput = {
  email: string
  password: string
  name: string
  role: "student" | "instructor" | "admin" | "finance"
  studentProfile?: Omit<StudentRegistrationProfile, "submittedAt">
  extraUserFields?: Partial<Pick<User, "bio" | "avatar" | "instructorProfile">>
}

type PendingRegistrationResult = {
  pendingRegistration: Omit<PendingRegistration, "password" | "otpHash">
}

const JWT_SECRET = process.env.JWT_SECRET?.trim()
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d").trim()
const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 5)
const ADMIN_ACCOUNTS_EMAIL = (process.env.ADMIN_ACCOUNTS_EMAIL || process.env.BOOTSTRAP_ADMIN_EMAIL)?.trim()
const ADMIN_ACCOUNTS_PASSWORD = (process.env.ADMIN_ACCOUNTS_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD)?.trim()

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim()

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production")
    }
    throw new Error("JWT_SECRET environment variable is required")
  }

  return secret
}

// Password hashing utility
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

// Password verification utility
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

function generateOtpCode(): string {
  const buffer = crypto.randomBytes(3)
  const code = (buffer.readUIntBE(0, 3) % 1000000).toString().padStart(6, "0")
  return code
}

function sanitizePendingRegistration(registration: PendingRegistration): Omit<PendingRegistration, "password" | "otpHash"> {
  const { password: _password, otpHash: _otpHash, ...safeRegistration } = registration
  return safeRegistration
}

// Generate JWT token
function generateToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }
  const options: any = {
    expiresIn: JWT_EXPIRES_IN,
  }
  return jwt.sign(payload, getJwtSecret(), options)
}

// Verify JWT token
function verifyToken(token: string): SessionData | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as SessionData
    return decoded
  } catch (error) {
    return null
  }
}

export function isValidSessionToken(token: string): boolean {
  return !!token && !!verifyToken(token)
}

async function validateUserPassword(user: User, password: string): Promise<boolean> {
  const isHashed = user.password.startsWith("$2a$") || user.password.startsWith("$2b$")
  if (isHashed) {
    return verifyPassword(password, user.password)
  }
  return user.password === password
}

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const db = getDB()
    const normalizedEmail = email?.trim().toLowerCase()
    const normalizedAdminAccountEmail = ADMIN_ACCOUNTS_EMAIL?.toLowerCase()

    // Check if this is the env admin account first
    if (normalizedAdminAccountEmail && ADMIN_ACCOUNTS_PASSWORD && normalizedEmail === normalizedAdminAccountEmail && password === ADMIN_ACCOUNTS_PASSWORD) {
      // Try to find existing user first
      let user = await db.findUserByEmail(normalizedEmail)
      
      if (!user) {
        // Create admin user if it doesn't exist
        user = await db.createUser({
          email: normalizedEmail,
          password: await hashPassword(password),
          name: "Admin Account",
          role: "admin",
          status: "active",
          emailVerified: true,
          enrolledCourses: [],
        })
      } else {
        // Update user to ensure it's an admin with verified email
        user = await db.updateUser(user.id, {
          role: "admin",
          status: "active",
          emailVerified: true,
        }) || user
      }
      
      const token = generateToken(user)
      const { password: _, ...userWithoutPassword } = user
      return { user: userWithoutPassword as User, token }
    }

    // Regular user login
    const user = await db.findUserByEmail(normalizedEmail)
    if (!user) {
      return null
    }

    let passwordValid = await validateUserPassword(user, password)
    if (passwordValid && !(user.password.startsWith("$2a$") || user.password.startsWith("$2b$"))) {
      const hashedPassword = await hashPassword(password)
      await db.updateUser(user.id, { password: hashedPassword })
    }

    if (!passwordValid) {
      return null
    }

    // Require email verification for users who registered via OTP.
    // OTP is only sent during signup and explicit resend actions.
    if (user.emailVerified === false) {
      return null
    }

    // Generate JWT token
    const token = generateToken(user)

    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = user

    return { user: userWithoutPassword as User, token }
  },

  async validateCredentials(email: string, password: string): Promise<"invalid" | "unverified" | "ok"> {
    const db = getDB()
    const normalizedEmail = email?.trim().toLowerCase()
    if (!normalizedEmail) return "invalid"

    const user = await db.findUserByEmail(normalizedEmail)
    if (!user) return "invalid"

    const passwordValid = await validateUserPassword(user, password)
    if (!passwordValid) return "invalid"

    if (user.emailVerified === false) {
      return "unverified"
    }

    return "ok"
  },

  async register(
    email: string,
    password: string,
    name: string,
    role: "student" | "instructor" | "admin" | "finance" = "student"
  ): Promise<{ user: User; token: string }> {
    const db = getDB()
    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await db.findUserByEmail(normalizedEmail)

    if (existingUser) {
      throw new Error("User already exists")
    }

    // Hash password before storing
    const hashedPassword = await hashPassword(password)

    const user = await db.createUser({
      email: normalizedEmail,
      password: hashedPassword,
      name,
      role,
      status: "active",
      emailVerified: true,
      enrolledCourses: [],
    })

    // Generate JWT token
    const token = generateToken(user)

    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = user

    return { user: userWithoutPassword as User, token }
  },

  async registerWithOtp(
    email: string,
    password: string,
    name: string,
    role: "student" | "instructor" | "admin" | "finance" = "student",
    studentProfile?: Omit<StudentRegistrationProfile, "submittedAt">,
    extraUserFields?: Partial<Pick<User, "bio" | "avatar" | "instructorProfile">>
  ): Promise<PendingRegistrationResult> {
    const db = getDB()
    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await db.findUserByEmail(normalizedEmail)

    if (existingUser) {
      throw new Error("User already exists")
    }

    const existingPendingRegistration = await db.findPendingRegistrationByEmail(normalizedEmail)
    const hashedPassword = await hashPassword(password)
    const otp = generateOtpCode()
    const otpHash = await hashPassword(otp)
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000)

    await sendOtpEmail({ to: normalizedEmail, name, otp })

    const registrationPayload = {
      email: normalizedEmail,
      password: hashedPassword,
      name,
      role,
      bio: extraUserFields?.bio,
      avatar: extraUserFields?.avatar,
      instructorProfile: extraUserFields?.instructorProfile,
      studentProfile: studentProfile
        ? {
            ...studentProfile,
            submittedAt: new Date(),
          }
        : undefined,
      emailVerified: false,
      otpHash,
      otpExpiresAt,
    }

    const pendingRegistration = existingPendingRegistration
      ? await db.updatePendingRegistration(existingPendingRegistration.id, registrationPayload)
      : await db.createPendingRegistration(registrationPayload)

    if (!pendingRegistration) {
      throw new Error("Failed to save pending registration")
    }

    return { pendingRegistration: sanitizePendingRegistration(pendingRegistration) }
  },

  async verifyOtp(email: string, otp: string): Promise<{ user: User; token: string } | null> {
    const db = getDB()
    const normalizedEmail = email.trim().toLowerCase()
    const pendingRegistration = await db.findPendingRegistrationByEmail(normalizedEmail)

    if (pendingRegistration) {
      if (new Date(pendingRegistration.otpExpiresAt).getTime() < Date.now()) {
        return null
      }

      const isValidPendingOtp = await verifyPassword(otp, pendingRegistration.otpHash)
      if (!isValidPendingOtp) {
        return null
      }

      const existingUser = await db.findUserByEmail(normalizedEmail)
      if (existingUser) {
        await db.deletePendingRegistration(pendingRegistration.id)
        return null
      }

      const user = await db.createUser({
        email: pendingRegistration.email,
        password: pendingRegistration.password,
        name: pendingRegistration.name,
        role: pendingRegistration.role,
        avatar: pendingRegistration.avatar,
        bio: pendingRegistration.bio,
        instructorProfile: pendingRegistration.instructorProfile,
        studentProfile: pendingRegistration.studentProfile,
        emailVerified: true,
        enrolledCourses: [],
      })

      const pendingPayments = await db.getPaymentsByUserId(pendingRegistration.id)
      for (const payment of pendingPayments) {
        await db.updatePayment(payment.id, { userId: user.id })
      }

      await db.deletePendingRegistration(pendingRegistration.id)

      const token = generateToken(user)
      const { password: _password, ...userWithoutPassword } = user
      return { user: userWithoutPassword as User, token }
    }

    const user = await db.findUserByEmail(normalizedEmail)

    if (!user || !user.otpHash || !user.otpExpiresAt) {
      return null
    }

    if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
      return null
    }

    const isValid = await verifyPassword(otp, user.otpHash)
    if (!isValid) {
      return null
    }

    const updated = await db.updateUser(user.id, {
      emailVerified: true,
      otpHash: undefined,
      otpExpiresAt: undefined,
    })

    if (!updated) return null

    const token = generateToken(updated as User)
    const { password: _, ...userWithoutPassword } = updated as User
    return { user: userWithoutPassword as User, token }
  },

  async resendOtp(email: string): Promise<ResendOtpResult> {
    const db = getDB()
    const normalizedEmail = email.trim().toLowerCase()
    const pendingRegistration = await db.findPendingRegistrationByEmail(normalizedEmail)

    if (pendingRegistration) {
      const otp = generateOtpCode()
      const otpHash = await hashPassword(otp)
      const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000)

      try {
        await sendOtpEmail({ to: normalizedEmail, name: pendingRegistration.name, otp })
        await db.updatePendingRegistration(pendingRegistration.id, { otpHash, otpExpiresAt })
        return { ok: true }
      } catch (error) {
        console.error("Failed to resend OTP email:", error)
        return { ok: false, reason: "email_send_failed" }
      }
    }

    const user = await db.findUserByEmail(normalizedEmail)

    if (!user || user.emailVerified) {
      return { ok: false, reason: "not_found_or_verified" }
    }

    const otp = generateOtpCode()
    const otpHash = await hashPassword(otp)
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000)

    await db.updateUser(user.id, { otpHash, otpExpiresAt })
    try {
      await sendOtpEmail({ to: normalizedEmail, name: user.name, otp })
      return { ok: true }
    } catch (error) {
      console.error("Failed to resend OTP email:", error)
      return { ok: false, reason: "email_send_failed" }
    }
  },

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const db = getDB()
    const user = await db.findUserById(userId)
    if (!user) return false

    const isValid = await validateUserPassword(user, currentPassword)
    if (!isValid) return false

    const hashedPassword = await hashPassword(newPassword)
    await db.updateUser(userId, { password: hashedPassword })
    return true
  },

  async requestPasswordReset(email: string): Promise<boolean> {
    const db = getDB()
    const normalizedEmail = email.trim().toLowerCase()
    const user = await db.findUserByEmail(normalizedEmail)
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return true
    }

    const resetToken = generateOtpCode()
    const resetTokenHash = await hashPassword(resetToken)
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.updateUser(user.id, {
      otpHash: resetTokenHash,
      otpExpiresAt: resetTokenExpiresAt,
    })

    // Send reset email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`
    
    try {
      await sendPasswordResetEmail({ to: normalizedEmail, name: user.name, resetUrl, token: resetToken })
    } catch (error) {
      console.error("Failed to send password reset email:", error)
      // In development, log the reset info
      if (process.env.NODE_ENV === "development") {
        console.log("=".repeat(50))
        console.log("PASSWORD RESET (Email sending failed):")
        console.log("Email:", email)
        console.log("Reset URL:", resetUrl)
        console.log("Reset Code:", resetToken)
        console.log("=".repeat(50))
      }
      // Still return true to not reveal if user exists
    }

    return true
  },

  async resetPassword(email: string, token: string, newPassword: string): Promise<boolean> {
    const db = getDB()
    const normalizedEmail = email.trim().toLowerCase()
    const user = await db.findUserByEmail(normalizedEmail)
    
    if (!user || !user.otpHash || !user.otpExpiresAt) {
      return false
    }

    // Check if token is expired
    if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
      return false
    }

    // Verify token
    const isValid = await verifyPassword(token, user.otpHash)
    if (!isValid) {
      return false
    }

    // Update password and clear reset token
    const hashedPassword = await hashPassword(newPassword)
    await db.updateUser(user.id, {
      password: hashedPassword,
      otpHash: undefined,
      otpExpiresAt: undefined,
    })

    return true
  },

  async getCurrentUser(token: string): Promise<User | null> {
    try {
      const db = getDB()
      const decoded = verifyToken(token)
      
      if (!decoded) {
        return null
      }

      const user = await db.findUserById(decoded.userId)
      
      if (!user) {
        return null
      }

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user
      return userWithoutPassword as User
    } catch {
      return null
    }
  },

  decodeToken(token: string): SessionData | null {
    return verifyToken(token)
  },
}



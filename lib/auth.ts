// Authentication utilities with bcrypt and JWT
import { getDB } from "./db"
import type { StudentRegistrationProfile, User } from "./types"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { sendOtpEmail, sendPasswordResetEmail } from "./email"

export interface SessionData {
  userId: string
  email: string
  role: string
}

const JWT_SECRET = (process.env.JWT_SECRET || "your-secret-key-change-in-production").trim()
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d").trim()
const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 15)
const ADMIN_ACCOUNTS_EMAIL = (process.env.ADMIN_ACCOUNTS_EMAIL || process.env.BOOTSTRAP_ADMIN_EMAIL)?.trim()
const ADMIN_ACCOUNTS_PASSWORD = (process.env.ADMIN_ACCOUNTS_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD)?.trim()

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
  return jwt.sign(payload, JWT_SECRET as string, options)
}

// Verify JWT token
function verifyToken(token: string): SessionData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as SessionData
    return decoded
  } catch (error) {
    return null
  }
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
  ): Promise<{ user: User }> {
    const db = getDB()
    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await db.findUserByEmail(normalizedEmail)

    if (existingUser) {
      throw new Error("User already exists")
    }

    const hashedPassword = await hashPassword(password)
    const otp = generateOtpCode()
    const otpHash = await hashPassword(otp)
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000)

    const user = await db.createUser({
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
      enrolledCourses: [],
    })

    // Send OTP email - if it fails, log but don't fail registration
    try {
      await sendOtpEmail({ to: normalizedEmail, name, otp })
    } catch (error) {
      console.error("Failed to send OTP email:", error)
      // In development, log the OTP to console
      if (process.env.NODE_ENV === "development") {
        console.log("=".repeat(50))
        console.log("REGISTRATION OTP (Email sending failed):")
        console.log("Email:", email)
        console.log("OTP Code:", otp)
        console.log("=".repeat(50))
      }
      // Don't throw - user is created, they can request resend
    }

    const { password: _, ...userWithoutPassword } = user
    return { user: userWithoutPassword as User }
  },

  async verifyOtp(email: string, otp: string): Promise<{ user: User; token: string } | null> {
    const db = getDB()
    const normalizedEmail = email.trim().toLowerCase()
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

  async resendOtp(email: string): Promise<boolean> {
    const db = getDB()
    const normalizedEmail = email.trim().toLowerCase()
    const user = await db.findUserByEmail(normalizedEmail)

    if (!user || user.emailVerified) {
      return false
    }

    const otp = generateOtpCode()
    const otpHash = await hashPassword(otp)
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000)

    await db.updateUser(user.id, { otpHash, otpExpiresAt })
    try {
      await sendOtpEmail({ to: normalizedEmail, name: user.name, otp })
      return true
    } catch (error) {
      console.error("Failed to resend OTP email:", error)
      return false
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

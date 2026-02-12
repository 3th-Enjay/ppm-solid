// Authentication utilities with bcrypt and JWT
import { getDB } from "./db"
import type { User } from "./types"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { sendOtpEmail } from "./email"

export interface SessionData {
  userId: string
  email: string
  role: string
}

const JWT_SECRET = (process.env.JWT_SECRET || "your-secret-key-change-in-production").trim()
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d").trim()
const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 15)
const ADMIN_ACCOUNTS_EMAIL = process.env.ADMIN_ACCOUNTS_EMAIL?.trim()
const ADMIN_ACCOUNTS_PASSWORD = process.env.ADMIN_ACCOUNTS_PASSWORD?.trim()

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
    const user = await db.findUserByEmail(email)
    const normalizedEmail = email?.trim().toLowerCase()
    const normalizedAdminAccountEmail = ADMIN_ACCOUNTS_EMAIL?.toLowerCase()

    if (!user) {
      if (normalizedAdminAccountEmail && ADMIN_ACCOUNTS_PASSWORD) {
        if (normalizedEmail === normalizedAdminAccountEmail && password === ADMIN_ACCOUNTS_PASSWORD) {
          const created = await db.createUser({
            email,
            password: await hashPassword(password),
            name: "Admin Account",
            role: "admin",
            status: "active",
            emailVerified: true,
            enrolledCourses: [],
          })
          const token = generateToken(created)
          const { password: _, ...userWithoutPassword } = created
          return { user: userWithoutPassword as User, token }
        }
      }
      return null
    }

    // Allow admin account to bypass OTP check if matches env creds
    if (normalizedAdminAccountEmail && ADMIN_ACCOUNTS_PASSWORD && normalizedEmail === normalizedAdminAccountEmail && password === ADMIN_ACCOUNTS_PASSWORD) {
      const token = generateToken(user)
      const { password: _, ...userWithoutPassword } = user
      return { user: userWithoutPassword as User, token }
    }

    let passwordValid = await validateUserPassword(user, password)
    if (passwordValid && !(user.password.startsWith("$2a$") || user.password.startsWith("$2b$"))) {
      const hashedPassword = await hashPassword(password)
      await db.updateUser(user.id, { password: hashedPassword })
    }

    if (!passwordValid) {
      return null
    }

    if (user.emailVerified === false) {
      return null
    }

    // Generate JWT token
    const token = generateToken(user)

    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = user

    return { user: userWithoutPassword as User, token }
  },

  async register(
    email: string,
    password: string,
    name: string,
    role: "student" | "instructor" | "admin" | "finance" = "student"
  ): Promise<{ user: User; token: string }> {
    const db = getDB()
    const existingUser = await db.findUserByEmail(email)

    if (existingUser) {
      throw new Error("User already exists")
    }

    // Hash password before storing
    const hashedPassword = await hashPassword(password)

    const user = await db.createUser({
      email,
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
    role: "student" | "instructor" | "admin" | "finance" = "student"
  ): Promise<{ user: User }> {
    const db = getDB()
    const existingUser = await db.findUserByEmail(email)

    if (existingUser) {
      throw new Error("User already exists")
    }

    const hashedPassword = await hashPassword(password)
    const otp = generateOtpCode()
    const otpHash = await hashPassword(otp)
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000)

    const user = await db.createUser({
      email,
      password: hashedPassword,
      name,
      role,
      emailVerified: false,
      otpHash,
      otpExpiresAt,
      enrolledCourses: [],
    })

    await sendOtpEmail({ to: email, name, otp })

    const { password: _, ...userWithoutPassword } = user
    return { user: userWithoutPassword as User }
  },

  async verifyOtp(email: string, otp: string): Promise<{ user: User; token: string } | null> {
    const db = getDB()
    const user = await db.findUserByEmail(email)

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
    const user = await db.findUserByEmail(email)

    if (!user || user.emailVerified) {
      return false
    }

    const otp = generateOtpCode()
    const otpHash = await hashPassword(otp)
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000)

    await db.updateUser(user.id, { otpHash, otpExpiresAt })
    await sendOtpEmail({ to: email, name: user.name, otp })

    return true
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

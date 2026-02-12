// Zod validation schemas
import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.enum(["student", "instructor", "admin", "finance"]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

export const coursePriceSchema = z.object({
  NGN: z.number().min(0, "NGN price must be positive"),
  USD: z.number().min(0, "USD price must be positive"),
  EUR: z.number().min(0, "EUR price must be positive"),
  GBP: z.number().min(0, "GBP price must be positive"),
})

export const courseCreateSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.enum(["development", "design", "business", "marketing", "photography", "music"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  price: coursePriceSchema,
  thumbnail: z.string().optional(),
  instructorId: z.string().min(1, "Instructor is required"),
  published: z.boolean().optional(),
  approved: z.boolean().optional(),
  modules: z.array(z.any()).optional(),
  totalDuration: z.number().optional(),
  enrollmentCount: z.number().optional(),
  rating: z.number().optional(),
})

export const courseUpdateSchema = courseCreateSchema.partial()

export const enrollmentCreateSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  courseId: z.string().min(1, "Course ID is required"),
})

export const enrollmentProgressSchema = z.object({
  progress: z.number().min(0).max(100),
  completedLessons: z.array(z.string()).optional(),
})

export const paymentInitializeSchema = z.object({
  userId: z.string().min(1),
  courseIds: z.array(z.string()).min(1),
  amount: z.number().min(1),
  email: z.string().email(),
  currency: z.enum(["NGN", "USD", "GBP"]).optional(),
})

export const paymentRefundSchema = z.object({
  status: z.enum(["refunded"]),
})

export const otpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
})

export const otpResendSchema = z.object({
  email: z.string().email(),
})

export const adminCreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(["admin", "finance"]),
  password: z.string().min(6),
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
})

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().optional(),
})

export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  status: z.enum(["active", "suspended"]).optional(),
})

// Core type definitions for the LMS platform

export type UserRole = "student" | "instructor" | "admin" | "finance"

export interface User {
  id: string
  email: string
  password: string // In production, this would be hashed
  name: string
  role: UserRole
  avatar?: string
  bio?: string
  status?: "active" | "suspended"
  emailVerified?: boolean
  otpHash?: string
  otpExpiresAt?: Date
  enrolledCourses: string[] // Course IDs
  createdAt: Date
  updatedAt: Date
}

export type CourseCategory = "development" | "design" | "business" | "marketing" | "photography" | "music"

export type CourseLevel = "beginner" | "intermediate" | "advanced"

export interface Course {
  id: string
  title: string
  slug: string
  description: string
  category: CourseCategory
  level: CourseLevel
  instructorId: string
  price: {
    NGN: number
    USD: number
    EUR: number
    GBP: number
  }
  thumbnail: string
  published: boolean
  approved: boolean
  modules: CourseModule[]
  totalDuration: number // in minutes
  enrollmentCount: number
  rating: number
  createdAt: Date
  updatedAt: Date
}

export interface CourseModule {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

export type LessonType = "video" | "article" | "quiz" | "assignment"

export interface Lesson {
  id: string
  title: string
  type: LessonType
  order: number
  duration?: number // in minutes
  content: {
    videoUrl?: string
    // Optional server-side note when a lesson is rejected
    rejectionNote?: string
    articleContent?: string
    quizId?: string
    assignmentId?: string
    resources?: { title: string; url: string }[]
  }
  isFree: boolean
  // Approval workflow for individual lessons
  approved?: boolean
  pendingApproval?: boolean
}

export interface Quiz {
  id: string
  title: string
  questions: QuizQuestion[]
  passingScore: number
  timeLimit?: number // in minutes
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export interface Assignment {
  id: string
  title: string
  description: string
  dueDate?: Date
  maxScore: number
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  progress: number // 0-100
  completedLessons: string[] // Lesson IDs
  status: "active" | "completed" | "expired"
  currentLesson?: string // Lesson ID
  enrolledAt: Date
  completedAt?: Date
}

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "success"
export type Currency = "NGN" | "USD" | "EUR" | "GBP"

export interface Payment {
  id: string
  userId: string
  courseId: string
  courseIds?: string[]
  amount: number
  currency: Currency
  status: PaymentStatus
  reference: string
  paymentMethod: string
  createdAt: Date
  completedAt?: Date
}

export interface Certificate {
  id: string
  userId: string
  courseId: string
  certificateUrl: string
  issuedAt: Date
  verificationCode: string
}

export interface CartItem {
  courseId: string
  course: Course
}

export interface AdminLog {
  id: string
  actorId: string
  actorName: string
  actorEmail: string
  action: "create_user" | "update_password" | "other"
  targetUserId?: string
  targetName?: string
  targetEmail?: string
  targetRole?: UserRole
  createdAt: Date
}

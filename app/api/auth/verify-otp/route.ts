import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { otpVerifySchema } from "@/lib/validation"
import { ZodError } from "zod"
import { sendWelcomeEmail } from "@/lib/email"
import { getDB } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = otpVerifySchema.parse(body)

    const result = await authService.verifyOtp(validated.email, validated.otp)

    if (!result) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Send welcome email (non-blocking if it fails)
    try {
      await sendWelcomeEmail({ to: result.user.email, name: result.user.name, role: result.user.role })
    } catch (err) {
      console.error("Failed to send welcome email:", err)
    }

    // Onsite students get full access only after completed onsite payment.
    let responseUser = result.user
    const isOnsiteProfile =
      result.user.role === "student" &&
      result.user.studentProfile &&
      (result.user.studentProfile.trainingMode === "onsite" ||
        (!result.user.studentProfile.trainingMode && (result.user.studentProfile.registrationFeeNgn || 0) > 0))
    if (
      isOnsiteProfile
    ) {
      try {
        const db = getDB()
        const payments = await db.getPaymentsByUserId(result.user.id)
        const hasCompletedOnsitePayment = (payments || []).some(
          (payment: any) =>
            payment.paymentType === "onsite_registration" &&
            (payment.status === "completed" || payment.status === "success"),
        )
        if (!hasCompletedOnsitePayment) {
          return NextResponse.json({
            success: true,
            user: responseUser,
            token: result.token,
          })
        }

        const [allCourses, existingEnrollments] = await Promise.all([db.getAllCourses(), db.getEnrollmentsByUserId(result.user.id)])

        const enrolledCourseIds = new Set((existingEnrollments || []).map((item: any) => item.courseId))
        for (const course of allCourses || []) {
          if (enrolledCourseIds.has(course.id)) continue
          await db.createEnrollment({
            userId: result.user.id,
            courseId: course.id,
            progress: 0,
            completedLessons: [],
            status: "active",
            enrolledAt: new Date(),
          })
          enrolledCourseIds.add(course.id)
        }

        const updatedUser = await db.updateUser(result.user.id, {
          enrolledCourses: Array.from(enrolledCourseIds),
        })
        if (updatedUser) {
          const { password: _password, ...safeUser } = updatedUser as any
          responseUser = safeUser
        }
      } catch (enrollmentError) {
        console.error("Failed to auto-enroll onsite student:", enrollmentError)
      }
    }

    return NextResponse.json({
      success: true,
      user: responseUser,
      token: result.token,
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
  }
}

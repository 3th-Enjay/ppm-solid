import { type NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { paystackService } from "@/lib/paystack"
import { getDB } from "@/lib/db"
import { paymentInitializeSchema } from "@/lib/validation"
import type { Currency } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = paymentInitializeSchema.parse(body)
    const { userId, courseIds, amount, email } = validated
    const currency = validated.currency || "USD"

    const db = getDB()
    // Check if user exists
    const user = await db.findUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Initialize payment with Paystack
    const callbackUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`
      : undefined
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    const paymentInit = await paystackService.initializePayment({
      email,
      amount,
      currency: currency as Currency,
      metadata: { userId, courseIds, invoiceNumber },
      callbackUrl,
    })

    // Create payment record in database
    const payment = await db.createPayment({
      userId,
      paymentType: "course_purchase",
      courseId: Array.isArray(courseIds) ? courseIds[0] : courseIds,
      courseIds: Array.isArray(courseIds) ? courseIds : [courseIds],
      amount,
      currency: currency as Currency,
      status: "pending",
      reference: paymentInit.reference,
      invoiceNumber,
      paymentMethod: "paystack",
      gatewayStatus: "pending",
      gatewayMessage: "Awaiting payment authorization on Paystack.",
      verificationAttempts: 0,
      verificationLocked: false,
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      payment,
      authorization_url: paymentInit.authorizationUrl,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Payment initialization error:", error)
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
  }
}

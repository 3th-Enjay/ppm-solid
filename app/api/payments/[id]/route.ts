import { type NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { getDB } from "@/lib/db"
import { paymentRefundSchema } from "@/lib/validation"
import { paystackService } from "@/lib/paystack"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = paymentRefundSchema.parse(body)

    const db = getDB()
    const updated = await db.updatePayment(id, validated)

    if (!updated) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (validated.status === "refunded") {
      await paystackService.processRefund({
        reference: updated.reference,
        amount: updated.amount,
        currency: updated.currency,
      })
    }

    return NextResponse.json({ payment: updated })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Update payment error:", error)
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 })
  }
}

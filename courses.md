# Course Payment Flow (Current Implementation)

This is the current flow used in the app for course purchases with Paystack.

## 1. Checkout Start

Page:
- `app/checkout/page.tsx`

Flow:
1. Authenticated user opens `/checkout`.
2. Cart courses and billing info are loaded.
3. User clicks **Complete Payment**.
4. Frontend calls:
   - `POST /api/payments/initialize`
   - payload: `userId`, `courseIds[]`, `amount`, `email`, `currency`

## 2. Payment Initialization

Route:
- `app/api/payments/initialize/route.ts`

What happens:
1. Request is validated with `paymentInitializeSchema`.
2. User is validated in DB.
3. Backend calls Paystack initialize endpoint through `paystackService.initializePayment(...)`.
4. App creates a local payment record with:
   - `status: pending`
   - app `reference`
   - `invoiceNumber`
   - `gatewayStatus: pending`
5. API returns `authorization_url`.

Frontend behavior:
- Browser redirects user to Paystack checkout via `authorization_url`.

## 3. Return From Paystack + Verification

Success return page:
- `app/checkout/success/page.tsx`

Query param used:
- `reference` or `trxref`

Frontend does:
1. Calls `GET /api/payments/verify?reference=...`
2. Calls `GET /api/payments?reference=...&includeDetails=true`
3. If verified success, cart is cleared.

## 4. Payment Verification Logic

Route:
- `app/api/payments/verify/route.ts`

What backend does:
1. Finds local payment by reference.
2. Verifies transaction directly with Paystack (`paystackService.verifyPayment`).
3. If Paystack status is success:
   - updates local payment to `completed`
   - stores Paystack metadata:
     - `transactionId`
     - `gatewayStatus`
     - `gatewayMessage`
     - `gatewayChannel`
     - `paidAt`
   - enrolls user in all purchased courses
   - updates user `enrolledCourses`
4. If failed:
   - marks payment `failed`
   - stores failure gateway metadata

## 5. Webhook (Server-to-Server Backup/Sync)

Route:
- `app/api/payments/webhook/route.ts`

What it does:
1. Verifies `x-paystack-signature`.
2. Handles events like:
   - `charge.success`
   - `charge.failed`
   - `refund.processed`
3. Updates payment status/Paystack fields.
4. Enrolls user for successful charge if needed.

This ensures app state can still update even if user closes browser before redirect completes.

## 6. Payment Confirmation UI

Current confirmation screen:
- `app/checkout/success/page.tsx`

Now includes:
1. **Transaction summary** (status, amount, invoice, transaction ID, date, method).
2. **Paystack fields**:
   - Paystack status
   - Paystack channel
   - Paystack message
3. **Courses in this transaction** list.
4. Actions:
   - **Copy Details** (copies full receipt text)
   - **Download Receipt** (downloads `.txt` receipt)
   - **Print**
   - **Save PDF** (print dialog)
   - **View Transaction** (dashboard payment detail)

## 7. Transaction Detail Pages

Detailed transaction UI:
- `components/payments/transaction-detail-view.tsx`
- used by:
  - `app/dashboard/payments/[paymentId]/page.tsx`
  - `app/admin/payments/[paymentId]/page.tsx`
  - `app/finance/transactions/[paymentId]/page.tsx`

Shows app + gateway fields and purchased courses.

## 8. Important Environment Variables

Needed for Paystack flow:
- `PAYSTACK_SECRET_KEY`
- optional: `PAYSTACK_BASE_URL` (defaults to `https://api.paystack.co`)
- frontend key (if needed by client flows): `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`

## 9. Summary

Yes, there is payment confirmation UI after successful payment.

It now supports:
- viewing transaction details,
- copying details,
- downloading receipt,
- and displaying both app-side and Paystack-side transaction data.

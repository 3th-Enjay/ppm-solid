# Paystack Flows (Current State)

This document describes how Paystack-related payment flows currently work in this app as of branch `test-ui`.

## Scope

- Onsite registration payment flow
- Course purchase (checkout) payment flow
- UI behavior
- API behavior
- DB persistence behavior

## 1) Onsite Registration Payment Flow (Current)

### Summary

Onsite registration now initializes a real Paystack transaction and stores onsite fee payment as a `Payment` record (`paymentType = onsite_registration`).

### Environment requirement

- `NEXT_PUBLIC_ONSITE_TRAINING_PAYMENT_URL` is **optional**. If set, it overrides the onsite training `paymentLink` shown in the registration UI; otherwise it falls back to `/contact?subject=Onsite%20Training%20Payment%20Link`.

### How to obtain required env values

- `PAYMENT_RECONCILE_SECRET`: Generate a long random secret (32+ chars). Use a password manager or a generator, then set it in hosting (Vercel/Render/etc.) and in `.env.local` for local testing.
- `CRON_SECRET`: Optional alternative to `PAYMENT_RECONCILE_SECRET` for scheduler auth. You can reuse the same value as `PAYMENT_RECONCILE_SECRET` or generate a separate one.
- `NEXT_PUBLIC_ONSITE_TRAINING_PAYMENT_URL`: Set this to your public payment link (Paystack payment page or Flutterwave payment link). If you don’t have one yet, leave it empty and the UI will route users to the contact form.
- `PAYMENT_ALERT_EMAIL`: Email address that should receive manual-review/alert notifications (e.g., a finance or admin inbox).
- `SUPPORT_EMAIL`: Public support email. Used as a fallback for alerts when `PAYMENT_ALERT_EMAIL` isn’t set.

### UI flow

1. User chooses `Onsite Student Registration` at `/register`.
2. Form rendered by `StudentRegistrationForm` in onsite mode:
   - Shows registration fee from config (`NGN 150,000`).
   - Removes self-declared payment status/reference fields.
3. On submit, data posts to `/api/payments/initialize-onsite`.
4. Backend creates user profile + pending onsite payment, initializes Paystack, and returns `authorization_url`.
5. Browser redirects user to Paystack checkout.

Relevant files:

- `components/auth/student-registration-form.tsx`
- `lib/student-registration.ts`
- `lib/validation.ts`
- `app/api/payments/initialize-onsite/route.ts`

### API/data behavior

`/api/payments/initialize-onsite`:

- creates onsite student user via OTP registration
- stores onsite profile fields on user account
- creates pending payment record with:
  - `paymentType: "onsite_registration"`
  - `amount: ONSITE_TRAINING.registrationFeeNgn`
  - `currency: "NGN"`
  - verification control fields
- initializes Paystack transaction and returns checkout authorization URL

User profile stores onsite registration context with:

- `trainingMode: "onsite"`
- `registrationFeeNgn`
- `paymentStatus` (`"no"` initially)
- `paymentReference` (filled after verified payment)
- `paymentLink`

### DB behavior

Onsite payment now persists in `Payment` records and `User.studentProfile` is updated from payment events:

- verify/webhook success updates:
  - `studentProfile.paymentStatus = "yes"`
  - `studentProfile.paymentReference = payment.reference`

On OTP verification (`/api/auth/verify-otp`) and `GET /api/enrollments?userId=...`, onsite auto-enrollment now requires a completed onsite payment record.

### Admin/student UI visibility

- Student profile page shows onsite payment status/reference and payment link.
- Admin students page shows submitted onsite payment status/reference.

These are display fields derived from verified payment completion updates.

## 2) Course Purchase Payment Flow (Current)

### Summary

Course checkout uses Paystack API transaction initialization + verification and has webhook handling. Payment records are persisted in the `payments` collection/table.

### UI flow

1. User adds courses to cart and opens `/checkout`.
2. On `Complete Payment`, frontend posts to `/api/payments/initialize` with:
   - `userId`
   - `courseIds[]`
   - `amount`
   - `email`
   - `currency`
3. API returns `authorization_url`; browser redirects to Paystack-hosted checkout.
4. Paystack callback returns user to `/checkout/success?reference=...` (or `trxref`).
5. Success page calls `/api/payments/verify?reference=...`.
6. Success page fetches `/api/payments?reference=...&includeDetails=true` and renders:
   - app payment status
   - gateway status/message/channel
   - invoice number
   - transaction ID
   - purchased courses

Relevant files:

- `app/checkout/page.tsx`
- `app/checkout/success/page.tsx`
- `app/checkout/failed/page.tsx`

### API behavior

#### Initialize: `POST /api/payments/initialize`

- Validates payload (`paymentInitializeSchema`).
- Confirms user exists.
- Calls `paystackService.initializePayment(...)`.
- Creates a **pending** payment record:
  - `status: "pending"`
  - `paymentMethod: "paystack"`
  - `reference`, `invoiceNumber`, `courseIds`, etc.
  - `gatewayStatus: "pending"`
  - `gatewayMessage: "Awaiting payment authorization on Paystack."`

#### Verify: `GET /api/payments/verify?reference=...`

- Loads payment by reference.
- Calls `paystackService.verifyPayment(reference)`.
- If success:
  - updates payment to `status: "completed"`
  - sets gateway and transaction fields
  - upserts enrollments for each paid course
  - updates `user.enrolledCourses`
- If failed:
  - updates payment `status: "failed"` with gateway details

#### Webhook: `POST /api/payments/webhook`

- Validates `x-paystack-signature` via HMAC SHA512.
- Handles:
  - `charge.success`: mark completed + enroll user + update user courses
  - `charge.failed`: mark failed
  - `refund.processed`: mark refunded
  - `refund.failed`: acknowledge only

#### Refund route: `PATCH /api/payments/[id]`

- If set to `status: "refunded"`, calls Paystack refund endpoint via `paystackService.processRefund`.

Relevant files:

- `lib/paystack.ts`
- `app/api/payments/initialize/route.ts`
- `app/api/payments/verify/route.ts`
- `app/api/payments/webhook/route.ts`
- `app/api/payments/[id]/route.ts`
- `app/api/payments/route.ts`

### DB behavior

Payment transaction state is stored in `Payment` objects (`lib/types.ts`) with fields including:

- `reference`
- `status` (`pending/completed/failed/refunded/...`)
- `paymentMethod`
- `gatewayStatus`, `gatewayMessage`, `gatewayChannel`
- `transactionId`
- `amount`, `currency`
- `courseId`, `courseIds`
- `invoiceNumber`
- `paidAt`, `completedAt`, `refundedAt`

Storage backend:

- MongoDB (`lib/mongodb-db.ts`) when `MONGODB_URI` is configured
- In-memory mock DB (`lib/mock-db.ts`) otherwise

## 3) Current Separation Between Onsite and Course Payments

- Onsite registration and course checkout are both represented in `Payment` records.
- Onsite uses `paymentType = onsite_registration`; course checkout uses `paymentType = course_purchase`.
- Profile payment fields for onsite are now synchronized on verified payment completion.

## 4) Known Behavior Gaps (Current)

- Cron security/env wiring still requires deployment env setup (`CRON_SECRET` or `PAYMENT_RECONCILE_SECRET`).
- Alert delivery depends on email env setup (`PAYMENT_ALERT_EMAIL`/`SUPPORT_EMAIL` + `RESEND_API_KEY`).
- Course payment verify endpoint can be called multiple times from success page load sequence, but lock/idempotency controls now reduce race effects.

## 5) Expected Paystack Behavior (To Be Updated)

This section defines the target architecture and tracks implementation progress.

### Goals

- Remove self-declared payments
- Enable automatic course access after payment
- Provide verifiable transaction receipt
- Support manual verification fallback
- Prevent duplicate/fraudulent payments

### 5.1 Unified Payment Model (Target)

All payments should be represented as `Payment` records using:

- `paymentType: "course_purchase" | "onsite_registration"`

Progress:

- [x] Added `paymentType` to `Payment` type.
- [x] Course checkout initialization now stores `paymentType: "course_purchase"`.
- [x] Onsite registration payments are now created and tracked as `Payment` records (`paymentType = onsite_registration`).

### 5.2 Onsite Registration Flow (Target)

Target:

1. Submit registration profile.
2. Create pending payment (`paymentType = onsite_registration`).
3. Initialize Paystack transaction.
4. Redirect user to Paystack.
5. Webhook/callback verifies payment.
6. Activate onsite access after verified completion.

Progress:

- [x] Onsite registration now initializes Paystack checkout via `/api/payments/initialize-onsite`.
- [x] Self-declared onsite payment fields removed from registration UI.
- [x] Onsite pending payment records now created with `paymentType = onsite_registration`.
- [x] Onsite completion updates student profile payment fields and grants course access.
- [x] Dedicated onsite callback/status page implemented at `/register-onsite/success`.

### 5.3 Course Checkout Reliability Improvements (Target)

Target improvements:

- Payment locking for verification races
- Idempotent webhook handling
- Enrollment guard against duplication
- Verification validations (reference, amount, currency, email)

Progress in this implementation pass:

- [x] Added verification control fields:
  - `verificationAttempts`
  - `verificationLocked`
  - `lastVerificationAt`
- [x] Verify endpoint now:
  - returns early when already completed
  - returns `202` if already locked/in progress
  - increments verification attempts and locks before Paystack verify
  - unlocks after outcome
- [x] Added mismatch checks during verification:
  - amount match
  - currency match
  - customer email match (when provided by gateway)
  - mismatch outcome -> `status = manual_review`
- [x] Webhook `charge.success` is idempotent:
  - exits early if already completed
- [x] Webhook now performs amount/currency/email checks and routes mismatches to `manual_review`.
- [x] Existing enrollment creation already checks for existing enrollment before insert.

### 5.4 Payment Timeout and Recovery (Target)

Target:

- Reconciliation job every 10 minutes:
  - find stale pending payments
  - verify with Paystack
  - update status

Progress:

- [x] Added reconciliation trigger endpoint: `POST /api/payments/reconcile`.
- [x] Added `GET /api/payments/reconcile` for scheduler compatibility.
- [x] Reconciliation scans stale pending/processing payments (default: older than 30 minutes), verifies with Paystack, and resolves to:
  - `completed`
  - `failed`
  - `manual_review`
- [x] Reconciliation also grants course access for successful results (including onsite payment sync).
- [x] Added Vercel cron schedule (`vercel.json`) for every 10 minutes.
- [ ] Deployment secrets for cron authentication still need to be configured.

### 5.5 Transaction Receipt UX (Target)

Target:

- Canonical receipt route by reference (example: `/dashboard/payments/[reference]`)
- Print / copy / download receipt details

Progress:

- [x] Checkout success page already supports copy/print/download text receipt.
- [x] Canonical reference lookup for transaction detail is supported:
  - `/dashboard/payments/[identifier]` now resolves by `id` first, then by `reference`.
  - checkout success/failed flows now link to transaction detail by reference.

### 5.6 Manual Verification Fallback (Target)

Target:

- Admin verify route/page to paste reference and trigger gateway verification
- Approve/reject/fraud actions

Progress:

- [x] Added admin verify endpoint: `POST /api/admin/payments/verify`.
- [x] Added admin UI route: `/admin/payments/verify`.
- [x] Supported actions:
  - `check`
  - `approve`
  - `reject`
  - `fraudulent`

### 5.7 Webhook Reconciliation Rules (Target)

Target event rules:

- `charge.success` -> verify/match -> complete -> grant access
- `charge.failed` -> failed
- `refund.processed` -> refunded

Progress:

- [x] Signature validation already implemented (`x-paystack-signature`).
- [x] Event handling exists for success/failed/refund.
- [x] Added idempotent success handling + mismatch to manual review.

### 5.8 Security and Fraud Checks (Target)

Target validation:

- reference exists in DB
- amount match
- currency match
- status success from Paystack
- customer email consistency

Progress:

- [x] Reference existence check already present.
- [x] Added amount/currency/email mismatch handling in verify + webhook.
- [x] Added explicit fraud/manual-review audit metadata fields on payments:
  - `manualReviewReason`, `manualReviewSource`, `manualReviewCreatedAt`, `manualReviewUpdatedAt`
  - `fraudFlagged`, `fraudReason`, `fraudFlaggedAt`, `fraudFlaggedBy`
  - `reviewedBy`, `reviewedAt`, `reviewNote`
- [x] Admin verify API now supports explicit fraudulent flagging with audit metadata.
- [x] Manual-review alert notifications are triggered from verify/webhook/reconcile/admin flows.

### 5.9 Recommended Payment State Machine (Target)

States:

- `pending`
- `processing`
- `completed`
- `failed`
- `refunded`
- `expired`
- `manual_review`

Progress:

- [x] Added state support in type model.
- [ ] Full lifecycle transitions (including `expired`) not fully wired yet.

### 5.10 Next Best Step

Implement operational hardening follow-ups:

1. Configure deployment secrets:
   - `CRON_SECRET` or `PAYMENT_RECONCILE_SECRET`
   - `PAYMENT_ALERT_EMAIL` (or `SUPPORT_EMAIL`)
   - `RESEND_API_KEY`
2. [x] Added admin payments UI filtering and table visibility for review risk states:
   - review filter options: `Needs Attention`, `Manual Review`, `Fraud Flagged`
   - table now surfaces review metadata: reason/source/fraud-flag
3. [x] Added automated payment verification rule tests:
   - file: `tests/payments/verification-rules.test.ts`
   - script: `npm run test:payments`
   - covers: mismatch-to-`manual_review` and status decision logic used by verify/webhook/reconcile/admin evaluation paths.

### 5.11 Current Finalization Checklist

- [x] Unified payment model and onsite Paystack migration
- [x] Webhook/callback/reconcile/admin verification flows
- [x] Fraud/manual-review audit metadata
- [x] Manual-review alert wiring
- [x] Admin manual verification + risk filtering UI
- [x] Payment verification decision tests
- [ ] Deployment secrets configured in hosting environment

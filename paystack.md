# Paystack Flows (Live App Behavior)

This document reflects the **live Paystack payment behavior** currently implemented in this codebase on `main`.
It documents what the app does now in production-style flow, not planned behavior.

## Scope

- Course checkout (Paystack)
- Onsite registration payment (Paystack)
- Verify + webhook + reconcile execution paths
- Enrollment grant behavior
- Payment alert email routing
- Data model and reliability safeguards

## 1) Payment Initialization

### How redirect URL is obtained (live behavior)

Yes, the redirect page URL is obtained through the Paystack API call from your backend.

Flow:
1. Backend (`/api/payments/initialize` or `/api/payments/initialize-onsite`) calls Paystack `POST /transaction/initialize`.
2. That call is authenticated with `PAYSTACK_SECRET_KEY` (server-side only).
3. Backend sends payload including `email`, `amount`, `currency`, `reference`, and `callback_url`.
4. Paystack responds with `authorization_url`.
5. Backend returns `authorization_url` to frontend.
6. Frontend redirects browser via `window.location.href = authorization_url`.

Important:
- `PAYSTACK_SECRET_KEY` is what authorizes the initialize API call that produces the redirect URL.
- `PAYSTACK_PUBLIC_KEY` is not used to generate the redirect URL in this flow.
- `callback_url` (from `NEXT_PUBLIC_APP_URL`) controls where Paystack returns the user after payment.

### Course checkout flow (`POST /api/payments/initialize`)

Flow:
1. Checkout UI (`app/checkout/page.tsx`) sends:
   - `userId`
   - `courseIds[]`
   - `amount`
   - `email`
   - `currency`
2. API validates payload (`paymentInitializeSchema`).
3. API confirms user exists.
4. API generates:
   - invoice number: `INV-YYYYMMDD-XXXXXX`
   - callback URL: `${NEXT_PUBLIC_APP_URL}/checkout/success` (when set)
5. API calls `paystackService.initializePayment(...)`.
6. API creates a pending `Payment` record with verification control fields.
7. API returns `authorization_url` for redirect to Paystack checkout.

### Onsite registration flow (`POST /api/payments/initialize-onsite`)

Flow:
1. Onsite registration form posts profile + registration details.
2. API creates student account/profile context and creates pending onsite payment:
   - `paymentType = "onsite_registration"`
3. API initializes Paystack and returns `authorization_url`.
4. Browser redirects to Paystack.

## 2) Reference Generation

Reference generation is in `lib/paystack.ts` and is now cryptographically secure:

- Format: `PC-${currency}-${Date.now()}-${secureHex}`
- `secureHex` is generated from `crypto.randomBytes(6).toString("hex")`

This preserves existing prefix/format style while improving entropy.

## 3) Success-Page Verification (`GET /api/payments/verify`)

Live triggers:
- `/checkout/success` page (`reference` or `trxref`)
- `/register-onsite/success` page

Route behavior:
1. Loads payment by reference.
2. Short-circuits if already completed.
3. Expires stale pending/processing payments older than 2 hours to `expired`.
4. Enforces attempt cap:
   - if `verificationAttempts >= 5`, marks `manual_review`.
5. Acquires verification lock (atomic when DB helper exists).
6. Calls Paystack verify API.
7. Evaluates amount/currency/email mismatch via `evaluateVerification`.
8. Writes one of:
   - `completed`
   - `failed`
   - `manual_review`
9. On completion:
   - grants enrollments
   - updates `user.enrolledCourses`
   - for onsite: updates `studentProfile.paymentStatus/paymentReference`
10. Logs payment events (`verify` / `manual_review`).

Stored gateway metadata (when available):
- `gatewayFee`
- `customerEmail`
- `customerCode`

## 4) Webhook Handling (`POST /api/payments/webhook`)

Security:
- Validates `x-paystack-signature` with HMAC SHA512 (`PAYSTACK_SECRET_KEY`).

Events handled:
- `charge.success`
- `charge.failed`
- `refund.processed`
- `refund.failed` (ack only)

Reliability behavior:
- Duplicate-safe completion: already completed payments are ignored for re-processing.
- Lock-aware handling to reduce races with verify/reconcile.
- Attempt threshold logic can route to `manual_review`.
- Persists gateway metadata fields where present.
- Logs payment events (`webhook`, `manual_review`, error/skipped).

Live acknowledgement behavior:
- For authenticated webhook processing paths, route returns HTTP 200 with `{ received: true }`.

## 5) Reconciliation (`GET/POST /api/payments/reconcile`)

Purpose:
- Recover payments that remain pending/processing after checkout.

Auth options:
- Admin JWT
- Secret via bearer token (`PAYMENT_RECONCILE_SECRET` or `CRON_SECRET`)
- `x-reconcile-key` header
- Query key (`?key=` or `?secret=`) for scheduler usage

Processing behavior:
1. Reads stale payments older than `olderThanMinutes` (default 30), up to `limit` (max 500).
2. Uses direct stale query helper when available (`getStalePayments`) instead of scanning all.
3. Expires >2-hour stale payments to `expired`.
4. Applies attempt cap (`>=5` -> `manual_review`).
5. Lock + verify + mismatch evaluation.
6. Writes `completed` / `failed` / `manual_review`.
7. Grants access for completed results.
8. Logs payment events (`reconcile` and `manual_review`).

Live scheduler note:
- Reconciliation is externally triggered (for example, cron-job.org hitting `/api/payments/reconcile`).

## 6) Enrollment Grant Logic

Used by verify, webhook, reconcile, and admin-approve flows.

Logic:
- Determine course IDs from `payment.courseIds` or `payment.courseId`.
- For onsite registrations, enroll into all courses.
- For each course:
  - create enrollment only if missing
- Update `user.enrolledCourses` with deduped merge.
- On onsite success, sync profile payment fields.

## 7) Payment States and Key Field Updates

Supported states:
- `pending`
- `processing`
- `completed`
- `failed`
- `refunded`
- `expired`
- `manual_review`
- `success` (legacy compatibility)

Typical writes:
- `pending`: initialization
- `processing`: lock acquisition before verify
- `completed`: verified success + gateway details + paid/completed timestamps
- `failed`: unsuccessful verification or charge failure
- `refunded`: refund processed
- `expired`: pending/processing older than 2 hours
- `manual_review`: mismatch, fraud/admin flag, or attempt cap

## 8) Data Safeguards and Constraints

Mongo indexes are ensured at runtime (`lib/mongodb.ts`):
- Unique: `payments.reference`
- Unique: `enrollments(userId, courseId)`
- Index: `payment_events(reference, createdAt desc)`

Idempotency helpers:
- Duplicate enrollment protection in both app logic and unique index handling.
- Lock helpers:
  - `acquirePaymentVerificationLock`
  - `releasePaymentVerificationLock`

## 9) Payment Events Audit Log

A `payment_events` collection/log is written for traceability.

Event types:
- `initialize`
- `webhook`
- `verify`
- `reconcile`
- `manual_review`

Each event may include:
- reference
- paymentId
- source
- status
- message
- metadata

## 10) Alert Email Routing (Current)

Manual-review alert emails are resolved from **database-backed recipients**:

1. All active users with role:
   - `admin`
   - `finance`
2. Support email from admin settings (`app_settings.supportEmail`)

Exclusions:
- Superadmin/bootstrap env emails (`ADMIN_ACCOUNTS_EMAIL`, `BOOTSTRAP_ADMIN_EMAIL`) are explicitly excluded from alert recipients.

Implementation file:
- `lib/payment-alerts.ts`

## 11) Relevant Files

- `lib/paystack.ts`
- `lib/payment-alerts.ts`
- `lib/payments/runtime.ts`
- `app/api/payments/initialize/route.ts`
- `app/api/payments/initialize-onsite/route.ts`
- `app/api/payments/verify/route.ts`
- `app/api/payments/webhook/route.ts`
- `app/api/payments/reconcile/route.ts`
- `app/api/payments/[id]/route.ts`
- `app/api/payments/route.ts`
- `app/api/admin/payments/verify/route.ts`
- `app/checkout/page.tsx`
- `app/checkout/success/page.tsx`
- `app/checkout/failed/page.tsx`
- `app/(auth)/register-onsite/success/page.tsx`
- `lib/mongodb.ts`
- `lib/mongodb-db.ts`
- `lib/mock-db.ts`

## 12) Live Behavior Summary

- Checkout redirects users to Paystack and tracks pending payment immediately.
- Success pages verify the Paystack reference and finalize payment/enrollment.
- Webhook and verify are both active and idempotency/locking safeguards reduce races.
- Reconciliation provides delayed recovery for stale pending/processing payments.
- Alerts are sent to active admin/finance users from DB plus support email from settings.

# Paystack Reliability/Security Hardening Report (Backward-Compatible)

## 1. Explanation Of The Current System

### 1.1 Payment initialization
- Frontend trigger: `app/checkout/page.tsx` (`handlePayment`) calls `POST /api/payments/initialize`.
- Backend route: `app/api/payments/initialize/route.ts`.
- Validation: `paymentInitializeSchema` in `lib/validation.ts`.
- Paystack init call: `paystackService.initializePayment(...)` in `lib/paystack.ts`.
- DB write before redirect:
  - `status: "pending"`
  - `reference`, `invoiceNumber`, `courseIds`, `amount`, `currency`
  - `verificationAttempts: 0`, `verificationLocked: false`
- API returns `authorization_url` used by browser redirect.

### 1.2 Reference generation
- Existing location: `lib/paystack.ts` (`generateReference`).
- Format used by system: `PC-${currency}-${timestamp}-${random}`.

### 1.3 Webhook verification flow
- Endpoint: `POST /api/payments/webhook`.
- Signature verification: `x-paystack-signature` validated by HMAC SHA512 in `paystackService.verifyWebhookSignature`.
- Handled events:
  - `charge.success`
  - `charge.failed`
  - `refund.processed`
  - `refund.failed` (ack only)
- `charge.success` marks payment completed (or manual review on mismatch), then grants enrollment and updates user enrolled courses.

### 1.4 Success-page verification flow
- UI: `app/checkout/success/page.tsx` captures `reference` or `trxref`.
- Calls `GET /api/payments/verify?reference=...`.
- Verify route (`app/api/payments/verify/route.ts`) calls Paystack verify API, evaluates mismatches, then sets:
  - `completed`
  - `failed`
  - or `manual_review`
- On complete, grants enrollment and updates user courses.

### 1.5 Reconciliation flow
- Endpoint: `GET/POST /api/payments/reconcile`.
- Auth allowed via:
  - admin JWT
  - `PAYMENT_RECONCILE_SECRET`/`CRON_SECRET` in bearer/header/query key.
- Scans stale `pending/processing` payments and verifies against Paystack.
- Updates state and grants access similarly to verify/webhook flow.

### 1.6 Enrollment granting
- Implemented in:
  - `verify` route
  - `webhook` route
  - `reconcile` route
  - admin verify route helper.
- Idempotency behavior:
  - checks `db.getEnrollment(userId, courseId)` before create.
  - merges `user.enrolledCourses` through set semantics.

### 1.7 Current DB constraints state (before hardening)
- No explicit index-enforced uniqueness in checked code for:
  - `payments.reference`
  - `(enrollments.userId, enrollments.courseId)`
- Deduplication was mostly app-level checks.

---

## 2. Identified Weaknesses

1. Reference suffix randomness used non-cryptographic randomness.
2. No guaranteed DB-level uniqueness for payment references/enrollment pairs.
3. Webhook retries could still contend with verify/reconcile timing windows.
4. Verification locking was not atomic across all actors.
5. No strict attempt cap escalation to `manual_review`.
6. No universal 2-hour pending/processing expiry guard.
7. Reconciliation loaded all payments before filtering.
8. Missing storage for useful gateway metadata (`gatewayFee`, `customerEmail`, `customerCode`).
9. No dedicated payment event log for forensic timeline.

---

## 3. Code Patches With Minimal Modifications (Implemented)

### 3.1 Secure reference generation (same prefix/shape)
- File: `lib/paystack.ts`
- Change:
  - Replaced weak random suffix with `crypto.randomBytes(6).toString("hex")`.
  - Format preserved: `PC-${currency}-${Date.now()}-${secureHex}`.

### 3.2 Added DB uniqueness + indexing bootstrap
- File: `lib/mongodb.ts`
- Added startup index ensure (best-effort, non-breaking):
  - unique index: `payments.reference`
  - unique index: `enrollments(userId, courseId)`
  - index: `payment_events(reference, createdAt desc)`

### 3.3 Added new payment metadata + event model (backward-compatible optional fields)
- File: `lib/types.ts`
- Added optional `Payment` fields:
  - `gatewayFee?: number`
  - `customerEmail?: string`
  - `customerCode?: string`
  - `verificationLockToken?: string`
  - `verificationLockExpiresAt?: Date`
- Added `PaymentEvent` interface + `PaymentEventType`.

### 3.4 DB layer hardening helpers
- File: `lib/mongodb-db.ts`
  - Added duplicate-safe `createEnrollment` behavior for unique index conflicts.
  - Added `getStalePayments(...)` for direct DB stale fetch.
  - Added `acquirePaymentVerificationLock(reference, maxAttempts)` (atomic lock + attempt increment).
  - Added `releasePaymentVerificationLock(reference)`.
  - Added `createPaymentEvent(...)`.
  - Extended date hydration for new date fields.
- File: `lib/mock-db.ts`
  - Added equivalent safe behavior for:
    - unique-like enrollment/payment reference checks
    - stale query helper
    - lock acquire/release
    - payment event log storage.

### 3.5 Shared runtime safeguards/utilities
- File: `lib/payments/runtime.ts` (new)
  - `logPaymentEvent(...)`
  - `isExpiredPayment(...)`
  - `expirePaymentIfStale(...)` (2-hour expiry for pending/processing)

### 3.6 Initialize route logging
- File: `app/api/payments/initialize/route.ts`
  - Added `initialize` event log entry after payment creation.

### 3.7 Verify route reliability/security hardening
- File: `app/api/payments/verify/route.ts`
- Added:
  - stale payment expiry to `expired` after 2 hours
  - attempt limit (>=5) -> `manual_review`
  - atomic lock usage when available (`acquirePaymentVerificationLock`)
  - lock release fallback on failures
  - persistence of `gatewayFee/customerEmail/customerCode`
  - payment event logging (`verify` and `manual_review`)
- Preserved:
  - endpoint path
  - core response keys (`success`, `verified`, `paystackMessage`, `payment`)
  - enrollment and user update logic.

### 3.8 Webhook idempotency + 200-ack behavior hardening
- File: `app/api/payments/webhook/route.ts`
- Added:
  - post-signature processing always acknowledges with HTTP 200 (`{ received: true }`)
  - lock-aware processing for `charge.success` to prevent race overlap
  - max attempt escalation path to `manual_review`
  - extra metadata persistence (`gatewayFee`, `customerEmail`, `customerCode`)
  - event logs for processed/skipped/error/manual-review/completed transitions
  - explicit lock cleanup on processing error
- Preserved:
  - invalid signature still rejected
  - existing event handling logic and enrollment behavior.

### 3.9 Reconciliation query + lock/attempt/expiry hardening
- File: `app/api/payments/reconcile/route.ts`
- Added:
  - direct stale fetch from DB (`getStalePayments`) with fallback
  - 2-hour expiry handling for stale pending/processing items
  - attempt limit escalation to `manual_review`
  - atomic lock usage when available
  - metadata persistence (`gatewayFee`, `customerEmail`, `customerCode`)
  - payment event logging for completed/failed/manual_review/error
  - safe lock release on exceptions.

### 3.10 Admin manual paths event logging
- File: `app/api/admin/payments/verify/route.ts`
- Added:
  - event logs for reject/fraud/manual-review and approve actions.

### 3.11 Build validation
- `npm run build` passes after all changes.

---

## 4. Migration Steps (DB Changes)

1. **Deploy code first** (backward compatible; new fields are optional).
2. **Pre-index duplicate audit** (production DB):
   - Find duplicate `payments.reference`.
   - Find duplicate `(enrollments.userId, enrollments.courseId)`.
3. **Deduplicate existing conflicts** before enforcing uniqueness:
   - keep canonical payment/enrollment records
   - merge/cleanup duplicates as needed.
4. **Apply indexes** (if runtime bootstrap could not due to duplicates):
   - `payments.reference` unique
   - `enrollments(userId, courseId)` unique
   - optional `payment_events(reference, createdAt)` for query performance.
5. **Monitor**:
   - `manual_review` counts
   - event log volume in `payment_events`
   - reconciliation summaries.

---

## 5. Final Architecture Diagram

```text
[Checkout UI]
    |
    | POST /api/payments/initialize
    v
[Initialize Route] ----> [Paystack /transaction/initialize]
    |                            |
    | create pending payment     | returns authorization_url + reference
    | log event: initialize      |
    v                            v
[Payments DB] <----------- browser redirect to Paystack
    |
    | callback to /checkout/success?reference=...
    v
[Success Page] -- GET /api/payments/verify --> [Verify Route]
                                              | acquire lock (atomic)
                                              | attempt limit (>=5 => manual_review)
                                              | expiry check (>=2h => expired)
                                              | verify with Paystack
                                              | update status + metadata
                                              | grant enrollment
                                              | log event
                                              v
                                          [Payments DB]

[Paystack Webhook] --> /api/payments/webhook
                        | signature verify
                        | always HTTP 200 after verified signature
                        | idempotent/lock-aware processing
                        | update status + metadata
                        | grant enrollment
                        | log event
                        v
                    [Payments DB]

[cron-job.org/Admin] --> /api/payments/reconcile
                          | direct stale DB query
                          | lock + attempts + expiry
                          | verify with Paystack
                          | update status + metadata
                          | grant enrollment
                          | log event
                          v
                      [Payments DB + payment_events]
```

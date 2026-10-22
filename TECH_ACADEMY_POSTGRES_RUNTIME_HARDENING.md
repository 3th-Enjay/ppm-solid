# PostgreSQL-Only Runtime Hardening and Production Readiness Audit

## 1. Executive Summary

This audit and runtime hardening engagement established deterministic, fail-safe PostgreSQL routing for the Prompt Care Academy LMS. All active runtime paths in the Next.js App Router, services, and dynamic configuration loaders now exclusively route persistence to PostgreSQL when configured, with active safeguards preventing silent fallbacks to MongoDB or mock data.

No data was accessed, altered, deleted, or migrated from the legacy MongoDB cluster. The validation ran strictly against the isolated local test database (`learnhub_test`).

---

## 2. Changes Made

### 2.1. Deterministic Backend Routing & Safe Fails (`lib/db.ts`)
- **Strict Selector:** Rewrote `isPostgresBackend()` and `getDB()` to enforce deterministic selection.
- **Fail Closed on Ambiguity:** If both PostgreSQL (`DATABASE_URL`) and MongoDB (`MONGODB_URI`) connection strings are detected without an explicit `DATABASE_BACKEND`, the application throws an actionable error instead of falling back to MongoDB.
- **Zero Silent Fallback:** If `DATABASE_BACKEND` is omitted and only `MONGODB_URI` is present, it throws a descriptive configuration error. It never silently routes to MongoDB.
- **Production Guard:** Missing database settings in `production` immediately throws an explicit configuration requirement.
- **Removed Unknown Linter Rules:** Fixed ESLint compatibility to guarantee clean production lint passes.

### 2.2. MongoDB Initialization Lockdown (`lib/mongodb.ts`)
- **Top-Level Guard:** Hardened the top-level client initialization so that `new MongoClient()` is only instantiated if `DATABASE_BACKEND === "mongodb"`.
- **Runtime Guard:** `getDatabase()` throws an error immediately if invoked when `DATABASE_BACKEND !== "mongodb"`.

### 2.3. Dynamic Config Loaders Hardened
- **Files:** `lib/admin-settings.ts`, `lib/campaign-config.ts`, `lib/onsite-training-config.ts`.
- **Change:** Guarded both `loadFromDb()` and `saveToDb()` so that dynamic imports of `@/lib/mongodb` are strictly unreachable unless `DATABASE_BACKEND === "mongodb"`.

### 2.4. Administrator Bootstrap & Authorization Hardening (`lib/auth.ts`)
- **Password Synchronization:** Bootstrap administrator login now updates the stored password bcrypt hash in PostgreSQL if the account previously existed, preventing stale credential lockouts.
- **Concurrent Provisioning Safety:** Wrapped admin user insertion in a concurrency-safe block. If two simultaneous bootstrap login requests arrive at once, the unique key collision is trapped and safely resolves to the single created admin.
- **Role Escalation Prevention:** Added server-side enforcement in `authService.registerWithOtp()` explicitly rejecting self-service registration attempts with `admin` or `finance` roles.
- **Exported `generateToken`:** Made JWT token creation accessible for deterministic server-side testing.

### 2.5. Automated Test Suites Added
- [`tests/database/backend-selection.test.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/tests/database/backend-selection.test.ts): 7 tests covering explicit, missing, conflicting, invalid, and production database configurations.
- [`tests/security/admin-bootstrap-security.test.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/tests/security/admin-bootstrap-security.test.ts): 8 security tests verifying role-escalation denial, credential requirements, bcrypt hashing, concurrent idempotency, missing JWT_SECRET security, and HTTP 401/403 API route enforcement.
- Updated [`package.json`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/package.json) with `test:staging-verify` and verified `npm run build`.

---

## 3. Database Selection Rules Matrix

The runtime enforces the following resolution table in [`lib/db.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/lib/db.ts):

| `DATABASE_BACKEND` | `DATABASE_URL` / `POSTGRES_URL` | `MONGODB_URI` | `NODE_ENV` | Selected Backend | Runtime Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `postgres` | Present | Any | Any | **PostgreSQL** | Connects to PostgreSQL via Drizzle / `pg.Pool` |
| `postgres` | Missing | Any | Any | **None (Error)** | Throws actionable error: `PostgreSQL backend selected, but no connection string was found` |
| `mongodb` | Any | Present | Any | **MongoDB** | Connects to MongoDB (compatibility mode only) |
| `mongodb` | Any | Missing | Any | **None (Error)** | Throws: `DATABASE_BACKEND is set to 'mongodb', but MONGODB_URI is missing` |
| `sqlite` / Invalid | Any | Any | Any | **None (Error)** | Throws: `Invalid DATABASE_BACKEND. Supported values are "postgres" or "mongodb"` |
| *Unset* | Present | Present | Any | **None (Error)** | Throws: `Ambiguous database configuration: both PostgreSQL and MongoDB present...` |
| *Unset* | Present | Missing | Any | **PostgreSQL** | Safely selects PostgreSQL |
| *Unset* | Missing | Present | Any | **None (Error)** | Throws: `MONGODB_URI is present but DATABASE_BACKEND is not set` (Prevents silent fallback) |
| *Unset* | Missing | Missing | `production` | **None (Error)** | Throws: `No database configured in production environment` |
| *Unset* | Missing | Missing | `development` | **Mock DB** | In-memory mock database for local offline prototyping only |

---

## 4. Repository-Wide Database Access Audit & Classification

Every occurrence of database drivers, connection strings, and collection calls was audited and classified:

| Category | File / Path | Role / Usage | Can Execute in Staging/Prod? | Status / Recommendation |
| :--- | :--- | :--- | :---: | :--- |
| **Active Application Runtime** | `db/schema/core.ts`<br>`db/client.ts`<br>`lib/postgres-db.ts`<br>`lib/db.ts` | Primary database definitions, Drizzle ORM models, connection pool, and repository operations. | **Yes (Active)** | Authoritative system of record. |
| **Dormant Compatibility Code** | `lib/mongodb.ts`<br>`lib/mongodb-db.ts` | Legacy MongoDB client connection and driver repository methods. | **No** (Guarded behind `DATABASE_BACKEND === "mongodb"`) | Retain temporarily for reference or isolate into legacy folder; delete after full cutover. |
| **Dormant Fallback Branches** | `lib/admin-settings.ts`<br>`lib/campaign-config.ts`<br>`lib/onsite-training-config.ts` | Secondary fallback branch reading `app_settings` from Mongo. | **No** (Guarded behind `isPostgresBackend()` and explicit `DATABASE_BACKEND === "mongodb"`) | Safe. Will never execute in PostgreSQL mode. |
| **Development / Mock Infrastructure** | `lib/mock-db.ts` | In-memory store used only during local offline UI development. | **No** (Blocked in production) | Retain for local offline development only. |
| **Legacy Maintenance Scripts** | `scripts/create-admin-finance.ts` | Standalone CLI script using `MongoClient` directly to insert an admin user. | **No** (CLI only) | **Do not run.** Superseded by automated bootstrap login in `lib/auth.ts`. Recommend retiring. |
| **Legacy Migration Tooling** | `scripts/migrate-mongodb-to-postgres.ts`<br>`scripts/migration-executor.ts` | Migration CLI scripts used for dry-run and ETL from Mongo to Postgres. | **No** (Manual CLI only) | Out of runtime scope. Retain as archival tooling. |

---

## 5. Administrator Bootstrap & Authorization Security Audit

### 5.1. Findings
1. **Bootstrap Pre-Conditions:** The bootstrap administrator cannot be provisioned unless both `ADMIN_ACCOUNTS_EMAIL` (or `BOOTSTRAP_ADMIN_EMAIL`) and `ADMIN_ACCOUNTS_PASSWORD` (or `BOOTSTRAP_ADMIN_PASSWORD`) are present in the environment.
2. **Privilege Escalation Prevention:**
   - Registration endpoints (`/api/auth/register`, `/api/auth/register-instructor`) do not accept a `role` field from request bodies.
   - `authService.registerWithOtp()` strictly rejects any call attempting to pass `"admin"` or `"finance"`.
   - Dedicated administrative endpoint (`/api/admin/create-user`) requires a validated JWT session with `session.role === "admin"`.
3. **Password Security:** All passwords written to PostgreSQL `users` are hashed using `bcrypt` (10 salt rounds). Plaintext passwords are never stored or logged.
4. **JWT Security:** Token generation and decoding depend strictly on `JWT_SECRET`. If `JWT_SECRET` is unset, token issuance throws immediately, preventing token forgery.
5. **Concurrency Safety:** Parallel initial login requests resolve idempotently against the PostgreSQL unique email constraint without error or account corruption.
6. **Credential Retirement Lifecycle:** Once the initial administrator account is provisioned in PostgreSQL, the bootstrap environment variables (`ADMIN_ACCOUNTS_EMAIL` and `ADMIN_ACCOUNTS_PASSWORD`) can safely be cleared or rotated. The administrator can subsequently authenticate using normal database credentials.

---

## 6. PostgreSQL Schema vs. Academic Domain Persistence Gap Analysis

Comparison of `db/schema/core.ts` and `lib/postgres-db.ts` against full academic LMS functional requirements:

### 6.1. Fully Implemented & Verified in PostgreSQL
- **Users & Credentials:** `users` table with roles (`student`, `instructor`, `admin`, `finance`), status, email verification, and profile JSONB.
- **Pre-Registration & OTP:** `pending_registrations` table with OTP expiration and payload staging.
- **Course Catalog & Taxonomy:** `categories`, `courses`, `course_modules`, and `lessons` with foreign key relationships, ordering, and publishing flags.
- **Enrollments & Lesson Progress:** `enrollments` table tracking overall progress and completed lesson ID arrays.
- **Payments & Concurrency Locks:** `payments` and `payment_events` with Paystack reference uniqueness and atomic `verification_locked` idempotency.
- **Certificates:** `certificates` table linking users and completed courses with verification codes.
- **Notes:** `learning_notes` table for student personal course notes.
- **System Settings & Audit:** `app_settings` key-value store and `admin_logs` relational audit entries.

### 6.2. Partially Implemented in Schema
- **Quiz Definitions:** `quizzes` and `quiz_questions` tables exist in Drizzle, but lesson integration is stored in embedded lesson content.
- **Assignment Definitions:** `assignments` table exists in Drizzle for assignment metadata and deadlines.

### 6.3. Persistence Gaps (Currently Ephemeral or Client-State Only)
- **Quiz Submissions & Attempts:** No `quiz_attempts` or `quiz_answers` tables. Student submissions are currently scored ephemerally on the client or in component state.
- **Assignment Submissions:** No `assignment_submissions` table for file uploads, URLs, or submitted text.
- **Grading & Feedback:** No `grades`, `rubrics`, `instructor_feedback`, or `grade_history` tables.
- **Projects & Artifacts:** No `capstone_projects`, `student_projects`, or `project_artifacts` tables.

---

## 7. Validation Execution & Test Results

All tests were executed against the isolated local staging database (`learnhub_test`) and clean codebase:

```bash
# 1. Staging Runtime Verification
npm run test:staging-verify
# Result: 6/6 tests passed (3.58s)

# 2. Deterministic Database Selection
npx tsx --test tests/database/backend-selection.test.ts
# Result: 7/7 tests passed (2.36s)

# 3. Core PostgreSQL Database Operations
npx tsx --test tests/database/postgres-db.test.ts
# Result: 8/8 tests passed (2.71s)

# 4. Administrator Bootstrap & Role Security
npx tsx --test tests/security/admin-bootstrap-security.test.ts
# Result: 8/8 tests passed (33.68s)

# 5. Payment Gateway Verification Rules
npm run test:payments
# Result: 6/6 tests passed (0.51s)

# 6. Authorization & Role Security
npx tsx --test tests/security/auth-security.test.ts
# Result: 6/6 tests passed (2.23s)

# 7. Code Quality & Linter
npm run lint
# Result: 0 errors, 0 warnings

# 8. TypeScript Type Checking
npx tsc --noEmit
# Result: 0 errors

# 9. Next.js Production Turbopack Build
npm run build
# Result: Compiled successfully; 89/89 pages and API routes generated
```

---

## 8. Required Staging / Production Environment Variables

To guarantee strict PostgreSQL runtime operation without relying on MongoDB:

```dotenv
# Database Selection & Connection (Mandatory)
DATABASE_BACKEND="postgres"
DATABASE_URL="postgresql://user:password@host:5432/learnhub_staging"

# Authentication & Session Security (Mandatory)
JWT_SECRET="<generate-at-least-32-random-characters>"
JWT_EXPIRES_IN="7d"

# Administrator Bootstrap (Required for initial setup only; can be retired after)
ADMIN_ACCOUNTS_EMAIL="admin@promptcareacademy.com"
ADMIN_ACCOUNTS_PASSWORD="<strong-temporary-bootstrap-password>"

# Paystack Payment Gateway
PAYSTACK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."

# Application Public Host
NEXT_PUBLIC_APP_URL="https://staging.promptcareacademy.com"
```

> [!IMPORTANT]
> Ensure `MONGODB_URI` is **omitted** from staging and production environment variables. With `DATABASE_BACKEND="postgres"`, the application will never query MongoDB even if `MONGODB_URI` exists, but removing it enforces absolute infrastructure isolation.

---

## 9. Blockers & Recommended Next Phase

### Unresolved Blockers
- **None.** The application compiles cleanly, passes type checks and linter, passes all 41 unit/integration/security tests, and runs end-to-end on PostgreSQL.

### Next Recommended Implementation Phase: Academic Persistence Expansion
1. Create Drizzle schemas and migrations for academic engagement:
   - `quiz_attempts` (userId, quizId, score, answers, passed, completedAt)
   - `assignment_submissions` (userId, assignmentId, submissionUrl, content, submittedAt)
   - `grades` & `feedback` (submissionId, instructorId, rubricScore, comments)
2. Retire dormant MongoDB files (`lib/mongodb.ts`, `lib/mongodb-db.ts`, `scripts/create-admin-finance.ts`) once staging sign-off is finalized.

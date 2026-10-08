# Existing System Architecture

## Executive Summary

This is a Next.js App Router LMS branded **Prompt Care Academy**. It is already partly general-purpose (the root metadata names technology subjects), but substantial copy, onboarding fields, onsite training rules, assets, and course seed data remain healthcare/caregiver-specific. The runtime selects a MongoDB repository when `MONGODB_URI` exists and otherwise uses process-memory mock arrays. The application has four roles: student, instructor, admin, and finance.

The core domain is viable for a technology academy: courses embed modules and lessons; enrollments, payments, certificates, notes, and audit/event records are separate collections. The redesign should retain those concepts but fix authorization and data-boundary issues before exposing a new academy publicly. In particular, the course-creation route currently has no server-side authentication check (`app/api/courses/route.ts`), and route/page guards are inconsistent.

This audit is based on repository code, not the README alone. Where runtime configuration, cron scheduling, provider accounts, or production data cannot be inspected, the finding is marked **NEEDS VERIFICATION**.

## Technology Stack

| Area | Evidence / implementation |
|---|---|
| Framework | Next.js `^16.1.6`, App Router and Route Handlers (`package.json`, `app/`). |
| UI runtime | React/React DOM `19.2.0`; TypeScript with `strict: true`, while `allowJs: true` (`package.json`, `tsconfig.json`). |
| Styling | Tailwind CSS v4 via PostCSS, CSS variables, `tw-animate-css`; shadcn/ui “new-york” configuration (`app/globals.css`, `components.json`). |
| Database | MongoDB Node driver `^7.0.0`; no ORM. Repository-like classes in `lib/mongodb-db.ts`, connection/index management in `lib/mongodb.ts`. |
| Development fallback | In-memory array database in `lib/mock-db.ts`, selected when no `MONGODB_URI` is set (`lib/db.ts`). Data disappears on restart. |
| Auth | Custom JWT signed with `jsonwebtoken`, bcryptjs password hashing, an HTTP-only `token` cookie, and a persisted Zustand client store (`lib/auth.ts`, `app/api/auth/login/route.ts`, `lib/store.ts`). |
| Validation | Zod schemas in `lib/validation.ts`, used by many mutation routes. |
| State | Zustand persisted to browser storage for auth, cart, and preferences (`lib/store.ts`). |
| Payments | Direct server-side Paystack REST calls and HMAC-SHA512 webhook validation (`lib/paystack.ts`, `app/api/payments/webhook/route.ts`). |
| Email | Direct Resend REST calls for OTP, welcome, lesson-review, reset, and payment-review mail (`lib/email.ts`). |
| Analytics | Vercel Analytics renders in the root layout; onboarding events are internally persisted (`app/layout.tsx`, `lib/onboarding-event-log.ts`). |
| Charts / interaction | Recharts, Framer Motion, Radix primitives, Lucide, React Hook Form + resolvers. |
| File storage | No upload/storage adapter is present. Course thumbnails/video URLs and assignment resources are persisted as URL strings. |

## Repository Structure

- `app/` is the App Router: route groups `(public)` and `(auth)`, role dashboards, commerce pages, and `app/api/**/route.ts` handlers.
- `components/ui/` contains shadcn/Radix-derived primitives; `components/skillup/` is the academy-specific design/component layer; `components/auth`, `admin`, `payments`, `layout`, and `campaign` are feature layers.
- `lib/` combines domain types, repositories, auth, payment/email provider clients, onboarding, analytics, and feature configuration. It is not cleanly separated into modules.
- `hooks/` has `use-purchase-guard.ts` and toast support.
- `scripts/create-admin-finance.ts` bootstraps privileged accounts. `tests/payments/` is the only test area identified by package scripts.
- `public/` holds static assets. `docs/` and many root Markdown reports are documentation only; they are not runtime configuration.

## Application Architecture

### Rendering and frontend

The root layout loads Inter and Plus Jakarta Sans, client session bootstrap, toasts, currency modal, and Vercel Analytics (`app/layout.tsx`). Public pages use `(public)/layout.tsx`, `PublicHeader`, and `PublicFooter`. Pages are mainly client-driven dashboards: they call JSON APIs with a bearer token taken from Zustand, then render feature-specific cards/forms.

`RoleDashboardShell` is the common sidebar/topbar/mobile-sheet shell for student, instructor, admin, and finance consoles (`components/skillup/role-dashboard-shell.tsx`). Role layouts perform client-side redirects; only the admin layout also rechecks `/api/auth/me` (`app/*/layout.tsx`). The edge proxy only verifies the existence of a cookie for protected URL prefixes; it does not verify JWT validity or role (`proxy.ts`).

### Backend and services

Route Handlers are the backend boundary. There are no Server Actions (`"use server"` is absent). Handlers call `getDB()` directly, plus cross-cutting helpers such as `authService`, Paystack, mail, onboarding events, and milestone synchronization. This is a pragmatic but tightly coupled service layer, not a layered/DI architecture.

`lib/db.ts` chooses MongoDB or mock data. `MongoDBDatabase` provides CRUD methods, but several handlers still contain orchestration/business logic. Mongo indexes are created lazily at first use (`lib/mongodb.ts`) for payment reference, user-course enrollment, payment events, and pending-registration email.

## Authentication & Authorization

### Account lifecycle

1. Student registration posts to `POST /api/auth/register`; instructor registration posts to `POST /api/auth/register-instructor`. Both create a pending-registration record with a bcrypt password and hashed, six-digit OTP in `lib/auth.ts`.
2. OTP mail is sent through Resend; `POST /api/auth/verify-otp` promotes the pending record to `users`, marks it verified, records events, sends welcome mail, and returns a JWT. Resend is `POST /api/auth/resend-otp`. Pending cleanup is exposed at `/api/auth/cleanup-pending-registrations` and guarded by an admin/session or maintenance secret.
3. `POST /api/auth/login` validates credentials, blocks `emailVerified === false`, creates a signed JWT, returns it in JSON, and writes an HTTP-only, `SameSite=Lax` cookie. “Remember me” gives the cookie a 30-day max age; otherwise it is a session cookie. JWT expiry defaults to seven days (`lib/auth.ts`).
4. Zustand also persists the returned JWT and user object in browser storage (`auth-storage`). `AuthSessionBootstrap` can restore this from the cookie through `GET /api/auth/me` (`components/auth/auth-session-bootstrap.tsx`).
5. Password reset: `POST /api/auth/forgot-password` intentionally does not reveal account existence; `authService.requestPasswordReset` creates a token/reset link and mails it. `POST /api/auth/reset-password` consumes it. **NEEDS VERIFICATION:** reset-token persistence/lifetime should be validated against the deployed database implementation before production use.
6. Logout clears the cookie at `POST /api/auth/logout` and the local Zustand state through `lib/client-logout.ts`.

### Authorization model and gaps

`UserRole` is `student | instructor | admin | finance` (`lib/types.ts`). API handlers generally use `getTokenFromRequest()` (cookie first, Bearer second), `authService.getCurrentUser()`, or JWT decoding, then compare roles/ownership. The protected prefix proxy covers `/admin`, `/dashboard`, `/instructor`, `/finance`, and `/checkout`, but only tests whether a `token` cookie exists.

This defense is not sufficient by itself: layout checks are client-side, and every sensitive API must enforce authentication and role/ownership. Several do, but enforcement is inconsistent. Most critically, `POST /api/courses` accepts a validated course body and creates it without authenticating the caller or deriving `instructorId` from the session (`app/api/courses/route.ts`). Treat this as a release-blocking authorization issue.

## User Roles

| Role | Intended capabilities evidenced in code |
|---|---|
| Student | Register/verify/sign in; browse/filter courses; maintain a cart; initiate payment; receive enrollments; study lessons; mark lessons complete; view certificates, payment history, profile, activity/history, notes, milestones, and onsite training (`app/dashboard/**`). |
| Instructor | Register via OTP; create/edit courses/curriculum; use course/content screens, view course-linked enrollment/payment analytics, and edit profile/settings (`app/instructor/**`). Lesson approval is admin-only. |
| Admin | Use analytics, campaigns, onsite training configuration, users/students, courses/categories, lesson approvals/rejections, payment review/verification, settings, and logs (`app/admin/**`, `app/api/admin/**`). |
| Finance | View finance dashboard, transactions/details, reports, and settings UI (`app/finance/**`). **NEEDS VERIFICATION:** finance-specific API authorization and workflows are limited/inconsistent; it appears largely a presentation role over shared payment data. |

## Database Architecture

MongoDB collections reflect these interfaces in `lib/types.ts` / `lib/mongodb-db.ts`:

| Collection/model | Relationships and purpose |
|---|---|
| `users` | Role, credentials, verification/onboarding state, embedded student/instructor profile, denormalized `enrolledCourses`, milestones. Referenced by courses, enrollments, payments, certificates, notes, and logs. |
| `pending_registrations` | Pre-verification user payload, bcrypt password and OTP hash/expiry; promoted on verification. Unique email index. |
| `courses` | Owned by `instructorId`; includes course metadata, price, approval/publish flags, and embedded `modules[]`/`lessons[]`. |
| `categories` | Simple course category records; course category is stored as a string, not a foreign key. |
| `enrollments` | Join of `userId` and `courseId`, progress, completed lesson IDs/status/current lesson. Unique compound index. |
| `payments` | Buyer, one `courseId` plus optional cart `courseIds`, onsite type, gateway/reference/status/review/refund fields. Unique reference index. |
| `payment_events` | Append-style payment lifecycle log by reference/payment ID. |
| `certificates` | User/course completion artifact with URL and verification code. |
| `quizzes`, `assignments` | Types/repository reads exist, while course lessons refer by IDs or embed assignment details. Creation/submission/attempt models are absent. |
| `learning_notes` | Student-owned course-optional notes. |
| `admin_logs`, `onboarding_events` | Audit activity and onboarding analytics events. |

There are no relational constraints/cascades beyond the four lazy indexes. IDs are serialized Mongo ObjectIds, but code contains fallback branches for arbitrary IDs, reflecting compatibility with the mock database.

## LMS Domain Model

Courses contain ordered modules, which contain ordered lessons of `video`, `article`, `quiz`, or `assignment` (`lib/types.ts`). Video/article URLs/content and assignment definitions are embedded per lesson; quiz/assignment ID references are optional. Public course responses mask video URLs for users without access (`lib/utils/course-masking.ts`).

Enrollment is created after a verified successful Paystack payment; an onsite-registration payment instead enrolls the student in every currently approved course (`app/api/payments/webhook/route.ts`, `app/api/admin/payments/verify/route.ts`). The learn page calculates completion locally as completed lessons divided by all lessons, then PATCHes the enrollment (`app/dashboard/courses/[courseId]/learn/page.tsx`). At 100%, the server marks the enrollment completed (`app/api/enrollments/[id]/progress/route.ts`). Certificates are retrievable but no certificate-generation route was found; **NEEDS VERIFICATION** whether another operational process writes them.

Quizzes and assignments are represented in types/UI, but no attempt, answer, submission, grading, rubric, or gradebook persistence was found. They are content presentation, not complete assessment workflows. Notifications are primarily transactional emails and toast UI; no notification collection/queue exists. Analytics are derived from records at request time plus onboarding-event logs; there is no data warehouse or scheduled aggregation.

## Route Map

### Pages

| Area | Routes |
|---|---|
| Public | `/`, `/about`, `/contact`, `/courses`, `/courses/[slug]`, `/faq`, `/privacy`, `/refund`, `/terms`, `/campaign/promptcare-academy`, `/cart` |
| Authentication/onboarding | `/login`, `/login-admin`, `/register`, `/register-instructor`, `/register-online`, `/register-onsite`, `/verify-otp`, `/forgot-password`, `/reset-password`, `/welcome/student`, `/welcome/instructor` |
| Commerce | `/checkout`, `/checkout/success`, `/checkout/failed` |
| Student | `/dashboard`, `/dashboard/courses`, `/dashboard/courses/[courseId]/learn`, `/dashboard/certificates`, `/dashboard/payments`, `/dashboard/payments/[paymentId]`, `/dashboard/profile`, `/dashboard/profile/setup`, `/dashboard/onsite-training`, `/dashboard/onsite-training/success` |
| Instructor | `/instructor`, `/instructor/analytics`, `/instructor/courses`, `/instructor/courses/new`, `/instructor/courses/[courseId]/edit`, `/instructor/courses/[courseId]/content`, plus legacy-looking `/instructor/create-course`, `/instructor/edit-course/[courseId]`, `/instructor/upload`, `/instructor/settings` |
| Admin | `/admin`, `/admin/analytics`, `/admin/campaign`, `/admin/onsite-training`, `/admin/users`, `/admin/students`, `/admin/courses`, `/admin/courses/[courseId]/edit`, `/admin/courses/[courseId]/content`, `/admin/payments`, `/admin/payments/[paymentId]`, `/admin/payments/verify`, `/admin/settings` |
| Finance | `/finance`, `/finance/transactions`, `/finance/transactions/[paymentId]`, `/finance/reports` |

### API Route Handlers

| Group | Routes and methods |
|---|---|
| Auth | `POST /api/auth/{login,logout,register,register-instructor,verify-otp,resend-otp,forgot-password,reset-password}`; `GET /api/auth/me`; `GET,POST /api/auth/cleanup-pending-registrations` |
| Courses/content | `GET,POST /api/courses`; `GET,PUT,DELETE /api/courses/[id]`; `GET /api/courses/slug/[slug]`; `POST /api/courses/[id]/lessons/[lessonId]/{approve,reject}`; `GET,POST /api/categories`; `PUT /api/categories/[id]` |
| Learning | `GET,POST /api/enrollments`; `PATCH /api/enrollments/[id]/progress`; `GET /api/{certificates,history,activity}`; `GET,POST,DELETE /api/notes`; `GET /api/home-video` |
| Payments | `GET /api/payments`; `GET,PATCH /api/payments/[id]`; `POST /api/payments/{initialize,initialize-onsite,webhook,reconcile}`; `GET /api/payments/verify` |
| Users/admin/config | `GET /api/users`; `PATCH,DELETE /api/users/[id]`; `POST /api/users/password`; `POST /api/admin/create-user`; `GET /api/admin/logs`; `POST /api/admin/payments/verify`; `GET,PUT /api/admin/settings`; `GET,PUT /api/{campaign,onsite-training}` |
| Onboarding/profile | `GET,PATCH /api/onboarding/state`; `GET,POST /api/onboarding/analytics`; `PATCH /api/profile/setup` |

There are no Server Actions.

## Major Business Logic

- Authentication/OTP/password reset: `lib/auth.ts`; route-level onboarding decisions: `lib/onboarding-flow.ts` and `app/api/auth/**`.
- Payment initialization, gateway calls, expiry, verification/reconciliation, event logging, locks, webhook processing, and access grants: `lib/paystack.ts`, `lib/payments/**`, `lib/onsite-checkout.ts`, `app/api/payments/**`, and `app/api/admin/payments/verify/route.ts`.
- Course approval and lesson-review workflow: course/lesson route handlers and admin screens.
- Milestones: definitions and derived unlock logic in `lib/student-milestones.ts`; synchronization is invoked after OTP verification and selected student operations.
- Onsite caregiver-training rules/configuration: `lib/onsite-training-*.ts`, `lib/student-registration.ts`, and `/api/onsite-training`. These are the most healthcare-specific operational rules.
- Course access masking: `lib/utils/course-masking.ts`.

## UI Architecture

The established design system is reusable: Tailwind semantic tokens, light/dark themes, green primary (`#16a34a` light / `#4ade80` dark), emerald accent, neutral surfaces, 14px radius, soft shadows, and accessible reduced-motion overrides (`app/globals.css`). Inter is body font and Plus Jakarta Sans is display/headings (`app/layout.tsx`).

Public navigation is a sticky, responsive header with desktop pill navigation and a mobile Sheet; its footer is a five-column responsive grid (`components/layout/*`). Dashboards share a responsive 72px? **Correction:** a `w-72` desktop sidebar, sticky desktop header, and mobile nav Sheet via `RoleDashboardShell`; breakpoints use Tailwind `md`/`lg`. shadcn primitives live in `components/ui`, feature cards/layout pieces in `components/skillup`. Branding, labels, icon/image paths, and caregiver copy are distributed through pages/components rather than centrally tokenized.

## External Services

- MongoDB: persistent application data when configured.
- Paystack: checkout initialization, transaction verification/refund and signed webhooks. Callback URLs are built with `NEXT_PUBLIC_APP_URL`.
- Resend: OTP, welcome, lesson approval/rejection, password reset, and payment-manual-review email.
- Vercel Analytics: rendered in the client root layout. Vercel deployment is implied by `VERCEL_URL`, not configured in a committed `vercel.json`.
- Social links/embedded media use YouTube, Instagram, and Facebook in `PublicFooter`; course video URLs are arbitrary external URLs.

## Environment Variables

| Variable | Use |
|---|---|
| `MONGODB_URI`, `MONGODB_DB` | Mongo connection and database selection. |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | JWT signing/expiry. |
| `BCRYPT_ROUNDS` | Documented but not used; code hard-codes 10 in `lib/auth.ts`. |
| `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_BASE_URL` | Paystack server key/base URL; public key variables are documented but not found in runtime code. |
| `RESEND_API_KEY`, `RESEND_FROM` | Email API and From identity. |
| `OTP_EXPIRES_MINUTES`, `OTP_RESEND_COOLDOWN_SECONDS`, `NEXT_PUBLIC_OTP_EXPIRES_MINUTES`, `NEXT_PUBLIC_OTP_RESEND_COOLDOWN_SECONDS` | OTP lifecycle / UI timing. |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `ADMIN_ACCOUNTS_EMAIL`, `ADMIN_ACCOUNTS_PASSWORD` | Environment-admin bootstrap/login path. |
| `NEXT_PUBLIC_APP_URL`, `VERCEL_URL` | Metadata, email/reset/callback URLs. |
| `AUTH_MAINTENANCE_SECRET`, `PAYMENT_RECONCILE_SECRET`, `CRON_SECRET` | Scheduled/manual maintenance endpoint authorization. |
| `NEXT_PUBLIC_ONSITE_TRAINING_PAYMENT_URL` | Caregiver onsite registration payment link/configuration. |
| `FEATURE_SHARED_OTP_EXPERIENCE`, `NEXT_PUBLIC_FEATURE_SHARED_OTP_EXPERIENCE`, `FEATURE_ONBOARDING_ANALYTICS`, `NEXT_PUBLIC_FEATURE_ONBOARDING_ANALYTICS`, `FEATURE_POST_VERIFY_WELCOME`, `NEXT_PUBLIC_FEATURE_POST_VERIFY_WELCOME` | Documented onboarding feature flags. **NEEDS VERIFICATION:** confirm all are consumed at runtime. |
| `NODE_ENV` | Secure-cookie and development email behavior. |

`ALLOWED_ORIGIN`, `SENTRY_DSN`, and `MAINTENANCE_MODE` occur only in `docs/DEPLOYMENT.md`, not runtime source, so they are not current application requirements.

## Deployment

Locally: install existing dependencies, create `.env.local` from `.env.example`, configure MongoDB/Paystack/Resend for real integrations (or omit MongoDB only for nonpersistent mock development), and run `npm run dev`. Build/start scripts are `next build` and `next start`; lint is `eslint .`; payment tests are `npm run test:payments`.

Production is designed for a Node-capable Next.js host such as Vercel, with environment variables set in that host. Paystack must be configured to call `/api/payments/webhook`; an external scheduler must invoke cleanup/reconciliation routes with their secrets. **NEEDS VERIFICATION:** no committed scheduler configuration, Vercel configuration, CI workflow, Dockerfile, database migration/seeding pipeline, backup plan, or health-check endpoint was found.

## Security

High-priority findings:

1. **Critical — unauthenticated course creation:** `POST /api/courses` has no session/role check and accepts ownership/approval fields from the request (`app/api/courses/route.ts`). Require authenticated instructor/admin, derive owner from session, and reserve approval for admin.
2. **High — insecure default JWT secret:** `lib/auth.ts` falls back to a known literal if `JWT_SECRET` is absent. Fail closed in production and rotate any potentially exposed key.
3. **High — inconsistent authorization strategy:** `proxy.ts` checks only cookie presence; several UI guards are client-side; APIs variably use raw decoded claims vs current user lookup. Adopt one server-side authorization policy for every handler, including object ownership.
4. **High — JWT persists in browser storage:** Zustand persists token/user state, exposing bearer tokens to XSS despite also using HTTP-only cookie (`lib/store.ts`). Prefer cookie-only session/short-lived access strategy and harden CSP.
5. **Medium — no visible rate limits/CSRF/CSP/security-header policy:** login, OTP, reset, and payment-related routes lack evident rate limiting. Cookie-authenticated mutations need a deliberate CSRF strategy. **NEEDS VERIFICATION:** host-level protections may exist outside the repository.
6. **Medium — embedded external media URLs and unoptimized images:** storage, file type/size validation, signed URLs, and Next image optimization are absent (`next.config.mjs` has `images.unoptimized: true`).
7. **Medium — authorization/validation regression risk:** some handlers use `any` and direct DB objects; no broad automated authorization test suite was found.

Positives: passwords are bcrypt-hashed for normal flows, OTPs are hashed, payment webhooks validate Paystack signatures, payment reference and enrollment uniqueness indexes exist, and payment verification includes lock/mismatch/manual-review handling.

## Technical Debt

- The mock/Mongo dual implementation duplicates a large repository contract (`lib/mock-db.ts`, `lib/mongodb-db.ts`) and causes production-like behavior to differ locally.
- Domain logic is spread among API handlers, helper modules, and UI; payment access-grant logic is duplicated between webhook and admin verification.
- Course modules/lessons are deeply embedded, while quizzes/assignments have disconnected collections and no attempts/submissions/grading. This blocks reliable educational analytics.
- `CourseCategory` is a string although `categories` exists; `User.enrolledCourses` duplicates enrollment joins; no cascades/indexes cover many query paths.
- Legacy/duplicate-looking instructor routes (`create-course`, `edit-course/[courseId]`, `upload`) coexist with newer course routes. Determine actual traffic before removal.
- `BCRYPT_ROUNDS` is documented but ignored. Some dependencies use `latest`, reducing reproducibility; both `package-lock.json` and `pnpm-lock.yaml` exist, creating package-manager ambiguity.
- Project/package naming (`my-v0-project`), generator metadata (`v0.app`), Prompt Care/SkillUp naming, stale README claims, and many root delivery documents obscure ownership and current behavior.
- No ORM/schema migration framework, comprehensive test suite, CI, observability/error tracking, queue, search index, CDN/media pipeline, or caching policy is in repository evidence.

Do not casually alter the payment webhook/verification lock and manual-review paths, Mongo conversion/index behavior, or OTP promotion flow during visual rebranding; these are high-impact transactional paths.

## KEEP / MODIFY / REFACTOR / REPLACE / REMOVE

| Classification | Scope for technology academy |
|---|---|
| KEEP | Next.js App Router foundation; TypeScript; MongoDB persistence option; courses/modules/lessons, enrollment, payments, certificates, notes; reusable shadcn/Tailwind primitives; responsive dashboard shell; Paystack signature verification and payment audit events. |
| MODIFY | Brand/metadata/assets/copy; category/level taxonomy; public curriculum pages; student and instructor onboarding/profile fields; legal content; pricing/currency policy; onsite offering wording/rules if a physical tech bootcamp remains. |
| REFACTOR | Auth/session into cookie-first centralized server authorization; repositories into typed interfaces; payment access grant into one idempotent domain service; course/assessment domain; analytics query layer; environment validation; central design tokens/content configuration; tests and CI. |
| REPLACE | In-memory fallback for any shared/staging/production environment; flat URL-only media handling with managed object storage/CDN; superficial client-only route protection; ad hoc reporting as scale grows; incomplete assessment model with attempts/submissions/grades. |
| REMOVE | Healthcare/caregiver-specific registration fields and language, training locations/configuration, caregiver campaign content, obsolete routes after usage verification, stale duplicated docs, and unused/dead dependencies only after dependency/telemetry audit. |

## Recommended Architecture for the Future Tech Academy

Retain Next.js but draw firm domain boundaries: `identity`, `catalog`, `learning`, `assessment`, `commerce`, `notifications`, and `admin`. Use an authenticated server-side policy layer (`requireUser`, `requireRole`, `requireResourceOwner`) before each handler, session cookies with rotation/expiry, rate limits, CSRF design, and runtime environment validation.

Model courses, curriculum, lessons, enrollments, payments, and certificates as first-class collections with explicit indexes; decide whether curriculum remains embedded only when lesson counts are bounded. Add assessment attempts, submissions, grades/feedback, instructor review, progress events, and a certificate issuance job. Keep payment fulfillment idempotent and event-driven, with exactly one access-grant service shared by webhook/admin/reconciliation paths.

Adopt object storage with signed uploads/streaming for videos, thumbnails, and submissions. Move brand/content/taxonomy to configuration/CMS-like records, retain the design token system but replace healthcare copy/assets centrally, and provide a migration plan for existing records. Before redesign implementation, add authorization/payment/webhook regression tests, structured logs/error monitoring, backups, migrations, and a documented production scheduler.

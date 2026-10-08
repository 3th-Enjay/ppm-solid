# Phase 0: Discovery and Safety

## Scope and Evidence Standard

This Phase 0 assessment is read-only. No application code, database, dependencies, package configuration, or existing paths were changed. Findings come from repository source and committed documentation only. Production MongoDB contents, deployment settings, domain/DNS ownership, provider dashboards, schedules, backups, and traffic cannot be inspected from this repository and are marked **NEEDS VERIFICATION**.

Related planning documents: `ARCHITECTURE_AUDIT.md` and `TECH_ACADEMY_TRANSFORMATION.md`.

## 1. DATABASE

### Runtime selection

`lib/db.ts` selects `MongoDBDatabase` from `lib/mongodb-db.ts` when `MONGODB_URI` is present; otherwise it selects the process-memory `MockDatabase` in `lib/mock-db.ts`. `lib/mongodb.ts` opens the MongoDB driver connection and picks `MONGODB_DB`, defaulting to `Prompt Care Academy`. `scripts/create-admin-finance.ts` instead defaults its database name to `learnhub`; this configuration divergence is a migration risk.

**NEEDS VERIFICATION:** Which database name/cluster is actually used in production, whether MongoDB is enabled in each environment, and whether any production records were ever created under both names.

### Collections and relationships

| Collection | Evidence | Purpose / relations |
|---|---|---|
| `users` | `lib/mongodb-db.ts`, `lib/types.ts` | Identity, role, credentials, verification, profiles, onboarding/milestones and denormalized `enrolledCourses`. Referenced by courses, enrollments, payments, certificates, notes, admin logs. |
| `pending_registrations` | `lib/mongodb-db.ts`, `lib/auth.ts` | Pre-verification registration payload with password/OTP hash and expiry. Promoted to a user upon OTP verification. |
| `courses` | `lib/mongodb-db.ts` | Catalog record with instructor ID and embedded modules/lessons. |
| `categories` | `lib/mongodb-db.ts` | Simple category records; course category remains a string rather than a reference. |
| `enrollments` | `lib/mongodb-db.ts` | User-course join, progress, completed lesson IDs, status/current lesson. |
| `payments` | `lib/mongodb-db.ts` | Buyer, course/course IDs, Paystack reference, payment state, gateway/review/refund fields. |
| `payment_events` | `lib/mongodb-db.ts`, `lib/payments/runtime.ts` | Payment lifecycle/event log keyed by payment reference. |
| `certificates` | `lib/mongodb-db.ts` | User-course certificate URL and verification code. |
| `quizzes` | `lib/mongodb-db.ts`, `lib/types.ts` | Quiz/questions. Course lessons may reference quiz IDs. |
| `assignments` | `lib/mongodb-db.ts`, `lib/types.ts` | Basic assignment definitions. Lessons can also embed assignment details. |
| `admin_logs` | `lib/mongodb-db.ts` | Privileged administrative action records. |
| `learning_notes` | `lib/mongodb-db.ts`, `app/api/notes/route.ts` | User-owned notes, optionally associated with a course. |
| `onboarding_events` | `lib/mongodb-db.ts`, `lib/onboarding-event-log.ts` | Onboarding analytics/event records. |

No collections for learning paths, skills, cohorts, orders, entitlements, quiz attempts, assignment submissions, project submissions, notifications, announcements, discussion threads, mentors, role assignments, sessions, or community moderation are implemented.

### Important indexes

`lib/mongodb.ts` lazily attempts to create the following indexes on first database access:

| Collection | Index | Purpose |
|---|---|---|
| `payments` | unique `{ reference: 1 }` named `uniq_payments_reference` | Prevent duplicate payment references. |
| `enrollments` | unique `{ userId: 1, courseId: 1 }` named `uniq_enrollments_user_course` | Prevent duplicate enrollment for the same learner/course. |
| `payment_events` | `{ reference: 1, createdAt: -1 }` named `idx_payment_events_ref_created` | Query payment event history by reference. |
| `pending_registrations` | unique `{ email: 1 }` named `uniq_pending_registrations_email` | One active pending registration per email. |

**NEEDS VERIFICATION:** Index creation failures are only logged; inspect the live cluster to confirm all four exist. No unique index for `users.email`, `courses.slug`, certificate verification code, or categories is evidenced. Those need design/migration decisions before Phase 1.

### Existing seed/mock data

There is no repository evidence of a MongoDB production seed command: `package.json` has no `db:migrate` or `db:seed` script even though `docs/DEPLOYMENT.md` mentions them. The only runtime seed data is `lib/mock-db.ts`:

- `mockUsers` is empty.
- Four technology-oriented courses are embedded in `mockCourses`: Complete Web Development Bootcamp, UI/UX Design Masterclass, Digital Marketing Strategy, and Business Analytics with Python.
- The course categories are healthcare-branded pillars: `The Foundation Pillar`, `The Clinical Pillar`, `The Leadership Pillar`, and `The Family Pillar`.
- Two mock enrollments belong to a nonexistent mock user ID `user-1`, while courses name nonexistent instructor ID `user-3`; this fixture referential inconsistency must not be treated as valid migration data.
- Two completed USD mock Paystack payments correspond to the two enrollment courses.
- One HTML quiz and one portfolio-website assignment exist; certificate, user, admin-log, note, payment-event, onboarding-event, and pending-registration mock arrays start empty.

The mock records use fixed legacy IDs such as `course-1`, `payment-1`, and `PAY-2024-001`; MongoDB records use ObjectIds serialized as strings (`lib/mongodb-db.ts`).

### Duplicate / denormalized data

| Duplicate/denormalized data | Locations | Risk / migration decision |
|---|---|---|
| Course access | `User.enrolledCourses` and `enrollments` in `lib/types.ts` | These can diverge. Make enrollment/entitlement authoritative; backfill and reconcile before removing `enrolledCourses`. |
| Course category | `courses.category` string and `categories` collection | Categories can be renamed/deleted without referential integrity. Introduce category IDs/controlled taxonomy in target model. |
| Instructor information | `courses.instructorId` plus denormalized `instructorName`, avatar, bio and profile-derived display fields | Instructor profile updates can leave stale course display data. Resolve at query/read model or refresh deterministically. |
| Payments and course access | `payments.courseId`, optional `courseIds`, user enrollment list, enrollment rows | Multi-course purchases and entitlement state are not a normalized commerce model. Phase 1/5 must introduce one fulfillment source. |
| Assignments | `assignments` collection and `Lesson.content.assignment` | Two competing representations lack submissions/grade records. Consolidate in assessment design. |

### Healthcare-specific data

`StudentRegistrationProfile` in `lib/types.ts` contains healthcare/onsite-derived fields: `isHealthcareProfessional`, `currentRoleOrField`, `trainingInterest`, `preferredLocation` (`enugu`/`abuja`), preferred location start date, onsite/online mode, registration fee/status/reference/link and acceptance fields. `lib/onsite-training-config.ts`, `lib/student-registration.ts`, and `lib/onsite-training-shared.ts` hold supporting rules. Existing live values are **NEEDS VERIFICATION** and must be classified for retention, archive, deletion, or consent-based migration before any schema changes.

## 2. USER DATA

### Existing identity fields

`User` in `lib/types.ts` contains `id`, `email`, `password`, `name`, `role`, optional avatar/bio/status/email verification, onboarding state, milestones, OTP values, student/instructor profile, `enrolledCourses`, and timestamps. `PendingRegistration` repeats most pre-verification user fields plus OTP data. Password/OTP hashes must never be exported into migration reports or target systems except as part of a controlled authentication migration strategy.

### Profile / role data

| Audience | Existing fields | Location | Transformation treatment |
|---|---|---|---|
| Student | `StudentRegistrationProfile`: phone/WhatsApp, gender, date of birth, address, training mode, existing field/role, location/start date, interest, payment/agreements. | `lib/types.ts`; registration routes/forms. | Migrate only minimal, justified data (name/email and explicitly requested profile fields). Healthcare/location/payment form fields need retention review. |
| Instructor | `InstructorProfile`: phone number, professional headline, specialties, years of experience; optional user bio/avatar. | `lib/types.ts`, instructor registration/settings UI. | Preserve only with user notice/consent and map specialties to technology expertise/skills after validation. |
| Admin / finance | No distinct profile model; `role`, common fields, status and verification identify them. Bootstrap/login configuration is in `lib/auth.ts`; account script is `scripts/create-admin-finance.ts`. | `lib/types.ts`, `lib/auth.ts`. | Preserve privileged identity records only after access review; migrate via controlled role assignment and force credential/session reset. |

### Fields that need migration decisions

1. `email`, `name`, role/status and creation timestamps: migrate after duplicate-email, status and consent checks.
2. Password hashes: **NEEDS VERIFICATION** whether maintaining password continuity is legally/security appropriate. Prefer forced reset if changing identity implementation/algorithms; never copy plaintext or reset tokens.
3. `avatar`, `bio`, instructor headline/specialties/experience: migrate only if still relevant and user-generated content policies permit it.
4. `enrolledCourses`, enrollment, payment and certificate data: reconcile into target enrollment/entitlement/certificate records; retain payment evidence as required.
5. Phone, WhatsApp, gender, date of birth, address, healthcare status/field, locations, agreements, and onboarding events: treat as sensitive or unnecessary legacy data; legal/privacy owner must decide retention or deletion. Do not automatically copy into technology academy profiles.
6. OTP hashes, expiry values, reset tokens and transient pending registrations: do not migrate; expire/purge according to approved policy after the old flow is retired.

## 3. COURSE DATA

### Current structure

`Course` in `lib/types.ts` stores title, slug, description/overview, string category, fixed level enum, owner/display instructor data, four-currency price, thumbnail URL, publish/approval state, embedded modules/lessons, duration, enrollment count, rating and timestamps. `CourseModule` is embedded and ordered. Each `Lesson` is embedded and typed as video, article, quiz, or assignment; it can carry external video URL, article body, quiz/assignment ID, embedded assignment details/resources, free-preview flag, and lesson approval/rejection state.

### Existing quiz/assignment data

`Quiz` stores questions/options/correct-answer index/explanation/passing score/time limit; `Assignment` contains only title/description/due date/max score. There are no models or API routes for quiz attempts, answers, assignment submissions, graders, rubrics, feedback, project artifacts, grades, or learner assessment history. The mock quiz and assignment in `lib/mock-db.ts` are technology-oriented, not a complete assessment system.

### Healthcare-specific content

The four mock course titles/content are technology/business-oriented, but their categories include Clinical/Family pillar language. The following UI/content paths include documented healthcare/caregiver material and must be inventoried against live Mongo content before migration:

- `app/(public)/page.tsx`, `app/(public)/about/page.tsx`, `app/(public)/contact/page.tsx`, `app/(public)/faq/**`, `app/(public)/courses/**`
- `app/(public)/campaign/promptcare-academy/**`, `lib/campaign-config.ts`, `lib/campaign-shared.ts`
- `app/(auth)/register-onsite/page.tsx`, `app/(auth)/register-online/page.tsx`, `components/auth/**`
- `app/dashboard/onsite-training/**`, `app/admin/onsite-training/page.tsx`
- `lib/mock-db.ts` category labels and any live course records with healthcare taxonomy.

**NEEDS VERIFICATION:** MongoDB course/category/module/lesson records, media links, owners, publish states, and actual learner access cannot be inferred from mock seed data.

## 4. PAYMENTS

### Current records and states

`Payment` in `lib/types.ts` has user, single/array course references, payment type (`course_purchase` or `onsite_registration`), invoice/reference, amount/currency, method, Paystack metadata, verification locking/attempts, review/fraud/refund fields and timestamps. States are `pending`, `processing`, `completed`, `failed`, `refunded`, `expired`, `manual_review`, and legacy-like `success`.

The repository only contains two mock completed payment records; live payment records are **NEEDS VERIFICATION**. The important durable key is `reference`, enforced unique in Mongo where index creation succeeds. Payment lifecycle records are stored in `payment_events` where supported.

### Enrollment/access relationship

- Standard checkout initializes a payment in `app/api/payments/initialize/route.ts`.
- Verified Paystack webhook events mark payment completed and create missing enrollments; they also append the course IDs to `User.enrolledCourses` (`app/api/payments/webhook/route.ts`).
- `app/api/admin/payments/verify/route.ts` repeats this access-grant behavior after admin verification.
- Reconciliation/verification routes can alter payment state (`app/api/payments/reconcile/route.ts`, `app/api/payments/verify/route.ts`).

### Onsite behavior and incorrect-access risks

For an `onsite_registration` payment, both webhook and admin verification load all approved courses and enroll the buyer in all of them (`app/api/payments/webhook/route.ts`, `app/api/admin/payments/verify/route.ts`). This is incompatible with normal technology-academy purchases unless deliberately modeled as an all-access entitlement.

High-risk conditions to validate before changes:

- Access grant is duplicated in webhook and admin verification handlers, creating drift risk.
- Payment has both `courseId` and optional `courseIds`; target rules for carts/bundles are not explicit.
- `User.enrolledCourses` and enrollment records can diverge.
- Routes and mock database may accept legacy `success` alongside `completed`.
- **NEEDS VERIFICATION:** Paystack dashboard webhook URL, event subscriptions, live/reconciliation jobs, refunds, transaction volume, duplicate events, failed/locked/manual-review payments, and whether any production reference reconciliation is required.

## 5. AUTHENTICATION

### Current flow

Registration uses pending registrations, bcrypt password hash, a hash of random six-digit OTP, email delivery through Resend and promotion after OTP verification (`lib/auth.ts`, `app/api/auth/register/route.ts`, `app/api/auth/register-instructor/route.ts`, `app/api/auth/verify-otp/route.ts`). Login creates a JWT and sets an HTTP-only same-site cookie (`app/api/auth/login/route.ts`). It also returns the token, which is persisted in Zustand browser storage (`lib/store.ts`). `components/auth/auth-session-bootstrap.tsx` restores state from `/api/auth/me` using the cookie.

Password reset is initiated by `/api/auth/forgot-password` and completed at `/api/auth/reset-password`; emails are sent from `lib/email.ts`. Bootstrap admin behavior is environment-driven in `lib/auth.ts`, and a separate account-creation script exists at `scripts/create-admin-finance.ts`.

### Authorization flow and privileged routes

`proxy.ts` redirects protected page prefixes when no cookie named `token` is present; it does not verify validity/role. API routes use inconsistent mechanisms: `getTokenFromRequest()` (`lib/jwt.ts`), `authService.getCurrentUser()`, or `authService.decodeToken()`.

Privileged/sensitive route families requiring policy review are:

| API path(s) | Expected privilege / concern |
|---|---|
| `app/api/admin/**` | Admin user creation, logs, settings, campaign, onsite configuration, and manual payment review. |
| `app/api/users/route.ts`, `app/api/users/[id]/route.ts`, `app/api/users/password/route.ts` | User listing, profile/role/status changes, deletion and password management. |
| `app/api/courses/route.ts`, `app/api/courses/[id]/route.ts` | Course creation/edit/delete; **critical:** `POST /api/courses` has no evident auth/role/ownership check. |
| `app/api/courses/[id]/lessons/[lessonId]/{approve,reject}/route.ts` | Admin lesson approval/rejection. |
| `app/api/categories/route.ts`, `app/api/categories/[id]/route.ts` | Taxonomy administration. |
| `app/api/enrollments/**`, `app/api/certificates/route.ts`, `app/api/history/route.ts`, `app/api/activity/route.ts`, `app/api/notes/route.ts` | Learner data/access; validate every user-ID query for object ownership. |
| `app/api/payments/**` | Payment state, verification, reconciliation, webhook and payment detail operations. |
| `app/api/profile/setup/route.ts`, `app/api/onboarding/**` | Profile/onboarding state and event data. |
| `app/api/auth/cleanup-pending-registrations/route.ts` | Maintenance operation protected by role/maintenance secret. |

### Known security gaps

| Severity | Finding | Evidence |
|---|---|---|
| CRITICAL | Unauthenticated course creation accepts body-provided ownership/approval-related data. | `app/api/courses/route.ts` POST handler. |
| HIGH | Known fallback JWT secret permits unsafe deployment if environment secret is absent. | `lib/auth.ts`. |
| HIGH | Bearer JWT is persisted in browser storage despite HTTP-only cookie use, increasing XSS blast radius. | `lib/store.ts`, `components/auth/auth-session-bootstrap.tsx`. |
| HIGH | Proxy/page layout checks are not server-side authorization; API enforcement is inconsistent. | `proxy.ts`, `app/{dashboard,instructor,finance,admin}/layout.tsx`, varied handlers. |
| MEDIUM | No repository evidence of rate limiting, CSRF policy, CSP/security headers, auth lockout, or centralized authorization tests. | `next.config.mjs`, route handlers, `tests/` scope. **NEEDS VERIFICATION** for host/WAF controls. |
| MEDIUM | Sensitive mutation paths sometimes use raw decoded JWT claims instead of a consistent current-user/policy check. | `app/api/**`, `lib/auth.ts`, `lib/jwt.ts`. |

## 6. ROUTES AFFECTED BY THE TRANSFORMATION

All public, identity, learner, commerce, role-console and API routes are affected in some degree. The following exact route trees need an explicit keep/replace/redirect decision:

| Area | Existing path(s) | Transformation effect |
|---|---|---|
| Brand/marketing | `app/(public)/**`, especially `page.tsx`, `about`, `contact`, `faq`, `privacy`, `refund`, `terms` | Rebrand/rewrite content, metadata, support contacts, media and legal language. |
| Legacy campaign | `app/(public)/campaign/promptcare-academy/**` | Replace, archive with redirect, or remove after traffic verification. |
| Catalog | `app/(public)/courses/**`, `app/api/courses/**`, `app/api/categories/**` | Add skills/paths/outcomes; secure publishing; preserve course URLs only with redirect plan. |
| Authentication | `app/(auth)/**`, `app/login-admin/page.tsx`, `app/api/auth/**` | Simplify/secure identity flow; retire caregiver onboarding variants after retention review. |
| Student learning | `app/dashboard/**`, `app/api/enrollments/**`, `app/api/history/**`, `app/api/activity/**`, `app/api/notes/**`, `app/api/certificates/route.ts` | Split learner dashboard/player; replace client-authoritative progress; add paths/assessments/projects. |
| Instructor | `app/instructor/**` | Reorganize curriculum studio, learners, grading, mentoring and analytics; assess legacy duplicate creation/edit routes. |
| Admin | `app/admin/**`, `app/api/admin/**`, `app/api/users/**`, `app/api/categories/**` | Add roles, taxonomy, content review, moderation, audit and governance. |
| Finance/commerce | `app/finance/**`, `app/cart/page.tsx`, `app/checkout/**`, `app/api/payments/**` | Replace course-only/onsite logic with orders, entitlements and target pricing policy. |
| Onsite product | `app/dashboard/onsite-training/**`, `app/admin/onsite-training/page.tsx`, `app/api/onsite-training/route.ts`, `app/api/payments/initialize-onsite/route.ts` | Remove or replace with cohorts/campuses after data/payment reconciliation. |
| Shared access/UI | `app/layout.tsx`, `proxy.ts`, `components/layout/**`, `components/skillup/**`, `components/auth/**`, `lib/role-routing.ts` | Rebrand and introduce server-side policy-controlled role layouts/navigation. |

## 7. EXTERNAL SERVICES

| Service / external endpoint | Repository evidence | Phase 0 status |
|---|---|---|
| MongoDB | `lib/mongodb.ts`, `lib/mongodb-db.ts`, `MONGODB_URI` / `MONGODB_DB` names in `.env.example` | Integration implemented. Cluster, database, backups, users, network controls and production data are **NEEDS VERIFICATION**. |
| Paystack | `lib/paystack.ts`, `app/api/payments/**` | Direct REST initialize/verify/refund use and signature-checked webhook implemented. Dashboard keys, mode, webhook URL/events and financial reconciliation are **NEEDS VERIFICATION**. |
| Resend | `lib/email.ts`, `RESEND_API_KEY` / `RESEND_FROM` names in `.env.example` | Direct email API integration for OTP/welcome/reset/review workflows. Sender-domain verification/deliverability are **NEEDS VERIFICATION**. |
| Vercel | `@vercel/analytics` in `package.json`, root `app/layout.tsx`, `VERCEL_URL` use | Vercel compatibility is implied; `.vercel` is gitignored and no committed project config exists. Project/account/deployment settings are **NEEDS VERIFICATION**. |
| Vercel Analytics | `app/layout.tsx`, `lib/onboarding-analytics.ts` | Client analytics package is used. Actual project linkage, data collection settings and privacy notice are **NEEDS VERIFICATION**. |
| External media | YouTube / YouTube no-cookie embeds in instructor/learner/content pages; Pexels/Unsplash URLs in public/skillup components; arbitrary video/avatar/resource URLs accepted by UI. | No owned upload/storage/CDN integration is present. Media ownership, availability, licensing and access control are **NEEDS VERIFICATION**. |
| Google | Google Forms URL in `lib/campaign-shared.ts`; Google Maps/contact embed in `app/(public)/contact/page.tsx`. | Legacy marketing/contact integrations; replace/remove after business decision. |
| WhatsApp/social | WhatsApp, YouTube, Instagram, Facebook links in `app/(public)/contact/page.tsx`, campaign and footer. | Prompt Care identities/contacts must be replaced or intentionally retained. |

## 8. PRODUCTION / DEPLOYMENT

### What repository evidence supports

- `package.json` supports `npm run dev`, `npm run build`, `npm start`, lint and payment tests.
- `next.config.mjs` uses Turbopack root, does not ignore TypeScript build errors, and sets `images.unoptimized: true`.
- `.gitignore` excludes `.env*` and `.vercel`; no secret values are reported here.
- `app/layout.tsx` uses `NEXT_PUBLIC_APP_URL` or `VERCEL_URL` to construct metadata base URLs.
- `app/api/payments/webhook/route.ts` is the implemented Paystack webhook endpoint; older documentation states a different path (`/api/webhooks/paystack`) in `docs/DEPLOYMENT.md`, so the documentation is stale.
- `app/api/payments/reconcile/route.ts` accepts `PAYMENT_RECONCILE_SECRET` or `CRON_SECRET`; `app/api/auth/cleanup-pending-registrations/route.ts` accepts `AUTH_MAINTENANCE_SECRET` or `CRON_SECRET`. Both imply external scheduling but do not define it.

### Unverified production facts

| Subject | Status |
|---|---|
| Vercel project, team, environments, preview controls and deployment history | **NEEDS VERIFICATION** — no `vercel.json`, CI workflow, or committed deployment project metadata. |
| Domains, DNS, HTTPS, redirects and canonical URL | **NEEDS VERIFICATION** — source has fallback URLs but no domain configuration. |
| Environment variables set per deployment environment | **NEEDS VERIFICATION** — `.env.local` is intentionally not inspected or reported for secret values; `.env.example` is only a template. |
| Scheduled jobs | **NEEDS VERIFICATION** — code supports secret-protected routes but repository contains no cron config, workflow, Vercel schedule, or external scheduler definition. |
| Webhook provider configuration | **NEEDS VERIFICATION** — handler exists but provider dashboard setting cannot be inferred. |
| Backups / disaster recovery | **NEEDS VERIFICATION** — no Mongo backup policy, restore procedure or provider export evidence is committed. |
| CI/CD | **NEEDS VERIFICATION** — no `.github/workflows`, Dockerfile, or other pipeline configuration found in the inspected tree. |

## 9. DATA MIGRATION STRATEGY

1. **Freeze and inventory:** identify production Mongo database(s), collections, document counts, schemas/field frequencies, indexes, roles, active users, published courses, enrollments, certificates, payment statuses and external media. Export only through a controlled, access-logged process. Do not rely on `lib/mock-db.ts` as production truth.
2. **Classify data:** create a field-level retention register with business/legal owners: migrate, transform, archive encrypted, delete, or request new consent. Healthcare/onsite fields must default to do-not-migrate pending decision.
3. **Create target schema alongside legacy:** introduce versioned target collections/fields and repositories; do not destructively mutate `users`, `courses`, payments or enrollments in place initially.
4. **Map identities:** normalize/lowercase email, deduplicate safely, retain stable legacy IDs as `legacyId` only where needed, and choose credential strategy. Prefer an authenticated password reset/migration flow if session/auth design changes.
5. **Map catalog:** migrate only approved, owner-validated technology content. Replace legacy categories with target taxonomy; preserve old slug/URL mappings in a redirect registry. Validate every embedded module/lesson, linked quiz/assignment and media URL.
6. **Reconcile access and finance:** produce a report comparing payment references, completed/success states, course IDs, user `enrolledCourses`, and enrollment records. Create target entitlements/enrollments from verified records; never use an onsite payment to automatically grant all new catalog content.
7. **Migrate credentials/progress carefully:** create certificates only when legacy evidence meets approved criteria; retain raw legacy progress as historical data rather than treating client-entered percentages as new authoritative progress.
8. **Dry run:** execute idempotent migration scripts against a sanitized staging copy. Check record counts, duplicates, orphans, payment totals/references, access samples, redirects, and rollback outcomes.
9. **Cutover:** announce maintenance window; temporarily freeze registrations/catalog/payment fulfillment as necessary; take final backup; run incremental delta; validate critical flows and reconciliation; then route traffic.
10. **Archive and retire:** retain read-only legacy data only for the approved policy window. Delete/rotate deprecated secrets; remove legacy healthcare features only after reconciliation, legal sign-off and traffic/redirect verification.

## 10. BACKUP / ROLLBACK PLAN

### Before any Phase 1 write

1. Obtain named owners and written approval for database, payments, identity, privacy and deployment operations.
2. Record immutable release evidence: current Git commit, dependency lockfile hashes, `package.json`, environment variable *names* by environment, Vercel deployment IDs, configured domains, Paystack webhook URL/events and Resend sender configuration. Do not copy secret values into repositories or tickets.
3. Create a MongoDB point-in-time/consistent backup and independently test restore into isolated staging. Export a restricted, encrypted logical snapshot with collection counts and checksums. **NEEDS VERIFICATION:** Atlas tier/backups and restore capabilities.
4. Export Paystack transaction/reconciliation records and webhook history for the applicable retention period; reconcile to local `payments`/`payment_events` by reference. Preserve finance records under controlled access.
5. Snapshot active public routes, redirect rules, published courses/media URLs, and production configuration. Retain the current deployment as a rollback-capable immutable artifact.
6. Establish a migration ledger recording script version, input snapshot ID/checksum, started/finished timestamp, counts, exceptions, operator and approval.

### Rollback rules

- Use additive, idempotent migrations first; do not rename/drop legacy collections, overwrite payment records, or remove media during cutover.
- Maintain a feature flag or deployment rollback path to the last verified release. **NEEDS VERIFICATION:** whether the deployment host supports this operationally.
- For a failed migration, stop writes, preserve logs/failed record IDs, revert traffic to the known-good deployment, restore only into a new isolated database for analysis, and do not overwrite the original evidence database.
- For payment impact, disable new checkout/fulfillment before rollback and reconcile all references generated during the window. Do not replay webhooks manually without idempotency evidence.
- Define acceptance thresholds before launch: zero missing verified paid entitlements, zero unauthorized access test failures, reconciled payment totals, expected collection counts, and tested restore time objective/recovery point objective.

## 11. FINAL RISK REGISTER

| Severity | Finding | Evidence | Required response |
|---|---|---|---|
| CRITICAL | Unauthenticated course creation could allow arbitrary creation/ownership/publish-related payloads. | `app/api/courses/route.ts` | Fix and regression-test server-side authorization before Phase 1 feature work. |
| CRITICAL | Production data, backup/recovery status, payment reconciliation and deployment configuration are unknown from the repository. | No committed cloud/deployment/backup configuration; only source references. | Verify owners, backups/restores, database/Paystack environments and live reconciliation before any data/schema work. |
| HIGH | JWT has a fallback secret and tokens persist in browser storage. | `lib/auth.ts`, `lib/store.ts`, `components/auth/auth-session-bootstrap.tsx` | Adopt fail-closed cookie-first session policy and force/plan credential/session rotation. |
| HIGH | Authorization is inconsistent and page protection is primarily client/proxy presence based. | `proxy.ts`, role layouts, `app/api/**` | Introduce centralized resource policies and authorization test suite before new roles/features. |
| HIGH | Onsite payment behavior grants every approved course; access grant logic is duplicated. | `app/api/payments/webhook/route.ts`, `app/api/admin/payments/verify/route.ts` | Freeze/understand active behavior, reconcile entitlements, centralize fulfillment before commerce migration. |
| HIGH | Healthcare personal data may be carried into an unrelated academy without retention/consent decision. | `lib/types.ts`, onsite/registration modules | Privacy/legal classification and approved data map are mandatory before migration. |
| MEDIUM | Mock/Mongo divergence, inconsistent fixture references and database-name defaults reduce migration confidence. | `lib/mock-db.ts`, `lib/db.ts`, `lib/mongodb.ts`, `scripts/create-admin-finance.ts` | Make production/staging Mongo-backed; establish fixtures/test strategy and confirm canonical DB name. |
| MEDIUM | Assessment/project/community/path models are absent; existing quiz/assignment representation is incomplete. | `lib/types.ts`, `lib/mongodb-db.ts`, routes | Design models/policies before UI implementation; do not overload existing course blobs blindly. |
| MEDIUM | No committed scheduler/CI/CD/security headers/rate-limit configuration. | `package.json`, `next.config.mjs`, no schedule/pipeline evidence | Define operational ownership, automation and controls in Phase 1. |
| MEDIUM | External media uses arbitrary URLs/YouTube plus third-party images; no signed storage. | instructor/learner content pages, `components/skillup/**`, `app/(public)/**` | Inventory/license media; implement controlled storage/access before private paid submissions/videos. |
| LOW | Legacy/stale documentation conflicts with implementation. | `docs/DEPLOYMENT.md` vs `app/api/payments/webhook/route.ts`; root reports | Consolidate maintained operational docs after verification. |
| LOW | Package-manager ambiguity and floating dependency versions reduce reproducibility. | `package-lock.json`, `pnpm-lock.yaml`, `package.json` `latest` entries | Select one package manager and pin/maintain dependencies in a later controlled change. |

## 12. IMPLEMENTATION BLOCKERS

The following must be resolved before starting Phase 1 implementation:

1. Confirm the canonical production Mongo cluster/database name, environments, access owner, collection inventory, indexes, backup policy, and a successful nonproduction restore test.
2. Confirm Paystack mode/accounts, production webhook endpoint and events, payment reconciliation status, refunds/manual-review backlog, and a safe plan for active payments.
3. Assign privacy/legal ownership and approve a field-level decision for healthcare/onsite user data, payment records, course content, and communications data.
4. Confirm the Vercel/hosting project, domains, deployment ownership, environment-variable governance, scheduler ownership and rollback capability.
5. Fix or formally block on the critical course-creation authorization gap in `app/api/courses/route.ts`; no catalog expansion should proceed while it remains.
6. Approve the target authentication/session strategy and the required migration/forced-reset approach; do not add mentor/community roles to the present scattered authorization model.
7. Agree the commercial model (free/paid courses, bundles, paths, cohorts, subscriptions) and target entitlement semantics before touching payment/enrollment behavior.
8. Decide whether the academy will operate cohorts/onsite locations; this governs retirement versus replacement of `lib/onsite-*` and related routes.
9. Choose media/file-storage, malware scanning, retention and private-access approach before projects or assignment submissions are implemented.
10. Establish a minimum CI/test gate for authorization, payment/webhook and migration reconciliation before schema or route changes.

## PHASE 1 ENTRY CRITERIA

- [ ] Production/staging MongoDB cluster, canonical database name, owners and collection/index inventory have been verified.
- [ ] A current backup exists, checksums/counts are recorded, and restore has been tested in isolated staging.
- [ ] Active user, course, enrollment, certificate and payment inventories are exported/reconciled under approved access controls.
- [ ] Paystack live/test account, webhook URL/events, reconciliation process and active payment/refund/manual-review state are verified.
- [ ] Resend sender/domain, email delivery ownership and target notification requirements are verified.
- [ ] Hosting/Vercel project, production domains, environments, deploy/rollback process and scheduled-job owner are verified.
- [ ] Privacy/legal owner has approved a retention/migration matrix for healthcare and onboarding data.
- [ ] Security owner has accepted a remediation plan for `app/api/courses/route.ts`, JWT fallback, browser token persistence and inconsistent API authorization; the critical course route is fixed before new feature implementation begins.
- [ ] Target identity/session design, role/policy model, commercial/entitlement model and onsite/cohort decision are approved.
- [ ] Migration scripts will be additive/idempotent, have a migration ledger, and have passed a sanitized staging dry run with reconciliation checks.
- [ ] CI or an equivalent controlled test gate covers authentication/authorization, payment webhook/fulfillment and migration reconciliation.
- [ ] A named go/no-go owner has approved the Phase 1 scope, rollback runbook and communication plan.

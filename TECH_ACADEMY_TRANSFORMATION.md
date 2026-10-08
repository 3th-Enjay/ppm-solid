# Technology Academy Transformation Blueprint

## Purpose

Transform the existing Prompt Care Academy LMS into a domain-neutral technology academy for students, without discarding the reusable learning, commerce, and dashboard foundation. This is a target architecture and phased migration plan; it does not implement or change application behavior.

The current application is a Next.js App Router LMS with MongoDB-or-mock persistence, custom JWT authentication, Paystack payments, Resend email, four roles, embedded course curriculum, and responsive role dashboards. See `ARCHITECTURE_AUDIT.md` for evidence and constraints.

## Design Principles

- Separate technology-academy content and policies from the platform core.
- Make every authorization decision server-side and resource-aware.
- Treat a course, a learning path, assessment attempts, projects, and progress events as distinct domain concepts.
- Keep payment fulfillment idempotent and independent of page/UI logic.
- Prefer configuration/content records over hard-coded industry wording, locations, assets, and taxonomies.
- Preserve existing student data only through an explicit data-migration and consent/retention plan.

## 1. LMS CORE

These capabilities should remain domain-independent and form the long-lived platform core.

| Current capability | Current evidence | Decision | Target direction |
|---|---|---|---|
| Identity and sessions | `lib/auth.ts`, `app/api/auth/**` | REPLACE / REFACTOR | Retain account lifecycle concepts but replace custom browser-persisted JWT pattern with a cookie-first session/auth module, centralized policies, rate limits, and audit events. |
| Roles | `UserRole` in `lib/types.ts` | MODIFY | Keep student, instructor, admin, and finance concepts; introduce mentor as a scoped capability/role. |
| Course catalog | `Course`, `Category`, `/api/courses` | MODIFY | Retain course catalog, pricing, publication, ownership and discoverability; introduce technology tracks, skills, outcomes, prerequisites, and tags. |
| Modules and lessons | Embedded `Course.modules[]` | REFACTOR | Keep hierarchy, but make curriculum versionable and able to support many lessons, reordered content, draft/review status, and structured learning materials. |
| Enrollment | `Enrollment`, unique user-course index | KEEP / REFACTOR | Keep enrollment as the source of course access; remove duplicate user course lists over time and record enrollment source/status. |
| Student progress | `completedLessons`, percentage | REPLACE | Preserve progress intent, but derive/record progress from lesson/assessment/project events rather than a client-supplied percentage. |
| Certificates | `Certificate` | MODIFY | Keep issued certificate/verification code; define eligibility rules, immutable certificate snapshot, template/version, and public verification endpoint. |
| Payments | Paystack routes/services | REFACTOR | Keep Paystack where paid courses are sold; one idempotent fulfillment service must grant enrollment after verified payment. |
| Email | `lib/email.ts` | MODIFY | Keep transactional provider abstraction; replace caregiver templates with academy templates and add notification preferences. |
| Admin audit/events | `AdminLog`, payment/onboarding events | KEEP / REFACTOR | Generalize event/audit model to security, content moderation, support, publishing and learning actions. |
| Notes | `LearningNote` | KEEP | Retain private learner notes and associate them with lesson/course/path context. |
| UI primitives and shells | `components/ui/**`, `components/skillup/**` | KEEP / MODIFY | Retain Tailwind/shadcn primitives and responsive role shell; rebrand components and centralize labels/assets. |

## 2. HEALTHCARE-SPECIFIC

The following is explicitly tied to caregiver training or the current organization and should be removed, replaced, or isolated before the technology academy launch.

| Feature / data | Existing evidence | Decision | Replacement / handling |
|---|---|---|---|
| Prompt Care brand, caregiver copy and social links | `app/layout.tsx`, `components/layout/**`, page copy/assets | REPLACE | New academy brand package, metadata, legal identity, editorial content, assets, and social accounts. |
| Healthcare registration details | `StudentRegistrationProfile` in `lib/types.ts` | REMOVE / MIGRATE | Retire healthcare-professional indicator, caregiver fields, healthcare interests, and caregiver consent language. Export/archive only according to the approved privacy/retention policy. |
| Onsite caregiver training | `lib/onsite-*`, `app/dashboard/onsite-training/**`, admin onsite pages | REMOVE or REPLACE | Remove if no physical offering. If a tech bootcamp exists, replace with a separate Cohort/Location/Session domain; do not reuse the current all-course enrollment rule. |
| Enugu/Abuja location and dates | `TrainingLocation`, `lib/student-registration.ts` | REMOVE | Replace only if locations are a real academy requirement, using configurable campuses/cohorts. |
| Caregiver campaign | `app/(public)/campaign/promptcare-academy/**`, `lib/campaign-*` | REPLACE | New campaign/content system or remove campaign subsystem until a product requirement exists. |
| Healthcare course seeds and categories | `lib/mock-db.ts`, existing course content | REMOVE / MIGRATE | Archive historical content; create technology curriculum independently. |
| "Onsite registration buys all courses" | payment/verification handlers | REMOVE | Fulfill only explicitly purchased course, bundle, subscription, or cohort entitlements. |
| Caregiver-oriented profile/about/FAQ/legal copy | public pages and docs | REPLACE | Create student/technology academy policies, accessibility statements, terms, refund rules, and safeguarding/community policy. |

## 3. TECH-ACADEMY-SPECIFIC

### Required capabilities

| Capability | Target behavior |
|---|---|
| Learning paths | Curated, ordered multi-course journeys such as Frontend, Data, Cloud, Product Design, or Cybersecurity. Paths have outcomes, level, skill tags, prerequisites, estimated time, visibility, optional price, and completion rules. |
| Skills and prerequisites | Controlled skill taxonomy; courses/paths declare taught skills and prerequisites. Learners can see readiness and recommended next steps. |
| Mentoring | Mentors can be assigned to cohorts, paths, courses, projects, or students; scope is explicit and does not automatically grant global student access. |
| Quizzes | Versioned question banks, attempts, answers, grading policies, time limits, feedback/review release, and pass criteria. Keep question correctness server-only. |
| Assignments | Lesson or module assignments with instructions, resources, submission requirements, due dates, attempts, grading rubric, feedback and status. |
| Projects | First-class capstones/portfolio projects with briefs, milestones, team option, artifacts/links, mentor review, score/feedback, showcase consent and publish state. |
| Cohorts | Optional timed groups for live/mentor-led programs: start/end, schedule, capacity, mentors, announcements, members, cohort-specific milestones. |
| Announcements | Admin/instructor/mentor scoped broadcasts to platform, path, course, or cohort; delivery/seen state and scheduled publishing. |
| Notifications | In-app notification feed with read state and delivery preferences, plus email for actionable/transactional events. Start without push notifications unless a product requirement validates them. |
| Community | Course/path/cohort discussion threads, replies, reactions, reporting/moderation, and clear conduct policy. Add direct messaging only after abuse-prevention, support, and retention requirements are defined. |
| Portfolio | Opt-in student public profile and project showcases; protect private submissions and provide privacy controls. |
| Career readiness | Optional skill-based profile, resume/portfolio links, learning goal, availability, and verified certificate/project achievements. Do not collect sensitive demographic data unless legally justified. |

## 4. SHARED INFRASTRUCTURE

| Concern | Current state | Recommendation |
|---|---|---|
| Next.js | Next.js 16 App Router | Keep; use Route Handlers or an explicitly chosen backend-for-frontend boundary. |
| Database | MongoDB driver with mock fallback | Use MongoDB in every shared environment; introduce schema validation, migrations/backfills, indexes, backups, and a typed repository interface. Remove mock persistence from deployed runtimes. |
| Authentication | Custom JWT/cookie plus Zustand token persistence | Replace with an auditable, cookie-first session strategy; centralize `requireUser`, `requireRole`, and resource policy checks; add brute-force protection and token/session revocation. |
| Authorization | Inconsistent per-route checks | Implement policy/service layer with role + ownership + scope checks. Never rely on client layouts or proxy cookie presence. |
| Storage | URLs only; no upload provider | Add object storage/CDN, signed direct uploads, malware/type/size checks, private submission access, and lifecycle rules. |
| Payments | Paystack with signed webhook and review flow | Retain provider abstraction; require durable webhook event idempotency, entitlement ledger, reconciliation job, refunds policy, and tested payment state machine. |
| Email | Resend REST calls | Retain or abstract provider; templates/versioning, queue/retry, unsubscribe/preferences where applicable, and delivery observability. |
| Jobs | Secret-protected maintenance endpoints, no committed scheduler | Add a scheduled job mechanism for expired payments, reminders, notification delivery, reporting rollups and cleanup. |
| Observability | Console logging / Vercel Analytics | Add structured logs, error monitoring, audit query tools, health checks, metrics and alerting. |
| Security | No evident global rate/CSP/CSRF policy | Add environment validation, CSP/security headers, rate limiting, CSRF design, secret rotation, dependency scanning and authorization tests. |

## New Domain Model

### Core identity and authorization

```text
User ──< UserRoleAssignment >── Role
User ──1 UserProfile
User ──< Session
User ──< AuditEvent
```

`User` contains identity, status, email verification and minimal account information. `UserProfile` stores learner or professional profile information, with a purpose/consent record for optional fields. Prefer `UserRoleAssignment` over a single role if users can be both instructor and mentor; otherwise retain a single role plus scoped mentor assignments.

### Catalog and curriculum

```text
Category ──< Skill
LearningPath ──< LearningPathCourse >── Course
Course ──< CourseModule ──< Lesson
Course / LearningPath ──< Prerequisite >── Skill or Course
Lesson ──0..1 Quiz | Assignment | ProjectMilestone
```

- `Course`: owner/instructor, title, slug, description, outcomes, level, skill tags, price/entitlement policy, status (`draft`, `in_review`, `published`, `archived`), version.
- `CourseModule` and `Lesson`: own collections if curriculum size/editing/reuse demands it; otherwise retain embedded modules with versioned publishing snapshots. `Lesson` includes type, visibility, duration, resources and free-preview policy.
- `LearningPath`: ordered course links, completion rule, target skills and optional enrollment/price.
- `Skill`: controlled taxonomy, aliases, category and lifecycle state.

### Learning and assessment

```text
User ──< Enrollment >── Course | LearningPath | Cohort
Enrollment ──< ProgressEvent >── Lesson / Assessment / Project
Quiz ──< QuizQuestion
User ──< QuizAttempt >── Quiz
Assignment ──< AssignmentSubmission >── User
Project ──< ProjectSubmission >── User or Team
Project ──< ProjectMilestone
```

`ProgressEvent` is append-oriented (`lesson_started`, `lesson_completed`, `quiz_passed`, `submission_graded`, etc.). A projection stores current course/path progress for fast reads. Quiz correct answers, evaluations, submissions, scores, and instructor feedback must be server-side. Use `Team`/`TeamMember` only if group projects are in scope for launch.

### Commerce and credentials

```text
User ──< Order ──< OrderItem >── Purchasable (Course, Path, Cohort, Bundle)
Order ──< Payment ──< PaymentEvent
User ──< Entitlement >── Purchasable
User ──< Certificate >── Course | LearningPath
```

Make `Entitlement`, not `User.enrolledCourses`, the durable output of successful payment/administrative grant. Enrollment is created from an entitlement when a learning container requires one. Preserve immutable price/currency/tax snapshots on order items.

### Communication and community

```text
Announcement ──< AnnouncementAudience >── Course | Path | Cohort | Platform
User ──< Notification
DiscussionThread ──< DiscussionPost
DiscussionThread ──1 Context (Course | Path | Cohort | Lesson)
DiscussionPost ──< ModerationReport
```

Keep notification delivery/read state separate from announcements. Community features need roles, rate limits, reporting, moderation queues and retention rules before launch.

## New Roles and Permissions

| Role | Permissions |
|---|---|
| Student | Maintain own profile; discover/enroll/purchase eligible offerings; consume entitled content; submit assessments/projects; view own progress/certificates; participate in permitted community spaces; manage preferences. |
| Instructor | Create/manage own courses and curriculum drafts; view enrolled learners for owned courses; create assessments; grade assigned work; publish only through configured review policy; issue scoped announcements. |
| Mentor | View/advise only assigned students, teams, courses, paths, or cohorts; review assigned projects/assignments; post scoped announcements/discussions. No platform-wide user/payment access by default. |
| Content reviewer (optional) | Review curriculum, approve/reject publications, inspect learning content. This may be a capability assigned to admin staff rather than a standalone role. |
| Finance | View payment/order/refund/reconciliation records; act on financial workflows; no unrestricted learner/content administration. |
| Community moderator (optional) | Handle reports, hide/restore content, apply scoped sanctions; no payment or curriculum control by default. |
| Administrator | Manage users, role assignments, taxonomy, catalog governance, configurations, audits and platform reporting. Privileged actions require audit logs. |

Implement permission checks as policies such as `canEditCourse(user, course)`, `canGradeSubmission(user, submission)`, and `canViewStudent(user, student, scope)` rather than role checks scattered through handlers.

## Navigation

### Public

`Home · Explore Courses · Learning Paths · Projects / Showcase · Instructors & Mentors · Community · Pricing · About · Help`

Authenticated public-header actions: `My Learning`, cart (if applicable), notification indicator, profile menu.

### Student dashboard

`Overview · My Learning · Learning Paths · Calendar / Cohorts · Projects · Certificates · Community · Announcements · Payments · Profile & Preferences`

The overview should prioritize “continue learning,” deadlines, mentor feedback, path progress, upcoming sessions and unread announcements—not generic aggregate metrics alone.

### Instructor dashboard

`Overview · My Courses · Curriculum Studio · Learners · Assessments · Projects & Reviews · Cohorts · Announcements · Analytics · Profile`

### Mentor dashboard

`Overview · Assigned Learners · Cohorts · Reviews · Discussions · Availability / Profile`

### Admin dashboard

`Overview · Users & Roles · Catalog · Learning Paths · Curriculum Review · Cohorts · Payments · Community Moderation · Announcements · Analytics · Settings · Audit Log`

Finance remains a least-privilege `Transactions · Reconciliation · Refunds · Reports` workspace.

## New Route Structure

Route groups separate layouts but not authorization; server policy checks remain mandatory.

```text
app/
  (marketing)/
    page.tsx
    courses/[slug]/page.tsx
    paths/[slug]/page.tsx
    showcase/[slug]/page.tsx
    instructors/[slug]/page.tsx
  (auth)/
    login/  register/  verify-email/  forgot-password/  reset-password/
  (learner)/learn/
    page.tsx
    courses/[courseSlug]/page.tsx
    courses/[courseSlug]/lessons/[lessonId]/page.tsx
    paths/[pathSlug]/page.tsx
    projects/[projectId]/page.tsx
    community/[context]/page.tsx
  (console)/
    student/  instructor/  mentor/  admin/  finance/
  checkout/
  api/
    auth/
    catalog/{courses,paths,categories,skills}/
    learning/{enrollments,progress,lessons}/
    assessments/{quizzes,attempts,assignments,submissions,projects}/
    community/{threads,posts,reports}/
    communications/{announcements,notifications}/
    commerce/{orders,payments,webhooks}/
    admin/{users,roles,review,audit,reports}/
```

Use opaque IDs internally. Slugs belong to public catalog routes only. Add public certificate verification at a deliberately scoped route such as `/verify/certificate/[code]` and disclose only intentional fields.

## Recommended Component Structure

```text
components/
  ui/                         # shadcn primitives; domain-free
  design-system/              # tokens, logo, typography, reusable layouts
  catalog/                    # course/path cards, filters, outcome displays
  learning/                   # player, curriculum nav, progress, resources
  assessments/                # quiz runner, submission forms, rubric/review
  projects/                   # briefs, milestones, showcase
  community/                  # discussion, reports, moderation UI
  communications/             # announcement, notification center
  commerce/                   # price, checkout, invoices
  dashboards/                 # shell, shared metrics, role-specific panels
  admin/                      # governance tables/workflows
```

Keep feature-specific components beside their feature when they are not reusable. Avoid a single catch-all `skillup` namespace; design-system and domain names should state ownership. Centralize theme tokens, brand images, navigation definitions, labels and environment-derived URLs.

## Recommended Service Architecture

```text
Route Handler
  -> request validation
  -> requireUser / policy authorization
  -> domain service
  -> repository / provider port
  -> response DTO
```

Suggested services:

- `IdentityService`, `SessionService`, `AuthorizationPolicy`
- `CatalogService`, `CurriculumService`, `PublishingService`, `PathService`
- `EnrollmentService`, `ProgressService`, `CertificateService`
- `AssessmentService`, `SubmissionService`, `ProjectReviewService`
- `OrderService`, `PaymentService`, `EntitlementService`, `WebhookService`
- `AnnouncementService`, `NotificationService`, `CommunityModerationService`
- `StorageService`, `EmailService`, `ReportingService`, `AuditService`

Repositories encapsulate Mongo queries and indexes. Provider ports encapsulate Paystack, Resend, object storage, analytics, and future search. Domain services own transactions/idempotency; UI/API code must not grant access, calculate authoritative scores, or directly update foreign resources.

## Existing Repository Path Disposition

This is a planning inventory. No path in this section should be changed until the relevant migration phase, traffic review, data-retention decision, and regression coverage are complete.

### 1. PRESERVED AS-IS

These paths are reusable foundations and should remain unchanged during the initial branding/content pass. They may receive later dependency/security maintenance, but do not need redesign-driven rewrites.

| Existing path | Why preserve it initially | Guardrail |
|---|---|---|
| `components/ui/**` | The shadcn/Radix primitive layer is domain-neutral: buttons, inputs, dialog, tabs, table-adjacent primitives, toast, sheets and form controls. | Change only through an intentional design-system upgrade; do not fork primitives per academy feature. |
| `components/theme-provider.tsx` | Theme-provider utility is not healthcare-specific. | Preserve if dark-mode strategy remains desired; verify it is actually mounted before relying on it. |
| `hooks/use-toast.ts` | Generic UI feedback hook. | Keep API stable while feature components are migrated. |
| `lib/utils.ts`, `lib/utils/format.ts`, `lib/utils/name.ts` | General-purpose class-name, display/formatting and name utilities. | Consolidate only if duplicate utilities are proven; preserve imports during phased work. |
| `lib/currency.ts`, `lib/price-formatter.ts` | Currency primitives are commerce-domain utilities rather than caregiver-specific behavior. | Confirm target-market currencies/prices before changing product behavior. |
| `lib/paystack.ts` | Provider client includes server-only Paystack calls, amount conversions and webhook-signature validation. | Preserve the cryptographic verification and provider boundary; refactor fulfillment callers separately. |
| `lib/payments/verification.ts` | Payment amount/currency/customer mismatch evaluation is reusable payment safety logic. | Cover with tests before extending orders/bundles/subscriptions. |
| `lib/payments/runtime.ts` | Payment expiry and event-log helpers are reusable. | Retain only as a compatibility layer until the new payment state machine is in place. |
| `components/payments/transaction-detail-view.tsx` | Existing transaction-detail presentation can be reused by the finance workspace. | Remove caregiver labels during visual rebrand, but preserve financial facts/actions. |
| `tests/payments/**` | The only identified automated test scope protects a high-risk workflow. | Expand this suite rather than replacing it without equivalent coverage. |
| `postcss.config.mjs`, `components.json`, `tsconfig.json` | Tooling/configuration for Tailwind, shadcn aliases and strict TypeScript. | Do not alter as part of product repositioning alone. |

### 2. REFACTORED BEFORE REDESIGN

These paths should be secured or structurally improved before new technology-academy functionality is built on them.

| Existing path | Why it must be refactored first | Target direction |
|---|---|---|
| `lib/auth.ts` | Authentication, OTP, reset, environment-admin logic, password rules and JWT handling are concentrated here; it includes a fallback JWT secret. | Split identity/session/reset/verification services; fail closed on missing production secrets; make session lifecycle auditable. |
| `lib/jwt.ts` | Token extraction handles cookie/Bearer parsing but has no policy layer. | Replace direct use with server helpers such as `requireUser`, `requireRole`, and resource-ownership policies. |
| `lib/store.ts` | Auth token and user are persisted in browser storage, while authentication also uses an HTTP-only cookie. | Remove persisted bearer tokens from client storage; keep only non-sensitive UI preferences/cart state. |
| `components/auth/auth-session-bootstrap.tsx` | Restores an auth token into Zustand and reinforces the dual cookie/local-storage auth model. | Rework for cookie-first server/session hydration with a safe, minimal client identity payload. |
| `proxy.ts` | It only checks whether a token cookie exists, not validity, identity or role. | Retain only coarse redirects if desired; make API policy enforcement authoritative and validate session at protected server boundaries. |
| `app/api/courses/route.ts` | `POST` creates courses without an evident authentication/role/ownership check. | Require instructor/admin authorization, derive ownership from session, reserve approval/publish authority, and add tests before catalog expansion. |
| `app/api/courses/[id]/route.ts` and `app/api/courses/[id]/lessons/[lessonId]/{approve,reject}/route.ts` | Course editing/approval is high-value authorization and publishing behavior. | Move to `CurriculumService`/`PublishingService` with ownership, reviewer policy, optimistic/version checks and audit records. |
| `app/api/enrollments/route.ts` and `app/api/enrollments/[id]/progress/route.ts` | Enrollment/progress rules are mixed in route handlers; progress can be client supplied. | Introduce `EnrollmentService` and event-based `ProgressService`; derive progress server-side. |
| `app/dashboard/courses/[courseId]/learn/page.tsx` | Learner UI computes progress and sends complete lesson lists/percentages. | Move authority to server events; keep this path as a presentation layer after redesign. |
| `app/api/payments/webhook/route.ts`, `app/api/payments/verify/route.ts`, `app/api/payments/reconcile/route.ts`, `app/api/admin/payments/verify/route.ts` | Payment verification/access fulfillment is distributed and includes caregiver onsite special cases. | Consolidate payment state transitions and one idempotent `EntitlementService`; retain webhook signature/locks/manual review safety. |
| `lib/onsite-checkout.ts` | Contains checkout behavior specialized for onsite registration. | Replace with general order/checkout orchestration only if onsite offerings remain; otherwise retire after migration. |
| `lib/mongodb.ts`, `lib/mongodb-db.ts`, `lib/mock-db.ts`, `lib/db.ts` | Persistence selection, Mongo conversion and a large duplicated mock/Mongo repository contract are coupled. | Define typed repositories and schema/index migrations; use MongoDB in every shared environment; isolate mock fixtures from runtime. |
| `lib/types.ts` | It mixes user, caregiver profile, catalog, payment, onboarding, assessment placeholders and operational types. | Split by domain (`identity`, `catalog`, `learning`, `assessment`, `commerce`, `communications`); establish explicit DTOs. |
| `lib/email.ts` | Provider call plus templates are coupled; templates include existing brand/domain content. | Keep a provider port, move templates to notification domain, queue/retry and version them. |
| `lib/student-milestones.ts` | Large student milestone logic is tightly coupled to the existing onboarding/onsite model. | Generalize to achievements/progress rules or defer it until target learning objectives are defined. |
| `app/api/users/**`, `app/api/admin/**`, `app/api/profile/setup/route.ts` | User administration/profile APIs require consistent role/scope policy before mentor and moderator roles are added. | Centralize policies and input/output DTOs; add audit coverage for privileged changes. |
| `app/admin/**`, `app/instructor/**`, `app/dashboard/**`, `app/finance/**` | These dashboard trees fetch APIs directly and use client-side role guards with varying patterns. | Refactor behind shared authenticated data-access hooks/BFF endpoints and role-specific dashboard modules before expanding consoles. |

### 3. RENAMED/REORGANIZED

These paths should move only as part of an intentional migration, with imports/routes redirected and legacy URLs measured before removal. The target paths are proposed names, not files to create now.

| Existing path | Proposed target organization | Reason |
|---|---|---|
| `components/skillup/**` | `components/design-system/**`, `components/catalog/**`, `components/dashboards/**`, or `components/learning/**` according to individual component responsibility | `skillup` is a legacy product namespace. For example, move `role-dashboard-shell.tsx` to `components/dashboards/role-dashboard-shell.tsx`, `course-card.tsx` to `components/catalog/course-card.tsx`, and `dashboard-nav.tsx` to `components/dashboards/dashboard-nav.tsx`. |
| `components/layout/public-header.tsx`, `components/layout/public-footer.tsx` | `components/design-system/site-header.tsx`, `components/design-system/site-footer.tsx` | These are global brand/layout components, not a generic feature layout. |
| `components/auth/**` | `features/identity/components/**` or `components/identity/**` | Co-locate registration, protected route and onboarding UI with the identity domain. |
| `components/admin/**` | `features/admin/components/**` | Make governance/admin ownership explicit and reduce top-level component clutter. |
| `components/payments/**` | `features/commerce/components/**` | The target commerce domain includes orders, entitlements and invoices beyond payment transactions. |
| `app/(public)/**` | `app/(marketing)/**` | Reflect public marketing/catalog ownership. Preserve external URLs through explicit routes/redirects, not merely a folder rename. |
| `app/dashboard/**` | `app/(console)/student/**` or `app/(learner)/learn/**`, depending on purpose | Separate student administrative dashboard from immersive course/path learning routes. |
| `app/instructor/**` | `app/(console)/instructor/**` | Consolidate role consoles under one route group/layout strategy. |
| `app/admin/**` | `app/(console)/admin/**` | Same role-console convention. |
| `app/finance/**` | `app/(console)/finance/**` | Same role-console convention and easier shared authorization. |
| `app/api/courses/**`, `app/api/categories/**` | `app/api/catalog/{courses,categories,skills,paths}/**` | The target catalog includes paths and skills; make boundary explicit. |
| `app/api/enrollments/**`, `app/api/history/**`, `app/api/activity/**`, `app/api/notes/**` | `app/api/learning/{enrollments,progress,activity,notes}/**` | Group learner-state resources by domain. |
| `app/api/payments/**` | `app/api/commerce/{orders,payments,webhooks,entitlements}/**` | Make checkout, order and entitlement responsibilities visible. Maintain external webhook compatibility until provider endpoints are updated. |
| `lib/analytics/**`, `lib/onboarding-analytics.ts`, `lib/onboarding-event-log.ts` | `features/analytics/**` and `features/identity/onboarding/**` | Separate product analytics from onboarding workflow/event logging. |
| `lib/utils/course-masking.ts` | `features/learning/access/course-access.ts` | Access control should be policy/service logic, not an anonymous utility. |

### 4. DELETED AFTER VERIFICATION

Deletion is appropriate only after checking production traffic, database records, payment/reconciliation history, marketing/legal requirements, imports, tests, and a defined archive/redirect plan. “After verification” is a gate, not a scheduled action.

| Existing path | Why it is a deletion candidate | Required verification before deletion |
|---|---|---|
| `app/(public)/campaign/promptcare-academy/**` | Prompt Care campaign is organization-specific. | Confirm campaign is inactive, no paid-ad/email links remain, and implement redirects or archival landing page as required. |
| `app/dashboard/onsite-training/**`, `app/admin/onsite-training/page.tsx`, `app/api/onsite-training/route.ts` | Caregiver onsite training workflow is not LMS core. | Decide whether the tech academy offers cohorts/campuses; migrate active registrants/payments and retain financial records before removal. |
| `lib/onsite-training-config.ts`, `lib/onsite-training-shared.ts`, `lib/onsite-checkout.ts`, `lib/student-registration.ts` | Contain onsite caregiver locations, dates, forms and purchase rules. | Complete retention review of submitted profiles/payment references; replace with cohort service if needed; confirm no live route imports remain. |
| `app/(auth)/register-onsite/page.tsx`, `app/(auth)/register-online/page.tsx` | Split registration modes stem from legacy training product. | Confirm target onboarding has a single registration flow or its replacements are live; preserve needed redirects. |
| `app/welcome/student/page.tsx`, `app/welcome/instructor/page.tsx` | May be legacy welcome endpoints distinct from target dashboard onboarding. | Measure links and first-login behavior; retain if a redesigned onboarding uses their URL contract. |
| `app/instructor/create-course/page.tsx`, `app/instructor/edit-course/[courseId]/page.tsx`, `app/instructor/upload/page.tsx` | These appear to overlap newer `app/instructor/courses/new/**` and `app/instructor/courses/[courseId]/**` flows. | Compare functionality, inbound links and analytics; migrate any unique workflow and add redirects before deletion. |
| `lib/mock-db.ts` runtime selection in `lib/db.ts` | In-memory persistence is unsafe for shared/production environments and duplicates database behavior. | Replace with explicit fixtures/test factories; confirm all dev/test workflows have a database strategy. Do not delete until tests run without it. |
| Root reports such as `PROMPTCARE_COMPLETE_BUILD.md`, `BRAND_GUIDELINES.md`, `BRAND_IMPLEMENTATION.md`, `BRAND_SUMMARY.txt`, `DELIVERY_REPORT.txt`, `DELIVERY_SUMMARY.txt`, `FINAL_SUMMARY.md`, `IMPLEMENTATION_COMPLETE.md`, `IMPLEMENTATION_STATUS_SUMMARY.md`, `MD_SUMMARY.md` | Historical delivery/brand artifacts create repository noise and describe the previous product. | Confirm they are not contractual handover records or referenced by automation; archive outside the runtime repository if retention is needed. |
| Root healthcare planning documents such as `campaign.md`, `courses.md`, `courseui.md`, `instructor.md`, `student.md`, `student-profile.md`, `onboarding.md`, `paystack.md`, `video.md` | They may be obsolete specifications for the legacy product. | Owner reviews/document-retention decision; extract any still-valid operational instructions into maintained docs first. |

### 5. NEW FILES/DIRECTORIES TO CREATE

Create these only in the corresponding phase; names are a recommended target layout and may be adjusted to the team’s established conventions.

| Proposed path | Purpose | Phase |
|---|---|---|
| `features/identity/services/session-service.ts` | Session issue/revoke/refresh behavior. | 1 |
| `features/identity/services/identity-service.ts` | Registration, verification, reset and account lifecycle orchestration. | 1 |
| `features/identity/policies/require-user.ts` | Shared authenticated-user guard. | 1 |
| `features/identity/policies/require-role.ts` | Shared role/capability guard. | 1 |
| `features/authorization/policies/*.ts` | Resource policies, e.g. `course-policy.ts`, `submission-policy.ts`, `student-policy.ts`. | 1 |
| `features/audit/audit-service.ts` and `features/audit/audit-repository.ts` | Immutable privileged-action audit logging/querying. | 1 |
| `lib/env.ts` | Typed, fail-fast environment validation; no secret values exposed to clients. | 1 |
| `tests/auth/**`, `tests/authorization/**`, `tests/api/**` | Regression tests for session, ownership, privilege and route behavior. | 1 |
| `features/catalog/{types,schemas,repositories,services,components}/**` | Courses, categories, skills, tags, outcomes and publishing lifecycle. | 2 |
| `features/paths/{types,schemas,repositories,services,components}/**` | Learning path entities, ordered course links, prerequisites and completion. | 2 |
| `components/design-system/**` | Academy tokens, logo, typography, site shell and navigation. | 2 |
| `features/learning/{repositories,services,components}/**` | Enrollment, access checks, lesson delivery, progress events/projections and notes. | 3 |
| `features/storage/storage-service.ts` and `features/storage/provider.ts` | Provider-neutral signed upload/download API for assets and submissions. | 3 |
| `features/assessments/{quizzes,assignments,submissions,grading}/**` | Question bank, attempts, grading, rubrics, feedback and instructor review. | 4 |
| `features/projects/**` | Project briefs, milestones, teams if required, submissions and showcase controls. | 4 |
| `features/credentials/certificate-service.ts` | Server-side certificate eligibility, issuance and public verification. | 4 |
| `features/commerce/{orders,entitlements,payments}/**` | Order/payment models, idempotent fulfillment and Paystack adapter boundary. | 5 |
| `features/cohorts/**` and `features/mentoring/**` | Optional cohort schedules, membership and scoped mentor assignments. | 5 |
| `features/communications/{announcements,notifications}/**` | Announcements, delivery/read state, preferences and email dispatch. | 6 |
| `features/community/{discussions,moderation}/**` | Scoped threads/posts, reporting, sanctions and moderation queue. | 6 |
| `scripts/migrations/**` | Versioned, idempotent data backfills and verification reports. | 2 onward |
| `docs/architecture/**`, `docs/runbooks/{payments,moderation,incidents}.md` | Maintained architecture decisions and operational playbooks replacing ad hoc root reports. | 1 onward |

### Path-Level Sequencing Rules

1. Refactor `lib/auth.ts`, `lib/jwt.ts`, `lib/store.ts`, `proxy.ts`, and sensitive `app/api/**` handlers before reorganizing route folders or adding mentor/community features.
2. Build new feature-domain modules beside existing paths first; migrate callers incrementally; delete only after imports, redirects, data, traffic, and tests verify the cutover.
3. Preserve `app/api/payments/webhook/route.ts` compatibility until the Paystack webhook endpoint is deliberately changed and verified in the provider dashboard.
4. Do not delete `lib/mock-db.ts` until an explicit test fixture/repository strategy replaces it; do not use it in shared environments in the interim.
5. Do not delete caregiver-specific profile, onsite or campaign paths until legal/data-retention and active-payment reconciliation are approved.

## Migration Phases

| Phase | Scope | Deliverables | Depends on |
|---|---|---|---|
| 0. Discovery and safety | Confirm production data, traffic, roles, payment records, legal retention, integrations, host/scheduler. | Data inventory, threat model, backup/rollback plan, acceptance criteria, deprecation decisions. | None. |
| 1. Platform hardening | Fix authorization before product expansion; add environment validation, tests, monitoring, persistent DB-only environments. | Central policy layer, secure session plan, rate limits, payment regression suite, observability baseline. | Phase 0. |
| 2. Brand and catalog foundation | New identity/design tokens; technology taxonomy; course/path metadata and public catalog. | Brand package, categories/skills, migration scripts, catalog UX. | Phase 1; final content strategy. |
| 3. Curriculum and learning | Versioned modules/lessons, storage, enrollment/progress events, learner dashboard. | Course studio, learning player, progress projection, controlled access. | Phase 2; storage decision. |
| 4. Assessment and projects | Quizzes, assignments, submissions, grading, capstones, certificates. | Assessment model, instructor review queues, certificate eligibility service. | Phase 3; rubric/grading policy. |
| 5. Commerce and cohorts | Orders/entitlements, Paystack fulfillment, discounts/bundles if required, cohorts/mentoring. | Idempotent purchase flow, entitlement ledger, cohort/mentor assignments. | Phase 1; pricing/refund/legal decisions. |
| 6. Communication/community | Announcements, notifications, scoped discussions/moderation. | Notification center, community policy, report/moderation queue, operational playbook. | Phase 1 and 3; support/moderation staffing. |
| 7. Cutover and retirement | Migrate data/content, redirect routes, archive healthcare features, validate live operations. | Reconciliation reports, redirects, archival evidence, launch checklist, post-launch review. | All applicable prior phases. |

## Dependencies Between Phases

```text
Discovery / retention decisions
          |
          v
Security + data platform hardening
   |              |                 \
   v              v                  v
Brand/catalog   Storage + learning   Commerce model
   |              |                  |
   v              v                  v
Curriculum ----> assessments       cohorts/mentoring
   |                 |                  |
   +-----------------+------------------+
                     v
         announcements / community / launch cutover
```

- Do not migrate healthcare profile data before privacy, retention, and consent decisions.
- Do not build community/direct messaging before moderation processes, policies, and operational ownership exist.
- Do not launch paid paths/bundles before entitlement/order semantics replace the current all-course onsite rule.
- Do not issue certificates from client percentage alone; assessment/progress eligibility must be authoritative first.
- Brand changes can precede data migration, but API authorization hardening should precede any public growth campaign.

## Key Risks and Mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Existing authorization gaps | Unauthorized course/content/payment access can compromise the new launch. | Security review, policy middleware/services, ownership tests, external penetration test before public launch. |
| Data loss / corruption | Existing mock fallback and duplicate enrollment fields complicate migration. | Backups, staging dry runs, reconciliation, idempotent scripts, read-only legacy archive, tested rollback. |
| Privacy exposure | Healthcare-related personal data may be sensitive and unnecessary for the academy. | Data minimization, legal review, retention/deletion schedule, access audit, explicit migration communications. |
| Payment entitlement errors | Current flow has special onsite all-course behavior and multiple access-grant paths. | One fulfillment service, payment event idempotency, transaction/reconciliation tests, manual-review runbook. |
| Scope explosion | Paths, projects, mentors, cohorts, community and portfolios are separate products. | Launch an MVP: catalog, courses, learning, enrollment, payments, quizzes/submissions; phase community and advanced cohort tooling. |
| Community abuse/support burden | Forums and messaging require active moderation and safeguards. | Scoped discussions first, report tools, conduct rules, rate limits, moderator training and escalation process. |
| Media cost/performance | Video and submissions require storage, delivery and lifecycle management. | Provider selection, signed URLs, quotas, CDN, transcoding/streaming approach, retention rules. |
| Content quality | Technology curriculum ages quickly and needs credible learning outcomes. | Curriculum governance, instructor contracts, review calendar, versioning, learner feedback loop. |

## Recommended MVP Boundary

Launch first with students, instructors, administrators, technology courses, modules/lessons, controlled enrollment, verifiable payments where relevant, progress, quizzes, assignment submission, certificates, announcements, and basic instructor/admin analytics. Include learning paths only if their completion/prerequisite behavior is fully specified.

Defer mentor matching, cohort scheduling, team projects, public portfolios, broad community features, direct messaging, subscriptions, marketplace features, and advanced recommendations until the core access/progress/assessment/payment model is proven.

## Decisions Required Before Implementation

1. Is the academy self-paced only, cohort-based, or both?
2. Which offerings are paid: individual courses, paths, cohorts, subscriptions, bundles, or free?
3. Are mentors distinct from instructors, and what learner data may they access?
4. What assessment model and certificate criteria are credible for each program?
5. What provider and retention policy will govern video, files, project artifacts, and learner submissions?
6. What existing user/content/payment data must be migrated, archived, deleted, or retained by law/contract?
7. What moderation/support capacity exists before community spaces launch?

No application code is modified by this blueprint.

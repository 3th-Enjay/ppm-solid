# STAGE 1.5 — DATABASE MIGRATION & POSTGRESQL FOUNDATION

## 1. Executive summary

This repository is still an active MongoDB-backed LMS with a working server-side auth/authorization baseline established in Phase 1. The migration work here is intentionally conservative:

- keep the current MongoDB source of truth intact
- inventory the real schema and collections in the codebase
- lay down a PostgreSQL + Drizzle foundation that preserves the existing domain model
- avoid any automatic production cutover
- keep the Phase 1 security behavior intact: HTTP-only cookie authentication, server-side authorization, and ownership checks remain the source of truth

This is a foundation phase, not a redesign. The application is not switched to PostgreSQL automatically, and the live production MongoDB deployment remains the rollback path until a controlled validation and cutover is approved.

## 2. Repository evidence and current architecture

The actual implementation confirms the following runtime behavior:

- `lib/db.ts` selects MongoDB when `MONGODB_URI` exists and otherwise falls back to the in-memory mock database in `lib/mock-db.ts`
- `lib/mongodb.ts` connects to the MongoDB driver and creates a few important indexes lazily
- `lib/mongodb-db.ts` implements the repository API across users, registrations, categories, courses, enrollments, payments, payment events, certificates, quizzes, assignments, notes, admin logs, and onboarding events
- `lib/types.ts` defines the current domain objects and the healthcare-specific profile fields that must be preserved for migration safety
- Phase 1 security work preserved a server-side authorization model in `lib/authorization.ts` and requires the database migration to remain behaviorally neutral from a security perspective

## 3. MongoDB inventory discovered from the repo

The repository code shows the following collections and their intended purposes:

- `users` — account data, roles, OTP info, onboarding state, student/instructor profile, enrolled course IDs
- `pending_registrations` — OTP verification flow before account promotion
- `categories` — course taxonomy records
- `courses` — course catalog rows with embedded modules and lessons
- `course_modules` — logical modules represented as nested documents in the current model; future relational design should split them into their own table
- `lessons` — embedded item-level lesson content; relational design will own these separately
- `enrollments` — learner/course access and progress
- `payments` — payment records and verification state
- `payment_events` — payment lifecycle events and webhook history
- `certificates` — completion documents for successful learners
- `quizzes` — quiz definitions and question sets
- `quiz_questions` — represented as nested questions within quiz documents in the current model
- `assignments` — assignment definitions
- `learning_notes` — user-owned study notes
- `admin_logs` — privileged audit records
- `onboarding_events` — onboarding analytics/activity events

The repository explicitly shows the following important unique/index fields:

- `payments.reference` unique
- `enrollments.userId + courseId` unique
- `payment_events.reference + createdAt`
- `pending_registrations.email` unique

Important note: the current implementation is not a clean relational schema; the course and payment systems still rely on denormalized or embedded data. This migration doc treats the embedded structures as the compatibility boundary and converts them into a PostgreSQL relational model without changing the application logic.

## 4. Data ownership and relationship map

### User

User records are the root identity entity. They own:

- auth fields
- OTP fields
- onboarding state
- profile data
- enrolled courses
- notes
- certificates
- payment records

### Course

Current course records embed:

- modules
- lessons
- category as a string label
- instructor metadata and ownership
- approval and publish flags

### Enrollment

Enrollment is the learner access source of truth at runtime, while `User.enrolledCourses` is a denormalized mirror. This migration preserves both the relational table and the historical duplicate representation while documenting the authoritative path.

### Payment

Payments are linked to users and course or onsite access, with review, reconciliation, and webhook history flows in the app. Because financial history is sensitive and mission-critical, the migration keeps payment rows and payment events intact and records any mismatch instead of guessing.

## 5. Denormalization identified in the repo

The actual repo shows several denormalized patterns that must be documented carefully:

- `User.enrolledCourses` vs `enrollments` collection
  - source of truth: runtime access is effectively implemented through enrollments and grant logic, while `enrolledCourses` is a convenience/duplicate field
  - risk: these can diverge
  - migration strategy: keep the relational `enrollments` table authoritative and report mismatches

- `Course.category` string vs `categories` collection
  - source of truth: the catalog currently uses a string category field, with a category collection available for listing and admin management
  - risk: category names can drift
  - migration strategy: move to `course_categories`/`categories` with a stable category id while retaining the legacy category label where needed

- `Course` instructor metadata duplication
  - source of truth: `instructorId` is authoritative, while instructor fields on the course are local denormalized copies
  - risk: stale display info
  - migration strategy: keep the relational user reference and preserve the snapshot fields for compatibility

- payment + enrollment + user course access duplication
  - risk: access can be granted in multiple places, including payment verification and webhook code paths
  - migration strategy: preserve all historical data and reconcile before any cutover

## 6. PostgreSQL design principles for Stage 1.5

This migration preserves the Phase 1 security baseline and therefore does not redesign the application behavior. The PostgreSQL schema intentionally follows the existing domain but adds relational boundaries:

- users remain the identity root
- courses remain course-owned records
- enrollments remain the learner access join table
- payments remain the financial record root
- payment events remain append-only history
- lessons/modules remain separate relational tables
- quizzes and assignment definitions retain their historical structure without introducing a future assessment engine

The design keeps `legacy_mongo_id` fields on each core table so migration rows remain traceable to the original MongoDB objects. This is required for audit, rollback analysis, and production reconciliation.

## 7. PostgreSQL schema foundation

The project now includes a first-pass Drizzle schema foundation under the `db/schema` directory. It is intentionally conservative and built to support the actual MongoDB inventory rather than a future redesigned academy model.

The current PostgreSQL schema includes the following logical tables:

- `users`
- `pending_registrations`
- `categories`
- `courses`
- `course_modules`
- `lessons`
- `enrollments`
- `payments`
- `payment_events`
- `certificates`
- `quizzes`
- `quiz_questions`
- `assignments`
- `learning_notes`
- `admin_logs`
- `onboarding_events`

This is a foundation only; future assessment tables are not introduced here.

## 8. Key schema rules

### Primary keys and IDs

The schema preserves legacy traceability via:

- `id`: stable application identifier
- `legacy_mongo_id`: original Mongo document id

This avoids silent ID loss and preserves an audit trail back to the MongoDB source.

### Constraints

The schema uses the key relational integrity rules required by the current repository:

- unique user emails
- unique pending registration emails
- unique payment reference
- unique enrollment (user + course)
- foreign keys for user/course/payment references
- no destructive deletes during migration

### Indexes

The PostgreSQL design recreates the important MongoDB indexes and adds relational query support:

- `payments.reference`
- `enrollments.user_id + course_id`
- `payment_events.reference + created_at`
- `pending_registrations.email`
- `courses.slug`
- `courses.instructor_id`
- `courses.category_id`

## 9. Migration strategy and safety rules

The migration process is intentionally explicit and safe:

1. read from MongoDB only
2. validate source records and counts
3. dry run before any execute path
4. write to PostgreSQL only via explicit migration invocation
5. preserve all MongoDB data without destructive operations
6. never auto-switch the app to PostgreSQL in this phase
7. produce reconciliation output instead of silently guessing at data conflicts

The migration script is intentionally designed to fail closed if the required environment variables are not configured.

## 10. Current migration assets added in this repo

The following Phase 1.5 scaffolding has been added to the repository:

- `drizzle.config.ts` — PostgreSQL + Drizzle configuration
- `db/schema/index.ts` — schema exports
- `db/schema/core.ts` — relational core schema for the current domain
- `scripts/migrate-mongodb-to-postgres.ts` — dry-run/execute migration orchestrator skeleton
- `tests/database/migration.test.ts` — migration validation tests for inventory and count reconciliation logic

These files are foundation scaffolding for a controlled migration workflow and do not change the production app behavior.

## 11. Production status

This repo currently shows:

- Production MongoDB modified: NO
- Production PostgreSQL created: NEEDS VERIFICATION
- Production application switched: NO
- Production cutover: NOT COMPLETE

This phase intentionally does not assume a cutover or a production database configuration.

## 12. Rollback and next steps

Rollback remains simple and safe because MongoDB remains untouched until the migration is approved:

- do not delete or rewrite live MongoDB records
- keep PostgreSQL in staging or validation-only mode until checks pass
- if validation fails, continue using MongoDB
- if a cutover ever occurs, restore the prior MongoDB-backed app and compare the PostgreSQL data with the original data set before re-enabled writes

The next step after this foundation is a live validation run against a real MongoDB backup and a test PostgreSQL instance. Only when counts, relationships, and payment/access reconciliations pass should any production cutover be considered.

## 13. Phase 1 security baseline preserved

This migration does not change the Phase 1 authorization model:

- server-side authentication remains the authority
- the HTTP-only cookie is still the real session boundary
- admin and ownership checks remain server-side
- the migration does not add client-driven trust or route-level bypasses
- the migration is not a technology-academy redesign or commerce rewrite

## 14. Phase 2 readiness

Status: NOT READY FOR PHASE 2

Reason: the repository has a PostgreSQL foundation and migration tooling scaffold, but a production migration still requires real validation against production data and a verified PostgreSQL environment. The app must complete dry-run validation, relationship reconciliation, payment reconciliation, and cutover approval before Phase 2 should proceed.

## 15. Future architecture note

This PostgreSQL foundation is the correct base for future learning, assessment, commerce, and administration phases. It does not implement those future tables now; it establishes the relational foundation required for the next phases without introducing Phase 2/3 redesigns prematurely.

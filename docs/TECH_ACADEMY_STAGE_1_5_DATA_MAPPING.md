# Stage 1.5A — Relational Inventory and MongoDB → PostgreSQL Mapping

## Executive summary

This document is the authoritative inventory and mapping specification for the MongoDB-to-PostgreSQL migration foundation created in Stage 1.5. It is intentionally documentation-first and operationally safe.

The repository remains MongoDB-backed at runtime and is not switched to PostgreSQL in this phase. The purpose of this document is to define the exact mapping contract that the eventual migration executor, dry-run validation, and reconciliation logic must honor.

This mapping is based on actual repository evidence in:

- `ARCHITECTURE_AUDIT.md`
- `TECH_ACADEMY_TRANSFORMATION.md`
- `docs/TECH_ACADEMY_PHASE_0.md`
- `docs/TECH_ACADEMY_PHASE_1_SECURITY.md`
- `TECH_ACADEMY_STAGE_1_5_DATABASE_MIGRATION.md`
- `lib/types.ts`
- `lib/mongodb-db.ts`
- `lib/mongodb.ts`
- `lib/db.ts`
- `db/schema/core.ts`

Important boundary: this is a safe mapping specification only. No production MongoDB writes, no destructive migration, and no database cutover are performed here.

---

## 1. MongoDB inventory discovered from the repository

### 1.1 Collections currently referenced by the app

| Collection | Source | Model / schema | Current role | Migration treatment |
|---|---|---|---|---|
| `users` | `lib/mongodb-db.ts`, `lib/types.ts` | `User` | Core identity and profile records | Required, populated source |
| `pending_registrations` | `lib/mongodb-db.ts`, `lib/auth.ts` | `PendingRegistration` | OTP registration pre-verification records | Confirmed empty source collection; `blocking = false` |
| `categories` | `lib/mongodb-db.ts`, `lib/types.ts` | `Category` | Course taxonomy | Required, populated source |
| `courses` | `lib/mongodb-db.ts`, `lib/types.ts` | `Course` | Catalog record with embedded modules/lessons | Required, populated source |
| `enrollments` | `lib/mongodb-db.ts`, `lib/types.ts` | `Enrollment` | Learner access, progress, completion | Confirmed empty source collection; `blocking = false` |
| `payments` | `lib/mongodb-db.ts`, `lib/types.ts` | `Payment` | Marketplace payments and verification state | Required, populated source |
| `payment_events` | `lib/mongodb-db.ts`, `lib/types.ts` | `PaymentEvent` | Payment lifecycle audit log | Required, populated source |
| `certificates` | `lib/mongodb-db.ts`, `lib/types.ts` | `Certificate` | Completion proof | Not present in authoritative Mongo source; no persisted data to migrate |
| `quizzes` | `lib/mongodb-db.ts`, `lib/types.ts` | `Quiz` | Definition of quiz structure | Not present in authoritative Mongo source; no persisted data to migrate |
| `assignments` | `lib/mongodb-db.ts`, `lib/types.ts` | `Assignment` | Assignment definition and settings | Not present in authoritative Mongo source; no persisted data to migrate |
| `learning_notes` | `lib/mongodb-db.ts`, `lib/types.ts` | `LearningNote` | Student notes | Actual Mongo persistence uses `notes`; this collection is not a migration source |
| `admin_logs` | `lib/mongodb-db.ts`, `lib/types.ts` | `AdminLog` | Privileged audit log | Required, populated source |
| `onboarding_events` | `lib/mongodb-db.ts`, `lib/types.ts` | `OnboardingEvent` | Onboarding analytics event stream | Required, populated source |
| `app_settings` | `lib/admin-settings.ts`, `lib/campaign-config.ts` | runtime configuration | admin/campaign settings persisted in Mongo | Out of scope for PostgreSQL migration; `blocking = false` |

### 1.2 Additional repo-derived evidence

The repository also references the following behaviors and document-level collection assumptions:

- `MONGODB_DB` default is `Prompt Care Academy` in `lib/mongodb.ts`, while `scripts/create-admin-finance.ts` defaults to `learnhub`
- the code contains explicit Mongo indexes on `payments`, `enrollments`, `payment_events`, and `pending_registrations`
- `lib/mock-db.ts` contains non-production mock data that is not authoritative production MongoDB data
- `lib/mongodb-db.ts` converts `ObjectId` fields to string IDs for application use, while the actual Mongo documents retain `_id`

### 1.3 Collection detail inventory

#### `users`

Source: `lib/types.ts`, `lib/mongodb-db.ts`

Fields and repository-derived meaning:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | `string` | Yes | Application-facing identifier |
| `email` | `string` | Yes | Unique identity key in the app |
| `password` | `string` | Yes | Password hash; must never be exposed in migration reports |
| `name` | `string` | Yes | Display name |
| `role` | `"student" | "instructor" | "admin" | "finance"` | Yes | Role enum |
| `avatar` | `string?` | No | Optional user image |
| `bio` | `string?` | No | Optional profile text |
| `status` | `"active" | "suspended"?` | No | Account status |
| `emailVerified` | `boolean?` | No | Verification state |
| `onboardingState` | `UserOnboardingState?` | No | Onboarding metadata |
| `studentMilestones` | `StudentMilestone[]?` | No | Milestone progress |
| `otpHash` | `string?` | No | OTP hash used in auth flow |
| `otpExpiresAt` | `Date?` | No | OTP expiry time |
| `studentProfile` | `StudentRegistrationProfile?` | No | Healthcare-specific registration profile |
| `instructorProfile` | `InstructorProfile?` | No | Instructor profile data |
| `enrolledCourses` | `string[]` | Yes | Denormalized course access mirror |
| `createdAt` | `Date` | Yes | Creation timestamp |
| `updatedAt` | `Date` | Yes | Update timestamp |

Indexes / constraints / risks:

- email is effectively the unique identity field in the app
- `otpHash` and `password` are sensitive and must not be exposed in any public reporting
- `enrolledCourses` is denormalized and can drift from `enrollments`
- `studentProfile` includes healthcare-specific fields such as `isHealthcareProfessional`, `currentRoleOrField`, `trainingInterest`, `preferredLocation`, `registrationFeeNgn` and payment agreement fields

#### `pending_registrations`

Source: `lib/auth.ts`, `lib/mongodb-db.ts`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | `string` | Yes | Local ID |
| `email` | `string` | Yes | One active registration per email |
| `password` | `string` | Yes | bcrypt hash |
| `name` | `string` | Yes | Name before approval |
| `role` | `UserRole` | Yes | user role |
| `avatar` | `string?` | No | optional |
| `bio` | `string?` | No | optional |
| `otpHash` | `string` | Yes | OTP hash |
| `otpExpiresAt` | `Date` | Yes | OTP expiry |
| `studentProfile` | `StudentRegistrationProfile?` | No | registration detail |
| `instructorProfile` | `InstructorProfile?` | No | instructor detail |
| `createdAt` | `Date` | Yes | created |
| `updatedAt` | `Date` | Yes | updated |

This table is a pre-verification staging record. It should be preserved only if the app still needs a registration backlog or migration traceability. It may also be intentionally ignored after the auth system is retired.

#### `categories`

Source: `lib/types.ts`, `lib/mongodb-db.ts`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | `string` | Yes | category id |
| `name` | `string` | Yes | category label |
| `createdAt` | `Date` | Yes | created |
| `updatedAt` | `Date` | Yes | updated |

The application currently keeps category as a string on `Course`. This is denormalized and should be normalized in PostgreSQL to a relational category reference where possible.

#### `courses`

Source: `lib/types.ts`, `lib/mongodb-db.ts`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | `string` | Yes | course id |
| `title` | `string` | Yes | title |
| `slug` | `string` | Yes | unique catalog slug |
| `description` | `string` | Yes | summary |
| `overview` | `string[]?` | No | course overview points |
| `category` | `string` | Yes | denormalized category string |
| `level` | `CourseLevel` | Yes | `Beginner Courses`, etc. |
| `instructorId` | `string` | Yes | owner id |
| `instructorName` | `string?` | No | denormalized snapshot |
| `instructorAvatar` | `string?` | No | denormalized snapshot |
| `instructorBio` | `string?` | No | denormalized snapshot |
| `instructorHeadline` | `string?` | No | denormalized snapshot |
| `instructorYearsOfExperience` | `number?` | No | denormalized snapshot |
| `instructorSpecialties` | `string[]?` | No | denormalized snapshot |
| `price` | `{ NGN, USD, EUR, GBP }` | Yes | embedded pricing object |
| `thumbnail` | `string` | Yes | media url |
| `published` | `boolean` | Yes | publish state |
| `approved` | `boolean` | Yes | approval state |
| `modules` | `CourseModule[]` | Yes | embedded nested modules |
| `totalDuration` | `number` | Yes | in minutes |
| `enrollmentCount` | `number` | Yes | denormalized count |
| `rating` | `number` | Yes | static rating |
| `createdAt` | `Date` | Yes | created |
| `updatedAt` | `Date` | Yes | updated |

Important denormalized data:

- `category` is stored as a string rather than a FK
- `instructor*` display metadata is duplicated on course data
- `modules[]` is embedded and should be normalized to `course_modules` + `lessons` in PostgreSQL

#### `CourseModule` and lessons

Current course lessons are embedded. The repository’s type indicates the following nested structure:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | `string` | Yes | module id |
| `title` | `string` | Yes | module heading |
| `order` | `number` | Yes | ordering |
| `lessons` | `Lesson[]` | Yes | nested lesson list |

Lesson:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | `string` | Yes | lesson id |
| `title` | `string` | Yes | title |
| `type` | `"video" | "article" | "quiz" | "assignment"` | Yes | content type |
| `order` | `number` | Yes | ordering |
| `duration` | `number?` | No | minutes |
| `content.videoUrl` | `string?` | No | video source |
| `content.rejectionNote` | `string?` | No | server-side rejection note |
| `content.articleContent` | `string?` | No | article text |
| `content.quizId` | `string?` | No | quiz reference |
| `content.assignmentId` | `string?` | No | assignment reference |
| `content.assignment` | `LessonAssignmentDetails?` | No | embedded assignment payload |
| `content.resources` | `LessonAssignmentResource[]?` | No | lesson resources |
| `isFree` | `boolean` | Yes | preview access |
| `approved` | `boolean?` | No | approval state |
| `pendingApproval` | `boolean?` | No | workflow state |

#### `quizzes`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | `string` | Yes | quiz id |
| `title` | `string` | Yes | quiz name |
| `questions` | `QuizQuestion[]` | Yes | question set |
| `passingScore` | `number` | Yes | minimum score |
| `timeLimit` | `number?` | No | minutes |

Question:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | `string` | Yes | question id |
| `question` | `string` | Yes | question content |
| `options` | `string[]` | Yes | answers |
| `correctAnswer` | `number` | Yes | index-based answer |
| `explanation` | `string?` | No | answer explanation |

#### `assignments`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | `string` | Yes | assignment id |
| `title` | `string` | Yes | assignment heading |
| `description` | `string` | Yes | assignment description |
| `dueDate` | `Date?` | No | due date |
| `maxScore` | `number` | Yes | scoring limit |

This is the current persisted assessment foundation. There are no quiz attempts, answers, assignment submissions, rubrics, or grading data in this app layer.

#### `enrollments`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | `string` | Yes | enrollment id |
| `userId` | `string` | Yes | user reference |
| `courseId` | `string` | Yes | course reference |
| `progress` | `number` | Yes | 0-100 |
| `completedLessons` | `string[]` | Yes | lesson ids |
| `status` | `"active" | "completed" | "expired"` | Yes | completion state |
| `currentLesson` | `string?` | No | current lesson |
| `enrolledAt` | `Date` | Yes | enrollment timestamp |
| `completedAt` | `Date?` | No | completion timestamp |

Important: this table is the strongest source for learner access; `User.enrolledCourses` is a denormalized duplicate.

#### `payments`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | `string` | Yes | payment id |
| `userId` | `string` | Yes | buyer |
| `paymentType` | `PaymentType?` | No | `course_purchase` or `onsite_registration` |
| `courseId` | `string` | Yes | primary course |
| `courseIds` | `string[]?` | No | optional bundled courses |
| `invoiceNumber` | `string?` | No | invoice id |
| `amount` | `number` | Yes | amount |
| `currency` | `Currency` | Yes | NGN/USD/EUR/GBP |
| `status` | `PaymentStatus` | Yes | payment lifecycle state |
| `reference` | `string` | Yes | key reference |
| `paymentMethod` | `string` | Yes | gateway / method |
| `transactionId` | `string?` | No | gateway transaction id |
| `gatewayStatus` | `string?` | No | provider status |
| `gatewayMessage` | `string?` | No | provider message |
| `gatewayChannel` | `string?` | No | payment channel |
| `gatewayFee` | `number?` | No | provider fee |
| `customerEmail` | `string?` | No | customer email |
| `customerCode` | `string?` | No | provider customer code |
| `verificationAttempts` | `number?` | No | verification retry count |
| `verificationLocked` | `boolean?` | No | verification lock |
| `verificationLockToken` | `string?` | No | lock token |
| `verificationLockExpiresAt` | `Date?` | No | lock expiry |
| `lastVerificationAt` | `Date?` | No | verification timestamp |
| `manualReviewReason` | `string?` | No | review explanation |
| `manualReviewSource` | `PaymentReviewSource?` | No | review source |
| `manualReviewCreatedAt` | `Date?` | No | review opened |
| `manualReviewUpdatedAt` | `Date?` | No | last review update |
| `fraudFlagged` | `boolean?` | No | fraud flag |
| `fraudReason` | `string?` | No | fraud reason |
| `fraudFlaggedAt` | `Date?` | No | fraud timestamp |
| `fraudFlaggedBy` | `string?` | No | actor |
| `reviewedBy` | `string?` | No | reviewer |
| `reviewedAt` | `Date?` | No | review timestamp |
| `reviewNote` | `string?` | No | review comments |
| `paidAt` | `Date?` | No | paid timestamp |
| `refundReason` | `string?` | No | refund reason |
| `refundedBy` | `string?` | No | refund actor |
| `refundedAt` | `Date?` | No | refund timestamp |
| `createdAt` | `Date` | Yes | created |
| `completedAt` | `Date?` | No | completed date |

This is a highly sensitive financial record set and should not be silently interpreted or repaired during migration.

#### `payment_events`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | `string` | Yes | event id |
| `reference` | `string` | Yes | payment reference |
| `paymentId` | `string?` | No | optional payment reference |
| `type` | `PaymentEventType` | Yes | initialize/webhook/verify/reconcile/manual_review |
| `source` | `string` | Yes | origin/source string |
| `status` | `string?` | No | status value |
| `message` | `string?` | No | event payload message |
| `metadata` | `Record<string, unknown>?` | No | event payload |
| `createdAt` | `Date` | Yes | event time |

#### `certificates`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | `string` | Yes | certificate id |
| `userId` | `string` | Yes | learner |
| `courseId` | `string` | Yes | associated course |
| `certificateUrl` | `string` | Yes | certificate asset url |
| `issuedAt` | `Date` | Yes | issue date |
| `verificationCode` | `string` | Yes | certificate verification key |

#### `learning_notes`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | `string` | Yes | note id |
| `userId` | `string` | Yes | owner |
| `content` | `string` | Yes | note body |
| `courseId` | `string?` | No | optional course association |
| `createdAt` | `Date` | Yes | created |
| `updatedAt` | `Date` | Yes | updated |

#### `admin_logs`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | `string` | Yes | log id |
| `actorId` | `string` | Yes | admin actor |
| `actorName` | `string` | Yes | actor name |
| `actorEmail` | `string` | Yes | actor email |
| `action` | `"create_user" | "update_password" | "other"` | Yes | action type |
| `targetUserId` | `string?` | No | target user |
| `targetName` | `string?` | No | target name |
| `targetEmail` | `string?` | No | target email |
| `targetRole` | `UserRole?` | No | target role |
| `createdAt` | `Date` | Yes | created |

#### `onboarding_events`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | `string` | Yes | event id |
| `name` | `string` | Yes | event name |
| `role` | `UserRole?` | No | user role |
| `mode` | `string?` | No | mode |
| `source` | `string?` | No | source |
| `step` | `string?` | No | step name |
| `stepIndex` | `number?` | No | step index |
| `status` | `string?` | No | event status |
| `reference` | `string?` | No | external reference |
| `metadata` | `Record<string, unknown>?` | No | event payload |
| `createdAt` | `Date` | Yes | creation time |

---

## 2. PostgreSQL inventory

The Stage 1.5 Drizzle schema defines the following PostgreSQL objects:

| PostgreSQL table | Primary key | Key purpose |
|---|---|---|
| `users` | `id` | identity root |
| `pending_registrations` | `id` | pre-verification account staging |
| `categories` | `id` | taxonomy |
| `courses` | `id` | catalog root |
| `course_modules` | `id` | module container |
| `lessons` | `id` | course lesson content |
| `enrollments` | `id` | enrollment history and access |
| `payments` | `id` | financial records |
| `payment_events` | `id` | financial event stream |
| `certificates` | `id` | issued completion proof |
| `quizzes` | `id` | quiz definitions |
| `quiz_questions` | `id` | question definitions |
| `assignments` | `id` | assignment definitions |
| `learning_notes` | `id` | student notes |
| `admin_logs` | `id` | admin activity |
| `onboarding_events` | `id` | onboarding analytics |
| `migration_audit` | `id` | migration ledger placeholder |
| `table_relationships` | composite PK | mapping metadata placeholder |

### 2.1 Important PostgreSQL-level notes

- every table includes `legacy_mongo_id` to preserve source identity
- `users.email`, `pending_registrations.email`, `courses.slug`, and payment reference fields are protected by uniqueness constraints
- relational edges are implemented with PostgreSQL FK references rather than embedding nested documents
- JSONB is used where the repository currently stores document-like or dynamic content: `student_profile`, `instructor_profile`, `overview`, `content`, `metadata`, `event_data`, etc.
- The schema intentionally does not introduce future assessment engine tables such as quiz attempts, assessment submissions, or rubric tables

---

## 3. Field-by-field mapping tables

### 3.1 `users`

| MongoDB field | PostgreSQL field | Transformation required | Reason |
|---|---|---|---|
| `users._id` | `users.legacy_mongo_id` | Yes | Preserve raw Mongo `_id` |
| `users.id` | `users.id` | No | Keep string application id |
| `users.email` | `users.email` | No | direct mapping |
| `users.password` | `users.password` | No | preserve bcrypt hash |
| `users.name` | `users.name` | No | direct mapping |
| `users.role` | `users.role` | No | enum mapping |
| `users.avatar` | `users.avatar` | No | direct mapping |
| `users.bio` | `users.bio` | No | direct mapping |
| `users.status` | `users.status` | No | direct mapping |
| `users.emailVerified` | `users.email_verified` | Yes | property->column rename |
| `users.onboardingState` | `users.onboarding_state` | DECISION REQUIRED | currently not in PostgreSQL; store as JSONB or child table if needed |
| `users.studentMilestones` | `users.student_milestones` | DECISION REQUIRED | currently not in PostgreSQL; could be JSONB or dedicated table |
| `users.otpHash` | `users.otp_hash` | Yes | property->column rename |
| `users.otpExpiresAt` | `users.otp_expires_at` | Yes | date mapping |
| `users.studentProfile` | `users.student_profile` | Yes | JSONB |
| `users.instructorProfile` | `users.instructor_profile` | Yes | JSONB |
| `users.enrolledCourses` | `users.enrolled_courses` | Yes | JSONB array conversion |
| `users.createdAt` | `users.created_at` | Yes | date mapping |
| `users.updatedAt` | `users.updated_at` | Yes | date mapping |

Notes:

- `onboardingState` and `studentMilestones` are not yet represented in the current PostgreSQL core schema and therefore require either a dedicated child table or a controlled JSONB representation.
- `password` and `otpHash` remain sensitive and must not appear in migration reports.

### 3.2 `pending_registrations`

| MongoDB field | PostgreSQL field | Transformation required | Reason |
|---|---|---|---|
| `pending_registrations._id` | `pending_registrations.legacy_mongo_id` | Yes | preserve Mongo id |
| `pending_registrations.id` | `pending_registrations.id` | No | direct mapping |
| `pending_registrations.email` | `pending_registrations.email` | No | direct mapping |
| `pending_registrations.password` | `pending_registrations.password` | No | preserve hash |
| `pending_registrations.name` | `pending_registrations.name` | No | direct mapping |
| `pending_registrations.role` | `pending_registrations.role` | No | enum |
| `pending_registrations.avatar` | `pending_registrations.avatar` | No | direct mapping |
| `pending_registrations.bio` | `pending_registrations.bio` | No | direct mapping |
| `pending_registrations.otpHash` | `pending_registrations.otp_hash` | Yes | property->column rename |
| `pending_registrations.otpExpiresAt` | `pending_registrations.otp_expires_at` | Yes | timestamp mapping |
| `pending_registrations.studentProfile` | `pending_registrations.student_profile` | Yes | JSONB |
| `pending_registrations.instructorProfile` | `pending_registrations.instructor_profile` | Yes | JSONB |
| `pending_registrations.createdAt` | `pending_registrations.created_at` | Yes | date mapping |
| `pending_registrations.updatedAt` | `pending_registrations.updated_at` | Yes | date mapping |

### 3.3 `categories`

| MongoDB field | PostgreSQL field | Transformation required | Reason |
|---|---|---|---|
| `categories._id` | `categories.legacy_mongo_id` | Yes | preserve Mongo id |
| `categories.id` | `categories.id` | No | direct mapping |
| `categories.name` | `categories.name` | No | direct mapping |
| `categories.createdAt` | `categories.created_at` | Yes | date mapping |
| `categories.updatedAt` | `categories.updated_at` | Yes | date mapping |

### 3.4 `courses`

| MongoDB field | PostgreSQL field | Transformation required | Reason |
|---|---|---|---|
| `courses._id` | `courses.legacy_mongo_id` | Yes | preserve Mongo id |
| `courses.id` | `courses.id` | No | direct mapping |
| `courses.title` | `courses.title` | No | direct mapping |
| `courses.slug` | `courses.slug` | No | preserved unique key |
| `courses.description` | `courses.description` | No | direct mapping |
| `courses.overview` | `courses.overview` | No | JSONB array |
| `courses.category` | `courses.category` | Yes | preserve as text while category normalization is pending |
| `courses.level` | `courses.level` | No | direct mapping |
| `courses.instructorId` | `courses.instructor_id` | Yes | FK to users |
| `courses.instructorName` | `courses.instructor_name` | Yes | denormalized snapshot |
| `courses.instructorAvatar` | `courses.instructor_avatar` | Yes | denormalized snapshot |
| `courses.instructorBio` | `courses.instructor_bio` | Yes | denormalized snapshot |
| `courses.instructorHeadline` | `courses.instructor_headline` | Yes | denormalized snapshot |
| `courses.instructorYearsOfExperience` | `courses.instructor_years_of_experience` | Yes | numeric mapping |
| `courses.instructorSpecialties` | `courses.instructor_specialties` | Yes | JSONB array |
| `courses.price.NGN` | `courses.price_ngn` | Yes | embedded object flattening |
| `courses.price.USD` | `courses.price_usd` | Yes | embedded object flattening |
| `courses.price.EUR` | `courses.price_eur` | Yes | embedded object flattening |
| `courses.price.GBP` | `courses.price_gbp` | Yes | embedded object flattening |
| `courses.thumbnail` | `courses.thumbnail` | No | direct mapping |
| `courses.published` | `courses.published` | No | direct mapping |
| `courses.approved` | `courses.approved` | No | direct mapping |
| `courses.modules` | `course_modules` + `lessons` | Yes | embedded document normalization |
| `courses.totalDuration` | `courses.total_duration` | Yes | number mapping |
| `courses.enrollmentCount` | `courses.enrollment_count` | Yes | numeric mapping |
| `courses.rating` | `courses.rating` | Yes | numeric mapping |
| `courses.createdAt` | `courses.created_at` | Yes | date mapping |
| `courses.updatedAt` | `courses.updated_at` | Yes | date mapping |

### 3.5 `course_modules` and `lessons`

| MongoDB field | PostgreSQL field | Transformation required | Reason |
|---|---|---|---|
| `courses.modules[].id` | `course_modules.id` | Yes | module identity |
| `courses.modules[].title` | `course_modules.title` | Yes | module title |
| `courses.modules[].order` | `course_modules.order` | Yes | ordering |
| `courses.modules[].lessons[]` | `lessons` | Yes | normalization to relational table |
| `courses.modules[].lessons[].id` | `lessons.id` | Yes | lesson identity |
| `courses.modules[].lessons[].title` | `lessons.title` | Yes | lesson title |
| `courses.modules[].lessons[].type` | `lessons.type` | Yes | enum mapping |
| `courses.modules[].lessons[].order` | `lessons.order` | Yes | ordering |
| `courses.modules[].lessons[].duration` | `lessons.duration` | Yes | numeric mapping |
| `courses.modules[].lessons[].content.videoUrl` | `lessons.content -> videoUrl` | Yes | JSONB nested field |
| `courses.modules[].lessons[].content.rejectionNote` | `lessons.content -> rejectionNote` | Yes | JSONB nested field |
| `courses.modules[].lessons[].content.articleContent` | `lessons.content -> articleContent` | Yes | JSONB nested field |
| `courses.modules[].lessons[].content.quizId` | `lessons.content -> quizId` | Yes | JSONB nested field |
| `courses.modules[].lessons[].content.assignmentId` | `lessons.content -> assignmentId` | Yes | JSONB nested field |
| `courses.modules[].lessons[].content.assignment` | `lessons.content -> assignment` | Yes | JSONB nested field |
| `courses.modules[].lessons[].content.resources` | `lessons.content -> resources` | Yes | JSONB nested field |
| `courses.modules[].lessons[].isFree` | `lessons.is_free` | Yes | property rename |
| `courses.modules[].lessons[].approved` | `lessons.approved` | Yes | direct mapping |
| `courses.modules[].lessons[].pendingApproval` | `lessons.pending_approval` | Yes | direct mapping |

### 3.6 `quizzes` and `quiz_questions`

| MongoDB field | PostgreSQL field | Transformation required | Reason |
|---|---|---|---|
| `quizzes._id` | `quizzes.legacy_mongo_id` | Yes | preserve Mongo id |
| `quizzes.id` | `quizzes.id` | No | direct mapping |
| `quizzes.title` | `quizzes.title` | No | direct mapping |
| `quizzes.questions` | `quiz_questions` | Yes | relational flattening |
| `quizzes.questions[].id` | `quiz_questions.id` | Yes | direct mapping |
| `quizzes.questions[].question` | `quiz_questions.question` | No | direct mapping |
| `quizzes.questions[].options` | `quiz_questions.options` | Yes | JSONB array |
| `quizzes.questions[].correctAnswer` | `quiz_questions.correct_answer` | Yes | property rename |
| `quizzes.questions[].explanation` | `quiz_questions.explanation` | No | direct mapping |
| `quizzes.passingScore` | `quizzes.passing_score` | Yes | property rename |
| `quizzes.timeLimit` | `quizzes.time_limit` | Yes | property rename |

Important: correct-answer fields remain sensitive content data. They must not be exposed in public-facing APIs.

### 3.7 `assignments`

| MongoDB field | PostgreSQL field | Transformation required | Reason |
|---|---|---|---|
| `assignments._id` | `assignments.legacy_mongo_id` | Yes | preserve Mongo id |
| `assignments.id` | `assignments.id` | No | direct mapping |
| `assignments.title` | `assignments.title` | No | direct mapping |
| `assignments.description` | `assignments.description` | No | direct mapping |
| `assignments.dueDate` | `assignments.due_date` | Yes | date mapping |
| `assignments.maxScore` | `assignments.max_score` | Yes | numeric mapping |

### 3.8 `enrollments`

| MongoDB field | PostgreSQL field | Transformation required | Reason |
|---|---|---|---|
| `enrollments._id` | `enrollments.legacy_mongo_id` | Yes | preserve Mongo id |
| `enrollments.id` | `enrollments.id` | No | direct mapping |
| `enrollments.userId` | `enrollments.user_id` | Yes | FK to users |
| `enrollments.courseId` | `enrollments.course_id` | Yes | FK to courses |
| `enrollments.progress` | `enrollments.progress` | No | direct mapping |
| `enrollments.completedLessons` | `enrollments.completed_lessons` | Yes | JSONB array |
| `enrollments.status` | `enrollments.status` | No | direct mapping |
| `enrollments.currentLesson` | `enrollments.current_lesson` | Yes | direct mapping |
| `enrollments.enrolledAt` | `enrollments.enrolled_at` | Yes | timestamp mapping |
| `enrollments.completedAt` | `enrollments.completed_at` | Yes | timestamp mapping |

Important reconciliation rule:

- `users.enrolledCourses` is denormalized and should be treated as a derived mirror
- the authoritative access representation in PostgreSQL becomes `enrollments`
- any mismatch between `users.enrolledCourses` and `enrollments` must be reported, not silently resolved

### 3.9 `payments`

| MongoDB field | PostgreSQL field | Transformation required | Reason |
|---|---|---|---|
| `payments._id` | `payments.legacy_mongo_id` | Yes | preserve Mongo id |
| `payments.id` | `payments.id` | No | direct mapping |
| `payments.userId` | `payments.user_id` | Yes | FK to users |
| `payments.paymentType` | `payments.payment_type` | Yes | direct mapping |
| `payments.courseId` | `payments.course_id` | Yes | nullable course ref |
| `payments.courseIds` | `payments.course_ids` | Yes | JSONB array |
| `payments.invoiceNumber` | `payments.invoice_number` | DECISION REQUIRED | current schema does not include this field |
| `payments.amount` | `payments.amount` | No | direct mapping |
| `payments.currency` | `payments.currency` | No | direct mapping |
| `payments.status` | `payments.status` | No | enum mapping |
| `payments.reference` | `payments.reference` | No | unique key |
| `payments.paymentMethod` | `payments.method` | Yes | rename to match schema |
| `payments.transactionId` | `payments.transaction_id` | DECISION REQUIRED | not in current schema |
| `payments.gatewayStatus` | `payments.gateway_status` | DECISION REQUIRED | not in current schema |
| `payments.gatewayMessage` | `payments.gateway_message` | DECISION REQUIRED | not in current schema |
| `payments.gatewayChannel` | `payments.gateway_channel` | DECISION REQUIRED | not in current schema |
| `payments.gatewayFee` | `payments.gateway_fee` | DECISION REQUIRED | not in current schema |
| `payments.customerEmail` | `payments.customer_email` | DECISION REQUIRED | not in current schema |
| `payments.customerCode` | `payments.customer_code` | DECISION REQUIRED | not in current schema |
| `payments.verificationAttempts` | `payments.verification_attempts` | DECISION REQUIRED | not in schema |
| `payments.verificationLocked` | `payments.verification_lock` | Yes | boolean rename |
| `payments.verificationLockToken` | `payments.verification_lock_token` | DECISION REQUIRED | not in schema |
| `payments.verificationLockExpiresAt` | `payments.verification_lock_expires_at` | Yes | timestamp |
| `payments.lastVerificationAt` | `payments.last_verification_at` | DECISION REQUIRED | not in schema |
| `payments.manualReviewReason` | `payments.manual_review_reason` | DECISION REQUIRED | not in schema |
| `payments.manualReviewSource` | `payments.manual_review_source` | DECISION REQUIRED | not in schema |
| `payments.manualReviewCreatedAt` | `payments.manual_review_created_at` | DECISION REQUIRED | not in schema |
| `payments.manualReviewUpdatedAt` | `payments.manual_review_updated_at` | DECISION REQUIRED | not in schema |
| `payments.fraudFlagged` | `payments.fraud_flagged` | DECISION REQUIRED | not in schema |
| `payments.fraudReason` | `payments.fraud_reason` | DECISION REQUIRED | not in schema |
| `payments.fraudFlaggedAt` | `payments.fraud_flagged_at` | DECISION REQUIRED | not in schema |
| `payments.fraudFlaggedBy` | `payments.fraud_flagged_by` | DECISION REQUIRED | not in schema |
| `payments.reviewedBy` | `payments.reviewed_by` | DECISION REQUIRED | not in schema |
| `payments.reviewedAt` | `payments.reviewed_at` | DECISION REQUIRED | not in schema |
| `payments.reviewNote` | `payments.review_note` | DECISION REQUIRED | not in schema |
| `payments.paidAt` | `payments.paid_at` | DECISION REQUIRED | not in schema |
| `payments.refundReason` | `payments.refund_reason` | DECISION REQUIRED | not in schema |
| `payments.refundedBy` | `payments.refunded_by` | DECISION REQUIRED | not in schema |
| `payments.refundedAt` | `payments.refunded_at` | DECISION REQUIRED | not in schema |
| `payments.createdAt` | `payments.created_at` | Yes | direct mapping |
| `payments.completedAt` | `payments.completed_at` | DECISION REQUIRED | nullable timestamp in source but not strongly represented in schema |

Important: the current PostgreSQL mapping is intentionally partial; some financial fields exist on the application model but not yet in the Drizzle schema. These are `DECISION REQUIRED` and should remain explicit pending review.

### 3.10 `payment_events`

| MongoDB field | PostgreSQL field | Transformation required | Reason |
|---|---|---|---|
| `payment_events._id` | `payment_events.legacy_mongo_id` | Yes | preserve Mongo id |
| `payment_events.id` | `payment_events.id` | No | direct mapping |
| `payment_events.reference` | `payment_events.reference` | No | direct mapping |
| `payment_events.paymentId` | `payment_events.payment_id` | Yes | FK to payments |
| `payment_events.type` | `payment_events.event_type` | Yes | property rename |
| `payment_events.source` | `payment_events.source` | NOT MIGRATED | current `payment_events` table does not include `source` column |
| `payment_events.status` | `payment_events.status` | NOT MIGRATED | not included in schema |
| `payment_events.message` | `payment_events.message` | NOT MIGRATED | not included in schema |
| `payment_events.metadata` | `payment_events.event_data` | Yes | normalization |
| `payment_events.createdAt` | `payment_events.created_at` | Yes | date mapping |

### 3.11 `certificates`

| MongoDB field | PostgreSQL field | Transformation required | Reason |
|---|---|---|---|
| `certificates._id` | `certificates.legacy_mongo_id` | Yes | preserve Mongo id |
| `certificates.id` | `certificates.id` | No | direct mapping |
| `certificates.userId` | `certificates.user_id` | Yes | FK to users |
| `certificates.courseId` | `certificates.course_id` | Yes | FK to courses |
| `certificates.certificateUrl` | `certificates.certificate_url` | Yes | property rename |
| `certificates.issuedAt` | `certificates.issued_at` | Yes | date mapping |
| `certificates.verificationCode` | `certificates.verification_code` | Yes | property rename |

### 3.12 `learning_notes`

| MongoDB field | PostgreSQL field | Transformation required | Reason |
|---|---|---|---|
| `learning_notes._id` | `learning_notes.legacy_mongo_id` | Yes | preserve Mongo id |
| `learning_notes.id` | `learning_notes.id` | No | direct mapping |
| `learning_notes.userId` | `learning_notes.user_id` | Yes | FK to users |
| `learning_notes.content` | `learning_notes.content` | No | direct mapping |
| `learning_notes.courseId` | `learning_notes.course_id` | Yes | optional FK to courses |
| `learning_notes.createdAt` | `learning_notes.created_at` | Yes | date mapping |
| `learning_notes.updatedAt` | `learning_notes.updated_at` | Yes | date mapping |

### 3.13 `admin_logs`

| MongoDB field | PostgreSQL field | Transformation required | Reason |
|---|---|---|---|
| `admin_logs._id` | `admin_logs.legacy_mongo_id` | Yes | preserve Mongo id |
| `admin_logs.id` | `admin_logs.id` | No | direct mapping |
| `admin_logs.actorId` | `admin_logs.actor_id` | Yes | direct mapping |
| `admin_logs.actorName` | `admin_logs.actor_name` | NOT MIGRATED | not in schema |
| `admin_logs.actorEmail` | `admin_logs.actor_email` | NOT MIGRATED | not in schema |
| `admin_logs.action` | `admin_logs.action` | No | direct mapping |
| `admin_logs.targetUserId` | `admin_logs.user_id` | DECISION REQUIRED | ambiguous between `user_id` and actor/target semantics |
| `admin_logs.targetName` | `admin_logs.details` | DECISION REQUIRED | could live in JSONB details |
| `admin_logs.targetEmail` | `admin_logs.details` | DECISION REQUIRED | could live in JSONB details |
| `admin_logs.targetRole` | `admin_logs.details` | DECISION REQUIRED | could live in JSONB details |
| `admin_logs.createdAt` | `admin_logs.created_at` | Yes | date mapping |

### 3.14 `onboarding_events`

| MongoDB field | PostgreSQL field | Transformation required | Reason |
|---|---|---|---|
| `onboarding_events._id` | `onboarding_events.legacy_mongo_id` | Yes | preserve Mongo id |
| `onboarding_events.id` | `onboarding_events.id` | No | direct mapping |
| `onboarding_events.name` | `onboarding_events.event` | Yes | property rename |
| `onboarding_events.role` | `onboarding_events.user_id` | DECISION REQUIRED | not a direct mapping; role may exist in details |
| `onboarding_events.mode` | `onboarding_events.data` | Yes | JSONB payload |
| `onboarding_events.source` | `onboarding_events.data` | Yes | JSONB payload |
| `onboarding_events.step` | `onboarding_events.data` | Yes | JSONB payload |
| `onboarding_events.stepIndex` | `onboarding_events.data` | Yes | JSONB payload |
| `onboarding_events.status` | `onboarding_events.data` | Yes | JSONB payload |
| `onboarding_events.reference` | `onboarding_events.data` | Yes | JSONB payload |
| `onboarding_events.metadata` | `onboarding_events.data` | Yes | JSONB payload |
| `onboarding_events.createdAt` | `onboarding_events.created_at` | Yes | date mapping |

---

## 4. ID strategy

### 4.1 Primary key strategy

The current Stage 1.5 design uses PostgreSQL text IDs, not UUIDs. The rationale is compatibility and minimal runtime churn in a Next.js app that already uses string IDs from Mongo documents and mock data.

The design includes:

- `id`: canonical PostgreSQL primary key as text
- `legacy_mongo_id`: raw Mongo `_id` preserved as text for traceability

This preserves the ability to answer the key audit question:

- Mongo document → PostgreSQL record

### 4.2 Relationship strategy

Relationships should be mapped through PostgreSQL foreign keys in the standard app layer. For example:

- `enrollments.user_id -> users.id`
- `enrollments.course_id -> courses.id`
- `payments.user_id -> users.id`
- `certificates.user_id -> users.id`
- `coureses.instructor_id -> users.id`

The migration executor must maintain a lookup table or deterministic mapping contract so that every record can be traced back to its source Mongo object.

This is mandatory for rollback, validation, and financial reconciliation.

### 4.3 Legacy map requirement

The migration executor must preserve a deterministic mapping of:

- `mongo_collection`
- `mongo_document_id`
- `target_table`
- `target_record_id`
- `status`
- `migration_time`
- `reconciliation_status`

This requirement is captured in the Stage 1.5 foundation as `migration_audit` and the concept of a migration ledger.

---

## 5. Users mapping details

The user model is the highest-risk identity dataset because it contains authentication fields and relationship data.

### 5.1 Fields requiring special care

- `password` — preserve hash only; no plaintext or migration report exposure
- `otpHash` — preserve only if the auth flow continues across the migration; otherwise treat as legacy temporary auth data and mark for review
- `studentProfile` — contains healthcare-specific fields that must not be silently dropped
- `enrolledCourses` — duplicates `enrollments` and must be treated as a denormalized mirror
- `role` — must map cleanly to supported PostgreSQL enum values

### 5.2 Privacy and healthcare-specific user fields

The repository contains the following values under `studentProfile` and related user data:

- `trainingMode`
- `phoneNumber`
- `whatsappNumber`
- `gender`
- `dateOfBirth`
- `currentAddress`
- `isHealthcareProfessional`
- `currentRoleOrField`
- `preferredLocation`
- `preferredLocationStartDate`
- `trainingInterest`
- `registrationFeeNgn`
- `paymentStatus`
- `paymentReference`
- `paymentLink`
- `agreedSlotSecured`
- `agreedDetailsCorrect`
- `submittedAt`

These are not disposable. They must be preserved as part of migration even though they may warrant a privacy/legal review before a later data-retention policy is applied.

### 5.3 User uniqueness / duplicate rules

The migration executor must enforce:

- one canonical user per email without silently deleting duplicates
- role normalization for any legacy data inconsistencies
- no duplicate user records by email where the app still treats email as the identity key

If duplicates are found in real MongoDB data, they should be reported as `needs_review` instead of merged without explicit business approval.

---

## 6. Courses and learning content mapping

### 6.1 Category mapping

Current Mongo model: `Course.category` is a string and the repo also contains a `categories` collection.

PostgreSQL decision:

- `courses.category` is preserved as a text field for compatibility
- a normalized `category_id` relationship may be added later once taxonomy governance is approved
- the migration should preserve the raw category label and a mapping to the category collection where available

### 6.2 Course and instructor ownership

Current source:

- `Course.instructorId` is the authoritative owner reference
- `Course.instructorName`, `instructorAvatar`, etc. are denormalized display fields

Target:

- `courses.instructor_id -> users.id`
- snapshot fields remain on `courses` for compatibility

This avoids breaking existing course render flows while still enabling a relational owner relationship.

### 6.3 Modules and lessons

This must be normalized into:

- `course_modules`
- `lessons`

The embedded structure in Mongo is currently the real expected runtime shape, so the migration should preserve that nested data relationally without changing app logic.

### 6.4 Pricing and metadata

The current price field is embedded as a literal object:

- `NGN`
- `USD`
- `EUR`
- `GBP`

This is flattened in the Postgres schema into individual numeric columns.

### 6.5 Approval and publishing state

Current Mongo fields:

- `courses.published`
- `courses.approved`
- `lessons.approved`
- `lessons.pendingApproval`

These remain as explicit state fields in the target schema. The migration should preserve them exactly; no business rule should be implicitly changed during the DB move.

---

## 7. Quizzes and assignments mapping

This mapping intentionally does not create the future assessment engine. It only preserves the current assessment data already persisted in Mongo.

### 7.1 Quiz mapping

Current persisted data:

- quiz record
- question list
- options array
- correct answer index
- explanation
- passing score
- time limit

PostgreSQL mapping:

- `quizzes` table stores the quiz shell
- `quiz_questions` stores each question

Important:

- correct-answer data is sensitive content data and must not be exposed through student-facing endpoints
- do not create `quiz_attempts` or answer history in Stage 1.5A

### 7.2 Assignment mapping

Current persisted data:

- assignment title
- description
- due date
- max score

No submission, grading, or rubric records are present in the repository evidence, so Stage 1.5A does not create them.

---

## 8. Enrollments and access mapping

The repository clearly contains two access representations:

1. `User.enrolledCourses` — denormalized array on the user record
2. `enrollments` collection — canonical learner/course relationship

Field and policy mapping:

| Source | Target | Authoritative status |
|---|---|---|
| `users.enrolledCourses` | `users.enrolled_courses` | Derived mirror |
| `enrollments` | `enrollments` | Authoritative access record |
| payment-derived access grants | `enrollments` + payment state | Derived by workflow, not by raw data alone |

### 8.1 Reconciliation rule

The migration executor must detect and report any mismatch between:

- user enrollments in `users.enrolledCourses`
- actual enrollment rows in `enrollments`

The app’s runtime behavior is to grant access based on payment + enrollment workflow, and therefore `enrollments` is the authoritative source for PostgreSQL access checks.

### 8.2 Ambiguous cases

If a user has a course ID in `enrolledCourses` but there is no matching `enrollments` row, the migration must report a reconciliation issue and not silently make the user eligible.

---

## 9. Payments mapping

### 9.1 Payment data and business meaning

The repository’s payment model is a financial and access-grant record. It carries:

- buyer (`userId`)
- course(s)
- payment type
- reference
- amount/currency
- provider metadata
- verification/review status
- refund state

This must be preserved exactly, without renormalizing away the historical state.

### 9.2 Payment event mapping

The `payment_events` collection is append-only lifecycle history. It must survive migration without deduplication unless the source itself proves duplicates.

### 9.3 Financial-phase boundaries

The app’s current flow already hints at a later Phase 7 architecture:

`Payment -> Order -> Entitlement -> Enrollment -> Access`

This mapping document does not implement that architecture yet. It only preserves the existing payment data and records the business semantics needed for later normalization.

### 9.4 Payment-specific constraints

The Stage 1.5 Drizzle schema already tracks the following critical constraints:

- `payments.reference` unique
- `payment_events.reference + created_at` index
- `payment.user_id` relationship to `users`

This is the minimum integrity layer for the current system.

---

## 10. Certificates

Certificates are direct completion proof. The source fields are a clean fit for relational storage.

| MongoDB field | PostgreSQL field |
|---|---|
| `certificates.userId` | `certificates.user_id` |
| `certificates.courseId` | `certificates.course_id` |
| `certificates.certificateUrl` | `certificates.certificate_url` |
| `certificates.issuedAt` | `certificates.issued_at` |
| `certificates.verificationCode` | `certificates.verification_code` |

This mapping is straightforward and should be preserved exactly.

---

## 11. Notes, admin audit, and onboarding events

### 11.1 Learning notes

These are user-owned content associated with a course when present. They remain a simple relational table.

### 11.2 Admin logs

These are less cleanly modeled in the current Postgres schema because some data lives in `details` JSONB while other fields are dropped. This is a deliberate placeholder and should be reviewed before canonical migration execution.

### 11.3 Onboarding events

These are event-stream-style metadata. The schema stores them in `event` plus `data` JSONB, which is a sensible normalization for the current repository shape.

---

## 12. Healthcare-specific data inventory

The repository has healthcare-specific data in the user/student registration model and in some UI/config content. The following are known retained legacy fields:

- `isHealthcareProfessional`
- `currentRoleOrField`
- `trainingInterest`
- `preferredLocation`
- `preferredLocationStartDate`
- `trainingMode`
- `paymentStatus`
- `paymentReference`
- `agreedSlotSecured`
- `agreedDetailsCorrect`
- `paymentLink`
- `registrationFeeNgn`

### Classification

| Field / content | Classification | Reason |
|---|---|---|
| `studentProfile` fields | RETAIN | They are already part of live user data and may be legally meaningful |
| `onsite-training` configuration | RETAIN (temporarily) | It is part of operational flow and may remain relevant |
| healthcare campaign copy | ARCHIVE / REBRAND | May be legacy marketing content not core to product logic |
| payment sub-objects tied to registration | RETAIN | Financial and operational audit trail must not be silently lost |
| legacy professional background information | REQUIRES PRIVACY / LEGAL REVIEW | may need explicit retention or purge policy |
| temporary OTP flows | ARCHIVE AFTER AUTH RETIREMENT | these should not be kept as active auth metadata |

No healthcare data is deleted in this mapping phase.

---

## 13. Orphans and invalid data

The repository itself can validate only the code structure and schema intent, not real production MongoDB integrity. The following categories should be treated as possible raw-data issues during migration execution.

### 13.1 Repository-verifiable issues

These are issues that can be inferred from repo structure or mock data, but not proven against real production data:

- orphan user profiles without matching enrollment rows
- stale `enrolledCourses` vs `enrollments`
- category string without a real category record
- course owner not found in users
- lesson references that point to missing quizzes or assignments
- payment records with no corresponding payment event history
- certificate records not connected to a completed enrollment

### 13.2 Real-database-only checks

The following require live MongoDB access and therefore remain `REQUIRES REAL DATABASE QUERY`:

- missing user documents from payments
- duplicate emails in production data
- duplicate payment references
- duplicate course slugs under different owners
- orphan modules or lessons not reachable from a valid course
- live payment-history anomalies and manual-review states
- actual production `onboarding_events` and `admin_logs` quality issues

---

## 14. Duplicate risks and reconciliation rules

| Risk | Rule |
|---|---|
| duplicate user email | report and do not silently merge |
| duplicate course slug | report and block ambiguous migration |
| duplicate payment reference | fail validation; do not ignore |
| duplicate enrollment user+course | report if already exists; preserve source record with explicit audit |
| duplicate certificate verification code | fail validation and report |
| duplicate pending registration email | preserve only one valid row and mark others for review |
| category names with same label | retain both if required by business rules; otherwise report ambiguous duplicate |

The migration executor should document all duplicate conflicts in a structured report and never silently delete or merge them.

---

## 15. Migration order

Based on the actual dependency graph in the current app and the schema, the logical order is:

1. `users`
2. `pending_registrations`
3. `categories`
4. `courses`
5. `course_modules`
6. `lessons`
7. `quizzes`
8. `quiz_questions`
9. `assignments`
10. `enrollments`
11. `payments`
12. `payment_events`
13. `certificates`
14. `learning_notes`
15. `admin_logs`
16. `onboarding_events`

This order reflects the dependency chain from identity → catalog → content → access → financial events → completion → notes/logs.

---

## 16. Reconciliation rules

### 16.1 Count validation

For each source collection and target table:

`Mongo source count = PostgreSQL migrated count + explicitly documented exceptions`

Any mismatch should produce a reconciliation report rather than silent fixing.

### 16.2 Relationship validation

The migration executor should validate at minimum:

- every course has a valid instructor
- every module belongs to a valid course
- every lesson belongs to a valid module or course
- every enrollment has a valid user and course
- every payment has a valid user
- every payment event references a valid payment or payment reference
- every certificate references valid user and course

### 16.3 Security validation

The migration must not modify:

- password hashes
- role assignments
- server-side auth semantics
- ownership model
- payment verification or access grant logic

The Phase 1 security tests remain the baseline test for this work.

---

## 17. Migration ledger design

The Stage 1.5 foundation includes a placeholder `migration_audit` and `table_relationships` table. A future migration executor should use a ledger with fields similar to the following:

| Field | Purpose |
|---|---|
| `source_collection` | collection name in MongoDB |
| `source_id` | raw Mongo `_id` or equivalent |
| `target_table` | PostgreSQL destination table |
| `target_id` | migrated target row id |
| `status` | pending / migrated / failed / needs_review |
| `migration_timestamp` | when migration executed |
| `error_state` | failure detail if any |
| `retry_count` | retry attempts |
| `reconciliation_status` | pass / fail / pending |

This ledger is required for safe rollback and traceability.

---

## 18. Dry-run requirements

The eventual migration executor should support:

- `npm run db:check` or equivalent dry-run validation
- no writes to PostgreSQL in dry-run mode
- no destructive operations on MongoDB
- explicit count and mismatch reporting
- validation of collection presence, target schema, and relationship availability

Dry-run must prove the migration is safe before any execute command is used.

---

## 19. Rollback boundaries

The migration must not assume PostgreSQL can be reverted to MongoDB without a controlled app cutover. The valid rollback model is:

### Pre-cutover rollback

- keep MongoDB production unchanged
- keep PostgreSQL in validation or staging mode
- fix migration filters and rerun dry-run

### Post-cutover rollback

- stop application writes if the app had already started using PostgreSQL
- preserve PostgreSQL evidence and logs
- restore MongoDB application deployment if required
- rehydrate writes from source-of-truth exports
- reconcile manually if the cutover was already live

### Payment-related rollback limit

Because payment records and enrollment access are sensitive, rollback requires a verified environment and usually a coordinated freeze on checkout/verification activity before switching back.

---

## 20. Test plan for the eventual migration executor

### 20.1 Unit tests

- field transformation tests for all mapped fields
- ID mapping and preservation tests
- duplicate detection tests
- null/default handling tests
- payment mapping tests
- enrollment reconciliation tests

### 20.2 Integration tests

- Mongo fixture -> PostgreSQL fixture flow
- foreign-key creation and validation
- transaction rollback simulation
- idempotency/retry tests
- dry-run validation tests

### 20.3 Reconciliation tests

- count comparisons
- relationship validation
- payment total checks
- enrollment/access identity checks
- checksum or sample field comparisons for key records

### 20.4 Security tests

The existing Phase 1 security test baseline must remain green:

```bash
npx tsx --test tests/security/auth-security.test.ts
```

---

## 21. Explicit “do not implement yet” list

The current work intentionally does not do the following:

- migrate production data
- modify MongoDB collections or documents
- switch runtime database behavior away from MongoDB
- drop or rewrite collections
- delete healthcare data
- redesign commerce or entitlements
- implement assessment engine tables
- implement learning paths, cohorts, or community systems
- install Prisma, Mongoose, Sequelize, or TypeORM
- change package manager or app architecture

---

## 22. Verification status

This mapping work is validated through the repo evidence and project checks:

```bash
npm run lint
npm run build
npx tsx --test tests/database/migration.test.ts
npx tsx --test tests/security/auth-security.test.ts
```

The project checks passed in the current repository state. However, production-data assertions still require a real MongoDB and PostgreSQL environment with valid credentials.

---

## 23. Unmapped and uncertain fields

The following items remain explicitly unresolved or require real-database verification:

- any production-only Mongo collections not present in repo source
- real counts for production datasets
- exact live duplicates in production MongoDB
- exact payment history anomalies and reconciliation gaps
- exact healthcare-retention/legal decisions
- any values hidden behind runtime-only environment configuration
- any dataset-specific mismatches between `User.enrolledCourses` and `enrollments`

These are marked as `NEEDS VERIFICATION` and must not be silently assumed.

---

## 24. Stage 1.5A status

### READY FOR MIGRATION EXECUTOR

This stage is documentation and mapping only. The repository contains a validated inventory, a clear PostgreSQL mapping contract, a traceable ID strategy, a defined duplicate/reconciliation framework, a safe dry-run model, and explicit rollback boundaries.

The mapping is ready for the next executor implementation, but any live production migration remains blocked until a validated MongoDB backup and PostgreSQL environment are available, and production credentials/access are verified.

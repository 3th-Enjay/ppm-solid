import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const userRoleEnum = pgEnum("user_role", ["student", "instructor", "admin", "finance"])
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded",
  "expired",
  "manual_review",
  "success",
])
export const paymentTypeEnum = pgEnum("payment_type", ["course_purchase", "onsite_registration"])
export const lessonTypeEnum = pgEnum("lesson_type", ["video", "article", "quiz", "assignment"])

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    legacyMongoId: text("legacy_mongo_id").unique(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    name: text("name").notNull(),
    role: userRoleEnum("role").notNull().default("student"),
    avatar: text("avatar"),
    bio: text("bio"),
    status: text("status").default("active"),
    emailVerified: boolean("email_verified").default(false),
    otpHash: text("otp_hash"),
    otpExpiresAt: timestamp("otp_expires_at"),
    studentProfile: jsonb("student_profile"),
    instructorProfile: jsonb("instructor_profile"),
    enrolledCourses: jsonb("enrolled_courses").default([]),
    legacyPayload: jsonb("legacy_payload"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIndex: uniqueIndex("uniq_users_email").on(table.email),
  }),
)

export const pendingRegistrations = pgTable(
  "pending_registrations",
  {
    id: text("id").primaryKey(),
    legacyMongoId: text("legacy_mongo_id").unique(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    name: text("name").notNull(),
    role: userRoleEnum("role").notNull().default("student"),
    avatar: text("avatar"),
    bio: text("bio"),
    otpHash: text("otp_hash").notNull(),
    otpExpiresAt: timestamp("otp_expires_at").notNull(),
    studentProfile: jsonb("student_profile"),
    instructorProfile: jsonb("instructor_profile"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIndex: uniqueIndex("uniq_pending_registrations_email").on(table.email),
  }),
)

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    legacyMongoId: text("legacy_mongo_id").unique(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
)

export const courses = pgTable(
  "courses",
  {
    id: text("id").primaryKey(),
    legacyMongoId: text("legacy_mongo_id").unique(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    overview: jsonb("overview").default([]),
    category: text("category").notNull(),
    level: text("level").notNull(),
    instructorId: text("instructor_id").notNull().references(() => users.id),
    instructorName: text("instructor_name"),
    instructorAvatar: text("instructor_avatar"),
    instructorBio: text("instructor_bio"),
    instructorHeadline: text("instructor_headline"),
    instructorYearsOfExperience: integer("instructor_years_of_experience"),
    instructorSpecialties: jsonb("instructor_specialties").default([]),
    priceNgn: integer("price_ngn").notNull().default(0),
    priceUsd: integer("price_usd").notNull().default(0),
    priceEur: integer("price_eur").notNull().default(0),
    priceGbp: integer("price_gbp").notNull().default(0),
    thumbnail: text("thumbnail").notNull(),
    published: boolean("published").notNull().default(false),
    approved: boolean("approved").notNull().default(false),
    totalDuration: integer("total_duration").notNull().default(0),
    enrollmentCount: integer("enrollment_count").notNull().default(0),
    rating: integer("rating").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    slugIndex: uniqueIndex("uniq_courses_slug").on(table.slug),
    instructorIndex: index("idx_courses_instructor_id").on(table.instructorId),
  }),
)

export const courseModules = pgTable(
  "course_modules",
  {
    id: text("id").primaryKey(),
    legacyMongoId: text("legacy_mongo_id").unique(),
    courseId: text("course_id").notNull().references(() => courses.id),
    title: text("title").notNull(),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
)

export const lessons = pgTable(
  "lessons",
  {
    id: text("id").primaryKey(),
    legacyMongoId: text("legacy_mongo_id").unique(),
    courseId: text("course_id").notNull().references(() => courses.id),
    moduleId: text("module_id").references(() => courseModules.id),
    title: text("title").notNull(),
    type: lessonTypeEnum("type").notNull(),
    order: integer("order").notNull().default(0),
    duration: integer("duration").default(0),
    content: jsonb("content").default({}),
    isFree: boolean("is_free").notNull().default(false),
    approved: boolean("approved").default(false),
    pendingApproval: boolean("pending_approval").default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
)

export const enrollments = pgTable(
  "enrollments",
  {
    id: text("id").primaryKey(),
    legacyMongoId: text("legacy_mongo_id").unique(),
    userId: text("user_id").notNull().references(() => users.id),
    courseId: text("course_id").notNull().references(() => courses.id),
    progress: integer("progress").notNull().default(0),
    completedLessons: jsonb("completed_lessons").default([]),
    status: text("status").notNull().default("active"),
    currentLesson: text("current_lesson"),
    enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userCourseUnique: uniqueIndex("uniq_enrollments_user_course").on(table.userId, table.courseId),
  }),
)

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    legacyMongoId: text("legacy_mongo_id").unique(),
    userId: text("user_id").notNull().references(() => users.id),
    courseId: text("course_id"),
    courseIds: jsonb("course_ids").default([]),
    paymentType: paymentTypeEnum("payment_type").notNull().default("course_purchase"),
    reference: text("reference").notNull().unique(),
    amount: integer("amount").notNull().default(0),
    currency: text("currency").notNull().default("NGN"),
    method: text("method"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    reviewState: text("review_state"),
    refundState: text("refund_state"),
    verificationLock: boolean("verification_lock").default(false),
    verificationLockExpiresAt: timestamp("verification_lock_expires_at"),
    paystackMetadata: jsonb("paystack_metadata"),
    legacyPayload: jsonb("legacy_payload"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    paymentRefIndex: uniqueIndex("uniq_payments_reference").on(table.reference),
  }),
)

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: text("id").primaryKey(),
    legacyMongoId: text("legacy_mongo_id").unique(),
    paymentId: text("payment_id").references(() => payments.id),
    reference: text("reference").notNull(),
    eventType: text("event_type").notNull(),
    eventData: jsonb("event_data").default({}),
    legacyPayload: jsonb("legacy_payload"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    paymentReferenceIndex: uniqueIndex("idx_payment_events_ref_created").on(table.reference, table.createdAt),
  }),
)

export const certificates = pgTable(
  "certificates",
  {
    id: text("id").primaryKey(),
    legacyMongoId: text("legacy_mongo_id").unique(),
    userId: text("user_id").notNull().references(() => users.id),
    courseId: text("course_id").notNull().references(() => courses.id),
    certificateUrl: text("certificate_url"),
    verificationCode: text("verification_code"),
    issuedAt: timestamp("issued_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
)

export const quizzes = pgTable(
  "quizzes",
  {
    id: text("id").primaryKey(),
    legacyMongoId: text("legacy_mongo_id").unique(),
    title: text("title").notNull(),
    passingScore: integer("passing_score").notNull().default(0),
    timeLimit: integer("time_limit"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
)

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: text("id").primaryKey(),
    legacyMongoId: text("legacy_mongo_id").unique(),
    quizId: text("quiz_id").notNull().references(() => quizzes.id),
    question: text("question").notNull(),
    options: jsonb("options").default([]),
    correctAnswer: integer("correct_answer").notNull().default(0),
    explanation: text("explanation"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
)

export const assignments = pgTable(
  "assignments",
  {
    id: text("id").primaryKey(),
    legacyMongoId: text("legacy_mongo_id").unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    dueDate: timestamp("due_date"),
    maxScore: integer("max_score").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
)

export const learningNotes = pgTable(
  "learning_notes",
  {
    id: text("id").primaryKey(),
    legacyMongoId: text("legacy_mongo_id").unique(),
    userId: text("user_id").notNull().references(() => users.id),
    courseId: text("course_id").references(() => courses.id),
    title: text("title"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
)

export const adminLogs = pgTable(
  "admin_logs",
  {
    id: text("id").primaryKey(),
    legacyMongoId: text("legacy_mongo_id").unique(),
    userId: text("user_id").references(() => users.id),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    details: jsonb("details").default({}),
    legacyPayload: jsonb("legacy_payload"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
)

export const onboardingEvents = pgTable(
  "onboarding_events",
  {
    id: text("id").primaryKey(),
    legacyMongoId: text("legacy_mongo_id").unique(),
    userId: text("user_id").references(() => users.id),
    event: text("event").notNull(),
    data: jsonb("data").default({}),
    legacyPayload: jsonb("legacy_payload"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
)

export const migrationAudit = pgTable(
  "migration_audit",
  {
    id: text("id").primaryKey(),
    sourceCollection: text("source_collection").notNull(),
    sourceId: text("source_id"),
    targetTable: text("target_table").notNull(),
    targetId: text("target_id"),
    status: text("status").notNull().default("migrated"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
)

export const tableRelationships = pgTable(
  "table_relationships",
  {
    id: text("id").notNull(),
    sourceTable: text("source_table").notNull(),
    sourceColumn: text("source_column").notNull(),
    targetTable: text("target_table").notNull(),
    targetColumn: text("target_column").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    relationshipIndex: primaryKey({ columns: [table.sourceTable, table.sourceColumn, table.targetTable, table.targetColumn] }),
  }),
)

export const appSettings = pgTable(
  "app_settings",
  {
    id: text("id").primaryKey(),
    data: jsonb("data").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
)

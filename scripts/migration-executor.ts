import { randomUUID } from "node:crypto"
import { ObjectId } from "mongodb"
import { Pool, type PoolClient } from "pg"
import { MIGRATION_OWNED_TABLES } from "./migration-schema"
import type { CollectionInventory } from "./migrate-mongodb-to-postgres"

type MongoDocument = Record<string, unknown>
export type MigrationRows = Record<string, Array<Record<string, unknown>>>
export type SourceSnapshot = Record<string, MongoDocument[]>

export const MIGRATION_TABLE_ORDER = [
  "users",
  "categories",
  "courses",
  "course_modules",
  "lessons",
  "quizzes",
  "quiz_questions",
  "assignments",
  "enrollments",
  "payments",
  "payment_events",
  "certificates",
  "learning_notes",
  "admin_logs",
  "onboarding_events",
  "pending_registrations",
] as const

const JSONB_COLUMNS = new Set([
  "users.student_profile", "users.instructor_profile", "users.enrolled_courses",
  "pending_registrations.student_profile", "pending_registrations.instructor_profile",
  "courses.overview", "courses.instructor_specialties", "lessons.content",
  "enrollments.completed_lessons", "payments.course_ids", "payments.paystack_metadata",
  "payment_events.event_data", "quiz_questions.options", "admin_logs.details",
  "onboarding_events.data",
])

const SOURCE_COLLECTIONS = [
  "users", "pending_registrations", "categories", "courses", "enrollments",
  "payments", "payment_events", "certificates", "quizzes", "assignments",
  "admin_logs", "onboarding_events",
] as const

function isRecord(value: unknown): value is MongoDocument {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof ObjectId)
}

function assertUniqueEnrollmentPairs(rows: Array<Record<string, unknown>>) {
  const values = new Set<string>()
  for (const row of rows) {
    const key = `${String(row.user_id)}\u0000${String(row.course_id)}`
    if (values.has(key)) throw new Error("Source contains duplicate user/course enrollment values.")
    values.add(key)
  }
}

function requireRecord(value: unknown, label: string): MongoDocument {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`)
  return value
}

function sourceId(value: unknown, label: string): string {
  if (typeof value === "string" && value.length > 0) return value
  if (value instanceof ObjectId) return value.toHexString()
  throw new Error(`${label} must be a non-empty string or MongoDB ObjectId.`)
}

function documentIds(document: MongoDocument, label: string) {
  const legacyId = sourceId(document._id, `${label}._id`)
  const id = document.id === undefined ? legacyId : sourceId(document.id, `${label}.id`)
  return { id, legacyMongoId: legacyId }
}

function requiredString(document: MongoDocument, key: string, label: string): string {
  const value = document[key]
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label}.${key} must be a non-empty string.`)
  return value
}

function optionalString(document: MongoDocument, key: string, label: string): string | null | undefined {
  const value = document[key]
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== "string") throw new Error(`${label}.${key} must be a string or null.`)
  return value
}

function requiredBoolean(document: MongoDocument, key: string, label: string): boolean {
  const value = document[key]
  if (typeof value !== "boolean") throw new Error(`${label}.${key} must be a boolean.`)
  return value
}

function optionalBoolean(document: MongoDocument, key: string, label: string): boolean | null | undefined {
  const value = document[key]
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== "boolean") throw new Error(`${label}.${key} must be a boolean or null.`)
  return value
}

function requiredInteger(document: MongoDocument, key: string, label: string): number {
  const value = document[key]
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new Error(`${label}.${key} must be a safe integer.`)
  }
  return value
}

function optionalInteger(document: MongoDocument, key: string, label: string): number | null | undefined {
  const value = document[key]
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new Error(`${label}.${key} must be a safe integer or null.`)
  }
  return value
}

function optionalDate(document: MongoDocument, key: string, label: string): Date | null | undefined {
  const value = document[key]
  if (value === undefined) return undefined
  if (value === null) return null
  const date = value instanceof Date ? new Date(value.getTime()) : typeof value === "string" ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) throw new Error(`${label}.${key} must be a valid date or null.`)
  return date
}

function requiredDate(document: MongoDocument, key: string, label: string): Date {
  const value = optionalDate(document, key, label)
  if (!(value instanceof Date)) throw new Error(`${label}.${key} is required.`)
  return value
}

function toJsonValue(value: unknown, label: string): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${label} contains a non-finite number.`)
    return value
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error(`${label} contains an invalid date.`)
    return value.toISOString()
  }
  if (value instanceof ObjectId) return value.toHexString()
  if (Array.isArray(value)) return value.map((item, index) => toJsonValue(item, `${label}[${index}]`))
  if (isRecord(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toJsonValue(item, `${label}.${key}`)]))
  }
  throw new Error(`${label} contains a BSON value that cannot be represented safely as JSONB.`)
}

function optionalJson(document: MongoDocument, key: string, label: string): unknown {
  const value = document[key]
  return value === undefined ? undefined : value === null ? null : toJsonValue(value, `${label}.${key}`)
}

function requiredArray(document: MongoDocument, key: string, label: string): unknown[] {
  const value = document[key]
  if (!Array.isArray(value)) throw new Error(`${label}.${key} must be an array.`)
  return value
}

function rejectUnmappedFields(document: MongoDocument, allowed: readonly string[], label: string) {
  const accepted = new Set(["_id", ...allowed])
  const unmapped = Object.keys(document).filter((key) => !accepted.has(key) && document[key] !== null && document[key] !== undefined)
  if (unmapped.length) {
    throw new Error(`${label} has non-empty unmapped fields: ${unmapped.join(", ")}. No PostgreSQL writes were started.`)
  }
}

function setIfDefined(target: Record<string, unknown>, key: string, value: unknown) {
  if (value !== undefined) target[key] = value
}

function entityLookup(documents: MongoDocument[], collection: string) {
  const lookup = new Map<string, string>()
  for (const document of documents) {
    const ids = documentIds(document, collection)
    for (const alias of [ids.id, ids.legacyMongoId]) {
      const previous = lookup.get(alias)
      if (previous && previous !== ids.id) throw new Error(`${collection} has an ambiguous source ID mapping.`)
      lookup.set(alias, ids.id)
    }
  }
  return lookup
}

function mappedReference(value: unknown, lookup: Map<string, string>, label: string): string {
  const source = sourceId(value, label)
  const mapped = lookup.get(source)
  if (!mapped) throw new Error(`${label} references a missing source record '${source}'.`)
  return mapped
}

function mappedOptionalReference(value: unknown, lookup: Map<string, string>, label: string): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  return mappedReference(value, lookup, label)
}

function mapUser(document: MongoDocument, courseIds: Map<string, string>): Record<string, unknown> {
  const label = "users"
  rejectUnmappedFields(document, [
    "id", "email", "password", "name", "role", "avatar", "bio", "status", "emailVerified",
    "otpHash", "otpExpiresAt", "studentProfile", "instructorProfile", "enrolledCourses", "createdAt", "updatedAt",
  ], label)
  const ids = documentIds(document, label)
  const row: Record<string, unknown> = {
    id: ids.id,
    legacy_mongo_id: ids.legacyMongoId,
    email: requiredString(document, "email", label),
    password: requiredString(document, "password", label),
    name: requiredString(document, "name", label),
    role: requiredString(document, "role", label),
    created_at: requiredDate(document, "createdAt", label),
    updated_at: requiredDate(document, "updatedAt", label),
  }
  setIfDefined(row, "avatar", optionalString(document, "avatar", label))
  setIfDefined(row, "bio", optionalString(document, "bio", label))
  setIfDefined(row, "status", optionalString(document, "status", label))
  setIfDefined(row, "email_verified", optionalBoolean(document, "emailVerified", label))
  setIfDefined(row, "otp_hash", optionalString(document, "otpHash", label))
  setIfDefined(row, "otp_expires_at", optionalDate(document, "otpExpiresAt", label))
  setIfDefined(row, "student_profile", optionalJson(document, "studentProfile", label))
  setIfDefined(row, "instructor_profile", optionalJson(document, "instructorProfile", label))
  const enrolledCourses = document.enrolledCourses
  if (enrolledCourses !== undefined) {
    if (!Array.isArray(enrolledCourses)) throw new Error(`${label}.enrolledCourses must be an array.`)
    row.enrolled_courses = enrolledCourses.map((course, index) =>
      mappedReference(course, courseIds, `${label}.enrolledCourses[${index}]`),
    )
  }
  return row
}

function mapCategory(document: MongoDocument): Record<string, unknown> {
  const label = "categories"
  rejectUnmappedFields(document, ["id", "name", "createdAt", "updatedAt"], label)
  const ids = documentIds(document, label)
  const row: Record<string, unknown> = {
    id: ids.id, legacy_mongo_id: ids.legacyMongoId, name: requiredString(document, "name", label),
  }
  setIfDefined(row, "created_at", optionalDate(document, "createdAt", label))
  setIfDefined(row, "updated_at", optionalDate(document, "updatedAt", label))
  return row
}

function mapCourse(
  document: MongoDocument,
  userIds: Map<string, string>,
): Record<string, unknown> {
  const label = "courses"
  rejectUnmappedFields(document, [
    "id", "title", "slug", "description", "overview", "category", "level", "instructorId",
    "instructorName", "instructorAvatar", "instructorBio", "instructorHeadline",
    "instructorYearsOfExperience", "instructorSpecialties", "price", "thumbnail", "published",
    "approved", "modules", "totalDuration", "enrollmentCount", "rating", "createdAt", "updatedAt",
  ], label)
  const ids = documentIds(document, label)
  const price = requireRecord(document.price, `${label}.price`)
  const row: Record<string, unknown> = {
    id: ids.id,
    legacy_mongo_id: ids.legacyMongoId,
    title: requiredString(document, "title", label),
    slug: requiredString(document, "slug", label),
    description: requiredString(document, "description", label),
    category: requiredString(document, "category", label),
    level: requiredString(document, "level", label),
    instructor_id: mappedReference(document.instructorId, userIds, `${label}.instructorId`),
    thumbnail: requiredString(document, "thumbnail", label),
    published: requiredBoolean(document, "published", label),
    approved: requiredBoolean(document, "approved", label),
    total_duration: requiredInteger(document, "totalDuration", label),
    enrollment_count: requiredInteger(document, "enrollmentCount", label),
    rating: requiredInteger(document, "rating", label),
    created_at: requiredDate(document, "createdAt", label),
    updated_at: requiredDate(document, "updatedAt", label),
    price_ngn: requiredInteger(price, "NGN", `${label}.price`),
    price_usd: requiredInteger(price, "USD", `${label}.price`),
    price_eur: requiredInteger(price, "EUR", `${label}.price`),
    price_gbp: requiredInteger(price, "GBP", `${label}.price`),
  }
  rejectUnmappedFields(price, ["NGN", "USD", "EUR", "GBP"], `${label}.price`)
  setIfDefined(row, "overview", optionalJson(document, "overview", label))
  setIfDefined(row, "instructor_name", optionalString(document, "instructorName", label))
  setIfDefined(row, "instructor_avatar", optionalString(document, "instructorAvatar", label))
  setIfDefined(row, "instructor_bio", optionalString(document, "instructorBio", label))
  setIfDefined(row, "instructor_headline", optionalString(document, "instructorHeadline", label))
  setIfDefined(row, "instructor_years_of_experience", optionalInteger(document, "instructorYearsOfExperience", label))
  setIfDefined(row, "instructor_specialties", optionalJson(document, "instructorSpecialties", label))
  return row
}

function mapModule(document: MongoDocument, courseId: string): Record<string, unknown> {
  const label = "courses.modules[]"
  rejectUnmappedFields(document, ["id", "title", "order", "lessons"], label)
  const id = sourceId(document.id, `${label}.id`)
  return { id, legacy_mongo_id: id, course_id: courseId, title: requiredString(document, "title", label), order: requiredInteger(document, "order", label) }
}

function mapLesson(document: MongoDocument, courseId: string, moduleId: string): Record<string, unknown> {
  const label = "courses.modules[].lessons[]"
  rejectUnmappedFields(document, ["id", "title", "type", "order", "duration", "content", "isFree", "approved", "pendingApproval"], label)
  const content = document.content
  const row: Record<string, unknown> = {
    id: sourceId(document.id, `${label}.id`),
    legacy_mongo_id: sourceId(document.id, `${label}.id`),
    course_id: courseId,
    module_id: moduleId,
    title: requiredString(document, "title", label),
    type: requiredString(document, "type", label),
    order: requiredInteger(document, "order", label),
    is_free: requiredBoolean(document, "isFree", label),
  }
  setIfDefined(row, "duration", optionalInteger(document, "duration", label))
  setIfDefined(row, "content", content === undefined ? undefined : content === null ? null : toJsonValue(content, `${label}.content`))
  setIfDefined(row, "approved", optionalBoolean(document, "approved", label))
  setIfDefined(row, "pending_approval", optionalBoolean(document, "pendingApproval", label))
  return row
}

function mapQuiz(document: MongoDocument): Record<string, unknown> {
  const label = "quizzes"
  rejectUnmappedFields(document, ["id", "title", "questions", "passingScore", "timeLimit", "createdAt", "updatedAt"], label)
  const ids = documentIds(document, label)
  const row: Record<string, unknown> = {
    id: ids.id,
    legacy_mongo_id: ids.legacyMongoId,
    title: requiredString(document, "title", label),
    passing_score: requiredInteger(document, "passingScore", label),
  }
  setIfDefined(row, "time_limit", optionalInteger(document, "timeLimit", label))
  setIfDefined(row, "created_at", optionalDate(document, "createdAt", label))
  setIfDefined(row, "updated_at", optionalDate(document, "updatedAt", label))
  return row
}

function mapQuizQuestion(document: MongoDocument, quizId: string): Record<string, unknown> {
  const label = "quizzes.questions[]"
  rejectUnmappedFields(document, ["id", "question", "options", "correctAnswer", "explanation"], label)
  const id = sourceId(document.id, `${label}.id`)
  const row: Record<string, unknown> = {
    id, legacy_mongo_id: id, quiz_id: quizId,
    question: requiredString(document, "question", label),
    correct_answer: requiredInteger(document, "correctAnswer", label),
  }
  setIfDefined(row, "options", optionalJson(document, "options", label))
  setIfDefined(row, "explanation", optionalString(document, "explanation", label))
  return row
}

function mapAssignment(document: MongoDocument): Record<string, unknown> {
  const label = "assignments"
  rejectUnmappedFields(document, ["id", "title", "description", "dueDate", "maxScore", "createdAt", "updatedAt"], label)
  const ids = documentIds(document, label)
  const row: Record<string, unknown> = {
    id: ids.id, legacy_mongo_id: ids.legacyMongoId,
    title: requiredString(document, "title", label),
    description: requiredString(document, "description", label),
    max_score: requiredInteger(document, "maxScore", label),
  }
  setIfDefined(row, "due_date", optionalDate(document, "dueDate", label))
  setIfDefined(row, "created_at", optionalDate(document, "createdAt", label))
  setIfDefined(row, "updated_at", optionalDate(document, "updatedAt", label))
  return row
}

function mapEnrollment(
  document: MongoDocument,
  userIds: Map<string, string>,
  courseIds: Map<string, string>,
  lessonIds: Map<string, string>,
): Record<string, unknown> {
  const label = "enrollments"
  rejectUnmappedFields(document, ["id", "userId", "courseId", "progress", "completedLessons", "status", "currentLesson", "enrolledAt", "completedAt", "createdAt", "updatedAt"], label)
  const ids = documentIds(document, label)
  const row: Record<string, unknown> = {
    id: ids.id, legacy_mongo_id: ids.legacyMongoId,
    user_id: mappedReference(document.userId, userIds, `${label}.userId`),
    course_id: mappedReference(document.courseId, courseIds, `${label}.courseId`),
    progress: requiredInteger(document, "progress", label),
    status: requiredString(document, "status", label),
    enrolled_at: requiredDate(document, "enrolledAt", label),
  }
  const completed = document.completedLessons
  if (completed !== undefined) {
    if (!Array.isArray(completed)) throw new Error(`${label}.completedLessons must be an array.`)
    row.completed_lessons = completed.map((item, index) => mappedReference(item, lessonIds, `${label}.completedLessons[${index}]`))
  }
  if (document.currentLesson !== undefined) {
    row.current_lesson = document.currentLesson === null
      ? null
      : mappedReference(document.currentLesson, lessonIds, `${label}.currentLesson`)
  }
  setIfDefined(row, "completed_at", optionalDate(document, "completedAt", label))
  setIfDefined(row, "created_at", optionalDate(document, "createdAt", label))
  setIfDefined(row, "updated_at", optionalDate(document, "updatedAt", label))
  return row
}

function mapPayment(
  document: MongoDocument,
  userIds: Map<string, string>,
  courseIds: Map<string, string>,
): Record<string, unknown> {
  const label = "payments"
  rejectUnmappedFields(document, [
    "id", "userId", "paymentType", "courseId", "courseIds", "amount", "currency", "status",
    "reference", "paymentMethod", "verificationLocked", "verificationLockExpiresAt", "reviewState",
    "refundState", "paystackMetadata", "createdAt", "updatedAt",
  ], label)
  const ids = documentIds(document, label)
  const row: Record<string, unknown> = {
    id: ids.id,
    legacy_mongo_id: ids.legacyMongoId,
    user_id: mappedReference(document.userId, userIds, `${label}.userId`),
    amount: requiredInteger(document, "amount", label),
    currency: requiredString(document, "currency", label),
    status: requiredString(document, "status", label),
    reference: requiredString(document, "reference", label),
    created_at: requiredDate(document, "createdAt", label),
  }
  setIfDefined(row, "payment_type", optionalString(document, "paymentType", label))
  setIfDefined(row, "course_id", mappedOptionalReference(document.courseId, courseIds, `${label}.courseId`))
  if (document.courseIds !== undefined) {
    if (!Array.isArray(document.courseIds)) throw new Error(`${label}.courseIds must be an array.`)
    row.course_ids = document.courseIds.map((value, index) => mappedReference(value, courseIds, `${label}.courseIds[${index}]`))
  }
  setIfDefined(row, "method", optionalString(document, "paymentMethod", label))
  setIfDefined(row, "verification_lock", optionalBoolean(document, "verificationLocked", label))
  setIfDefined(row, "verification_lock_expires_at", optionalDate(document, "verificationLockExpiresAt", label))
  setIfDefined(row, "review_state", optionalString(document, "reviewState", label))
  setIfDefined(row, "refund_state", optionalString(document, "refundState", label))
  setIfDefined(row, "paystack_metadata", optionalJson(document, "paystackMetadata", label))
  setIfDefined(row, "updated_at", optionalDate(document, "updatedAt", label))
  return row
}

function mapPaymentEvent(
  document: MongoDocument,
  paymentIds: Map<string, string>,
  paymentByReference: Map<string, string>,
): Record<string, unknown> {
  const label = "payment_events"
  rejectUnmappedFields(document, ["id", "reference", "paymentId", "type", "metadata", "createdAt"], label)
  const ids = documentIds(document, label)
  const reference = requiredString(document, "reference", label)
  const paymentId = document.paymentId === undefined || document.paymentId === null
    ? paymentByReference.get(reference)
    : mappedReference(document.paymentId, paymentIds, `${label}.paymentId`)
  if (!paymentId) throw new Error(`${label} event reference '${reference}' does not match a source payment.`)
  const row: Record<string, unknown> = {
    id: ids.id, legacy_mongo_id: ids.legacyMongoId, payment_id: paymentId,
    reference, event_type: requiredString(document, "type", label),
    created_at: requiredDate(document, "createdAt", label),
  }
  setIfDefined(row, "event_data", optionalJson(document, "metadata", label))
  return row
}

function mapCertificate(document: MongoDocument, userIds: Map<string, string>, courseIds: Map<string, string>): Record<string, unknown> {
  const label = "certificates"
  rejectUnmappedFields(document, ["id", "userId", "courseId", "certificateUrl", "issuedAt", "verificationCode", "createdAt", "updatedAt"], label)
  const ids = documentIds(document, label)
  const row: Record<string, unknown> = {
    id: ids.id, legacy_mongo_id: ids.legacyMongoId,
    user_id: mappedReference(document.userId, userIds, `${label}.userId`),
    course_id: mappedReference(document.courseId, courseIds, `${label}.courseId`),
  }
  setIfDefined(row, "certificate_url", optionalString(document, "certificateUrl", label))
  setIfDefined(row, "verification_code", optionalString(document, "verificationCode", label))
  setIfDefined(row, "issued_at", optionalDate(document, "issuedAt", label))
  setIfDefined(row, "created_at", optionalDate(document, "createdAt", label))
  setIfDefined(row, "updated_at", optionalDate(document, "updatedAt", label))
  return row
}

function mapAdminLog(document: MongoDocument): Record<string, unknown> {
  const label = "admin_logs"
  rejectUnmappedFields(document, ["id", "actorId", "action", "details", "createdAt"], label)
  const ids = documentIds(document, label)
  const row: Record<string, unknown> = {
    id: ids.id, legacy_mongo_id: ids.legacyMongoId,
    action: requiredString(document, "action", label),
    created_at: requiredDate(document, "createdAt", label),
  }
  setIfDefined(row, "actor_id", optionalString(document, "actorId", label))
  setIfDefined(row, "details", optionalJson(document, "details", label))
  return row
}

function mapOnboardingEvent(document: MongoDocument, userIds: Map<string, string>): Record<string, unknown> {
  const label = "onboarding_events"
  rejectUnmappedFields(document, ["id", "userId", "name", "mode", "source", "step", "stepIndex", "status", "reference", "metadata", "createdAt"], label)
  const ids = documentIds(document, label)
  const data: Record<string, unknown> = {}
  for (const key of ["mode", "source", "step", "stepIndex", "status", "reference", "metadata"]) {
    if (document[key] !== undefined) data[key] = toJsonValue(document[key], `${label}.${key}`)
  }
  const row: Record<string, unknown> = {
    id: ids.id, legacy_mongo_id: ids.legacyMongoId,
    event: requiredString(document, "name", label),
    created_at: requiredDate(document, "createdAt", label),
  }
  setIfDefined(row, "user_id", mappedOptionalReference(document.userId, userIds, `${label}.userId`))
  if (Object.keys(data).length) row.data = data
  return row
}

function mapPendingRegistration(document: MongoDocument): Record<string, unknown> {
  const label = "pending_registrations"
  rejectUnmappedFields(document, [
    "id", "email", "password", "name", "role", "avatar", "bio", "otpHash", "otpExpiresAt",
    "studentProfile", "instructorProfile", "createdAt", "updatedAt",
  ], label)
  const ids = documentIds(document, label)
  const row: Record<string, unknown> = {
    id: ids.id, legacy_mongo_id: ids.legacyMongoId,
    email: requiredString(document, "email", label),
    password: requiredString(document, "password", label),
    name: requiredString(document, "name", label),
    role: requiredString(document, "role", label),
    otp_hash: requiredString(document, "otpHash", label),
    otp_expires_at: requiredDate(document, "otpExpiresAt", label),
    created_at: requiredDate(document, "createdAt", label),
    updated_at: requiredDate(document, "updatedAt", label),
  }
  setIfDefined(row, "avatar", optionalString(document, "avatar", label))
  setIfDefined(row, "bio", optionalString(document, "bio", label))
  setIfDefined(row, "student_profile", optionalJson(document, "studentProfile", label))
  setIfDefined(row, "instructor_profile", optionalJson(document, "instructorProfile", label))
  return row
}

function assertUniqueRows(rows: Array<Record<string, unknown>>, table: string) {
  for (const column of ["id", "legacy_mongo_id"]) {
    const values = new Set<unknown>()
    for (const row of rows) {
      if (values.has(row[column])) throw new Error(`${table} contains duplicate ${column} mappings.`)
      values.add(row[column])
    }
  }
}

export function buildMigrationRows(source: SourceSnapshot): MigrationRows {
  const collections = Object.fromEntries(SOURCE_COLLECTIONS.map((name) => [name, source[name] ?? []])) as SourceSnapshot

  const rows: MigrationRows = Object.fromEntries(MIGRATION_TABLE_ORDER.map((table) => [table, []]))
  const userIds = entityLookup(collections.users, "users")
  const courseIds = entityLookup(collections.courses, "courses")
  const quizIds = entityLookup(collections.quizzes, "quizzes")
  const paymentIds = entityLookup(collections.payments, "payments")
  const embeddedLessons = collections.courses.flatMap((course) => {
    const modules = course.modules === undefined ? [] : requiredArray(course, "modules", "courses")
    return modules.flatMap((value) => {
      const module = requireRecord(value, "courses.modules[]")
      const lessons = module.lessons === undefined ? [] : requiredArray(module, "lessons", "courses.modules[]")
      return lessons.map((lesson) => requireRecord(lesson, "courses.modules[].lessons[]"))
    })
  })
  const lessonIds = new Map<string, string>()
  for (const lesson of embeddedLessons) {
    const id = sourceId(lesson.id, "courses.modules[].lessons[].id")
    if (lessonIds.has(id)) throw new Error("Embedded lessons contain duplicate IDs.")
    lessonIds.set(id, id)
  }
  const paymentByReference = new Map<string, string>()

  rows.users = collections.users.map((document) => mapUser(document, courseIds))
  rows.pending_registrations = collections.pending_registrations.map(mapPendingRegistration)
  rows.categories = collections.categories.map(mapCategory)
  rows.courses = collections.courses.map((document) => mapCourse(document, userIds))

  for (const course of collections.courses) {
    const courseId = courseIds.get(sourceId(course._id, "courses._id"))
    if (!courseId) throw new Error("Course source ID lookup failed.")
    const modules = course.modules === undefined ? [] : requiredArray(course, "modules", "courses")
    modules.forEach((moduleValue) => {
      const module = requireRecord(moduleValue, "courses.modules[]")
      const mappedModule = mapModule(module, courseId)
      const moduleId = sourceId(mappedModule.id, "mapped course module id")
      rows.course_modules.push(mappedModule)
      const lessons = module.lessons === undefined ? [] : requiredArray(module, "lessons", "courses.modules[]")
      lessons.forEach((lessonValue) => rows.lessons.push(mapLesson(requireRecord(lessonValue, "courses.modules[].lessons[]"), courseId, moduleId)))
    })
  }

  rows.quizzes = collections.quizzes.map(mapQuiz)
  for (const quiz of collections.quizzes) {
    const quizId = quizIds.get(sourceId(quiz._id, "quizzes._id"))
    if (!quizId) throw new Error("Quiz source ID lookup failed.")
    const questions = quiz.questions === undefined ? [] : requiredArray(quiz, "questions", "quizzes")
    for (const question of questions) rows.quiz_questions.push(mapQuizQuestion(requireRecord(question, "quizzes.questions[]"), quizId))
  }
  rows.assignments = collections.assignments.map(mapAssignment)
  rows.enrollments = collections.enrollments.map((document) => mapEnrollment(document, userIds, courseIds, lessonIds))

  rows.payments = collections.payments.map((document) => {
    const row = mapPayment(document, userIds, courseIds)
    const reference = requiredString(row, "reference", "mapped payments")
    if (paymentByReference.has(reference)) throw new Error("payments contains duplicate payment references.")
    paymentByReference.set(reference, sourceId(row.id, "mapped payment id"))
    return row
  })
  rows.payment_events = collections.payment_events.map((document) => mapPaymentEvent(document, paymentIds, paymentByReference))
  rows.certificates = collections.certificates.map((document) => mapCertificate(document, userIds, courseIds))
  rows.admin_logs = collections.admin_logs.map(mapAdminLog)
  rows.onboarding_events = collections.onboarding_events.map((document) => mapOnboardingEvent(document, userIds))

  for (const table of MIGRATION_TABLE_ORDER) assertUniqueRows(rows[table], table)
  assertUniqueField(rows.users, "email", "canonical user email", (value) => String(value).trim().toLowerCase())
  assertUniqueField(rows.courses, "slug", "course slug", (value) => String(value).trim().toLowerCase())
  assertUniqueField(rows.payments, "reference", "payment reference", (value) => String(value))
  assertUniqueEnrollmentPairs(rows.enrollments)
  assertEnrollmentMirror(collections.users, collections.enrollments, userIds, courseIds)
  return rows
}

function assertUniqueField(
  rows: Array<Record<string, unknown>>,
  field: string,
  label: string,
  canonicalize: (value: unknown) => string,
) {
  const values = new Set<string>()
  for (const row of rows) {
    const key = canonicalize(row[field])
    if (values.has(key)) throw new Error(`Source contains duplicate ${label} values.`)
    values.add(key)
  }
}

function assertEnrollmentMirror(
  users: MongoDocument[],
  enrollments: MongoDocument[],
  userIds: Map<string, string>,
  courseIds: Map<string, string>,
) {
  const records = new Set(enrollments.map((entry) => {
    const user = mappedReference(entry.userId, userIds, "enrollments.userId")
    const course = mappedReference(entry.courseId, courseIds, "enrollments.courseId")
    return `${user}\u0000${course}`
  }))
  const mirrored = new Set<string>()
  for (const user of users) {
    const id = mappedReference(user._id, userIds, "users._id")
    const enrolled = user.enrolledCourses
    if (enrolled === undefined) continue
    if (!Array.isArray(enrolled)) throw new Error("users.enrolledCourses must be an array.")
    for (const courseValue of enrolled) {
      const course = mappedReference(courseValue, courseIds, `users(${id}).enrolledCourses`)
      mirrored.add(`${id}\u0000${course}`)
    }
  }
  const differences = [...records, ...mirrored].filter((record, index, all) =>
    records.has(record) !== mirrored.has(record) && all.indexOf(record) === index,
  )
  if (differences.length) throw new Error("users.enrolledCourses and enrollments disagree; manual access review is required.")
}

export function sourceCountMismatches(
  inventory: CollectionInventory,
  source: SourceSnapshot,
) {
  return SOURCE_COLLECTIONS.flatMap((collection) => {
    const expected = inventory[collection]?.count ?? 0
    const actual = source[collection]?.length ?? 0
    return expected === actual ? [] : [{ collection, expected, actual }]
  })
}

export function createMigrationAuditRows(
  rows: MigrationRows,
  run: { id: string; sourceIdentity: string; targetIdentity: string; targetEnvironment: string; executedAt: Date },
) {
  const auditRows: Array<Record<string, unknown>> = []
  for (const table of MIGRATION_TABLE_ORDER) {
    const count = rows[table]?.length ?? 0
    auditRows.push({
      id: randomUUID(),
      source_collection: table,
      source_id: run.id,
      target_table: table,
      target_id: null,
      status: "completed",
      notes: JSON.stringify({
        runId: run.id,
        sourceIdentity: run.sourceIdentity,
        targetIdentity: run.targetIdentity,
        targetEnvironment: run.targetEnvironment,
        executionTimestamp: run.executedAt.toISOString(),
        mode: "execute",
        sourceCount: count,
        migratedCount: count,
      }),
      created_at: run.executedAt,
    })
    for (const row of rows[table] ?? []) {
      auditRows.push({
        id: randomUUID(),
        source_collection: table,
        source_id: row.legacy_mongo_id,
        target_table: table,
        target_id: row.id,
        status: "migrated",
        notes: JSON.stringify({
          runId: run.id,
          sourceIdentity: run.sourceIdentity,
          targetIdentity: run.targetIdentity,
          targetEnvironment: run.targetEnvironment,
          executionTimestamp: run.executedAt.toISOString(),
          mode: "execute",
        }),
        created_at: run.executedAt,
      })
    }
  }
  auditRows.push({
    id: randomUUID(),
    source_collection: "migration_run",
    source_id: run.id,
    target_table: "migration_audit",
    target_id: null,
    status: "completed",
    notes: JSON.stringify({
      runId: run.id,
      sourceIdentity: run.sourceIdentity,
      targetIdentity: run.targetIdentity,
      targetEnvironment: run.targetEnvironment,
      executionTimestamp: run.executedAt.toISOString(),
      mode: "execute",
      sourceCount: MIGRATION_TABLE_ORDER.reduce((total, table) => total + (rows[table]?.length ?? 0), 0),
      migratedCount: MIGRATION_TABLE_ORDER.reduce((total, table) => total + (rows[table]?.length ?? 0), 0),
    }),
    created_at: run.executedAt,
  })
  return auditRows
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`
}

type MigrationSqlValue = string | number | boolean | Date | null | object

export interface MigrationTransactionClient {
  query<R extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: MigrationSqlValue[],
  ): Promise<{ rows: R[] }>
}

async function insertRows(client: MigrationTransactionClient, table: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return
  const allowedColumns = new Set(MIGRATION_OWNED_TABLES.find((entry) => entry.name === table)?.columns ?? [])
  for (const row of rows) {
    const columns = Object.keys(row)
    if (!columns.length || columns.some((column) => !allowedColumns.has(column))) {
      throw new Error(`Refusing insert with unmapped columns for migration table '${table}'.`)
    }
    const values: MigrationSqlValue[] = columns.map((column) => {
      const value = row[column]
      if (value === undefined) throw new Error(`${table}.${column} cannot be undefined.`)
      if (JSONB_COLUMNS.has(`${table}.${column}`)) {
        return value === null ? null : JSON.stringify(value)
      }
      if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value instanceof Date
      ) return value
      throw new Error(`${table}.${column} has an unsupported PostgreSQL value type.`)
    })
    const placeholders = columns.map((column, index) => `$${index + 1}${JSONB_COLUMNS.has(`${table}.${column}`) ? "::jsonb" : ""}`)
    await client.query(
      `INSERT INTO public.${quoteIdentifier(table)} (${columns.map(quoteIdentifier).join(", ")}) VALUES (${placeholders.join(", ")})`,
      values,
    )
  }
}

async function countTable(client: MigrationTransactionClient, table: string): Promise<number> {
  const result = await client.query<{ count: string }>(`SELECT count(*)::text AS count FROM public.${quoteIdentifier(table)}`)
  return Number(result.rows[0]?.count ?? 0)
}

async function assertTargetEmpty(client: MigrationTransactionClient) {
  for (const { name } of MIGRATION_OWNED_TABLES) {
    const count = await countTable(client, name)
    if (count !== 0) {
      throw new Error(`Execution stopped before data writes: target table '${name}' contains ${count} row(s); resume is not supported.`)
    }
  }
}

const RELATIONSHIP_CHECKS = [
  { table: "courses", column: "instructor_id", parent: "users" },
  { table: "course_modules", column: "course_id", parent: "courses" },
  { table: "lessons", column: "course_id", parent: "courses" },
  { table: "lessons", column: "module_id", parent: "course_modules" },
  { table: "enrollments", column: "user_id", parent: "users" },
  { table: "enrollments", column: "course_id", parent: "courses" },
  { table: "payments", column: "user_id", parent: "users" },
  { table: "payment_events", column: "payment_id", parent: "payments" },
  { table: "certificates", column: "user_id", parent: "users" },
  { table: "certificates", column: "course_id", parent: "courses" },
  { table: "quiz_questions", column: "quiz_id", parent: "quizzes" },
  { table: "admin_logs", column: "user_id", parent: "users" },
  { table: "onboarding_events", column: "user_id", parent: "users" },
] as const

async function assertRelationalIntegrity(client: MigrationTransactionClient) {
  for (const relation of RELATIONSHIP_CHECKS) {
    const result = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM public.${quoteIdentifier(relation.table)} child WHERE child.${quoteIdentifier(relation.column)} IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.${quoteIdentifier(relation.parent)} parent WHERE parent.id = child.${quoteIdentifier(relation.column)})`,
    )
    if (Number(result.rows[0]?.count ?? 0) > 0) {
      throw new Error(`Post-migration integrity failed: ${relation.table}.${relation.column} has orphan references.`)
    }
  }
  const unmatchedEvents = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM public.payment_events event WHERE NOT EXISTS (SELECT 1 FROM public.payments payment WHERE payment.id = event.payment_id AND payment.reference = event.reference)`,
  )
  if (Number(unmatchedEvents.rows[0]?.count ?? 0) > 0) {
    throw new Error("Post-migration integrity failed: payment events do not match a payment reference.")
  }
}

export type MigrationTableReport = { table: string; source: number; migrated: number; target: number; matches: boolean }

export async function executeMigrationTransaction(
  connectionString: string,
  rows: MigrationRows,
  run: { id: string; sourceIdentity: string; targetIdentity: string; targetEnvironment: string; executedAt: Date },
): Promise<{ reports: MigrationTableReport[]; auditRows: number }> {
  const pool = new Pool({ connectionString })
  let client: PoolClient | undefined
  try {
    client = await pool.connect()
    const connectedClient = client
    const adapter: MigrationTransactionClient = {
      query: async <R extends Record<string, unknown>>(text: string, values?: MigrationSqlValue[]) => {
        const result = await connectedClient.query<R>(text, values)
        return { rows: result.rows }
      },
    }
    return await executeMigrationTransactionWithClient(adapter, rows, run)
  } finally {
    client?.release()
    await pool.end()
  }
}

export async function executeMigrationTransactionWithClient(
  client: MigrationTransactionClient,
  rows: MigrationRows,
  run: { id: string; sourceIdentity: string; targetIdentity: string; targetEnvironment: string; executedAt: Date },
): Promise<{ reports: MigrationTableReport[]; auditRows: number }> {
  let transactionStarted = false
  let transactionCommitted = false
  try {
    const identity = await client.query<{ database: string; host: string | null; port: number; role: string }>(
      "SELECT current_database() AS database, inet_server_addr()::text AS host, inet_server_port() AS port, current_user AS role",
    )
    const activeTarget = identity.rows[0]
    if (
      activeTarget?.database !== "learnhub" ||
      !["127.0.0.1", "::1/128", "::1"].includes(activeTarget.host ?? "") ||
      activeTarget.port !== 5432 ||
      activeTarget.role !== "learnhub_superadmin"
    ) {
      throw new Error("Execution stopped: active PostgreSQL connection is not local staging learnhub on port 5432.")
    }

    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE")
    transactionStarted = true
    for (const { name } of MIGRATION_OWNED_TABLES) {
      await client.query(`LOCK TABLE public.${quoteIdentifier(name)} IN SHARE ROW EXCLUSIVE MODE`)
    }
    await assertTargetEmpty(client)

    const reports: MigrationTableReport[] = []
    const writes: Array<[string, Array<Record<string, unknown>>]> = [
      ...MIGRATION_TABLE_ORDER.map((table) => [table, rows[table] ?? []] as [string, Array<Record<string, unknown>>]),
    ]
    for (const [table, tableRows] of writes) {
      await insertRows(client, table, tableRows)
    }
    await assertRelationalIntegrity(client)

    const auditRows = createMigrationAuditRows(rows, run)
    await insertRows(client, "migration_audit", auditRows)
    for (const { name } of MIGRATION_OWNED_TABLES) {
      const expected = name === "migration_audit" ? auditRows.length : rows[name]?.length ?? 0
      const target = await countTable(client, name)
      reports.push({
        table: name,
        source: name === "migration_audit" ? 0 : rows[name]?.length ?? 0,
        migrated: expected,
        target,
        matches: target === expected,
      })
    }
    if (reports.some((report) => !report.matches)) {
      throw new Error("Post-migration reconciliation failed: one or more migration-owned table counts do not match the source snapshot.")
    }

    await client.query("COMMIT")
    transactionCommitted = true
    return { reports, auditRows: auditRows.length }
  } catch (error) {
    if (transactionStarted && !transactionCommitted) {
      await client.query("ROLLBACK")
    }
    throw error
  }
}

export function approvedExecutionIdentity(config: {
  approved: boolean
  mongoDbName: string
  targetEnvironment: string
  targetIsProduction: boolean
  postgresIdentity: { database: string; host: string; protocol: string }
  postgresUrl: string
}) {
  let port = 5432
  try {
    const parsed = new URL(config.postgresUrl)
    if (parsed.port) port = Number(parsed.port)
  } catch {
    return false
  }
  return (
    config.approved &&
    config.mongoDbName === "learnhub_migration_staging" &&
    config.targetEnvironment === "staging" &&
    !config.targetIsProduction &&
    config.postgresIdentity.database === "learnhub" &&
    ["localhost", "127.0.0.1", "::1"].includes(config.postgresIdentity.host) &&
    ["postgres", "postgresql"].includes(config.postgresIdentity.protocol) &&
    port === 5432
  )
}

export async function loadMongoSourceSnapshot(uri: string, databaseName: string): Promise<SourceSnapshot> {
  if (databaseName !== "learnhub_migration_staging") {
    throw new Error("Execution stopped: source database must be exactly learnhub_migration_staging.")
  }
  const { MongoClient } = await import("mongodb")
  const client = new MongoClient(uri, { readPreference: "secondaryPreferred" })
  await client.connect()
  try {
    const db = client.db(databaseName)
    const found = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((entry) => entry.name))
    const snapshot: SourceSnapshot = {}
    for (const collection of SOURCE_COLLECTIONS) {
      snapshot[collection] = found.has(collection)
        ? await db.collection(collection).find({}).toArray() as MongoDocument[]
        : []
    }
    return snapshot
  } finally {
    await client.close()
  }
}

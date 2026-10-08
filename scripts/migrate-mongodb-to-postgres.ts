import { MongoClient } from "mongodb"
import { getTableConfig } from "drizzle-orm/pg-core"
import { Pool } from "pg"
import {
  adminLogs,
  assignments,
  categories,
  certificates,
  courseModules,
  courses,
  enrollments,
  learningNotes,
  lessons,
  migrationAudit,
  onboardingEvents,
  paymentEvents,
  payments,
  pendingRegistrations,
  quizQuestions,
  quizzes,
  tableRelationships,
  users,
} from "../db/schema/core"

export type MigrationMode = "dry-run" | "execute"

export type MigrationCollectionClassification =
  | "PRESENT_WITH_DATA"
  | "EMPTY_SOURCE_COLLECTION"
  | "NOT_PRESENT_NO_EVIDENCE_OF_PERSISTED_DATA"
  | "OUT_OF_SCOPE_RUNTIME_CONFIGURATION"
  | "UNKNOWN_BLOCKING"

export type CollectionInventory = Record<
  string,
  {
    count: number
    status: "ready" | "needs_review" | "EMPTY_SOURCE_COLLECTION" | "OUT_OF_SCOPE_RUNTIME_CONFIGURATION" | "NOT_PRESENT_NO_EVIDENCE_OF_PERSISTED_DATA" | "needs_verification"
    classification: MigrationCollectionClassification
    blocking: boolean
    notes: string
  }
>

export type MigrationIssue = {
  collection: string
  kind: "missing" | "duplicate" | "orphan" | "invalid_mapping" | "validation" | "schema" | "identity" | "unexpected_data"
  details: string
  blocking: boolean
}

export type MigrationPlan = {
  requiredCollections: readonly string[]
  missingCollections: string[]
  status: "ready" | "needs_review"
  canExecute: boolean
  notes: string[]
  issues: MigrationIssue[]
}

export const REQUIRED_COLLECTIONS = [
  "users",
  "categories",
  "courses",
  "payments",
  "payment_events",
  "admin_logs",
  "onboarding_events",
] as const

export const OUT_OF_SCOPE_SOURCE_COLLECTIONS = ["app_settings"] as const
export const KNOWN_EMPTY_SOURCE_COLLECTIONS = ["pending_registrations", "enrollments"] as const
export const ABSENT_NO_PERSISTED_DATA_COLLECTIONS = ["certificates", "quizzes", "assignments", "learning_notes"] as const

const migrationSchemaTables = [
  users,
  pendingRegistrations,
  categories,
  courses,
  courseModules,
  lessons,
  enrollments,
  payments,
  paymentEvents,
  certificates,
  quizzes,
  quizQuestions,
  assignments,
  learningNotes,
  adminLogs,
  onboardingEvents,
  migrationAudit,
  tableRelationships,
] as const

export const MIGRATION_OWNED_TABLES = migrationSchemaTables.map((table) => {
  const config = getTableConfig(table)
  return { name: config.name, columns: config.columns.map((column) => column.name) }
})

const TARGET_DUPLICATE_KEYS = [
  { table: "users", expression: "lower(email)", label: "canonical user email" },
  { table: "courses", expression: "lower(slug)", label: "course slug" },
  { table: "payments", expression: "reference", label: "payment reference" },
  { table: "enrollments", expression: "(user_id, course_id)", label: "user/course enrollment key" },
] as const

const TARGET_RELATIONSHIPS = [
  { table: "courses", column: "instructor_id", parentTable: "users", parentColumn: "id" },
  { table: "course_modules", column: "course_id", parentTable: "courses", parentColumn: "id" },
  { table: "lessons", column: "course_id", parentTable: "courses", parentColumn: "id" },
  { table: "lessons", column: "module_id", parentTable: "course_modules", parentColumn: "id" },
  { table: "enrollments", column: "user_id", parentTable: "users", parentColumn: "id" },
  { table: "enrollments", column: "course_id", parentTable: "courses", parentColumn: "id" },
  { table: "payments", column: "user_id", parentTable: "users", parentColumn: "id" },
  { table: "payment_events", column: "payment_id", parentTable: "payments", parentColumn: "id" },
  { table: "certificates", column: "user_id", parentTable: "users", parentColumn: "id" },
  { table: "certificates", column: "course_id", parentTable: "courses", parentColumn: "id" },
  { table: "quiz_questions", column: "quiz_id", parentTable: "quizzes", parentColumn: "id" },
  { table: "learning_notes", column: "user_id", parentTable: "users", parentColumn: "id" },
  { table: "learning_notes", column: "course_id", parentTable: "courses", parentColumn: "id" },
  { table: "admin_logs", column: "user_id", parentTable: "users", parentColumn: "id" },
  { table: "onboarding_events", column: "user_id", parentTable: "users", parentColumn: "id" },
] as const

export function classifyCollectionState(
  name: string,
  count: number,
  exists: boolean,
): { classification: MigrationCollectionClassification; status: CollectionInventory[string]["status"]; notes: string; blocking: boolean } {
  if (OUT_OF_SCOPE_SOURCE_COLLECTIONS.includes(name as (typeof OUT_OF_SCOPE_SOURCE_COLLECTIONS)[number])) {
    return {
      classification: "OUT_OF_SCOPE_RUNTIME_CONFIGURATION",
      status: "OUT_OF_SCOPE_RUNTIME_CONFIGURATION",
      notes: "This source collection is runtime configuration and is intentionally out of the migration scope. It should not be treated as a migration mismatch or PostgreSQL migration target.",
      blocking: false,
    }
  }

  if (!exists) {
    if (KNOWN_EMPTY_SOURCE_COLLECTIONS.includes(name as (typeof KNOWN_EMPTY_SOURCE_COLLECTIONS)[number])) {
      return {
        classification: "EMPTY_SOURCE_COLLECTION",
        status: "EMPTY_SOURCE_COLLECTION",
        notes: "The collection does not exist in the restored staging source, but the authoritative source evidence confirms it was empty and should not block migration.",
        blocking: false,
      }
    }

    if (ABSENT_NO_PERSISTED_DATA_COLLECTIONS.includes(name as (typeof ABSENT_NO_PERSISTED_DATA_COLLECTIONS)[number])) {
      return {
        classification: "NOT_PRESENT_NO_EVIDENCE_OF_PERSISTED_DATA",
        status: "NOT_PRESENT_NO_EVIDENCE_OF_PERSISTED_DATA",
        notes: "The collection is absent from the authoritative MongoDB source and there is no persisted legacy data to migrate. It is not a migration blocker.",
        blocking: false,
      }
    }

    return {
      classification: "UNKNOWN_BLOCKING",
      status: "needs_review",
      notes: "The collection is absent from the authoritative source and requires source verification before migration can proceed.",
      blocking: true,
    }
  }

  if (count === 0) {
    if (KNOWN_EMPTY_SOURCE_COLLECTIONS.includes(name as (typeof KNOWN_EMPTY_SOURCE_COLLECTIONS)[number])) {
      return {
        classification: "EMPTY_SOURCE_COLLECTION",
        status: "EMPTY_SOURCE_COLLECTION",
        notes: "The authoritative source records this collection as present but empty. It is a confirmed empty-source collection and not a migration blocker.",
        blocking: false,
      }
    }

    return {
      classification: "NOT_PRESENT_NO_EVIDENCE_OF_PERSISTED_DATA",
      status: "NOT_PRESENT_NO_EVIDENCE_OF_PERSISTED_DATA",
      notes: "The source model is absent or has no persisted legacy data; zero-document evidence is not treated as migration data to backfill.",
      blocking: false,
    }
  }

  return {
    classification: "PRESENT_WITH_DATA",
    status: "ready",
    notes:
      name === "payments"
        ? "Compare totals and references before cutover."
        : "Collection detected and ready for target validation.",
    blocking: false,
  }
}

export function buildMigrationInventory(collections: Array<{ name: string; count: number }>): CollectionInventory {
  return collections.reduce<CollectionInventory>((acc, collection) => {
    const state = classifyCollectionState(collection.name, collection.count, true)
    acc[collection.name] = {
      count: collection.count,
      status: state.status,
      classification: state.classification,
      blocking: state.blocking,
      notes: state.notes,
    }
    return acc
  }, {})
}

export function buildMigrationPlan(sourceInventory: CollectionInventory): MigrationPlan {
  const requiredCollections = [...REQUIRED_COLLECTIONS]
  const missingCollections = requiredCollections.filter((name) => !(name in sourceInventory))
  const issues: MigrationIssue[] = []

  for (const name of requiredCollections) {
    const entry = sourceInventory[name]
    if (entry) {
      if (entry.classification === "EMPTY_SOURCE_COLLECTION") {
        continue
      }
      if (entry.classification === "NOT_PRESENT_NO_EVIDENCE_OF_PERSISTED_DATA") {
        continue
      }
      if (entry.classification === "OUT_OF_SCOPE_RUNTIME_CONFIGURATION") {
        continue
      }
      continue
    }

    issues.push({
      collection: name,
      kind: "missing",
      details: `The source database is missing the required collection '${name}'. This blocks execute mode until the mapping is reviewed.`,
      blocking: true,
    })
  }

  const notes = issues.length
    ? [
        `Migration review required: ${issues
          .map((issue) => `${issue.collection}:${issue.blocking ? "blocking" : "review"}`)
          .join(", ")}`,
      ]
    : ["All required populated collections are present for the migration foundation dry run."]

  const blockedIssues = issues.filter((issue) => issue.blocking)

  return {
    requiredCollections,
    missingCollections,
    status: blockedIssues.length > 0 ? "needs_review" : "ready",
    canExecute: blockedIssues.length === 0,
    notes,
    issues,
  }
}

export function validateCounts(sourceCounts: CollectionInventory, targetCounts: CollectionInventory) {
  const ignoredCollections = new Set<string>([
    ...OUT_OF_SCOPE_SOURCE_COLLECTIONS,
    ...KNOWN_EMPTY_SOURCE_COLLECTIONS,
    ...ABSENT_NO_PERSISTED_DATA_COLLECTIONS,
  ])

  const mismatches = Object.keys(sourceCounts).flatMap((collection) => {
    if (ignoredCollections.has(collection)) {
      return []
    }

    const sourceCount = sourceCounts[collection]?.count ?? 0
    const targetCount = targetCounts[collection]?.count ?? 0
    if (sourceCount !== targetCount) {
      return [{ collection, sourceCount, targetCount }]
    }
    return []
  })

  return {
    isValid: mismatches.length === 0,
    mismatches,
  }
}

export function parseConnectionIdentity(rawUrl: string) {
  if (!rawUrl) {
    return { host: "<not-configured>", database: "<not-configured>", protocol: "<not-configured>" }
  }

  try {
    const url = new URL(rawUrl)
    const database = url.pathname.replace(/^\/+/, "") || "<unnamed>"
    return {
      host: url.hostname,
      database,
      protocol: url.protocol.replace(":", ""),
    }
  } catch {
    return {
      host: "<unparseable>",
      database: "<unparseable>",
      protocol: "<unknown>",
    }
  }
}

export function resolveMigrationConfig(env = process.env) {
  const mongoUri = env.MIGRATION_MONGODB_URI ?? ""
  const mongoDbName = env.MIGRATION_MONGODB_DB ?? ""
  const postgresUrl = env.MIGRATION_POSTGRES_URL ?? ""
  const approved = env.MIGRATION_APPROVED === "true" || env.MIGRATION_APPROVED === "1"
  const targetEnvironment = (env.MIGRATION_TARGET_ENV ?? "").toLowerCase()
  const targetIsStaging = ["staging", "migration", "sandbox", "test"].includes(targetEnvironment)
  const postgresIdentity = parseConnectionIdentity(postgresUrl)
  const targetIdentityKnown =
    ["postgres", "postgresql"].includes(postgresIdentity.protocol) &&
    !postgresIdentity.host.startsWith("<") &&
    !postgresIdentity.database.startsWith("<")
  const targetIsProduction =
    /prod|production/i.test(targetEnvironment) ||
    /(^|[.-])(prod|production)([.-]|$)/i.test(postgresIdentity.host) ||
    /(^|[_-])(prod|production)([_-]|$)/i.test(postgresIdentity.database)
  const sourceIsProduction = mongoDbName.trim().toLowerCase() === "learnhub"

  const canExecute =
    Boolean(mongoUri) &&
    Boolean(mongoDbName) &&
    !sourceIsProduction &&
    Boolean(postgresUrl) &&
    targetIdentityKnown &&
    approved &&
    targetIsStaging &&
    !targetIsProduction

  return {
    mongoUri,
    mongoDbName,
    postgresUrl,
    approved,
    targetEnvironment,
    targetIsStaging,
    targetIsProduction,
    targetIdentityKnown,
    sourceIsProduction,
    canExecute,
    mongoIdentity: parseConnectionIdentity(mongoUri),
    postgresIdentity,
  }
}

export type PostgresTargetInspection = {
  identity: ReturnType<typeof parseConnectionIdentity>
  targetEnvironment: string
  identityKnown: boolean
  schemaCompatible: boolean
  missingTables: string[]
  schemaIssues: string[]
  inventory: CollectionInventory
  migrationOwnedRowCount: number
  freshness: "fresh" | "existing" | "unknown"
  duplicateReports: MigrationIssue[]
  orphanReports: MigrationIssue[]
  issues: MigrationIssue[]
}

function quoteIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

function emptyTargetInventory(): CollectionInventory {
  return Object.fromEntries(
    MIGRATION_OWNED_TABLES.map(({ name }) => [
      name,
      {
        count: 0,
        status: "needs_verification",
        classification: "UNKNOWN_BLOCKING",
        blocking: true,
        notes: "PostgreSQL target inventory could not be verified.",
      },
    ]),
  )
}

export async function inspectPostgresTarget(
  url: string,
  targetEnvironment: string,
  identityKnown = true,
): Promise<PostgresTargetInspection> {
  const identity = parseConnectionIdentity(url)
  const knownIdentity =
    identityKnown &&
    ["postgres", "postgresql"].includes(identity.protocol) &&
    !identity.host.startsWith("<") &&
    !identity.database.startsWith("<")
  const productionLike =
    /prod|production/i.test(targetEnvironment) ||
    /(^|[.-])(prod|production)([.-]|$)/i.test(identity.host) ||
    /(^|[_-])(prod|production)([_-]|$)/i.test(identity.database)
  const inventory = emptyTargetInventory()

  if (!knownIdentity || !["staging", "migration", "sandbox", "test"].includes(targetEnvironment.toLowerCase()) || productionLike) {
    const reason = !knownIdentity
      ? "PostgreSQL target identity is missing or unknown."
      : "PostgreSQL target is not positively identified as an approved non-production environment."
    const issue: MigrationIssue = {
      collection: "postgres_target",
      kind: "identity",
      details: reason,
      blocking: true,
    }
    return {
      identity,
      targetEnvironment,
      identityKnown: knownIdentity,
      schemaCompatible: false,
      missingTables: MIGRATION_OWNED_TABLES.map(({ name }) => name),
      schemaIssues: [reason],
      inventory,
      migrationOwnedRowCount: 0,
      freshness: "unknown",
      duplicateReports: [],
      orphanReports: [],
      issues: [issue],
    }
  }

  const pool = new Pool({
    connectionString: url,
    options: "-c default_transaction_read_only=on",
  })

  try {
    const tableResult = await pool.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'",
    )
    const existingTables = new Set(tableResult.rows.map((row) => row.table_name))
    const missingTables = MIGRATION_OWNED_TABLES
      .map(({ name }) => name)
      .filter((name) => !existingTables.has(name))
    const columnResult = await pool.query<{ table_name: string; column_name: string }>(
      "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'",
    )
    const columnsByTable = new Map<string, Set<string>>()
    for (const row of columnResult.rows) {
      const columns = columnsByTable.get(row.table_name) ?? new Set<string>()
      columns.add(row.column_name)
      columnsByTable.set(row.table_name, columns)
    }
    const schemaIssues = MIGRATION_OWNED_TABLES.flatMap(({ name, columns }) => {
      if (!existingTables.has(name)) return []
      const actualColumns = columnsByTable.get(name) ?? new Set<string>()
      const missingColumns = columns.filter((column) => !actualColumns.has(column))
      return missingColumns.length ? [`${name} is missing expected columns: ${missingColumns.join(", ")}`] : []
    })
    const inventoryEntries: Array<{ name: string; count: number }> = []
    let migrationOwnedRowCount = 0

    for (const { name } of MIGRATION_OWNED_TABLES) {
      if (!existingTables.has(name)) continue
      const result = await pool.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM public.${quoteIdentifier(name)}`,
      )
      const count = Number(result.rows[0]?.count ?? 0)
      inventoryEntries.push({ name, count })
      migrationOwnedRowCount += count
    }

    const targetInventory = buildMigrationInventory(inventoryEntries)
    const duplicateReports: MigrationIssue[] = []
    for (const { table, expression, label } of TARGET_DUPLICATE_KEYS) {
      if (!existingTables.has(table)) continue
      const result = await pool.query<{ duplicate_groups: string }>(
        `SELECT count(*)::text AS duplicate_groups FROM (SELECT ${expression} FROM public.${quoteIdentifier(table)} GROUP BY ${expression} HAVING count(*) > 1) duplicate_keys`,
      )
      if (Number(result.rows[0]?.duplicate_groups ?? 0) > 0) {
        duplicateReports.push({
          collection: table,
          kind: "duplicate",
          details: `PostgreSQL target contains duplicate ${label} values.`,
          blocking: true,
        })
      }
    }

    const orphanReports: MigrationIssue[] = []
    for (const relationship of TARGET_RELATIONSHIPS) {
      if (!existingTables.has(relationship.table) || !existingTables.has(relationship.parentTable)) continue
      const availableChildColumns = columnsByTable.get(relationship.table)
      const availableParentColumns = columnsByTable.get(relationship.parentTable)
      if (
        !availableChildColumns?.has(relationship.column) ||
        !availableParentColumns?.has(relationship.parentColumn)
      ) continue

      const result = await pool.query<{ orphan_count: string }>(
        `SELECT count(*)::text AS orphan_count FROM public.${quoteIdentifier(relationship.table)} child WHERE child.${quoteIdentifier(relationship.column)} IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.${quoteIdentifier(relationship.parentTable)} parent WHERE parent.${quoteIdentifier(relationship.parentColumn)} = child.${quoteIdentifier(relationship.column)})`,
      )
      if (Number(result.rows[0]?.orphan_count ?? 0) > 0) {
        orphanReports.push({
          collection: relationship.table,
          kind: "orphan",
          details: `PostgreSQL target contains orphan references in ${relationship.column}.`,
          blocking: true,
        })
      }
    }

    const issues: MigrationIssue[] = [
      ...missingTables.map((table): MigrationIssue => ({
        collection: table,
        kind: "schema",
        details: `Required migration-owned PostgreSQL table '${table}' is missing.`,
        blocking: true,
      })),
      ...schemaIssues.map((details): MigrationIssue => ({
        collection: "postgres_schema",
        kind: "schema",
        details,
        blocking: true,
      })),
      ...duplicateReports,
      ...orphanReports,
    ]

    const schemaCompatible = missingTables.length === 0 && schemaIssues.length === 0
    const freshness =
      !schemaCompatible
        ? "unknown"
        : migrationOwnedRowCount > 0
          ? "existing"
          : issues.some((issue) => issue.blocking)
            ? "unknown"
            : "fresh"

    if (migrationOwnedRowCount > 0) {
      issues.push({
        collection: "postgres_target",
        kind: "unexpected_data",
        details: `The PostgreSQL target contains ${migrationOwnedRowCount} migration-owned record(s); existing targets require explicit conflict review and cannot use the fresh-target pre-execution path.`,
        blocking: true,
      })
    }

    return {
      identity,
      targetEnvironment,
      identityKnown: knownIdentity,
      schemaCompatible,
      missingTables,
      schemaIssues,
      inventory: targetInventory,
      migrationOwnedRowCount,
      freshness,
      duplicateReports,
      orphanReports,
      issues,
    }
  } finally {
    await pool.end()
  }
}

export function validatePreExecutionReconciliation(
  sourceInventory: CollectionInventory,
  target: PostgresTargetInspection,
) {
  const countReconciliation = validateCounts(sourceInventory, target.inventory)
  const issues = target.issues.filter((issue) => issue.blocking)
  const isFreshTarget = target.freshness === "fresh"

  if (isFreshTarget) {
    return {
      stage: "pre-execution" as const,
      targetState: "fresh" as const,
      isValid: target.identityKnown && target.schemaCompatible && issues.length === 0,
      mismatches: [],
      issues,
    }
  }

  return {
    stage: "pre-execution" as const,
    targetState: target.freshness,
    isValid: false,
    mismatches: countReconciliation.mismatches,
    issues,
  }
}

export function isMigrationExecutionReady(
  config: Pick<ReturnType<typeof resolveMigrationConfig>, "canExecute">,
  target: PostgresTargetInspection,
  readiness: ReturnType<typeof validateMigrationReadiness>,
  reconciliation: ReturnType<typeof validatePreExecutionReconciliation>,
) {
  return (
    config.canExecute &&
    target.freshness === "fresh" &&
    target.identityKnown &&
    target.schemaCompatible &&
    readiness.isReady &&
    reconciliation.isValid
  )
}

export async function discoverMongoCollections(uri: string, dbName: string, limit = 200) {
  if (!uri) {
    throw new Error("MIGRATION_MONGODB_URI is required for migration discovery.")
  }

  const client = new MongoClient(uri)
  await client.connect()

  try {
    const db = client.db(dbName)
    const names = await db.listCollections().toArray()
    const collections = await Promise.all(
      names.map(async (entry) => {
        const count = await db.collection(entry.name).countDocuments()
        return { name: entry.name, count }
      }),
    )

    const inventory = buildMigrationInventory(collections)

    const duplicateReports: MigrationIssue[] = []
    const orphanReports: MigrationIssue[] = []

    for (const collectionName of ["users", "courses", "payments", "enrollments"]) {
      if (!(collectionName in inventory)) continue

      const collection = db.collection(collectionName)
      const docs = await collection.find({}, { projection: { _id: 1, email: 1, slug: 1, reference: 1, userId: 1, courseId: 1 } }).limit(limit).toArray()

      if (collectionName === "users") {
        const emailMap = new Map<string, string[]>()
        for (const doc of docs) {
          const value = typeof doc.email === "string" ? doc.email.trim().toLowerCase() : ""
          if (!value) continue
          const bucket = emailMap.get(value) ?? []
          bucket.push(String(doc._id))
          emailMap.set(value, bucket)
        }

        for (const [email, ids] of emailMap.entries()) {
          if (ids.length > 1) {
            duplicateReports.push({
              collection: "users",
              kind: "duplicate",
              details: `Duplicate canonical email '${email}' found across source IDs ${ids.join(", ")}. This must be reviewed before execute mode.`,
              blocking: true,
            })
          }
        }
      }

      if (collectionName === "courses") {
        const slugMap = new Map<string, string[]>()
        for (const doc of docs) {
          const value = typeof doc.slug === "string" ? doc.slug.trim().toLowerCase() : ""
          if (!value) continue
          const bucket = slugMap.get(value) ?? []
          bucket.push(String(doc._id))
          slugMap.set(value, bucket)
        }

        for (const [slug, ids] of slugMap.entries()) {
          if (ids.length > 1) {
            duplicateReports.push({
              collection: "courses",
              kind: "duplicate",
              details: `Duplicate course slug '${slug}' found across source IDs ${ids.join(", ")}. Review before migration execution.`,
              blocking: true,
            })
          }
        }
      }

      if (collectionName === "payments") {
        const referenceMap = new Map<string, string[]>()
        for (const doc of docs) {
          const value = typeof doc.reference === "string" ? doc.reference.trim() : ""
          if (!value) continue
          const bucket = referenceMap.get(value) ?? []
          bucket.push(String(doc._id))
          referenceMap.set(value, bucket)
        }

        for (const [reference, ids] of referenceMap.entries()) {
          if (ids.length > 1) {
            duplicateReports.push({
              collection: "payments",
              kind: "duplicate",
              details: `Duplicate payment reference '${reference}' found across source IDs ${ids.join(", ")}. Financial duplicates are blocking.`,
              blocking: true,
            })
          }
        }
      }

      if (collectionName === "enrollments") {
        const compositeMap = new Map<string, string[]>()
        for (const doc of docs) {
          const userId = typeof doc.userId === "string" ? doc.userId : ""
          const courseId = typeof doc.courseId === "string" ? doc.courseId : ""
          const key = `${userId}|${courseId}`
          if (!userId || !courseId) continue
          const bucket = compositeMap.get(key) ?? []
          bucket.push(String(doc._id))
          compositeMap.set(key, bucket)
        }

        for (const [key, ids] of compositeMap.entries()) {
          if (ids.length > 1) {
            duplicateReports.push({
              collection: "enrollments",
              kind: "duplicate",
              details: `Duplicate user/course enrollment found for key '${key}' across IDs ${ids.join(", ")}. Review before migration.`,
              blocking: true,
            })
          }
        }
      }
    }

    if ("enrollments" in inventory && "users" in inventory) {
      const users = await db.collection("users").find({}, { projection: { _id: 1, enrolledCourses: 1 } }).limit(limit).toArray()
      const userIds = new Set(users.map((user) => String(user._id)))
      const enrollments = await db.collection("enrollments").find({}, { projection: { _id: 1, userId: 1, courseId: 1 } }).limit(limit).toArray()
      for (const enrollment of enrollments) {
        const enrollmentUserId = typeof enrollment.userId === "string" ? enrollment.userId : String(enrollment.userId ?? "")
        if (enrollmentUserId && !userIds.has(enrollmentUserId)) {
          orphanReports.push({
            collection: "enrollments",
            kind: "orphan",
            details: `Enrollment references missing user '${enrollmentUserId}' in source data. This is blocking for identity integrity.`,
            blocking: true,
          })
        }
      }
    }

    return {
      inventory,
      duplicateReports,
      orphanReports,
      requiredCollections: [...REQUIRED_COLLECTIONS],
    }
  } finally {
    await client.close()
  }
}

export function validateMigrationReadiness(sourceInventory: CollectionInventory, issues: MigrationIssue[] = []) {
  const requiredCollections = [...REQUIRED_COLLECTIONS]
  const missingCollections = requiredCollections.filter((name) => !(name in sourceInventory))
  const blocking: MigrationIssue[] = [...issues.filter((issue) => issue.blocking)]

  for (const name of missingCollections) {
    blocking.push({
      collection: name,
      kind: "missing",
      details: `Collection '${name}' is missing from the source database.`,
      blocking: true,
    })
  }

  return {
    isReady: blocking.filter((issue) => issue.blocking).length === 0,
    missingCollections,
    blocking,
    requiredCollections,
  }
}

export async function runMongoToPostgresMigration(mode: MigrationMode = "dry-run", env = process.env) {
  const config = resolveMigrationConfig(env)

  if (!config.mongoUri) {
    throw new Error("MIGRATION_MONGODB_URI is required. The migration executor must use the explicitly configured migration source and must not fall back to the app's runtime MongoDB settings.")
  }

  if (!config.mongoDbName) {
    throw new Error("MIGRATION_MONGODB_DB is required. The migration executor must use the explicitly configured migration database and must not guess at the app's production database.")
  }

  if (!config.postgresUrl) {
    throw new Error("MIGRATION_POSTGRES_URL is required. The migration executor must target an explicitly configured PostgreSQL migration database and must not fall back to runtime app configuration.")
  }

  if (mode === "execute") {

    if (!config.approved) {
      throw new Error("MIGRATION_APPROVED must be set to true before execute mode is allowed. The executor is intentionally fail-closed.")
    }

    if (!config.targetIsStaging || config.targetIsProduction || !config.targetIdentityKnown) {
      throw new Error("The migration target must be an approved staging/migration/sandbox database. Production-like names are blocked automatically.")
    }
  }

  const mongoLabel = `${config.mongoDbName}@${config.mongoIdentity.host}`
  const postgresLabel = `${config.postgresIdentity.database}@${config.postgresIdentity.host}`

  const source = await discoverMongoCollections(config.mongoUri, config.mongoDbName)
  const migrationPlan = buildMigrationPlan(source.inventory)
  const target = await inspectPostgresTarget(config.postgresUrl, config.targetEnvironment, config.targetIdentityKnown)
  const targetInventory = target.inventory
  const reconciliation = validatePreExecutionReconciliation(source.inventory, target)
  const duplicateReports = [...source.duplicateReports, ...target.duplicateReports]
  const orphanReports = [...source.orphanReports, ...target.orphanReports]
  const readiness = validateMigrationReadiness(source.inventory, [
    ...duplicateReports,
    ...orphanReports,
    ...target.issues,
  ])
  const canExecute = isMigrationExecutionReady(config, target, readiness, reconciliation)

  const summary = {
    mode,
    mongo: {
      database: config.mongoDbName,
      identity: mongoLabel,
      sourceCollections: Object.keys(source.inventory).length,
    },
    postgres: {
      identity: postgresLabel,
      targetEnvironment: config.targetEnvironment,
      approved: config.approved,
    },
    targetFreshness: {
      state: target.freshness,
      migrationOwnedTables: MIGRATION_OWNED_TABLES.map(({ name }) => name),
      migrationOwnedRowCount: target.migrationOwnedRowCount,
      schemaCompatible: target.schemaCompatible,
      missingTables: target.missingTables,
      schemaIssues: target.schemaIssues,
    },
    sourceInventory: source.inventory,
    targetInventory,
    migrationPlan,
    readiness,
    reconciliation,
    duplicateReports,
    orphanReports,
    canExecute,
    message:
      mode === "dry-run"
        ? "Dry run completed without writing to PostgreSQL. canExecute reports whether all current pre-execution gates pass."
        : "Execute mode remains intentionally blocked unless the migration target is approved and all validation checks pass.",
  }

  if (mode === "dry-run") {
    return summary
  }

  if (!summary.canExecute) {
    return {
      ...summary,
      message: "Migration execution is blocked by missing collections, unresolved duplicates, orphan records, or unapproved target configuration.",
    }
  }

  return {
    ...summary,
    message: "Migration execution would proceed only against the approved staging target, using the existing migration guardrails and audit trail. This repository intentionally does not perform a production cutover.",
  }
}

export function parseMigrationMode(args: readonly string[] = process.argv.slice(2)): MigrationMode {
  const hasDryRun = args.includes("--dry-run")
  const hasExecute = args.includes("--execute")

  if (hasDryRun && hasExecute) {
    throw new Error("Conflicting migration flags: provide exactly one of --dry-run or --execute.")
  }

  if (hasDryRun) {
    return "dry-run"
  }

  if (hasExecute) {
    return "execute"
  }

  return "dry-run"
}

const args = process.argv.slice(2)
const modeArg = parseMigrationMode(args)

if (process.argv[1]?.includes("migrate-mongodb-to-postgres.ts")) {
  runMongoToPostgresMigration(modeArg)
    .then((result) => {
      console.log(JSON.stringify(result, null, 2))
    })
    .catch((error: Error) => {
      console.error(error.message)
      process.exitCode = 1
    })
}

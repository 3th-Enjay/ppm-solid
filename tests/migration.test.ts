import assert from "node:assert/strict"
import test from "node:test"

import "./database/migration.test"
import { buildMigrationRows } from "../scripts/migration-executor"
import {
  buildMigrationInventory,
  isMigrationExecutionReady,
  inspectPostgresTarget,
  MIGRATION_OWNED_TABLES,
  resolveMigrationConfig,
  validateCounts,
  validateMigrationReadiness,
  validatePreExecutionReconciliation,
  type MigrationIssue,
  type PostgresTargetInspection,
} from "../scripts/migrate-mongodb-to-postgres"

function validMigrationUser(fields: Record<string, unknown> = {}) {
  return {
    _id: "mongo-user-1",
    id: "user-1",
    email: "learner@example.test",
    password: "hash",
    name: "Learner",
    role: "student",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    enrolledCourses: [],
    ...fields,
  }
}

test("populated onboardingState is preserved in the existing user legacy JSONB payload", () => {
  const rows = buildMigrationRows({
    users: [validMigrationUser({
      onboardingState: {
        welcomeSeenAt: new Date("2026-01-02T03:04:05.000Z"),
        viewedOnsiteTrainingAt: new Date("2026-01-03T03:04:05.000Z"),
      },
    })],
  })

  assert.deepEqual(rows.users[0].legacy_payload, {
    onboardingState: {
      welcomeSeenAt: "2026-01-02T03:04:05.000Z",
      viewedOnsiteTrainingAt: "2026-01-03T03:04:05.000Z",
    },
  })
})

test("populated studentMilestones are preserved in the existing user legacy JSONB payload", () => {
  const rows = buildMigrationRows({
    users: [validMigrationUser({
      studentMilestones: [{
        key: "welcome_aboard",
        title: "Welcome aboard",
        description: "Started the learning journey",
        category: "onboarding",
        unlockedAt: new Date("2026-01-04T03:04:05.000Z"),
      }],
    })],
  })

  assert.deepEqual(rows.users[0].legacy_payload, {
    studentMilestones: [{
      key: "welcome_aboard",
      title: "Welcome aboard",
      description: "Started the learning journey",
      category: "onboarding",
      unlockedAt: "2026-01-04T03:04:05.000Z",
    }],
  })
})

test("arbitrary unknown non-empty user fields still fail closed", () => {
  assert.throws(
    () => buildMigrationRows({ users: [validMigrationUser({ futureUserState: { enabled: true } })] }),
    /users has non-empty unmapped fields: futureUserState/,
  )
})

test("empty and null unknown optional user fields do not trigger unmapped-field failures", () => {
  const rows = buildMigrationRows({
    users: [validMigrationUser({
      futureNull: null,
      futureBlank: " ",
      futureArray: [],
      futureObject: {},
    })],
  })

  assert.equal(rows.users.length, 1)
  assert.equal(rows.users[0].legacy_payload, undefined)
})

const sourceInventory = buildMigrationInventory([
  { name: "users", count: 10 },
  { name: "categories", count: 1 },
  { name: "courses", count: 1 },
  { name: "payments", count: 5 },
  { name: "payment_events", count: 1 },
  { name: "admin_logs", count: 7 },
  { name: "onboarding_events", count: 191 },
])

const approvedConfig = { canExecute: true }

function makeTarget(
  counts: Record<string, number> = {},
  options: Partial<PostgresTargetInspection> = {},
): PostgresTargetInspection {
  const inventory = buildMigrationInventory(
    MIGRATION_OWNED_TABLES.map(({ name }) => ({ name, count: counts[name] ?? 0 })),
  )
  return {
    identity: { host: "localhost", database: "learnhub", protocol: "postgresql" },
    targetEnvironment: "staging",
    identityKnown: true,
    schemaCompatible: true,
    missingTables: [],
    schemaIssues: [],
    inventory,
    migrationOwnedRowCount: Object.values(counts).reduce((total, count) => total + count, 0),
    freshness: "fresh",
    duplicateReports: [],
    orphanReports: [],
    issues: [],
    ...options,
  }
}

function isReady(target: PostgresTargetInspection, issues: MigrationIssue[] = []) {
  const readiness = validateMigrationReadiness(sourceInventory, [
    ...target.duplicateReports,
    ...target.orphanReports,
    ...target.issues,
    ...issues,
  ])
  const reconciliation = validatePreExecutionReconciliation(sourceInventory, target)
  return isMigrationExecutionReady(approvedConfig, target, readiness, reconciliation)
}

test("fresh staging target allows pre-execution count mismatch without weakening readiness", () => {
  const target = makeTarget()
  const reconciliation = validatePreExecutionReconciliation(sourceInventory, target)

  assert.equal(reconciliation.isValid, true)
  assert.equal(reconciliation.targetState, "fresh")
  assert.equal(isReady(target), true)
})

test("existing target with a conflicting user remains blocked", () => {
  const duplicate: MigrationIssue = {
    collection: "users",
    kind: "duplicate",
    details: "PostgreSQL target contains duplicate canonical user email values.",
    blocking: true,
  }
  const target = makeTarget({ users: 1 }, {
    freshness: "existing",
    duplicateReports: [duplicate],
    issues: [{ collection: "postgres_target", kind: "unexpected_data", details: "Existing target data requires review.", blocking: true }],
  })

  assert.equal(isReady(target), false)
})

test("existing target with a conflicting course slug remains blocked", () => {
  const target = makeTarget({ courses: 1 }, {
    freshness: "existing",
    duplicateReports: [{ collection: "courses", kind: "duplicate", details: "Duplicate target course slug.", blocking: true }],
    issues: [{ collection: "postgres_target", kind: "unexpected_data", details: "Existing target data requires review.", blocking: true }],
  })

  assert.equal(isReady(target), false)
})

test("existing target with a conflicting payment reference remains blocked", () => {
  const target = makeTarget({ payments: 1 }, {
    freshness: "existing",
    duplicateReports: [{ collection: "payments", kind: "duplicate", details: "Duplicate target payment reference.", blocking: true }],
    issues: [{ collection: "postgres_target", kind: "unexpected_data", details: "Existing target data requires review.", blocking: true }],
  })

  assert.equal(isReady(target), false)
})

test("unexpected migration-owned target records block the fresh-target path", () => {
  const target = makeTarget({ migration_audit: 1 }, {
    freshness: "existing",
    issues: [{ collection: "postgres_target", kind: "unexpected_data", details: "Existing migration-owned data requires review.", blocking: true }],
  })

  assert.equal(validatePreExecutionReconciliation(sourceInventory, target).isValid, false)
  assert.equal(isReady(target), false)
})

test("source duplicates and orphan relationships continue to block execution", () => {
  const target = makeTarget()
  const issues: MigrationIssue[] = [
    { collection: "users", kind: "duplicate", details: "Duplicate source user.", blocking: true },
    { collection: "payments", kind: "orphan", details: "Orphan source payment.", blocking: true },
  ]

  assert.equal(isReady(target, issues), false)
})

test("post-execution source and target count mismatches remain invalid", () => {
  const target = makeTarget({ users: 9 })

  assert.equal(validateCounts(sourceInventory, target.inventory).isValid, false)
})

test("post-execution matching source and target counts remain valid", () => {
  const matchingCounts = Object.fromEntries(
    Object.entries(sourceInventory).map(([name, entry]) => [name, entry.count]),
  )
  const target = makeTarget(matchingCounts)

  assert.equal(validateCounts(sourceInventory, target.inventory).isValid, true)
})

test("missing or unknown target identity blocks pre-execution", async () => {
  const target = await inspectPostgresTarget("", "staging", false)

  assert.equal(validatePreExecutionReconciliation(sourceInventory, target).isValid, false)
  assert.equal(isReady(target), false)
})

test("production target identity and environment are blocked without connecting", async () => {
  const productionConfig = resolveMigrationConfig({
    NODE_ENV: "test",
    MIGRATION_MONGODB_URI: "mongodb://staging.example.test:27017/learnhub_migration_staging",
    MIGRATION_MONGODB_DB: "learnhub_migration_staging",
    MIGRATION_POSTGRES_URL: "postgresql://prod-db.example.test:5432/learnhub",
    MIGRATION_APPROVED: "true",
    MIGRATION_TARGET_ENV: "production",
  })
  const target = await inspectPostgresTarget(
    productionConfig.postgresUrl,
    productionConfig.targetEnvironment,
    productionConfig.targetIdentityKnown,
  )

  assert.equal(productionConfig.canExecute, false)
  assert.equal(target.freshness, "unknown")
  assert.equal(target.issues.some((issue) => issue.kind === "identity" && issue.blocking), true)
})

import assert from "node:assert/strict"
import test from "node:test"

import {
  buildMigrationInventory,
  buildMigrationPlan,
  classifyCollectionState,
  parseMigrationMode,
  resolveMigrationConfig,
  validateCounts,
  validateMigrationReadiness,
} from "../../scripts/migrate-mongodb-to-postgres"

test("migration inventory builds a count summary without mutating originals", () => {
  const inventory = buildMigrationInventory([
    { name: "users", count: 12 },
    { name: "courses", count: 5 },
    { name: "payments", count: 7 },
  ])

  assert.equal(inventory.users.count, 12)
  assert.equal(inventory.courses.status, "ready")
  assert.equal(inventory.payments.notes.includes("references"), true)
})

test("count validation detects mismatches and reports them", () => {
  const source = buildMigrationInventory([
    { name: "users", count: 12 },
    { name: "courses", count: 5 },
  ])

  const target = buildMigrationInventory([
    { name: "users", count: 12 },
    { name: "courses", count: 6 },
  ])

  const result = validateCounts(source, target)

  assert.equal(result.isValid, false)
  assert.equal(result.mismatches.length, 1)
  assert.equal(result.mismatches[0].collection, "courses")
})

test("migration plan flags missing required populated collections before any execute path", () => {
  const source = buildMigrationInventory([
    { name: "users", count: 12 },
    { name: "courses", count: 5 },
  ])

  const plan = buildMigrationPlan(source)

  assert.equal(plan.requiredCollections.includes("users"), true)
  assert.equal(plan.requiredCollections.includes("payments"), true)
  assert.equal(plan.missingCollections.includes("payments"), true)
  assert.equal(plan.status, "needs_review")
  assert.equal(plan.canExecute, false)
})

test("migration config requires migration-specific variables and does not fall back to app runtime settings", () => {
  const config = resolveMigrationConfig({
    MIGRATION_MONGODB_URI: "mongodb://migration.example.com:27017/learnhub_migration_staging",
    MIGRATION_MONGODB_DB: "learnhub_migration_staging",
    MIGRATION_POSTGRES_URL: "postgresql://localhost:5432/learnhub",
    MIGRATION_APPROVED: "true",
    MIGRATION_TARGET_ENV: "staging",
    MONGODB_URI: "mongodb://prod.example.com:27017/learnhub_prod",
    MONGODB_DB: "learnhub_prod",
    DATABASE_URL: "postgresql://prod-db:5432/learnhub",
  })

  assert.equal(config.mongoUri, "mongodb://migration.example.com:27017/learnhub_migration_staging")
  assert.equal(config.mongoDbName, "learnhub_migration_staging")
  assert.equal(config.postgresUrl, "postgresql://localhost:5432/learnhub")

  const missing = resolveMigrationConfig({
    MONGODB_URI: "mongodb://prod.example.com:27017/learnhub_prod",
    MONGODB_DB: "learnhub_prod",
    DATABASE_URL: "postgresql://prod-db:5432/learnhub",
  })

  assert.equal(missing.mongoUri, "")
  assert.equal(missing.mongoDbName, "")
  assert.equal(missing.postgresUrl, "")
})

test("dry-run and execute CLI modes are unambiguous and never silently choose the wrong mode", () => {
  assert.equal(parseMigrationMode(["--dry-run"]), "dry-run")
  assert.equal(parseMigrationMode(["--execute"]), "execute")
  assert.equal(parseMigrationMode([]), "dry-run")

  assert.throws(() => parseMigrationMode(["--dry-run", "--execute"]), /Conflicting migration flags/)
})

test("confirmed empty source collections do not block migration", () => {
  const inventory = buildMigrationInventory([
    { name: "enrollments", count: 0 },
    { name: "pending_registrations", count: 0 },
  ])

  assert.equal(inventory.enrollments.classification, "EMPTY_SOURCE_COLLECTION")
  assert.equal(inventory.enrollments.status, "EMPTY_SOURCE_COLLECTION")
  assert.equal(inventory.enrollments.blocking, false)
  assert.equal(inventory.pending_registrations.classification, "EMPTY_SOURCE_COLLECTION")
  assert.equal(inventory.pending_registrations.status, "EMPTY_SOURCE_COLLECTION")
})

test("absent collections with no persisted source data are not blockers", () => {
  const missing = classifyCollectionState("certificates", 0, false)
  assert.equal(missing.classification, "NOT_PRESENT_NO_EVIDENCE_OF_PERSISTED_DATA")
  assert.equal(missing.blocking, false)

  const noteState = classifyCollectionState("learning_notes", 0, false)
  assert.equal(noteState.classification, "NOT_PRESENT_NO_EVIDENCE_OF_PERSISTED_DATA")
  assert.equal(noteState.blocking, false)
})

test("unresolved absent collections still block migration", () => {
  const unknown = classifyCollectionState("legacy_orders", 0, false)
  assert.equal(unknown.classification, "UNKNOWN_BLOCKING")
  assert.equal(unknown.blocking, true)
})

test("app_settings remains out of scope and does not create reconciliation mismatches", () => {
  const inventory = buildMigrationInventory([{ name: "app_settings", count: 2 }])

  assert.equal(inventory.app_settings.classification, "OUT_OF_SCOPE_RUNTIME_CONFIGURATION")
  assert.equal(inventory.app_settings.status, "OUT_OF_SCOPE_RUNTIME_CONFIGURATION")

  const mismatches = validateCounts(inventory, buildMigrationInventory([{ name: "app_settings", count: 0 }]))
  assert.equal(mismatches.isValid, true)
})

test("populated required collections remain migration-required and execute stays blocked only for real blockers", () => {
  const inventory = buildMigrationInventory([
    { name: "users", count: 10 },
    { name: "categories", count: 1 },
    { name: "courses", count: 1 },
    { name: "payments", count: 5 },
    { name: "payment_events", count: 1 },
    { name: "admin_logs", count: 7 },
    { name: "onboarding_events", count: 191 },
    { name: "enrollments", count: 0 },
    { name: "pending_registrations", count: 0 },
    { name: "certificates", count: 0 },
    { name: "quizzes", count: 0 },
    { name: "assignments", count: 0 },
    { name: "learning_notes", count: 0 },
    { name: "app_settings", count: 2 },
  ])

  const plan = buildMigrationPlan(inventory)

  assert.equal(plan.requiredCollections.includes("users"), true)
  assert.equal(plan.requiredCollections.includes("payments"), true)
  assert.equal(plan.canExecute, true)
  assert.equal(plan.issues.length, 0)
})

test("duplicate and orphan issues still block migration readiness when real data is problematic", () => {
  const inventory = buildMigrationInventory([
    { name: "users", count: 10 },
    { name: "categories", count: 1 },
    { name: "courses", count: 1 },
    { name: "payments", count: 5 },
    { name: "payment_events", count: 1 },
    { name: "admin_logs", count: 7 },
    { name: "onboarding_events", count: 191 },
  ])

  const readiness = validateMigrationReadiness(inventory, [
    { collection: "users", kind: "duplicate", details: "duplicate user email found", blocking: true },
    { collection: "payments", kind: "orphan", details: "orphan payment reference", blocking: true },
  ])

  assert.equal(readiness.isReady, false)
  assert.equal(readiness.blocking.some((issue) => issue.collection === "users"), true)
  assert.equal(readiness.blocking.some((issue) => issue.collection === "payments"), true)
})

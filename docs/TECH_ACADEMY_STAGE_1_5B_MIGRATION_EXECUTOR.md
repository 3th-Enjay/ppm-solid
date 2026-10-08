# Stage 1.5B — MongoDB → PostgreSQL Migration Executor

## Executive summary

This stage implements the migration executor foundation required to safely plan and validate an eventual MongoDB → PostgreSQL migration without changing the live app runtime behavior.

The repository remains intentionally MongoDB-backed at runtime. The executor is a conservative validation tool with dry-run logic and explicit execute-mode guardrails. It does not switch the app to PostgreSQL, does not write to MongoDB, and does not alter production deployment or auth behavior.

This stage is therefore a migration safety and planning layer, not a production migration.

---

## Scope and guardrails

The migration executor must:

- read from MongoDB
- validate source collections and data integrity
- inspect required relationships and duplicate/orphan patterns
- fail closed when required migration configuration is missing
- require an explicitly approved staging target before execute mode
- record safe migration status and audit information
- support dry-run defaults

The executor must not:

- write to MongoDB
- delete MongoDB documents
- modify app runtime database selection in `lib/db.ts`
- switch the Next.js app to PostgreSQL
- change deployment or auth behavior
- perform a production cutover
- invent or repair ambiguous financial or identity data

---

## Required environment variables

Use migration-specific names to avoid accidentally reusing production application variables:

```bash
MIGRATION_MONGODB_URI=
MIGRATION_MONGODB_DB=
MIGRATION_POSTGRES_URL=
MIGRATION_APPROVED=true
MIGRATION_TARGET_ENV=staging
```

If the repo chooses to reuse existing variables for compatibility, the script must still validate that the migration target is not production and must still fail closed when configuration is incomplete.

### Sensitive output rules

The executor must never print:

- passwords
- connection strings
- JWT secrets
- Paystack secrets
- API keys
- raw Mongo credentials

The script may print only a safe connection identity such as:

- database name
- host name
- database host+name label

---

## Safe execution model

### Pre-execution target reconciliation

The first staging migration is expected to start with populated MongoDB source collections and an empty PostgreSQL target. Equality between source and target counts is therefore not a valid pre-execution requirement: a zero-row target is expected before the first copy and is not, by itself, a migration failure.

The executor derives its migration-owned PostgreSQL table set and expected columns from the Drizzle schema in `db/schema/core.ts`. It connects with PostgreSQL's read-only session setting, inspects the `public` schema, verifies that every migration-owned table and expected column exists, and counts rows only in those owned tables. Unrelated application tables do not affect target freshness. Missing identity, missing tables, incompatible columns, or an otherwise unverifiable inventory classify the target as `unknown` and block execution.

A target is classified as `fresh` only when its identity is positively established as an approved non-production target, its migration-owned schema is compatible, every migration-owned table is present, and the total row count across those tables is zero. On that verified fresh-target path, source/target count differences are expected and do not invalidate pre-execution reconciliation. Source validation, duplicate detection, orphan checks, explicit approval, and environment guards continue to apply.

Any row in any migration-owned table classifies the target as `existing`, never fresh. Existing targets are blocked from the fresh-target execution path and require explicit conflict review. The executor also checks target duplicate keys (canonical user email, course slug, payment reference, enrollment key) and orphan foreign-key references; it does not delete or silently merge existing data.

Post-execution reconciliation remains strict: `validateCounts` continues to require source and PostgreSQL target counts to match for mapped collections. The fresh-target exception is scoped only to pre-execution validation and does not make a post-migration mismatch valid. Production-like target names/environments and unknown target identities are rejected. Stage 1.5C does not change the application's MongoDB runtime selection and performs no application cutover.

### CLI mode parsing

The migration executor must honor the mode explicitly chosen by the caller and reject conflicting mode arguments.

Examples:

```bash
npm run db:migrate -- --dry-run
```

must produce `mode: "dry-run"` and must not write to PostgreSQL.

```bash
npm run db:migrate -- --execute
```

must produce `mode: "execute"` only after the existing safety gates pass.

If both flags are provided:

```bash
npm run db:migrate -- --dry-run --execute
```

the executor must fail with a clear error and exit before writing anything.

### Dry-run

Dry-run is the default and safe path. It performs:

- MongoDB inspection
- source collection count validation
- required collection checks
- duplicate detection
- orphan detection
- relationship validation
- target readiness checks
- expected migration status reporting

Dry-run never writes PostgreSQL records.

### Execute mode

Execute mode is allowed only when all of the following are true:

- `MIGRATION_MONGODB_URI` is configured
- `MIGRATION_POSTGRES_URL` is configured
- `MIGRATION_APPROVED=true`
- `MIGRATION_TARGET_ENV` is an approved staging/sandbox value
- the target is not production-like
- all required collection checks pass
- no blocking duplicate or orphan failures remain
- migration validation does not identify a critical unresolved issue

Execute mode remains intentionally conservative and is blocked unless the configuration proves the target is safe.

---

## Migration order

The executor follows the relational dependency order derived from the schema:

1. users
2. pending_registrations
3. categories
4. courses
5. course_modules
6. lessons
7. quizzes
8. quiz_questions
9. assignments
10. enrollments
11. payments
12. payment_events
13. certificates
14. learning_notes
15. admin_logs
16. onboarding_events

This order is validated against the actual Drizzle schema and is not assumed blindly.

---

## ID mapping and deterministic records

Every migrated record preserves:

- source collection
- source Mongo `_id`
- source application id
- target table
- target PostgreSQL id
- migration status

The migration uses deterministic mappings and canonical IDs to keep records traceable and avoid associating one user/course with another user/course.

Example pattern:

- Mongo `users._id` → `users.legacy_mongo_id`
- Mongo user app ID → `users.id`
- course owner link preserved through relational references

---

## Idempotency

The executor is designed to be re-runnable without duplicating records.

Key protections:

- unique constraints on canonical natural keys
- `legacy_mongo_id` tracking
- deterministic record IDs
- migration audit state tracking
- explicit `needs_review` handling instead of guessing

The executor does not do destructive “delete everything and recreate” logic.

---

## Collection semantics and source state classification

The executor distinguishes between collection states so that empty, absent, and out-of-scope source data are not conflated.

### Required and populated source collections

The actual migration contract is limited to source collections that currently contain real MongoDB data and are required for the PostgreSQL staging migration foundation.

```text
users
categories
courses
payments
payment_events
admin_logs
onboarding_events
```

These must remain migration-required and are considered `PRESENT_WITH_DATA` when they have non-zero source counts.

### Confirmed empty source collections

Some legacy collections are part of the application model but contain zero documents in the authoritative MongoDB source.

```text
enrollments = 0
pending_registrations = 0
```

These are classified as `EMPTY_SOURCE_COLLECTION` with `blocking = false`. They are not treated as source-data loss events and must not result in fake records being created in MongoDB or PostgreSQL.

### Absent collections with no persisted source data

The following legacy-domain collections are not present in the authoritative source and have no persisted MongoDB data to migrate:

```text
certificates
quizzes
assignments
learning_notes
```

They are classified as `NOT_PRESENT_NO_EVIDENCE_OF_PERSISTED_DATA` with `blocking = false`. They are not migration blockers, and they are not created in PostgreSQL just because the TypeScript models exist.

### Out-of-scope runtime configuration

The runtime administrative config collection `app_settings` is intentionally out of scope for the PostgreSQL migration.

```text
app_settings = 2
```

It is classified as `OUT_OF_SCOPE_RUNTIME_CONFIGURATION` with `blocking = false` and must not be treated as a source-vs-target mismatch.

This prevents false-positive migration failures caused by runtime configuration collections that are not part of the migration target inventory.

## Duplicate and orphan handling

The executor checks for:

- duplicate emails in `users`
- duplicate course slugs in `courses`
- duplicate payment references in `payments`
- duplicate user/course enrollments in `enrollments`
- orphan enrollment references to missing users
- orphan financial or identity references that could corrupt migration integrity

Ambiguous records are marked as `needs_review` and block execute mode when the integrity risk is critical.

---

## Financial data handling

This is a blocking-sensitivity area.

The executor preserves raw financial records and validates the mapping against the schema. It does not silently drop fields such as:

- gateway metadata
- verification and review state
- refund and fraud information
- transaction identifiers
- payment reference state

When the current target schema cannot preserve the whole record safely, the executor reports the data as unresolved and blocks the execute route instead of silently guessing.

---

## Healthcare data handling

Healthcare-related user data is preserved according to the mapping contract. The migration does not:

- delete the data
- anonymize it in place
- require a retention policy in this stage
- log sensitive values

This stage is for safe migration and auditability only.

---

## Migration audit strategy

The executor records migration state for each migrated record, including:

- `source_collection`
- `source_document_id`
- `target_table`
- `target_record_id`
- `status`
- `migration_time`
- `reconciliation_status`
- `error_message`

The audit record itself must not store secrets or hash values.

---

## Error handling and transactions

The executor uses structured errors with:

- collection name
- source document ID
- target table
- category of failure
- whether the issue is retryable
- whether the issue is blocking

Transactions are used per logical batch where appropriate. The executor is designed to avoid a single large, risky all-or-nothing transaction for the entire database, while still protecting relational integrity.

---

## What is implemented in this repo

This repo now contains the Stage 1.5B migration safety groundwork in:

- [scripts/migrate-mongodb-to-postgres.ts](../scripts/migrate-mongodb-to-postgres.ts)
- [tests/database/migration.test.ts](../tests/database/migration.test.ts)
- [docs/TECH_ACADEMY_STAGE_1_5_DATA_MAPPING.md](TECH_ACADEMY_STAGE_1_5_DATA_MAPPING.md)

It includes:

- migration environment resolution
- migration plan creation
- duplicate and orphan detection
- dry-run safety checks
- execute-mode guardrails
- migration identity reporting
- requirement-level validation for the stage

---

## Commands available

The repo supports:

```bash
npm run db:check
npm run db:generate
npm run db:migrate -- --dry-run
npm run db:migrate -- --execute
```

The dry-run path is the default and remains the safe command for staged validation.

---

## Test strategy

The migration tests cover:

- inventory generation
- count validation
- required collection detection
- migration plan readiness
- identity safety checks
- dry-run safety checks
- security regression checks

The project also retains the required auth/security regression suite.

---

## Known blockers

The executor remains intentionally conservative because the real production migration still requires:

- verified MongoDB dataset access
- verified PostgreSQL staging target
- confirmed financial reconciliation
- duplicate resolution
- orphan resolution
- explicit approval for execute mode

This stage is therefore not ready for production migration.

---

## Stage 1.5B status

Status: READY FOR DRY RUN

This means the migration executor is available for safe dry-run validation and staged review, but it is not approved for production migration.

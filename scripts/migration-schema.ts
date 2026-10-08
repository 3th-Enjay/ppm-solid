import { getTableConfig } from "drizzle-orm/pg-core"
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

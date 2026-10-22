import { getPostgresDatabase } from "./postgres-db"
import { getDB as getMockDB } from "./mock-db"

let mongoDbInstance: any = null
function getMongoDatabase() {
  if (!mongoDbInstance) {
    const { getDatabase } = require("./mongodb-db")
    mongoDbInstance = getDatabase()
  }
  return mongoDbInstance
}

export function isPostgresBackend(): boolean {
  const backend = process.env.DATABASE_BACKEND?.trim()

  if (backend) {
    if (backend === "postgres") return true
    if (backend === "mongodb") return false
    throw new Error(
      `Invalid DATABASE_BACKEND "${backend}". Supported values are "postgres" or "mongodb".`,
    )
  }

  const hasPgUrl = Boolean(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.MIGRATION_POSTGRES_URL,
  )
  const hasMongoUri = Boolean(process.env.MONGODB_URI)

  if (hasPgUrl && hasMongoUri) {
    throw new Error(
      "Ambiguous database configuration: both PostgreSQL and MongoDB connection strings are present, but DATABASE_BACKEND is not set. Explicitly set DATABASE_BACKEND=postgres.",
    )
  }

  if (hasPgUrl) {
    return true
  }

  if (hasMongoUri) {
    throw new Error(
      "MONGODB_URI is present but DATABASE_BACKEND is not set. To prevent unintended fallbacks, explicitly set DATABASE_BACKEND=mongodb for legacy compatibility, or set DATABASE_BACKEND=postgres and provide DATABASE_URL for PostgreSQL.",
    )
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "No database configured in production environment. Explicit PostgreSQL configuration is required (DATABASE_BACKEND=postgres, DATABASE_URL=...).",
    )
  }

  return false
}

export function getDB() {
  if (isPostgresBackend()) {
    const url =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.MIGRATION_POSTGRES_URL
    if (!url) {
      throw new Error(
        "PostgreSQL backend selected, but no connection string was found. Expected DATABASE_URL or POSTGRES_URL.",
      )
    }
    return getPostgresDatabase()
  }

  const backend = process.env.DATABASE_BACKEND?.trim()
  if (backend === "mongodb") {
    if (!process.env.MONGODB_URI) {
      throw new Error("DATABASE_BACKEND is set to 'mongodb', but MONGODB_URI is missing.")
    }
    return getMongoDatabase()
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Production environment requires PostgreSQL. Configure DATABASE_BACKEND=postgres and DATABASE_URL.",
    )
  }

  return getMockDB()
}

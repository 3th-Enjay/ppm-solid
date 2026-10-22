import { migrate } from "drizzle-orm/node-postgres/migrator"
import { getDrizzleDb, closePool, getPostgresUrl } from "../db/client"

async function runMigration() {
  console.log("Applying PostgreSQL Drizzle migrations to target...")
  const db = getDrizzleDb()
  await migrate(db, { migrationsFolder: "./db/migrations" })
  console.log("Migrations applied successfully.")
  await closePool()
}

runMigration().catch(async (error) => {
  console.error("Migration failed:", error)
  await closePool()
  process.exit(1)
})

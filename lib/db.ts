// Database selector (MongoDB when configured, otherwise mock)
import { getDatabase as getMongoDatabase } from "./mongodb-db"
import { getDB as getMockDB } from "./mock-db"

export function getDB() {
  if (process.env.MONGODB_URI) {
    return getMongoDatabase()
  }
  return getMockDB()
}

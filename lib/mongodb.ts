// MongoDB connection utilities
import { MongoClient } from "mongodb"
import type { Document } from "mongodb"

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || "Prompt Care Academy"


type GlobalMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>
}

const globalWithMongo = global as GlobalMongo

let clientPromise: Promise<MongoClient>
let indexesEnsuredPromise: Promise<void> | null = null

if (process.env.DATABASE_BACKEND === "mongodb" && uri && !globalWithMongo._mongoClientPromise) {
  const client = new MongoClient(uri)
  globalWithMongo._mongoClientPromise = client.connect()
}

clientPromise = globalWithMongo._mongoClientPromise as Promise<MongoClient>

export async function getDatabase() {
  if (process.env.DATABASE_BACKEND !== "mongodb") {
    throw new Error("MongoDB access attempted while DATABASE_BACKEND is not set to 'mongodb'.")
  }
  if (!uri) {
    throw new Error("MONGODB_URI is not set")
  }
  if (!clientPromise) {
    const client = new MongoClient(uri)
    clientPromise = client.connect()
    globalWithMongo._mongoClientPromise = clientPromise
  }
  const client = await clientPromise
  const db = client.db(dbName)
  if (!indexesEnsuredPromise) {
    indexesEnsuredPromise = ensureIndexes(db).catch((error) => {
      console.error("Failed to ensure MongoDB indexes:", error)
    })
  }
  await indexesEnsuredPromise
  return db
}

export async function getCollection<T extends Document>(name: string) {
  const db = await getDatabase()
  return db.collection<T>(name)
}

async function ensureIndexes(db: any) {
  try {
    await db.collection("payments").createIndex({ reference: 1 }, { unique: true, name: "uniq_payments_reference" })
  } catch (error) {
    console.error("payments.reference unique index was not applied automatically.", error)
  }

  try {
    await db
      .collection("enrollments")
      .createIndex({ userId: 1, courseId: 1 }, { unique: true, name: "uniq_enrollments_user_course" })
  } catch (error) {
    console.error("enrollments (userId, courseId) unique index was not applied automatically.", error)
  }

  try {
    await db.collection("payment_events").createIndex({ reference: 1, createdAt: -1 }, { name: "idx_payment_events_ref_created" })
  } catch (error) {
    console.error("payment_events index was not applied automatically.", error)
  }

  try {
    await db
      .collection("pending_registrations")
      .createIndex({ email: 1 }, { unique: true, name: "uniq_pending_registrations_email" })
  } catch (error) {
    console.error("pending_registrations.email unique index was not applied automatically.", error)
  }
}



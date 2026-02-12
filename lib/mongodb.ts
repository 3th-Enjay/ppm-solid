// MongoDB connection utilities
import { MongoClient } from "mongodb"
import type { Document } from "mongodb"

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || "PromptCare Academy"


type GlobalMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>
}

const globalWithMongo = global as GlobalMongo

let clientPromise: Promise<MongoClient>

if (uri && !globalWithMongo._mongoClientPromise) {
  const client = new MongoClient(uri)
  globalWithMongo._mongoClientPromise = client.connect()
}

clientPromise = globalWithMongo._mongoClientPromise as Promise<MongoClient>

export async function getDatabase() {
  if (!uri) {
    throw new Error("MONGODB_URI is not set")
  }
  if (!clientPromise) {
    const client = new MongoClient(uri)
    clientPromise = client.connect()
    globalWithMongo._mongoClientPromise = clientPromise
  }
  const client = await clientPromise
  return client.db(dbName)
}

export async function getCollection<T extends Document>(name: string) {
  const db = await getDatabase()
  return db.collection<T>(name)
}


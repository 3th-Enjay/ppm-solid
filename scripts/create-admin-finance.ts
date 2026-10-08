import bcrypt from "bcryptjs"
import { MongoClient } from "mongodb"

type Role = "admin" | "finance"

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || "learnhub"

if (!uri) {
  throw new Error("MONGODB_URI is required")
}

function parseArg(name: string) {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return undefined
  return process.argv[idx + 1]
}

async function main() {
  const role = parseArg("--role") as Role | undefined
  const email = parseArg("--email")
  const password = parseArg("--password")
  const name = parseArg("--name") || (role === "finance" ? "Finance User" : "Admin User")

  if (!role || (role !== "admin" && role !== "finance")) {
    throw new Error("Missing or invalid --role. Use admin or finance.")
  }
  if (!email || !password) {
    throw new Error("Missing --email or --password")
  }

  const client = new MongoClient(uri!)
  await client.connect()
  const db = client.db(dbName)
  const users = db.collection("users")

  const existing = await users.findOne({ email })
  if (existing) {
    throw new Error("User already exists")
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const now = new Date()

  await users.insertOne({
    email,
    password: hashedPassword,
    name,
    role,
    status: "active",
    emailVerified: true,
    enrolledCourses: [],
    createdAt: now,
    updatedAt: now,
  })

  await client.close()
  console.log(`Created ${role} account for ${email}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

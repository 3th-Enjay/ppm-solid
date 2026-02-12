import { getCollection } from "@/lib/mongodb"
import { adminSettingsSchema } from "@/lib/validation"

export type AdminSettings = {
  siteName: string
  siteDescription: string
  contactEmail: string
  supportEmail: string
  emailNotifications: boolean
  courseApproval: boolean
  autoEnrollment: boolean
  certificateGeneration: boolean
  maintenanceMode: boolean
}

const SETTINGS_DOC_ID = "admin_settings"

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  siteName: "Prompt Care Academy",
  siteDescription: "Professional online learning platform",
  contactEmail: "admin@promptcareacademy.com",
  supportEmail: "support@promptcareacademy.com",
  emailNotifications: true,
  courseApproval: false,
  autoEnrollment: true,
  certificateGeneration: true,
  maintenanceMode: false,
}

type GlobalSettings = typeof globalThis & {
  _adminSettingsCache?: AdminSettings
}

const globalWithSettings = globalThis as GlobalSettings

async function loadFromMongo(): Promise<AdminSettings | null> {
  if (!process.env.MONGODB_URI) return null
  const collection = await getCollection<AdminSettings & { _id: string }>("app_settings")
  const doc = await collection.findOne({ _id: SETTINGS_DOC_ID })
  if (!doc) return null
  const { _id: _unused, ...settings } = doc
  const parsed = adminSettingsSchema.safeParse(settings)
  return parsed.success ? parsed.data : null
}

async function saveToMongo(settings: AdminSettings): Promise<void> {
  if (!process.env.MONGODB_URI) return
  const collection = await getCollection<AdminSettings & { _id: string }>("app_settings")
  await collection.updateOne(
    { _id: SETTINGS_DOC_ID },
    { $set: settings },
    { upsert: true },
  )
}

export async function getAdminSettings(): Promise<AdminSettings> {
  try {
    const mongoSettings = await loadFromMongo()
    if (mongoSettings) return mongoSettings
  } catch {
    // Fall through to in-memory fallback.
  }

  if (!globalWithSettings._adminSettingsCache) {
    globalWithSettings._adminSettingsCache = { ...DEFAULT_ADMIN_SETTINGS }
  }
  return globalWithSettings._adminSettingsCache
}

export async function updateAdminSettings(nextSettings: AdminSettings): Promise<AdminSettings> {
  const parsed = adminSettingsSchema.parse(nextSettings)
  globalWithSettings._adminSettingsCache = parsed

  try {
    await saveToMongo(parsed)
  } catch {
    // Keep in-memory value even if persistence fails.
  }

  return parsed
}


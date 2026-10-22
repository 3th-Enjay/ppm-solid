import { adminSettingsSchema } from "@/lib/validation"
import { isPostgresBackend } from "@/lib/db"
import { getPostgresDatabase } from "@/lib/postgres-db"

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
  homeIntroVideoUrl: string
}

const SETTINGS_DOC_ID = "admin_settings"

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  siteName: process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Technology Academy",
  siteDescription: "Practical technology skills and engineering academy",
  contactEmail: "admissions@techacademy.edu",
  supportEmail: "support@techacademy.edu",
  emailNotifications: true,
  courseApproval: false,
  autoEnrollment: true,
  certificateGeneration: true,
  maintenanceMode: false,
  homeIntroVideoUrl: "",
}

type GlobalSettings = typeof globalThis & {
  _adminSettingsCache?: AdminSettings
}

const globalWithSettings = globalThis as GlobalSettings

async function loadFromDb(): Promise<AdminSettings | null> {
  if (isPostgresBackend()) {
    const pg = getPostgresDatabase()
    const data = await pg.getAppSettings<AdminSettings>(SETTINGS_DOC_ID)
    if (!data) return null
    const parsed = adminSettingsSchema.safeParse(data)
    return parsed.success ? parsed.data : null
  }

  if (process.env.DATABASE_BACKEND !== "mongodb" || !process.env.MONGODB_URI) return null
  const { getCollection } = await import("@/lib/mongodb")
  const collection = await getCollection<AdminSettings & { _id: string }>("app_settings")
  const doc = await collection.findOne({ _id: SETTINGS_DOC_ID })
  if (!doc) return null
  const { _id: _unused, ...settings } = doc
  const parsed = adminSettingsSchema.safeParse(settings)
  return parsed.success ? parsed.data : null
}

async function saveToDb(settings: AdminSettings): Promise<void> {
  if (isPostgresBackend()) {
    const pg = getPostgresDatabase()
    await pg.setAppSettings(SETTINGS_DOC_ID, settings)
    return
  }

  if (process.env.DATABASE_BACKEND !== "mongodb" || !process.env.MONGODB_URI) return
  const { getCollection } = await import("@/lib/mongodb")
  const collection = await getCollection<AdminSettings & { _id: string }>("app_settings")
  await collection.updateOne(
    { _id: SETTINGS_DOC_ID },
    { $set: settings },
    { upsert: true },
  )
}

export async function getAdminSettings(): Promise<AdminSettings> {
  try {
    const dbSettings = await loadFromDb()
    if (dbSettings) return dbSettings
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
    await saveToDb(parsed)
  } catch {
    // Keep in-memory value even if persistence fails.
  }

  return parsed
}




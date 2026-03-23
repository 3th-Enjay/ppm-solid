import { getCollection } from "@/lib/mongodb"
import {
  DEFAULT_ONSITE_TRAINING_CONFIG,
  onsiteTrainingConfigSchema,
  type OnsiteTrainingConfig,
} from "@/lib/onsite-training-shared"

const SETTINGS_DOC_ID = "onsite_training_settings"

type GlobalSettings = typeof globalThis & {
  _onsiteTrainingConfigCache?: OnsiteTrainingConfig
}

const globalWithSettings = globalThis as GlobalSettings

async function loadFromMongo(): Promise<OnsiteTrainingConfig | null> {
  if (!process.env.MONGODB_URI) return null
  const collection = await getCollection<OnsiteTrainingConfig & { _id: string }>("app_settings")
  const doc = await collection.findOne({ _id: SETTINGS_DOC_ID })
  if (!doc) return null
  const { _id: _unused, ...settings } = doc
  const parsed = onsiteTrainingConfigSchema.safeParse(settings)
  return parsed.success ? parsed.data : null
}

async function saveToMongo(settings: OnsiteTrainingConfig): Promise<void> {
  if (!process.env.MONGODB_URI) return
  const collection = await getCollection<OnsiteTrainingConfig & { _id: string }>("app_settings")
  await collection.updateOne({ _id: SETTINGS_DOC_ID }, { $set: settings }, { upsert: true })
}

export async function getOnsiteTrainingConfig(): Promise<OnsiteTrainingConfig> {
  try {
    const mongoSettings = await loadFromMongo()
    if (mongoSettings) return mongoSettings
  } catch {
    // Fall back to in-memory/default settings.
  }

  if (!globalWithSettings._onsiteTrainingConfigCache) {
    globalWithSettings._onsiteTrainingConfigCache = { ...DEFAULT_ONSITE_TRAINING_CONFIG }
  }

  return globalWithSettings._onsiteTrainingConfigCache
}

export async function updateOnsiteTrainingConfig(nextSettings: OnsiteTrainingConfig): Promise<OnsiteTrainingConfig> {
  const parsed = onsiteTrainingConfigSchema.parse(nextSettings)
  globalWithSettings._onsiteTrainingConfigCache = parsed

  try {
    await saveToMongo(parsed)
  } catch {
    // Keep in-memory value even if persistence fails.
  }

  return parsed
}

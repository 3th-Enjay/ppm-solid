import { getCollection } from "@/lib/mongodb"
import {
  buildDefaultCampaignConfig,
  campaignConfigSchema,
  DEFAULT_CAMPAIGN_CONFIG,
  type CampaignConfig,
} from "@/lib/campaign-shared"

const SETTINGS_DOC_ID = "campaign_promptcare_academy_settings"

type GlobalSettings = typeof globalThis & {
  _campaignConfigCache?: CampaignConfig
}

const globalWithSettings = globalThis as GlobalSettings

async function loadFromMongo(): Promise<CampaignConfig | null> {
  if (!process.env.MONGODB_URI) return null
  const collection = await getCollection<CampaignConfig & { _id: string }>("app_settings")
  const doc = await collection.findOne({ _id: SETTINGS_DOC_ID })
  if (!doc) return null
  const { _id: _unused, ...settings } = doc
  const parsed = campaignConfigSchema.safeParse({ ...buildDefaultCampaignConfig(), ...settings })
  return parsed.success ? parsed.data : null
}

async function saveToMongo(settings: CampaignConfig): Promise<void> {
  if (!process.env.MONGODB_URI) return
  const collection = await getCollection<CampaignConfig & { _id: string }>("app_settings")
  await collection.updateOne({ _id: SETTINGS_DOC_ID }, { $set: settings }, { upsert: true })
}

export async function getCampaignConfig(): Promise<CampaignConfig> {
  try {
    const mongoSettings = await loadFromMongo()
    if (mongoSettings) {
      globalWithSettings._campaignConfigCache = mongoSettings
      return mongoSettings
    }
  } catch {
    // Fall back to in-memory/default settings.
  }

  if (!globalWithSettings._campaignConfigCache) {
    globalWithSettings._campaignConfigCache = { ...DEFAULT_CAMPAIGN_CONFIG }
  }

  return globalWithSettings._campaignConfigCache
}

export async function updateCampaignConfig(nextSettings: CampaignConfig): Promise<CampaignConfig> {
  const parsed = campaignConfigSchema.parse(nextSettings)
  globalWithSettings._campaignConfigCache = parsed

  try {
    await saveToMongo(parsed)
  } catch {
    // Keep in-memory value even if persistence fails.
  }

  return parsed
}

import type { Metadata } from "next"
import { getCampaignConfig } from "@/lib/campaign-config"
import { PromptCareCampaignClient } from "./campaign-page-client"

export const metadata: Metadata = {
  title: "Prompt Care Academy Campaign",
  description:
    "Become a world-class certified caregiver in 21 days with Prompt Care Academy's practical Abuja training cohort.",
  openGraph: {
    title: "Become a World-Class Certified Caregiver in 21 Days",
    description:
      "Join Prompt Care Academy for intensive caregiver training in Abuja. Limited slots available.",
    images: ["/promptcare-campaign.jpeg"],
  },
}

export default async function PromptCareCampaignPage() {
  const config = await getCampaignConfig()

  return <PromptCareCampaignClient config={config} />
}

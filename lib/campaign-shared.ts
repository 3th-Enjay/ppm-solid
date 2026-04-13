import { z } from "zod"

const DEFAULT_COUNTDOWN_DURATION_DAYS = 7

export const campaignConfigSchema = z.object({
  heroBadge: z.string().min(2),
  heroTitle: z.string().min(5),
  heroDescription: z.string().min(10),
  campaignImage: z.string().min(2),
  registrationCtaLabel: z.string().min(2),
  registrationHref: z.string().min(2),
  registrationRedirect: z.string().min(2),
  countdownDurationDays: z.number().int().min(1).max(365),
  countdownEndsAt: z.string().min(10),
  costLabel: z.string().min(2),
  costValue: z.string().min(1),
  costSuffix: z.string().min(2),
  cohortLabel: z.string().min(2),
  cohortValue: z.string().min(2),
  cohortDescription: z.string().min(5),
  contactLabel: z.string().min(2),
  contactValue: z.string().min(2),
  contactDescription: z.string().min(5),
  supportPhone: z.string().min(5),
  whatsappNumber: z.string().min(5),
  venueLabel: z.string().min(2),
  venueValue: z.string().min(5),
  startDateLabel: z.string().min(2),
  startDateValue: z.string().min(3),
  durationLabel: z.string().min(2),
  durationValue: z.string().min(2),
  durationDescription: z.string().min(5),
  dateDescription: z.string().min(5),
  venueDescription: z.string().min(5),
  academySectionTitle: z.string().min(5),
  academySectionDescription: z.string().min(5),
  upcomingBatchTitle: z.string().min(5),
  upcomingBatchDescription: z.string().min(10),
  benefits: z.array(z.string().min(2)).min(1),
})

export type CampaignConfig = z.infer<typeof campaignConfigSchema>

export function buildDefaultCampaignConfig(): CampaignConfig {
  return {
    heroBadge: "Prompt Care Academy Campaign",
    heroTitle: "Become a world-class certified caregiver in 21 days",
    heroDescription:
      "Join the training arm of Prompt Home Health and learn with one of Nigeria's home care pioneers through a practical, intensive caregiver program.",
    campaignImage: "/promptcare-campaign.jpeg",
    registrationCtaLabel: "Fill Student Form",
    registrationHref: "https://forms.gle/oD34hY69pXWQC46G6",
    registrationRedirect: "/dashboard/onsite-training",
    countdownDurationDays: DEFAULT_COUNTDOWN_DURATION_DAYS,
    countdownEndsAt: new Date(Date.now() + DEFAULT_COUNTDOWN_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    costLabel: "Cost of Training",
    costValue: "150,000",
    costSuffix: "Naira only",
    cohortLabel: "Session Type",
    cohortValue: "Limited Slot Cohort",
    cohortDescription: "Train with experienced care leaders in a focused practical batch.",
    contactLabel: "Call or WhatsApp",
    contactValue: "09117069490",
    contactDescription: "Reach our team directly for quick answers before you register.",
    supportPhone: "09117069490",
    whatsappNumber: "09117069490",
    venueLabel: "Abuja training venue",
    venueValue: "Suite B16, Area 11 Shopping Complex, Garki, Abuja",
    startDateLabel: "Starts April 20, 2026",
    startDateValue: "20th April, 2026",
    durationLabel: "21-day intensive format",
    durationValue: "21 Days",
    durationDescription: "A focused training experience designed to move learners from interest to confidence quickly.",
    dateDescription: "Limited cohort access for the upcoming Abuja session, with structured practical engagement.",
    venueDescription: "A clear venue that makes it easy for you to plan and arrive prepared.",
    academySectionTitle: "What participants get from this program",
    academySectionDescription: "The Academy Advantage",
    upcomingBatchTitle: "Upcoming Batch",
    upcomingBatchDescription:
      "Secure your spot in the next Abuja cohort and begin your caregiver journey with structured training, hands-on practice, and clear next steps.",
    benefits: [
      "150+ hours of theory and intensive practice",
      "Internationally recognized certification",
      "Official training scrubs and materials",
      "Transcript and recommendation letter",
      "Internship support and specialty modules",
      "CPR and First Aid certification",
    ],
  }
}

export const DEFAULT_CAMPAIGN_CONFIG: CampaignConfig = buildDefaultCampaignConfig()

import type { User } from "@/lib/types"

export type ProfileCompletionItem = {
  key: string
  label: string
  complete: boolean
}

export type ProfileCompletionTracker = {
  percent: number
  completedCount: number
  totalCount: number
  items: ProfileCompletionItem[]
  remainingLabels: string[]
}

export type ResolvedOnboardingState = {
  role: User["role"]
  welcomeSeen: boolean
  profileCompletionPercent: number
  profileCompletion: ProfileCompletionTracker
  checklist: Record<string, boolean>
  onboardingState: User["onboardingState"]
}

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0
}

function buildCompletionTracker(items: ProfileCompletionItem[]): ProfileCompletionTracker {
  const completedCount = items.filter((item) => item.complete).length
  const totalCount = items.length || 1

  return {
    percent: Math.round((completedCount / totalCount) * 100),
    completedCount,
    totalCount,
    items,
    remainingLabels: items.filter((item) => !item.complete).map((item) => item.label),
  }
}

export function getProfileCompletion(user: User): ProfileCompletionTracker {
  if (user.role === "student") {
    const profile = user.studentProfile
    return buildCompletionTracker([
      { key: "name", label: "Full name", complete: hasText(user.name) },
      { key: "email", label: "Email address", complete: hasText(user.email) },
      { key: "phoneNumber", label: "Phone number", complete: hasText(profile?.phoneNumber) },
      { key: "whatsappNumber", label: "WhatsApp number", complete: hasText(profile?.whatsappNumber) },
      { key: "gender", label: "Gender", complete: hasText(profile?.gender) },
      { key: "dateOfBirth", label: "Date of birth", complete: hasText(profile?.dateOfBirth) },
      { key: "currentAddress", label: "Current address", complete: hasText(profile?.currentAddress) },
      {
        key: "isHealthcareProfessional",
        label: "Healthcare background",
        complete: typeof profile?.isHealthcareProfessional === "boolean",
      },
      { key: "currentRoleOrField", label: "Current role or field", complete: hasText(profile?.currentRoleOrField) },
      { key: "preferredLocation", label: "Preferred location", complete: hasText(profile?.preferredLocation) },
      { key: "trainingInterest", label: "Training interest", complete: hasText(profile?.trainingInterest) },
      { key: "bio", label: "Short bio", complete: hasText(user.bio) },
    ])
  }

  if (user.role === "instructor") {
    const profile = user.instructorProfile
    return buildCompletionTracker([
      { key: "name", label: "Full name", complete: hasText(user.name) },
      { key: "email", label: "Email address", complete: hasText(user.email) },
      { key: "phoneNumber", label: "Phone number", complete: hasText(profile?.phoneNumber) },
      {
        key: "professionalHeadline",
        label: "Professional headline",
        complete: hasText(profile?.professionalHeadline),
      },
      {
        key: "specialties",
        label: "Specialties",
        complete: Array.isArray(profile?.specialties) && profile.specialties.length > 0,
      },
      {
        key: "yearsOfExperience",
        label: "Years of experience",
        complete: typeof profile?.yearsOfExperience === "number" && profile.yearsOfExperience > 0,
      },
      { key: "bio", label: "Instructor bio", complete: hasText(user.bio) },
      { key: "avatar", label: "Profile photo", complete: hasText(user.avatar) },
    ])
  }

  return buildCompletionTracker([])
}

export function getProfileCompletionPercent(user: User): number {
  return getProfileCompletion(user).percent
}

export async function resolveOnboardingState(db: any, user: User): Promise<ResolvedOnboardingState> {
  const onboardingState = user.onboardingState || {}
  const profileCompletion = getProfileCompletion(user)
  const profileCompletionPercent = profileCompletion.percent

  if (user.role === "student") {
    return {
      role: user.role,
      welcomeSeen: Boolean(onboardingState.welcomeSeenAt),
      profileCompletionPercent,
      profileCompletion,
      checklist: {
        completeProfile: profileCompletionPercent >= 100,
        exploreCourses: (user.enrolledCourses || []).length > 0,
        viewOnsiteTraining: Boolean(onboardingState.viewedOnsiteTrainingAt),
      },
      onboardingState,
    }
  }

  if (user.role === "instructor") {
    const courses = typeof db.getCoursesByInstructor === "function" ? await db.getCoursesByInstructor(user.id) : []
    return {
      role: user.role,
      welcomeSeen: Boolean(onboardingState.welcomeSeenAt),
      profileCompletionPercent,
      profileCompletion,
      checklist: {
        completeProfile: profileCompletionPercent >= 100,
        reviewPublishingGuidelines: Boolean(onboardingState.reviewedPublishingGuidelinesAt),
        createFirstCourse: (courses || []).length > 0,
      },
      onboardingState,
    }
  }

  return {
    role: user.role,
    welcomeSeen: Boolean(onboardingState.welcomeSeenAt),
    profileCompletionPercent,
    profileCompletion,
    checklist: {},
    onboardingState,
  }
}

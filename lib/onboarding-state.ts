import type { User } from "@/lib/types"

export type ResolvedOnboardingState = {
  role: User["role"]
  welcomeSeen: boolean
  profileCompletionPercent: number
  checklist: Record<string, boolean>
  onboardingState: User["onboardingState"]
}

function countFilled(values: Array<string | undefined | null | boolean>) {
  return values.filter((value) => {
    if (typeof value === "boolean") {
      return value
    }
    return typeof value === "string" && value.trim().length > 0
  }).length
}

export function getProfileCompletionPercent(user: User): number {
  if (user.role === "student") {
    const profile = user.studentProfile
    const total = 8
    const filled = countFilled([
      user.name,
      user.email,
      profile?.phoneNumber,
      profile?.whatsappNumber,
      profile?.currentAddress,
      profile?.dateOfBirth,
      profile?.currentRoleOrField,
      user.bio,
    ])
    return Math.round((filled / total) * 100)
  }

  if (user.role === "instructor") {
    const profile = user.instructorProfile
    const total = 7
    const filled = countFilled([
      user.name,
      user.email,
      profile?.phoneNumber,
      profile?.professionalHeadline,
      Array.isArray(profile?.specialties) && profile.specialties.length > 0,
      user.bio,
      user.avatar,
    ])
    return Math.round((filled / total) * 100)
  }

  return 100
}

export async function resolveOnboardingState(db: any, user: User): Promise<ResolvedOnboardingState> {
  const onboardingState = user.onboardingState || {}
  const profileCompletionPercent = getProfileCompletionPercent(user)

  if (user.role === "student") {
    return {
      role: user.role,
      welcomeSeen: Boolean(onboardingState.welcomeSeenAt),
      profileCompletionPercent,
      checklist: {
        completeProfile: profileCompletionPercent >= 70,
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
      checklist: {
        completeProfile: profileCompletionPercent >= 70,
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
    checklist: {},
    onboardingState,
  }
}

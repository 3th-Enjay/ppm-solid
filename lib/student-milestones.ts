import type {
  Certificate,
  Enrollment,
  LearningNote,
  StudentMilestone,
  StudentMilestoneCategory,
  StudentMilestoneKey,
  User,
} from "@/lib/types"

type StudentMilestoneDefinition = {
  key: StudentMilestoneKey
  title: string
  description: string
  category: StudentMilestoneCategory
  icon: string
  order: number
}

export type StudentMilestoneEffort = "Quick win" | "In reach" | "Longer arc"
export type StudentMilestoneTone = "sky" | "emerald" | "amber" | "violet" | "rose" | "indigo" | "slate"

export type StudentMilestoneSummaryItem = StudentMilestoneDefinition & {
  unlockedAt?: Date
  progressValue?: number
  targetValue?: number
  progressPercent?: number
  progressLabel?: string
  effortLabel?: StudentMilestoneEffort
  tone?: StudentMilestoneTone
}

export type StudentMilestoneCategoryProgress = {
  category: StudentMilestoneCategory
  label: string
  unlocked: number
  total: number
  tone: StudentMilestoneTone
  summary: string
}

export type StudentMilestoneSummary = {
  totalUnlocked: number
  totalAvailable: number
  remainingCount: number
  progressPercent: number
  featured: StudentMilestoneSummaryItem | null
  recent: StudentMilestoneSummaryItem[]
  nextUp: StudentMilestoneSummaryItem[]
  categories: StudentMilestoneCategoryProgress[]
}

export type StudentMilestoneSummaryInput = {
  enrollments?: Enrollment[]
  notes?: LearningNote[]
  certificates?: Certificate[]
}

export const STUDENT_MILESTONE_DEFINITIONS: StudentMilestoneDefinition[] = [
  {
    key: "student_activated",
    title: "Student Activated",
    description: "Your account is verified and ready for learning.",
    category: "onboarding",
    icon: "user-check",
    order: 1,
  },
  {
    key: "welcome_aboard",
    title: "Welcome Aboard",
    description: "You completed your first welcome step inside the student journey.",
    category: "onboarding",
    icon: "sparkles",
    order: 2,
  },
  {
    key: "profile_starter",
    title: "Profile Starter",
    description: "You opened the guided setup flow and started shaping your learner identity.",
    category: "profile",
    icon: "clipboard-list",
    order: 3,
  },
  {
    key: "profile_complete",
    title: "Profile Complete",
    description: "Your learner profile is fully complete and ready to guide recommendations.",
    category: "completion",
    icon: "badge-check",
    order: 4,
  },
  {
    key: "first_dashboard_visit",
    title: "First Dashboard Visit",
    description: "You stepped into your main learning dashboard for the first time.",
    category: "onboarding",
    icon: "layout-dashboard",
    order: 5,
  },
  {
    key: "onsite_interested",
    title: "Onsite Interested",
    description: "You explored the onsite training upgrade from your dashboard.",
    category: "onsite",
    icon: "map-pinned",
    order: 6,
  },
  {
    key: "onsite_learner",
    title: "Onsite Learner",
    description: "You secured your onsite training path and unlocked the premium track.",
    category: "onsite",
    icon: "graduation-cap",
    order: 7,
  },
  {
    key: "first_enrollment",
    title: "First Enrollment",
    description: "You enrolled in your first course and officially began learning.",
    category: "learning",
    icon: "book-open",
    order: 8,
  },
  {
    key: "course_finisher",
    title: "Course Finisher",
    description: "You completed your first course milestone and crossed the finish line.",
    category: "learning",
    icon: "trophy",
    order: 9,
  },
  {
    key: "identity_confirmed",
    title: "Identity Confirmed",
    description: "Your core learner identity details are complete and trustworthy.",
    category: "profile",
    icon: "badge-check",
    order: 10,
  },
  {
    key: "course_explorer",
    title: "Course Explorer",
    description: "You moved beyond onboarding and started exploring your learning path.",
    category: "learning",
    icon: "layout-dashboard",
    order: 11,
  },
  {
    key: "lesson_starter",
    title: "Lesson Starter",
    description: "You completed your first lesson and turned enrollment into momentum.",
    category: "learning",
    icon: "book-open",
    order: 12,
  },
  {
    key: "steady_learner",
    title: "Steady Learner",
    description: "You built steady course momentum with multiple completed lessons.",
    category: "consistency",
    icon: "sparkles",
    order: 13,
  },
  {
    key: "focused_learner",
    title: "Focused Learner",
    description: "Your lesson progress shows real focus and follow-through.",
    category: "consistency",
    icon: "target",
    order: 14,
  },
  {
    key: "learning_streak",
    title: "Learning Streak",
    description: "You showed up on multiple learning days and built visible consistency.",
    category: "consistency",
    icon: "sparkles",
    order: 15,
  },
  {
    key: "note_taker",
    title: "Note Taker",
    description: "You captured a learning note and started building your personal study trail.",
    category: "learning",
    icon: "clipboard-list",
    order: 16,
  },
  {
    key: "progress_builder",
    title: "Progress Builder",
    description: "You pushed a course far enough to prove real learning momentum.",
    category: "progress",
    icon: "target",
    order: 17,
  },
  {
    key: "halfway_there",
    title: "Halfway There",
    description: "You reached the halfway point in a course and kept the pressure on.",
    category: "progress",
    icon: "target",
    order: 18,
  },
  {
    key: "almost_done",
    title: "Almost Done",
    description: "You are close to completion and one strong push away from the finish line.",
    category: "progress",
    icon: "trophy",
    order: 19,
  },
  {
    key: "certified_learner",
    title: "Certified Learner",
    description: "You earned a certificate and turned your progress into a verified outcome.",
    category: "completion",
    icon: "badge-check",
    order: 20,
  },
]

const milestoneDefinitionsByKey = new Map(
  STUDENT_MILESTONE_DEFINITIONS.map((definition) => [definition.key, definition]),
)

const CATEGORY_META: Record<
  StudentMilestoneCategory,
  { label: string; tone: StudentMilestoneTone; summary: string }
> = {
  onboarding: {
    label: "Onboarding",
    tone: "sky",
    summary: "Early account and welcome actions that get the learner journey moving.",
  },
  profile: {
    label: "Profile",
    tone: "emerald",
    summary: "Identity details that make the learner record more complete and trustworthy.",
  },
  learning: {
    label: "Learning",
    tone: "violet",
    summary: "Active study actions like enrollment, lesson progress, and note-taking.",
  },
  onsite: {
    label: "Onsite",
    tone: "amber",
    summary: "Premium onsite exploration, activation, and payment milestones.",
  },
  completion: {
    label: "Completion",
    tone: "rose",
    summary: "Big finish-line moments such as full profile completion and certification.",
  },
  consistency: {
    label: "Consistency",
    tone: "indigo",
    summary: "Repeated learning behavior that proves steady momentum over time.",
  },
  progress: {
    label: "Progress",
    tone: "slate",
    summary: "Course depth markers that show how far the learner has pushed a course.",
  },
}

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0
}

function clampProgress(value: number, target: number) {
  const safeTarget = Math.max(target, 1)
  return Math.max(0, Math.min(value, safeTarget))
}

function buildProfileCompletionSnapshot(user: User) {
  const profile = user.studentProfile
  const items = [
    hasText(user.name),
    hasText(user.email),
    hasText(profile?.phoneNumber),
    hasText(profile?.whatsappNumber),
    hasText(profile?.gender),
    hasText(profile?.dateOfBirth),
    hasText(profile?.currentAddress),
    typeof profile?.isHealthcareProfessional === "boolean",
    hasText(profile?.currentRoleOrField),
    hasText(profile?.preferredLocation),
    hasText(profile?.trainingInterest),
    hasText(user.bio),
  ]

  return {
    completedCount: items.filter(Boolean).length,
    totalCount: items.length,
  }
}

function isStudentProfileComplete(user: User) {
  const snapshot = buildProfileCompletionSnapshot(user)
  return snapshot.completedCount === snapshot.totalCount
}

function toDate(value: Date | string | undefined) {
  if (!value) return undefined
  return value instanceof Date ? value : new Date(value)
}

function toDayKey(value: Date | string | undefined) {
  const date = toDate(value)
  if (!date || Number.isNaN(date.getTime())) return undefined
  return date.toISOString().slice(0, 10)
}

type StudentMilestoneContext = {
  user: User
  enrollments: Enrollment[]
  notes: LearningNote[]
  certificates: Certificate[]
  totalCompletedLessons: number
  maxProgress: number
  distinctActivityDays: number
  consecutiveActivityDays: number
  noteCount: number
}

type MilestoneProgressSnapshot = {
  progressValue: number
  targetValue: number
  progressPercent: number
  progressLabel: string
}

function getConsecutiveActivityDays(dayKeys: string[]) {
  if (dayKeys.length === 0) return 0

  const sorted = [...new Set(dayKeys)].sort()
  let streak = 1

  for (let index = sorted.length - 1; index > 0; index -= 1) {
    const current = new Date(`${sorted[index]}T00:00:00.000Z`)
    const previous = new Date(`${sorted[index - 1]}T00:00:00.000Z`)
    const diffInDays = Math.round((current.getTime() - previous.getTime()) / 86400000)

    if (diffInDays === 1) {
      streak += 1
      continue
    }

    break
  }

  return streak
}

function getMilestoneEffortLabel(key: StudentMilestoneKey): StudentMilestoneEffort {
  switch (key) {
    case "student_activated":
    case "welcome_aboard":
    case "profile_starter":
    case "first_dashboard_visit":
    case "onsite_interested":
    case "first_enrollment":
    case "course_explorer":
    case "lesson_starter":
    case "note_taker":
      return "Quick win"
    case "profile_complete":
    case "identity_confirmed":
    case "onsite_learner":
    case "steady_learner":
    case "progress_builder":
    case "halfway_there":
    case "learning_streak":
      return "In reach"
    default:
      return "Longer arc"
  }
}

function buildMilestoneContext(
  user: User,
  enrollments: Enrollment[] = [],
  notes: LearningNote[] = [],
  certificates: Certificate[] = [],
): StudentMilestoneContext {
  const totalCompletedLessons = enrollments.reduce(
    (total, enrollment) => total + (enrollment.completedLessons || []).length,
    0,
  )
  const maxProgress = enrollments.reduce(
    (highest, enrollment) => Math.max(highest, enrollment.progress || 0),
    0,
  )
  const activityDayKeys = new Set<string>()

  ;[
    ...enrollments.map((item) => item.enrolledAt),
    ...enrollments.map((item) => item.completedAt),
    ...notes.map((item) => item.createdAt),
    ...certificates.map((item) => item.issuedAt),
  ].forEach((value) => {
    const key = toDayKey(value)
    if (key) {
      activityDayKeys.add(key)
    }
  })

  const orderedActivityDays = [...activityDayKeys].sort()

  return {
    user,
    enrollments,
    notes,
    certificates,
    totalCompletedLessons,
    maxProgress,
    distinctActivityDays: activityDayKeys.size,
    consecutiveActivityDays: getConsecutiveActivityDays(orderedActivityDays),
    noteCount: notes.length,
  }
}

function getMilestoneProgress(context: StudentMilestoneContext, key: StudentMilestoneKey): MilestoneProgressSnapshot {
  const { user, enrollments, notes, certificates, totalCompletedLessons, maxProgress, distinctActivityDays, consecutiveActivityDays, noteCount } = context
  const onboardingState = user.onboardingState || {}
  const profileSnapshot = buildProfileCompletionSnapshot(user)
  const isOnsitePath = Boolean(
    user.studentProfile &&
      (user.studentProfile.trainingMode === "onsite" ||
        (!user.studentProfile.trainingMode && (user.studentProfile.registrationFeeNgn || 0) > 0)),
  )

  switch (key) {
    case "student_activated": {
      const progressValue = user.emailVerified ? 1 : 0
      return {
        progressValue,
        targetValue: 1,
        progressPercent: progressValue * 100,
        progressLabel: progressValue ? "Account verified" : "Verify your account",
      }
    }
    case "welcome_aboard": {
      const progressValue = onboardingState.welcomeSeenAt ? 1 : 0
      return {
        progressValue,
        targetValue: 1,
        progressPercent: progressValue * 100,
        progressLabel: progressValue ? "Welcome completed" : "Open your welcome journey",
      }
    }
    case "profile_starter": {
      const progressValue = onboardingState.profileSetupStartedAt ? 1 : 0
      return {
        progressValue,
        targetValue: 1,
        progressPercent: progressValue * 100,
        progressLabel: progressValue ? "Setup started" : "Open guided setup",
      }
    }
    case "profile_complete": {
      const progressValue = profileSnapshot.completedCount
      const targetValue = profileSnapshot.totalCount || 1
      return {
        progressValue,
        targetValue,
        progressPercent: Math.round((progressValue / targetValue) * 100),
        progressLabel: `${progressValue}/${targetValue} profile items complete`,
      }
    }
    case "first_dashboard_visit": {
      const progressValue = onboardingState.dashboardVisitedAt ? 1 : 0
      return {
        progressValue,
        targetValue: 1,
        progressPercent: progressValue * 100,
        progressLabel: progressValue ? "Dashboard visited" : "Open the learner dashboard",
      }
    }
    case "onsite_interested": {
      const progressValue = onboardingState.viewedOnsiteTrainingAt ? 1 : 0
      return {
        progressValue,
        targetValue: 1,
        progressPercent: progressValue * 100,
        progressLabel: progressValue ? "Onsite page explored" : "Visit the onsite pathway",
      }
    }
    case "onsite_learner": {
      const progressValue = user.studentProfile?.paymentStatus === "yes" ? 2 : isOnsitePath ? 1 : 0
      const targetValue = 2
      return {
        progressValue,
        targetValue,
        progressPercent: Math.round((progressValue / targetValue) * 100),
        progressLabel:
          progressValue >= 2
            ? "Premium track active"
            : progressValue === 1
              ? "Onsite route created, payment pending"
              : "Choose and activate the onsite route",
      }
    }
    case "first_enrollment": {
      const progressValue = enrollments.length > 0 || (user.enrolledCourses || []).length > 0 ? 1 : 0
      return {
        progressValue,
        targetValue: 1,
        progressPercent: progressValue * 100,
        progressLabel: progressValue ? "First course enrolled" : "Enroll in your first course",
      }
    }
    case "course_finisher": {
      const progressValue = enrollments.some((enrollment) => enrollment.status === "completed" || enrollment.progress >= 100) ? 100 : maxProgress
      return {
        progressValue: clampProgress(progressValue, 100),
        targetValue: 100,
        progressPercent: clampProgress(progressValue, 100),
        progressLabel: `${clampProgress(progressValue, 100)}% toward a completed course`,
      }
    }
    case "identity_confirmed": {
      const progressValue = [
        user.emailVerified,
        hasText(user.name),
        hasText(user.studentProfile?.phoneNumber),
        hasText(user.studentProfile?.whatsappNumber),
      ].filter(Boolean).length
      const targetValue = 4
      return {
        progressValue,
        targetValue,
        progressPercent: Math.round((progressValue / targetValue) * 100),
        progressLabel: `${progressValue}/${targetValue} identity checks complete`,
      }
    }
    case "course_explorer": {
      const progressValue = onboardingState.dashboardVisitedAt || enrollments.length > 0 || notes.length > 0 ? 1 : 0
      return {
        progressValue,
        targetValue: 1,
        progressPercent: progressValue * 100,
        progressLabel: progressValue ? "Learning path explored" : "Browse your learning path",
      }
    }
    case "lesson_starter": {
      const progressValue = totalCompletedLessons > 0 || maxProgress > 0 ? 1 : 0
      return {
        progressValue,
        targetValue: 1,
        progressPercent: progressValue * 100,
        progressLabel: progressValue ? "First lesson momentum started" : "Complete your first lesson",
      }
    }
    case "steady_learner": {
      const progressValue = clampProgress(Math.max(totalCompletedLessons, Math.round(maxProgress / 10)), 3)
      return {
        progressValue,
        targetValue: 3,
        progressPercent: Math.round((progressValue / 3) * 100),
        progressLabel: `${progressValue}/3 steady-learning milestones reached`,
      }
    }
    case "focused_learner": {
      const progressValue = clampProgress(Math.max(totalCompletedLessons, Math.round(maxProgress / 5)), 8)
      return {
        progressValue,
        targetValue: 8,
        progressPercent: Math.round((progressValue / 8) * 100),
        progressLabel: `${progressValue}/8 focus markers reached`,
      }
    }
    case "learning_streak": {
      const progressValue = clampProgress(consecutiveActivityDays, 3)
      return {
        progressValue,
        targetValue: 3,
        progressPercent: Math.round((progressValue / 3) * 100),
        progressLabel:
          progressValue >= 3
            ? "Three-day learning streak reached"
            : `${progressValue}/3 consecutive learning days`,
      }
    }
    case "note_taker": {
      const progressValue = clampProgress(noteCount, 3)
      return {
        progressValue,
        targetValue: 3,
        progressPercent: Math.round((progressValue / 3) * 100),
        progressLabel:
          noteCount > 0
            ? `${noteCount} study note${noteCount === 1 ? "" : "s"} captured`
            : "Create your first study note",
      }
    }
    case "progress_builder": {
      const progressValue = clampProgress(maxProgress, 25)
      return {
        progressValue,
        targetValue: 25,
        progressPercent: Math.round((progressValue / 25) * 100),
        progressLabel: `${progressValue}% of 25% progress reached`,
      }
    }
    case "halfway_there": {
      const progressValue = clampProgress(maxProgress, 50)
      return {
        progressValue,
        targetValue: 50,
        progressPercent: Math.round((progressValue / 50) * 100),
        progressLabel: `${progressValue}% of 50% progress reached`,
      }
    }
    case "almost_done": {
      const progressValue = clampProgress(maxProgress, 90)
      return {
        progressValue,
        targetValue: 90,
        progressPercent: Math.round((progressValue / 90) * 100),
        progressLabel: `${progressValue}% of 90% progress reached`,
      }
    }
    case "certified_learner": {
      const progressValue = certificates.length > 0 ? 1 : 0
      return {
        progressValue,
        targetValue: 1,
        progressPercent: progressValue * 100,
        progressLabel: progressValue ? "Certificate earned" : "Complete a course and earn certification",
      }
    }
    default:
      return {
        progressValue: 0,
        targetValue: 1,
        progressPercent: 0,
        progressLabel: "Progress not available yet",
      }
  }
}

function isUnlocked(context: StudentMilestoneContext, key: StudentMilestoneKey) {
  const { user, enrollments, notes, certificates, totalCompletedLessons, maxProgress, consecutiveActivityDays } = context
  const onboardingState = user.onboardingState || {}

  switch (key) {
    case "student_activated":
      return Boolean(user.emailVerified)
    case "welcome_aboard":
      return Boolean(onboardingState.welcomeSeenAt)
    case "profile_starter":
      return Boolean(onboardingState.profileSetupStartedAt)
    case "profile_complete":
      return isStudentProfileComplete(user)
    case "first_dashboard_visit":
      return Boolean(onboardingState.dashboardVisitedAt)
    case "onsite_interested":
      return Boolean(onboardingState.viewedOnsiteTrainingAt)
    case "onsite_learner":
      return user.studentProfile?.paymentStatus === "yes"
    case "first_enrollment":
      return enrollments.length > 0 || (user.enrolledCourses || []).length > 0
    case "course_finisher":
      return enrollments.some((enrollment) => enrollment.status === "completed" || enrollment.progress >= 100)
    case "identity_confirmed":
      return Boolean(user.emailVerified && hasText(user.name) && hasText(user.studentProfile?.phoneNumber) && hasText(user.studentProfile?.whatsappNumber))
    case "course_explorer":
      return Boolean(onboardingState.dashboardVisitedAt || enrollments.length > 0 || notes.length > 0)
    case "lesson_starter":
      return totalCompletedLessons > 0 || maxProgress > 0
    case "steady_learner":
      return totalCompletedLessons >= 3 || maxProgress >= 20
    case "focused_learner":
      return totalCompletedLessons >= 8 || maxProgress >= 40
    case "learning_streak":
      return consecutiveActivityDays >= 3
    case "note_taker":
      return notes.length > 0
    case "progress_builder":
      return maxProgress >= 25
    case "halfway_there":
      return maxProgress >= 50
    case "almost_done":
      return enrollments.some((enrollment) => enrollment.progress >= 90 && enrollment.progress < 100)
    case "certified_learner":
      return certificates.length > 0
    default:
      return false
  }
}

export async function syncStudentMilestones(db: any, input: User | string): Promise<User> {
  const user = typeof input === "string" ? await db.findUserById(input) : input
  if (!user || user.role !== "student") {
    return user
  }

  const [enrollments, notes, certificates] = await Promise.all([
    typeof db.getEnrollmentsByUserId === "function" ? db.getEnrollmentsByUserId(user.id) : Promise.resolve([]),
    typeof db.getNotesByUserId === "function" ? db.getNotesByUserId(user.id) : Promise.resolve([]),
    typeof db.getCertificatesByUserId === "function" ? db.getCertificatesByUserId(user.id) : Promise.resolve([]),
  ])

  const context = buildMilestoneContext(user, enrollments || [], notes || [], certificates || [])
  const existingMilestones: StudentMilestone[] = Array.isArray(user.studentMilestones) ? user.studentMilestones : []
  const existingKeys = new Set(existingMilestones.map((milestone) => milestone.key))
  const nextMilestones = [...existingMilestones]
  let changed = false

  for (const definition of STUDENT_MILESTONE_DEFINITIONS) {
    if (!isUnlocked(context, definition.key) || existingKeys.has(definition.key)) {
      continue
    }

    nextMilestones.push({
      key: definition.key,
      title: definition.title,
      description: definition.description,
      category: definition.category,
      unlockedAt: new Date(),
    })
    existingKeys.add(definition.key)
    changed = true
  }

  if (!changed) {
    return {
      ...user,
      studentMilestones: nextMilestones,
    }
  }

  const updatedUser = await db.updateUser(user.id, {
    studentMilestones: nextMilestones,
  })

  return (updatedUser || {
    ...user,
    studentMilestones: nextMilestones,
  }) as User
}

export function buildStudentMilestoneSummary(
  user: User,
  input: StudentMilestoneSummaryInput = {},
): StudentMilestoneSummary {
  const context = buildMilestoneContext(user, input.enrollments || [], input.notes || [], input.certificates || [])

  const unlockedMilestones = (user.studentMilestones || [])
    .map((milestone) => {
      const definition = milestoneDefinitionsByKey.get(milestone.key)
      if (!definition) return null

      return {
        ...definition,
        unlockedAt: toDate(milestone.unlockedAt),
        tone: CATEGORY_META[definition.category].tone,
        effortLabel: getMilestoneEffortLabel(milestone.key),
        ...getMilestoneProgress(context, milestone.key),
      }
    })
    .filter(Boolean) as StudentMilestoneSummaryItem[]

  const recent = [...unlockedMilestones].sort((a, b) => {
    const aTime = a.unlockedAt ? a.unlockedAt.getTime() : 0
    const bTime = b.unlockedAt ? b.unlockedAt.getTime() : 0
    return bTime - aTime
  })

  const unlockedKeys = new Set(unlockedMilestones.map((milestone) => milestone.key))
  const nextUp = STUDENT_MILESTONE_DEFINITIONS.filter((definition) => !unlockedKeys.has(definition.key))
    .slice(0, 4)
    .map((definition) => ({
      ...definition,
      tone: CATEGORY_META[definition.category].tone,
      effortLabel: getMilestoneEffortLabel(definition.key),
      ...getMilestoneProgress(context, definition.key),
    }))

  const totalAvailable = STUDENT_MILESTONE_DEFINITIONS.length || 1
  const totalUnlocked = unlockedMilestones.length
  const categories = Object.entries(CATEGORY_META).map(([category, meta]) => {
    const typedCategory = category as StudentMilestoneCategory
    const total = STUDENT_MILESTONE_DEFINITIONS.filter((definition) => definition.category === typedCategory).length
    const unlocked = unlockedMilestones.filter((milestone) => milestone.category === typedCategory).length

    return {
      category: typedCategory,
      label: meta.label,
      unlocked,
      total,
      tone: meta.tone,
      summary: meta.summary,
    }
  })

  return {
    totalUnlocked,
    totalAvailable,
    remainingCount: Math.max(totalAvailable - totalUnlocked, 0),
    progressPercent: Math.round((totalUnlocked / totalAvailable) * 100),
    featured: recent[0] || null,
    recent: recent.slice(0, 6),
    nextUp,
    categories,
  }
}

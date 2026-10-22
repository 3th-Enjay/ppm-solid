export interface QuizAttemptAnswer {
  questionId: string
  selectedOption: number
  isCorrect?: boolean
  score?: number
}

export interface QuizAttempt {
  id: string
  quizId: string
  courseId: string
  lessonId?: string
  userId: string
  status: "in_progress" | "completed" | "abandoned"
  score?: number
  maxScore: number
  passed?: boolean
  answers: QuizAttemptAnswer[]
  startedAt: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AssignmentSubmission {
  id: string
  assignmentId: string
  courseId: string
  lessonId?: string
  userId: string
  attemptNumber: number
  content?: string
  artifactUrls: string[]
  status: "draft" | "submitted" | "graded" | "resubmission_requested"
  submittedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface RubricCriterion {
  id: string
  title: string
  description?: string
  maxPoints: number
}

export interface Rubric {
  id: string
  courseId: string
  assignmentId?: string
  projectId?: string
  title: string
  description?: string
  criteria: RubricCriterion[]
  totalMaxPoints: number
  createdAt: Date
  updatedAt: Date
}

export interface RubricScoreItem {
  criterionId: string
  points: number
  comment?: string
}

export interface Grade {
  id: string
  submissionType: "assignment" | "project"
  submissionId: string
  courseId: string
  studentId: string
  instructorId: string
  score: number
  maxScore: number
  rubricScores: RubricScoreItem[]
  feedback?: string
  status: "draft" | "published"
  releasedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface GradeHistoryEntry {
  id: string
  gradeId: string
  changedBy: string
  previousScore: number
  newScore: number
  previousFeedback?: string
  newFeedback?: string
  reason?: string
  createdAt: Date
}

export interface Project {
  id: string
  courseId: string
  title: string
  description: string
  instructions?: string
  maxScore: number
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ProjectArtifactItem {
  name: string
  url: string
  type: string
  sizeBytes?: number
}

export interface ProjectSubmission {
  id: string
  projectId: string
  courseId: string
  userId: string
  title: string
  description?: string
  repositoryUrl?: string
  liveDemoUrl?: string
  artifacts: ProjectArtifactItem[]
  status: "submitted" | "under_review" | "approved" | "changes_requested"
  submittedAt: Date
  createdAt: Date
  updatedAt: Date
}

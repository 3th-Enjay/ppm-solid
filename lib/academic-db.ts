import { and, asc, desc, eq, sql } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import { getDrizzleDb } from "@/db/client"
import * as schema from "@/db/schema"
import type {
  Assignment,
  AssignmentSubmission,
  Grade,
  GradeHistoryEntry,
  Project,
  ProjectArtifactItem,
  ProjectSubmission,
  Quiz,
  QuizAttempt,
  QuizAttemptAnswer,
  QuizQuestion,
  Rubric,
  RubricCriterion,
  RubricScoreItem,
} from "./types"

// Helper converters
function toQuizAttempt(row: typeof schema.quizAttempts.$inferSelect): QuizAttempt {
  return {
    id: row.id,
    quizId: row.quizId,
    courseId: row.courseId,
    lessonId: row.lessonId ?? undefined,
    userId: row.userId,
    status: row.status as QuizAttempt["status"],
    score: row.score ?? undefined,
    maxScore: row.maxScore,
    passed: row.passed ?? undefined,
    answers: (row.answers as QuizAttemptAnswer[]) ?? [],
    startedAt: row.startedAt,
    completedAt: row.completedAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function toAssignmentSubmission(row: typeof schema.assignmentSubmissions.$inferSelect): AssignmentSubmission {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    courseId: row.courseId,
    lessonId: row.lessonId ?? undefined,
    userId: row.userId,
    attemptNumber: row.attemptNumber,
    content: row.content ?? undefined,
    artifactUrls: (row.artifactUrls as string[]) ?? [],
    status: row.status as AssignmentSubmission["status"],
    submittedAt: row.submittedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function toRubric(row: typeof schema.rubrics.$inferSelect): Rubric {
  return {
    id: row.id,
    courseId: row.courseId,
    assignmentId: row.assignmentId ?? undefined,
    projectId: row.projectId ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    criteria: (row.criteria as RubricCriterion[]) ?? [],
    totalMaxPoints: row.totalMaxPoints,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function toGrade(row: typeof schema.grades.$inferSelect): Grade {
  return {
    id: row.id,
    submissionType: row.submissionType as Grade["submissionType"],
    submissionId: row.submissionId,
    courseId: row.courseId,
    studentId: row.studentId,
    instructorId: row.instructorId,
    score: row.score,
    maxScore: row.maxScore,
    rubricScores: (row.rubricScores as RubricScoreItem[]) ?? [],
    feedback: row.feedback ?? undefined,
    status: row.status as Grade["status"],
    releasedAt: row.releasedAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function toGradeHistory(row: typeof schema.gradeHistory.$inferSelect): GradeHistoryEntry {
  return {
    id: row.id,
    gradeId: row.gradeId,
    changedBy: row.changedBy,
    previousScore: row.previousScore,
    newScore: row.newScore,
    previousFeedback: row.previousFeedback ?? undefined,
    newFeedback: row.newFeedback ?? undefined,
    reason: row.reason ?? undefined,
    createdAt: row.createdAt,
  }
}

function toProject(row: typeof schema.projects.$inferSelect): Project {
  return {
    id: row.id,
    courseId: row.courseId,
    title: row.title,
    description: row.description,
    instructions: row.instructions ?? undefined,
    maxScore: row.maxScore,
    dueDate: row.dueDate ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function toProjectSubmission(row: typeof schema.projectSubmissions.$inferSelect): ProjectSubmission {
  return {
    id: row.id,
    projectId: row.projectId,
    courseId: row.courseId,
    userId: row.userId,
    title: row.title,
    description: row.description ?? undefined,
    repositoryUrl: row.repositoryUrl ?? undefined,
    liveDemoUrl: row.liveDemoUrl ?? undefined,
    artifacts: (row.artifacts as ProjectArtifactItem[]) ?? [],
    status: row.status as ProjectSubmission["status"],
    submittedAt: row.submittedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class AcademicDatabase {
  private db() {
    return getDrizzleDb()
  }

  // ==========================================
  // Quizzes & Questions
  // ==========================================

  async createQuiz(data: {
    id?: string
    title: string
    passingScore?: number
    timeLimit?: number
    questions?: Array<{
      id?: string
      question: string
      options: string[]
      correctAnswer: number
      explanation?: string
    }>
  }): Promise<Quiz> {
    const quizId = data.id || randomUUID()
    const now = new Date()

    const [quizRow] = await this.db()
      .insert(schema.quizzes)
      .values({
        id: quizId,
        title: data.title,
        passingScore: data.passingScore ?? 70,
        timeLimit: data.timeLimit ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    const createdQuestions: QuizQuestion[] = []

    if (data.questions && data.questions.length > 0) {
      for (const q of data.questions) {
        const qId = q.id || randomUUID()
        const [questionRow] = await this.db()
          .insert(schema.quizQuestions)
          .values({
            id: qId,
            quizId,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation ?? null,
            createdAt: now,
            updatedAt: now,
          })
          .returning()

        createdQuestions.push({
          id: questionRow.id,
          question: questionRow.question,
          options: (questionRow.options as string[]) ?? [],
          correctAnswer: questionRow.correctAnswer,
          explanation: questionRow.explanation ?? undefined,
        })
      }
    }

    return {
      id: quizRow.id,
      title: quizRow.title,
      passingScore: quizRow.passingScore,
      timeLimit: quizRow.timeLimit ?? undefined,
      questions: createdQuestions,
    }
  }

  async getQuizById(id: string): Promise<Quiz | undefined> {
    const [quizRow] = await this.db().select().from(schema.quizzes).where(eq(schema.quizzes.id, id)).limit(1)
    if (!quizRow) return undefined

    const questionRows = await this.db()
      .select()
      .from(schema.quizQuestions)
      .where(eq(schema.quizQuestions.quizId, id))
      .orderBy(asc(schema.quizQuestions.createdAt))

    return {
      id: quizRow.id,
      title: quizRow.title,
      passingScore: quizRow.passingScore,
      timeLimit: quizRow.timeLimit ?? undefined,
      questions: questionRows.map((q) => ({
        id: q.id,
        question: q.question,
        options: (q.options as string[]) ?? [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation ?? undefined,
      })),
    }
  }

  // Anti-cheat masked quiz for students (without answers and explanations)
  async getQuizForStudent(id: string): Promise<{
    id: string
    title: string
    passingScore: number
    timeLimit?: number
    questions: Array<{
      id: string
      question: string
      options: string[]
    }>
  } | undefined> {
    const fullQuiz = await this.getQuizById(id)
    if (!fullQuiz) return undefined

    return {
      id: fullQuiz.id,
      title: fullQuiz.title,
      passingScore: fullQuiz.passingScore,
      timeLimit: fullQuiz.timeLimit,
      questions: fullQuiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
      })),
    }
  }

  // ==========================================
  // Quiz Attempts & Trusted Scoring
  // ==========================================

  async createQuizAttempt(data: {
    quizId: string
    courseId: string
    lessonId?: string
    userId: string
  }): Promise<QuizAttempt> {
    const quiz = await this.getQuizById(data.quizId)
    if (!quiz) {
      throw new Error(`Quiz with id "${data.quizId}" not found`)
    }

    const id = randomUUID()
    const now = new Date()

    const [row] = await this.db()
      .insert(schema.quizAttempts)
      .values({
        id,
        quizId: data.quizId,
        courseId: data.courseId,
        lessonId: data.lessonId ?? null,
        userId: data.userId,
        status: "in_progress",
        score: null,
        maxScore: 100,
        passed: false,
        answers: [],
        startedAt: now,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return toQuizAttempt(row)
  }

  async getQuizAttemptById(attemptId: string): Promise<QuizAttempt | undefined> {
    const [row] = await this.db()
      .select()
      .from(schema.quizAttempts)
      .where(eq(schema.quizAttempts.id, attemptId))
      .limit(1)

    return row ? toQuizAttempt(row) : undefined
  }

  async getQuizAttemptsByUserAndQuiz(userId: string, quizId: string): Promise<QuizAttempt[]> {
    const rows = await this.db()
      .select()
      .from(schema.quizAttempts)
      .where(and(eq(schema.quizAttempts.userId, userId), eq(schema.quizAttempts.quizId, quizId)))
      .orderBy(desc(schema.quizAttempts.startedAt))

    return rows.map(toQuizAttempt)
  }

  async submitQuizAttempt(params: {
    attemptId: string
    userId: string
    answers: Array<{ questionId: string; selectedOption: number }>
  }): Promise<{ attempt: QuizAttempt; passed: boolean; score: number; maxScore: number }> {
    const attempt = await this.getQuizAttemptById(params.attemptId)
    if (!attempt) {
      throw new Error(`Quiz attempt with id "${params.attemptId}" not found`)
    }

    if (attempt.userId !== params.userId) {
      throw new Error("Forbidden: This quiz attempt belongs to another user")
    }

    if (attempt.status === "completed") {
      return {
        attempt,
        passed: Boolean(attempt.passed),
        score: attempt.score ?? 0,
        maxScore: attempt.maxScore,
      }
    }

    const quiz = await this.getQuizById(attempt.quizId)
    if (!quiz) {
      throw new Error(`Quiz with id "${attempt.quizId}" not found`)
    }

    // Authoritative Server-Side Scoring
    const calculatedAnswers: QuizAttemptAnswer[] = []
    let correctCount = 0
    const totalQuestions = quiz.questions.length

    for (const q of quiz.questions) {
      const studentSubmission = params.answers.find((a) => a.questionId === q.id)
      const selectedOption = studentSubmission !== undefined ? studentSubmission.selectedOption : -1
      const isCorrect = selectedOption === q.correctAnswer
      if (isCorrect) {
        correctCount += 1
      }
      calculatedAnswers.push({
        questionId: q.id,
        selectedOption,
        isCorrect,
        score: isCorrect ? 1 : 0,
      })
    }

    const totalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
    const passed = totalScore >= (quiz.passingScore || 70)
    const now = new Date()

    const [updatedRow] = await this.db()
      .update(schema.quizAttempts)
      .set({
        status: "completed",
        score: totalScore,
        maxScore: 100,
        passed,
        answers: calculatedAnswers,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.quizAttempts.id, params.attemptId))
      .returning()

    const completedAttempt = toQuizAttempt(updatedRow)
    return {
      attempt: completedAttempt,
      passed,
      score: totalScore,
      maxScore: 100,
    }
  }

  // ==========================================
  // Assignment Management & Submissions
  // ==========================================

  async createAssignment(data: {
    id?: string
    title: string
    description: string
    maxScore?: number
    dueDate?: Date
  }): Promise<Assignment> {
    const id = data.id || randomUUID()
    const now = new Date()

    const [row] = await this.db()
      .insert(schema.assignments)
      .values({
        id,
        title: data.title,
        description: data.description,
        maxScore: data.maxScore ?? 100,
        dueDate: data.dueDate ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      maxScore: row.maxScore,
      dueDate: row.dueDate ?? undefined,
    }
  }

  async getAssignmentById(id: string): Promise<Assignment | undefined> {
    const [row] = await this.db().select().from(schema.assignments).where(eq(schema.assignments.id, id)).limit(1)
    if (!row) return undefined
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      maxScore: row.maxScore,
      dueDate: row.dueDate ?? undefined,
    }
  }

  async createAssignmentSubmission(data: {
    assignmentId: string
    courseId: string
    lessonId?: string
    userId: string
    content?: string
    artifactUrls?: string[]
  }): Promise<AssignmentSubmission> {
    const now = new Date()
    const id = randomUUID()

    // Determine attempt number
    const existing = await this.db()
      .select({ count: sql<number>`count(*)` })
      .from(schema.assignmentSubmissions)
      .where(
        and(
          eq(schema.assignmentSubmissions.userId, data.userId),
          eq(schema.assignmentSubmissions.assignmentId, data.assignmentId),
        ),
      )

    const attemptNumber = (Number(existing[0]?.count) || 0) + 1

    const [row] = await this.db()
      .insert(schema.assignmentSubmissions)
      .values({
        id,
        assignmentId: data.assignmentId,
        courseId: data.courseId,
        lessonId: data.lessonId ?? null,
        userId: data.userId,
        attemptNumber,
        content: data.content ?? null,
        artifactUrls: data.artifactUrls ?? [],
        status: "submitted",
        submittedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return toAssignmentSubmission(row)
  }

  async getAssignmentSubmissionById(submissionId: string): Promise<AssignmentSubmission | undefined> {
    const [row] = await this.db()
      .select()
      .from(schema.assignmentSubmissions)
      .where(eq(schema.assignmentSubmissions.id, submissionId))
      .limit(1)

    return row ? toAssignmentSubmission(row) : undefined
  }

  async getAssignmentSubmissionsByUser(userId: string, courseId?: string): Promise<AssignmentSubmission[]> {
    const conditions = [eq(schema.assignmentSubmissions.userId, userId)]
    if (courseId) {
      conditions.push(eq(schema.assignmentSubmissions.courseId, courseId))
    }

    const rows = await this.db()
      .select()
      .from(schema.assignmentSubmissions)
      .where(and(...conditions))
      .orderBy(desc(schema.assignmentSubmissions.submittedAt))

    return rows.map(toAssignmentSubmission)
  }

  async getAssignmentSubmissionsByCourse(courseId: string, assignmentId?: string): Promise<AssignmentSubmission[]> {
    const conditions = [eq(schema.assignmentSubmissions.courseId, courseId)]
    if (assignmentId) {
      conditions.push(eq(schema.assignmentSubmissions.assignmentId, assignmentId))
    }

    const rows = await this.db()
      .select()
      .from(schema.assignmentSubmissions)
      .where(and(...conditions))
      .orderBy(desc(schema.assignmentSubmissions.submittedAt))

    return rows.map(toAssignmentSubmission)
  }

  // ==========================================
  // Rubrics
  // ==========================================

  async createRubric(data: {
    courseId: string
    assignmentId?: string
    projectId?: string
    title: string
    description?: string
    criteria: RubricCriterion[]
    totalMaxPoints?: number
  }): Promise<Rubric> {
    const id = randomUUID()
    const now = new Date()

    const totalMaxPoints =
      data.totalMaxPoints ?? data.criteria.reduce((sum, c) => sum + (c.maxPoints || 0), 0)

    const [row] = await this.db()
      .insert(schema.rubrics)
      .values({
        id,
        courseId: data.courseId,
        assignmentId: data.assignmentId ?? null,
        projectId: data.projectId ?? null,
        title: data.title,
        description: data.description ?? null,
        criteria: data.criteria,
        totalMaxPoints,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return toRubric(row)
  }

  async getRubricById(id: string): Promise<Rubric | undefined> {
    const [row] = await this.db().select().from(schema.rubrics).where(eq(schema.rubrics.id, id)).limit(1)
    return row ? toRubric(row) : undefined
  }

  async getRubricByTarget(
    courseId: string,
    target: { assignmentId?: string; projectId?: string },
  ): Promise<Rubric | undefined> {
    const conditions = [eq(schema.rubrics.courseId, courseId)]
    if (target.assignmentId) {
      conditions.push(eq(schema.rubrics.assignmentId, target.assignmentId))
    }
    if (target.projectId) {
      conditions.push(eq(schema.rubrics.projectId, target.projectId))
    }

    const [row] = await this.db()
      .select()
      .from(schema.rubrics)
      .where(and(...conditions))
      .orderBy(desc(schema.rubrics.createdAt))
      .limit(1)

    return row ? toRubric(row) : undefined
  }

  // ==========================================
  // Grading & Grade History
  // ==========================================

  async gradeSubmission(data: {
    submissionType: "assignment" | "project"
    submissionId: string
    courseId: string
    studentId: string
    instructorId: string
    score: number
    maxScore: number
    rubricScores?: RubricScoreItem[]
    feedback?: string
    reason?: string
  }): Promise<Grade> {
    const now = new Date()

    // Find existing grade
    const [existing] = await this.db()
      .select()
      .from(schema.grades)
      .where(
        and(
          eq(schema.grades.submissionType, data.submissionType),
          eq(schema.grades.submissionId, data.submissionId),
        ),
      )
      .limit(1)

    let gradeRecord: Grade

    if (existing) {
      // Record immutable grade history entry
      await this.db().insert(schema.gradeHistory).values({
        id: randomUUID(),
        gradeId: existing.id,
        changedBy: data.instructorId,
        previousScore: existing.score,
        newScore: data.score,
        previousFeedback: existing.feedback ?? null,
        newFeedback: data.feedback ?? null,
        reason: data.reason ?? "Grade updated by instructor",
        createdAt: now,
      })

      // Update grade
      const [updated] = await this.db()
        .update(schema.grades)
        .set({
          instructorId: data.instructorId,
          score: data.score,
          maxScore: data.maxScore,
          rubricScores: data.rubricScores ?? [],
          feedback: data.feedback ?? null,
          status: "published",
          updatedAt: now,
        })
        .where(eq(schema.grades.id, existing.id))
        .returning()

      gradeRecord = toGrade(updated)
    } else {
      // Create new grade
      const id = randomUUID()
      const [created] = await this.db()
        .insert(schema.grades)
        .values({
          id,
          submissionType: data.submissionType,
          submissionId: data.submissionId,
          courseId: data.courseId,
          studentId: data.studentId,
          instructorId: data.instructorId,
          score: data.score,
          maxScore: data.maxScore,
          rubricScores: data.rubricScores ?? [],
          feedback: data.feedback ?? null,
          status: "published",
          releasedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      gradeRecord = toGrade(created)
    }

    // Update status in submission table
    if (data.submissionType === "assignment") {
      await this.db()
        .update(schema.assignmentSubmissions)
        .set({ status: "graded", updatedAt: now })
        .where(eq(schema.assignmentSubmissions.id, data.submissionId))
    } else if (data.submissionType === "project") {
      await this.db()
        .update(schema.projectSubmissions)
        .set({ status: "approved", updatedAt: now })
        .where(eq(schema.projectSubmissions.id, data.submissionId))
    }

    return gradeRecord
  }

  async getGradeBySubmission(
    submissionType: "assignment" | "project",
    submissionId: string,
  ): Promise<Grade | undefined> {
    const [row] = await this.db()
      .select()
      .from(schema.grades)
      .where(
        and(
          eq(schema.grades.submissionType, submissionType),
          eq(schema.grades.submissionId, submissionId),
        ),
      )
      .limit(1)

    return row ? toGrade(row) : undefined
  }

  async getGradeHistory(gradeId: string): Promise<GradeHistoryEntry[]> {
    const rows = await this.db()
      .select()
      .from(schema.gradeHistory)
      .where(eq(schema.gradeHistory.gradeId, gradeId))
      .orderBy(desc(schema.gradeHistory.createdAt))

    return rows.map(toGradeHistory)
  }

  async getGradesByStudent(studentId: string, courseId?: string): Promise<Grade[]> {
    const conditions = [eq(schema.grades.studentId, studentId)]
    if (courseId) {
      conditions.push(eq(schema.grades.courseId, courseId))
    }

    const rows = await this.db()
      .select()
      .from(schema.grades)
      .where(and(...conditions))
      .orderBy(desc(schema.grades.createdAt))

    return rows.map(toGrade)
  }

  // ==========================================
  // Capstone Projects
  // ==========================================

  async createProject(data: {
    courseId: string
    title: string
    description: string
    instructions?: string
    maxScore?: number
    dueDate?: Date
  }): Promise<Project> {
    const id = randomUUID()
    const now = new Date()

    const [row] = await this.db()
      .insert(schema.projects)
      .values({
        id,
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        instructions: data.instructions ?? null,
        maxScore: data.maxScore ?? 100,
        dueDate: data.dueDate ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return toProject(row)
  }

  async getProjectsByCourse(courseId: string): Promise<Project[]> {
    const rows = await this.db()
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.courseId, courseId))
      .orderBy(asc(schema.projects.createdAt))

    return rows.map(toProject)
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    const [row] = await this.db().select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1)
    return row ? toProject(row) : undefined
  }

  async createProjectSubmission(data: {
    projectId: string
    courseId: string
    userId: string
    title: string
    description?: string
    repositoryUrl?: string
    liveDemoUrl?: string
    artifacts?: ProjectArtifactItem[]
  }): Promise<ProjectSubmission> {
    const now = new Date()

    // Check if submission already exists for this user and project
    const existing = await this.getProjectSubmissionByUserAndProject(data.userId, data.projectId)

    if (existing) {
      const [updated] = await this.db()
        .update(schema.projectSubmissions)
        .set({
          title: data.title,
          description: data.description ?? null,
          repositoryUrl: data.repositoryUrl ?? null,
          liveDemoUrl: data.liveDemoUrl ?? null,
          artifacts: data.artifacts ?? [],
          status: "submitted",
          submittedAt: now,
          updatedAt: now,
        })
        .where(eq(schema.projectSubmissions.id, existing.id))
        .returning()

      return toProjectSubmission(updated)
    }

    const id = randomUUID()
    const [row] = await this.db()
      .insert(schema.projectSubmissions)
      .values({
        id,
        projectId: data.projectId,
        courseId: data.courseId,
        userId: data.userId,
        title: data.title,
        description: data.description ?? null,
        repositoryUrl: data.repositoryUrl ?? null,
        liveDemoUrl: data.liveDemoUrl ?? null,
        artifacts: data.artifacts ?? [],
        status: "submitted",
        submittedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return toProjectSubmission(row)
  }

  async getProjectSubmissionByUserAndProject(
    userId: string,
    projectId: string,
  ): Promise<ProjectSubmission | undefined> {
    const [row] = await this.db()
      .select()
      .from(schema.projectSubmissions)
      .where(
        and(
          eq(schema.projectSubmissions.userId, userId),
          eq(schema.projectSubmissions.projectId, projectId),
        ),
      )
      .limit(1)

    return row ? toProjectSubmission(row) : undefined
  }

  async getProjectSubmissionsByCourse(courseId: string, projectId?: string): Promise<ProjectSubmission[]> {
    const conditions = [eq(schema.projectSubmissions.courseId, courseId)]
    if (projectId) {
      conditions.push(eq(schema.projectSubmissions.projectId, projectId))
    }

    const rows = await this.db()
      .select()
      .from(schema.projectSubmissions)
      .where(and(...conditions))
      .orderBy(desc(schema.projectSubmissions.submittedAt))

    return rows.map(toProjectSubmission)
  }

  async getProjectSubmissionById(id: string): Promise<ProjectSubmission | undefined> {
    const [row] = await this.db()
      .select()
      .from(schema.projectSubmissions)
      .where(eq(schema.projectSubmissions.id, id))
      .limit(1)

    return row ? toProjectSubmission(row) : undefined
  }
}

let academicDbInstance: AcademicDatabase | null = null

export function getAcademicDb(): AcademicDatabase {
  if (!academicDbInstance) {
    academicDbInstance = new AcademicDatabase()
  }
  return academicDbInstance
}

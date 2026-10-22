import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { users, courses, lessons, quizzes } from "./core"

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: text("id").primaryKey(),
    quizId: text("quiz_id").notNull().references(() => quizzes.id),
    courseId: text("course_id").notNull().references(() => courses.id),
    lessonId: text("lesson_id").references(() => lessons.id),
    userId: text("user_id").notNull().references(() => users.id),
    status: text("status").notNull().default("in_progress"), // in_progress | completed | abandoned
    score: integer("score"),
    maxScore: integer("max_score").notNull().default(0),
    passed: boolean("passed").default(false),
    answers: jsonb("answers").default([]), // [{ questionId, selectedOption, isCorrect, score }]
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userQuizIndex: index("idx_quiz_attempts_user_quiz").on(table.userId, table.quizId),
    courseIndex: index("idx_quiz_attempts_course").on(table.courseId),
  }),
)

export const assignmentSubmissions = pgTable(
  "assignment_submissions",
  {
    id: text("id").primaryKey(),
    assignmentId: text("assignment_id").notNull(),
    courseId: text("course_id").notNull().references(() => courses.id),
    lessonId: text("lesson_id").references(() => lessons.id),
    userId: text("user_id").notNull().references(() => users.id),
    attemptNumber: integer("attempt_number").notNull().default(1),
    content: text("content"),
    artifactUrls: jsonb("artifact_urls").default([]), // string[] of URLs / metadata
    status: text("status").notNull().default("submitted"), // draft | submitted | graded | resubmission_requested
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userAssignmentIndex: index("idx_assignment_submissions_user_assignment").on(table.userId, table.assignmentId),
    courseIndex: index("idx_assignment_submissions_course").on(table.courseId),
  }),
)

export const rubrics = pgTable(
  "rubrics",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id").notNull().references(() => courses.id),
    assignmentId: text("assignment_id"),
    projectId: text("project_id"),
    title: text("title").notNull(),
    description: text("description"),
    criteria: jsonb("criteria").default([]), // [{ id, title, description, maxPoints }]
    totalMaxPoints: integer("total_max_points").notNull().default(100),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    courseIndex: index("idx_rubrics_course").on(table.courseId),
  }),
)

export const grades = pgTable(
  "grades",
  {
    id: text("id").primaryKey(),
    submissionType: text("submission_type").notNull(), // assignment | project
    submissionId: text("submission_id").notNull(),
    courseId: text("course_id").notNull().references(() => courses.id),
    studentId: text("student_id").notNull().references(() => users.id),
    instructorId: text("instructor_id").notNull().references(() => users.id),
    score: integer("score").notNull().default(0),
    maxScore: integer("max_score").notNull().default(100),
    rubricScores: jsonb("rubric_scores").default([]), // [{ criterionId, points, comment }]
    feedback: text("feedback"),
    status: text("status").notNull().default("published"), // draft | published
    releasedAt: timestamp("released_at").defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    submissionUnique: uniqueIndex("uniq_grades_submission").on(table.submissionType, table.submissionId),
    studentIndex: index("idx_grades_student").on(table.studentId),
    courseIndex: index("idx_grades_course").on(table.courseId),
  }),
)

export const gradeHistory = pgTable(
  "grade_history",
  {
    id: text("id").primaryKey(),
    gradeId: text("grade_id").notNull().references(() => grades.id),
    changedBy: text("changed_by").notNull().references(() => users.id),
    previousScore: integer("previous_score").notNull(),
    newScore: integer("new_score").notNull(),
    previousFeedback: text("previous_feedback"),
    newFeedback: text("new_feedback"),
    reason: text("reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    gradeIndex: index("idx_grade_history_grade").on(table.gradeId),
  }),
)

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id").notNull().references(() => courses.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    instructions: text("instructions"),
    maxScore: integer("max_score").notNull().default(100),
    dueDate: timestamp("due_date"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    courseIndex: index("idx_projects_course").on(table.courseId),
  }),
)

export const projectSubmissions = pgTable(
  "project_submissions",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => projects.id),
    courseId: text("course_id").notNull().references(() => courses.id),
    userId: text("user_id").notNull().references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    repositoryUrl: text("repository_url"),
    liveDemoUrl: text("live_demo_url"),
    artifacts: jsonb("artifacts").default([]), // [{ name, url, type, sizeBytes }]
    status: text("status").notNull().default("submitted"), // submitted | under_review | approved | changes_requested
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userProjectUnique: uniqueIndex("uniq_project_submissions_user_project").on(table.userId, table.projectId),
    courseIndex: index("idx_project_submissions_course").on(table.courseId),
  }),
)

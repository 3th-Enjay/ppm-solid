CREATE TABLE "assignment_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"course_id" text NOT NULL,
	"lesson_id" text,
	"user_id" text NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"content" text,
	"artifact_urls" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'submitted' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grade_history" (
	"id" text PRIMARY KEY NOT NULL,
	"grade_id" text NOT NULL,
	"changed_by" text NOT NULL,
	"previous_score" integer NOT NULL,
	"new_score" integer NOT NULL,
	"previous_feedback" text,
	"new_feedback" text,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_type" text NOT NULL,
	"submission_id" text NOT NULL,
	"course_id" text NOT NULL,
	"student_id" text NOT NULL,
	"instructor_id" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"max_score" integer DEFAULT 100 NOT NULL,
	"rubric_scores" jsonb DEFAULT '[]'::jsonb,
	"feedback" text,
	"status" text DEFAULT 'published' NOT NULL,
	"released_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"course_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"repository_url" text,
	"live_demo_url" text,
	"artifacts" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'submitted' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"instructions" text,
	"max_score" integer DEFAULT 100 NOT NULL,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"quiz_id" text NOT NULL,
	"course_id" text NOT NULL,
	"lesson_id" text,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"score" integer,
	"max_score" integer DEFAULT 0 NOT NULL,
	"passed" boolean DEFAULT false,
	"answers" jsonb DEFAULT '[]'::jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rubrics" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"assignment_id" text,
	"project_id" text,
	"title" text NOT NULL,
	"description" text,
	"criteria" jsonb DEFAULT '[]'::jsonb,
	"total_max_points" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_history" ADD CONSTRAINT "grade_history_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_history" ADD CONSTRAINT "grade_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubrics" ADD CONSTRAINT "rubrics_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_assignment_submissions_user_assignment" ON "assignment_submissions" USING btree ("user_id","assignment_id");--> statement-breakpoint
CREATE INDEX "idx_assignment_submissions_course" ON "assignment_submissions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_grade_history_grade" ON "grade_history" USING btree ("grade_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_grades_submission" ON "grades" USING btree ("submission_type","submission_id");--> statement-breakpoint
CREATE INDEX "idx_grades_student" ON "grades" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_grades_course" ON "grades" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_project_submissions_user_project" ON "project_submissions" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "idx_project_submissions_course" ON "project_submissions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_projects_course" ON "projects" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_quiz_attempts_user_quiz" ON "quiz_attempts" USING btree ("user_id","quiz_id");--> statement-breakpoint
CREATE INDEX "idx_quiz_attempts_course" ON "quiz_attempts" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_rubrics_course" ON "rubrics" USING btree ("course_id");
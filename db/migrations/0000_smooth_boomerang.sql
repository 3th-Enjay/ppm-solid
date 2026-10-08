CREATE TYPE "public"."lesson_type" AS ENUM('video', 'article', 'quiz', 'assignment');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'expired', 'manual_review', 'success');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('course_purchase', 'onsite_registration');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'instructor', 'admin', 'finance');--> statement-breakpoint
CREATE TABLE "admin_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"legacy_mongo_id" text NOT NULL,
	"user_id" text,
	"actor_id" text,
	"action" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_logs_legacy_mongo_id_unique" UNIQUE("legacy_mongo_id")
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"legacy_mongo_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"due_date" timestamp,
	"max_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assignments_legacy_mongo_id_unique" UNIQUE("legacy_mongo_id")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"legacy_mongo_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_legacy_mongo_id_unique" UNIQUE("legacy_mongo_id")
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"legacy_mongo_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"certificate_url" text,
	"verification_code" text,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_legacy_mongo_id_unique" UNIQUE("legacy_mongo_id")
);
--> statement-breakpoint
CREATE TABLE "course_modules" (
	"id" text PRIMARY KEY NOT NULL,
	"legacy_mongo_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_modules_legacy_mongo_id_unique" UNIQUE("legacy_mongo_id")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"legacy_mongo_id" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"overview" jsonb DEFAULT '[]'::jsonb,
	"category" text NOT NULL,
	"level" text NOT NULL,
	"instructor_id" text NOT NULL,
	"instructor_name" text,
	"instructor_avatar" text,
	"instructor_bio" text,
	"instructor_headline" text,
	"instructor_years_of_experience" integer,
	"instructor_specialties" jsonb DEFAULT '[]'::jsonb,
	"price_ngn" integer DEFAULT 0 NOT NULL,
	"price_usd" integer DEFAULT 0 NOT NULL,
	"price_eur" integer DEFAULT 0 NOT NULL,
	"price_gbp" integer DEFAULT 0 NOT NULL,
	"thumbnail" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"total_duration" integer DEFAULT 0 NOT NULL,
	"enrollment_count" integer DEFAULT 0 NOT NULL,
	"rating" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_legacy_mongo_id_unique" UNIQUE("legacy_mongo_id"),
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"legacy_mongo_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"completed_lessons" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"current_lesson" text,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_legacy_mongo_id_unique" UNIQUE("legacy_mongo_id")
);
--> statement-breakpoint
CREATE TABLE "learning_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"legacy_mongo_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text,
	"title" text,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "learning_notes_legacy_mongo_id_unique" UNIQUE("legacy_mongo_id")
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"legacy_mongo_id" text NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text,
	"title" text NOT NULL,
	"type" "lesson_type" NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"duration" integer DEFAULT 0,
	"content" jsonb DEFAULT '{}'::jsonb,
	"is_free" boolean DEFAULT false NOT NULL,
	"approved" boolean DEFAULT false,
	"pending_approval" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lessons_legacy_mongo_id_unique" UNIQUE("legacy_mongo_id")
);
--> statement-breakpoint
CREATE TABLE "migration_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"source_collection" text NOT NULL,
	"source_id" text,
	"target_table" text NOT NULL,
	"target_id" text,
	"status" text DEFAULT 'migrated' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_events" (
	"id" text PRIMARY KEY NOT NULL,
	"legacy_mongo_id" text NOT NULL,
	"user_id" text,
	"event" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_events_legacy_mongo_id_unique" UNIQUE("legacy_mongo_id")
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"legacy_mongo_id" text NOT NULL,
	"payment_id" text,
	"reference" text NOT NULL,
	"event_type" text NOT NULL,
	"event_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_events_legacy_mongo_id_unique" UNIQUE("legacy_mongo_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"legacy_mongo_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text,
	"course_ids" jsonb DEFAULT '[]'::jsonb,
	"payment_type" "payment_type" DEFAULT 'course_purchase' NOT NULL,
	"reference" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"method" text,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"review_state" text,
	"refund_state" text,
	"verification_lock" boolean DEFAULT false,
	"verification_lock_expires_at" timestamp,
	"paystack_metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_legacy_mongo_id_unique" UNIQUE("legacy_mongo_id"),
	CONSTRAINT "payments_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "pending_registrations" (
	"id" text PRIMARY KEY NOT NULL,
	"legacy_mongo_id" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"avatar" text,
	"bio" text,
	"otp_hash" text NOT NULL,
	"otp_expires_at" timestamp NOT NULL,
	"student_profile" jsonb,
	"instructor_profile" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pending_registrations_legacy_mongo_id_unique" UNIQUE("legacy_mongo_id"),
	CONSTRAINT "pending_registrations_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"legacy_mongo_id" text NOT NULL,
	"quiz_id" text NOT NULL,
	"question" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb,
	"correct_answer" integer DEFAULT 0 NOT NULL,
	"explanation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_questions_legacy_mongo_id_unique" UNIQUE("legacy_mongo_id")
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" text PRIMARY KEY NOT NULL,
	"legacy_mongo_id" text NOT NULL,
	"title" text NOT NULL,
	"passing_score" integer DEFAULT 0 NOT NULL,
	"time_limit" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quizzes_legacy_mongo_id_unique" UNIQUE("legacy_mongo_id")
);
--> statement-breakpoint
CREATE TABLE "table_relationships" (
	"id" text NOT NULL,
	"source_table" text NOT NULL,
	"source_column" text NOT NULL,
	"target_table" text NOT NULL,
	"target_column" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "table_relationships_source_table_source_column_target_table_target_column_pk" PRIMARY KEY("source_table","source_column","target_table","target_column")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"legacy_mongo_id" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"avatar" text,
	"bio" text,
	"status" text DEFAULT 'active',
	"email_verified" boolean DEFAULT false,
	"otp_hash" text,
	"otp_expires_at" timestamp,
	"student_profile" jsonb,
	"instructor_profile" jsonb,
	"enrolled_courses" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_legacy_mongo_id_unique" UNIQUE("legacy_mongo_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_notes" ADD CONSTRAINT "learning_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_notes" ADD CONSTRAINT "learning_notes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_course_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_events" ADD CONSTRAINT "onboarding_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_courses_slug" ON "courses" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_courses_instructor_id" ON "courses" USING btree ("instructor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_enrollments_user_course" ON "enrollments" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_payment_events_ref_created" ON "payment_events" USING btree ("reference","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_payments_reference" ON "payments" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_pending_registrations_email" ON "pending_registrations" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_users_email" ON "users" USING btree ("email");
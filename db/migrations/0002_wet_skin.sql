CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "idx_courses_instructor_id";--> statement-breakpoint
ALTER TABLE "admin_logs" ALTER COLUMN "legacy_mongo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assignments" ALTER COLUMN "legacy_mongo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "legacy_mongo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "certificates" ALTER COLUMN "legacy_mongo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "course_modules" ALTER COLUMN "legacy_mongo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ALTER COLUMN "legacy_mongo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "enrollments" ALTER COLUMN "legacy_mongo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_notes" ALTER COLUMN "legacy_mongo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ALTER COLUMN "legacy_mongo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding_events" ALTER COLUMN "legacy_mongo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_events" ALTER COLUMN "legacy_mongo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "legacy_mongo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "pending_registrations" ALTER COLUMN "legacy_mongo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_questions" ALTER COLUMN "legacy_mongo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "quizzes" ALTER COLUMN "legacy_mongo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "legacy_mongo_id" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_courses_instructor_id" ON "courses" USING btree ("instructor_id");
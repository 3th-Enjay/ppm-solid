ALTER TABLE "admin_logs" ADD COLUMN "legacy_payload" jsonb;--> statement-breakpoint
ALTER TABLE "onboarding_events" ADD COLUMN "legacy_payload" jsonb;--> statement-breakpoint
ALTER TABLE "payment_events" ADD COLUMN "legacy_payload" jsonb;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "legacy_payload" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "legacy_payload" jsonb;
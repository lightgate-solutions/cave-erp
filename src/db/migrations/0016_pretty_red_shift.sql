ALTER TABLE "employees" ALTER COLUMN "staff_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD COLUMN "email_on_in_app_message" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD COLUMN "email_on_task_notification" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD COLUMN "email_on_general_notification" boolean DEFAULT false NOT NULL;
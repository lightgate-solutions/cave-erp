CREATE TYPE "public"."attendance_status" AS ENUM('Approved', 'Rejected');--> statement-breakpoint
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_approved_by_employees_id_fk";
--> statement-breakpoint
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_sign_out_approved_by_employees_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'Todo'::text;--> statement-breakpoint
DROP TYPE "public"."task_status";--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('Backlog', 'Todo', 'In Progress', 'Review', 'Completed', 'Pending');--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'Todo'::"public"."task_status";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DATA TYPE "public"."task_status" USING "status"::"public"."task_status";--> statement-breakpoint
DROP INDEX "attendence_employee_idx";--> statement-breakpoint
DROP INDEX "attendence_approved_idx";--> statement-breakpoint
DROP INDEX "attendance_date_idx";--> statement-breakpoint
DROP INDEX "attendance_signout_approved_idx";--> statement-breakpoint
DROP INDEX "attendance_signout_approved_by_idx";--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "sign_out_time" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "sign_in_time" timestamp;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "status" "attendance_status" DEFAULT 'Approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "rejected_by" integer;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_rejected_by_employees_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" DROP COLUMN "time";--> statement-breakpoint
ALTER TABLE "attendance" DROP COLUMN "checked_in";--> statement-breakpoint
ALTER TABLE "attendance" DROP COLUMN "approved_by";--> statement-breakpoint
ALTER TABLE "attendance" DROP COLUMN "sign_out_approved";--> statement-breakpoint
ALTER TABLE "attendance" DROP COLUMN "sign_out_approved_by";
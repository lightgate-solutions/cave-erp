CREATE TYPE "public"."employees_department" AS ENUM('hr', 'admin', 'finance', 'operations');--> statement-breakpoint
CREATE TYPE "public"."employees_role" AS ENUM('admin', 'user');--> statement-breakpoint
ALTER TABLE "employees" DROP CONSTRAINT "employees_email_unique";--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."employees_role";--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "role" SET DATA TYPE "public"."employees_role" USING "role"::"public"."employees_role";--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "department" SET DEFAULT 'operations'::"public"."employees_department";--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "department" SET DATA TYPE "public"."employees_department" USING "department"::"public"."employees_department";--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "department" text DEFAULT 'operations' NOT NULL;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;
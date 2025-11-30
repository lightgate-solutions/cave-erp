CREATE TYPE "public"."employment_type" AS ENUM('Full-time', 'Part-time', 'Contract', 'Intern');--> statement-breakpoint
CREATE TYPE "public"."marital_status" AS ENUM('Single', 'Married', 'Divorced', 'Widowed');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('pending', 'in-progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('approval', 'deadline', 'message');--> statement-breakpoint
CREATE TYPE "public"."payment_status_type" AS ENUM('successful', 'pending', 'failed');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('Accepted', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('Low', 'Medium', 'High', 'Urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('Pending', 'In Progress', 'Completed', 'Overdue');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"username" text,
	"display_username" text,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"auth_id" text DEFAULT '' NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"staff_number" text NOT NULL,
	"role" text NOT NULL,
	"is_manager" boolean DEFAULT false NOT NULL,
	"department" text NOT NULL,
	"manager_id" integer,
	"date_of_birth" date,
	"address" text,
	"marital_status" "marital_status",
	"employment_type" "employment_type",
	"document_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employees_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "email" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"parent_email_id" integer,
	"type" text DEFAULT 'sent' NOT NULL,
	"has_been_opened" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_attachment" (
	"id" serial PRIMARY KEY NOT NULL,
	"email_id" integer NOT NULL,
	"document_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_recipient" (
	"id" serial PRIMARY KEY NOT NULL,
	"email_id" integer NOT NULL,
	"recipient_id" integer NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"archived_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"title" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"spent_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp,
	"completed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"location" text,
	"status" "project_status" DEFAULT 'pending' NOT NULL,
	"budget_planned" integer DEFAULT 0 NOT NULL,
	"budget_actual" integer DEFAULT 0 NOT NULL,
	"supervisor_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projects_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"upstash_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"original_file_name" text,
	"department" text NOT NULL,
	"departmental" boolean DEFAULT false,
	"folder_id" integer,
	"current_version" integer DEFAULT 0 NOT NULL,
	"current_version_id" integer DEFAULT 0 NOT NULL,
	"public" boolean DEFAULT false,
	"uploaded_by" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"access_level" text NOT NULL,
	"document_id" integer NOT NULL,
	"user_id" integer,
	"department" text,
	"granted_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer,
	"user_id" integer,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"parent_id" integer,
	"root" boolean DEFAULT true NOT NULL,
	"department" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"public" boolean DEFAULT false NOT NULL,
	"departmental" boolean DEFAULT false NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"document_id" integer,
	"document_version_id" integer,
	"action" text NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_shared_link" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer,
	"token" text NOT NULL,
	"expires_at" timestamp,
	"access_level" text DEFAULT 'View',
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "document_shared_link_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "document_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer,
	"tag" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"version_number" integer NOT NULL,
	"file_path" text NOT NULL,
	"file_size" numeric(10, 2) NOT NULL,
	"mime_type" text,
	"scanned_ocr" text,
	"uploaded_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" serial NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"notification_type" "notification_type" NOT NULL,
	"created_by" serial NOT NULL,
	"reference_id" serial NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" serial NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"in_app_notifications" boolean DEFAULT true NOT NULL,
	"notify_on_message" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payer_name" text NOT NULL,
	"account_number" text NOT NULL,
	"bank_name" text,
	"amount" serial NOT NULL,
	"currency" text DEFAULT 'NGN',
	"payment_reference" text,
	"payment_date" timestamp DEFAULT now(),
	"payment_status_type" "payment_status_type" DEFAULT 'pending',
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"submission_id" integer NOT NULL,
	"reviewed_by" integer NOT NULL,
	"status" "review_status" NOT NULL,
	"review_note" text,
	"reviewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"submitted_by" integer NOT NULL,
	"submission_note" text,
	"submitted_files" jsonb,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"assigned_to" integer NOT NULL,
	"assigned_by" integer NOT NULL,
	"status" "task_status" DEFAULT 'Pending' NOT NULL,
	"priority" "task_priority" DEFAULT 'Medium' NOT NULL,
	"due_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_assignees" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email" ADD CONSTRAINT "email_sender_id_employees_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_attachment" ADD CONSTRAINT "email_attachment_email_id_email_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."email"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_attachment" ADD CONSTRAINT "email_attachment_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_recipient" ADD CONSTRAINT "email_recipient_email_id_email_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."email"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_recipient" ADD CONSTRAINT "email_recipient_recipient_id_employees_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_supervisor_id_employees_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_folder_id_document_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."document_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_uploaded_by_employees_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access" ADD CONSTRAINT "document_access_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access" ADD CONSTRAINT "document_access_user_id_employees_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access" ADD CONSTRAINT "document_access_granted_by_employees_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_user_id_employees_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_parent_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."document_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_logs" ADD CONSTRAINT "document_logs_user_id_employees_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_logs" ADD CONSTRAINT "document_logs_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_logs" ADD CONSTRAINT "document_logs_document_version_id_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_shared_link" ADD CONSTRAINT "document_shared_link_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_shared_link" ADD CONSTRAINT "document_shared_link_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_tags" ADD CONSTRAINT "document_tags_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploaded_by_employees_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_employees_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_reference_id_email_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."email"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_employees_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_submission_id_task_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."task_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_reviewed_by_employees_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_submitted_by_employees_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_employees_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_by_employees_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_messages" ADD CONSTRAINT "task_messages_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_messages" ADD CONSTRAINT "task_messages_sender_id_employees_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_accounts_userId" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_userId" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_token" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "auth_users_email" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "auth_verification_identifier" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "employee_manager_idx" ON "employees" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "employees_department_role_idx" ON "employees" USING btree ("department","role");--> statement-breakpoint
CREATE INDEX "email_sender_id_idx" ON "email" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "email_created_at_idx" ON "email" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_parent_email_id_idx" ON "email" USING btree ("parent_email_id");--> statement-breakpoint
CREATE INDEX "email_attachment_email_id_idx" ON "email_attachment" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX "email_attachment_document_id_idx" ON "email_attachment" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "email_recipient_email_id_idx" ON "email_recipient" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX "email_recipient_recipient_id_idx" ON "email_recipient" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "email_recipient_is_read_idx" ON "email_recipient" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "email_recipient_is_archived_idx" ON "email_recipient" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "email_recipient_is_deleted_idx" ON "email_recipient" USING btree ("is_deleted");--> statement-breakpoint
CREATE INDEX "expenses_project_idx" ON "expenses" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "milestones_project_idx" ON "milestones" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "projects_supervisor_idx" ON "projects" USING btree ("supervisor_id");--> statement-breakpoint
CREATE INDEX "documents_name_idx" ON "document" USING btree ("title");--> statement-breakpoint
CREATE INDEX "documents_version_id_idx" ON "document" USING btree ("current_version_id");--> statement-breakpoint
CREATE INDEX "documents_access_id_idx" ON "document_access" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "documents_access_level_idx" ON "document_access" USING btree ("access_level");--> statement-breakpoint
CREATE INDEX "documents_access_granted_idx" ON "document_access" USING btree ("granted_by");--> statement-breakpoint
CREATE INDEX "documents_access_department_idx" ON "document_access" USING btree ("department");--> statement-breakpoint
CREATE INDEX "documents_access_user_idx" ON "document_access" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "document_comment_idx" ON "document_comments" USING btree ("comment");--> statement-breakpoint
CREATE INDEX "folders_name_idx" ON "document_folders" USING btree ("name");--> statement-breakpoint
CREATE INDEX "folders_department_idx" ON "document_folders" USING btree ("department");--> statement-breakpoint
CREATE INDEX "folders_parent_idx" ON "document_folders" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "documents_logs_action_idx" ON "document_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "documents_logs_document_idx" ON "document_logs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "documents_shared_token" ON "document_shared_link" USING btree ("token");--> statement-breakpoint
CREATE INDEX "documents_tag_idx" ON "document_tags" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "documents_tag_id_idx" ON "document_tags" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "documents_version_number_idx" ON "document_versions" USING btree ("version_number");--> statement-breakpoint
CREATE INDEX "documents_version_uploaded_by_idx" ON "document_versions" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "documents_version_ocr_idx" ON "document_versions" USING btree ("scanned_ocr");--> statement-breakpoint
CREATE INDEX "task_reviews_task_idx" ON "task_reviews" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_reviews_submission_idx" ON "task_reviews" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "task_reviews_reviewer_idx" ON "task_reviews" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "task_submissions_task_idx" ON "task_submissions" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_submissions_employee_idx" ON "task_submissions" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "tasks_assigned_to_idx" ON "tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "tasks_assigned_by_idx" ON "tasks" USING btree ("assigned_by");--> statement-breakpoint
CREATE INDEX "task_assignees_task_idx" ON "task_assignees" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_assignees_employee_idx" ON "task_assignees" USING btree ("employee_id");
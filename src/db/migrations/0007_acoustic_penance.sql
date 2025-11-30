CREATE TABLE "email_attachment" (
	"id" serial PRIMARY KEY NOT NULL,
	"email_id" integer NOT NULL,
	"document_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
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
ALTER TABLE "employees" ALTER COLUMN "department" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "document_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "email_attachment" ADD CONSTRAINT "email_attachment_email_id_email_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."email"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_attachment" ADD CONSTRAINT "email_attachment_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "email_attachment_email_id_idx" ON "email_attachment" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX "email_attachment_document_id_idx" ON "email_attachment" USING btree ("document_id");--> statement-breakpoint
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
CREATE INDEX "documents_version_ocr_idx" ON "document_versions" USING btree ("scanned_ocr");
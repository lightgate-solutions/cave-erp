CREATE TABLE "bug_report_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"bug_report_id" serial NOT NULL,
	"upstash_id" varchar(255) NOT NULL,
	"original_file_name" varchar(500) NOT NULL,
	"file_path" text NOT NULL,
	"file_size" varchar(50) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bug_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"title" varchar(500) NOT NULL,
	"severity" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"steps_to_reproduce" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bug_report_attachments" ADD CONSTRAINT "bug_report_attachments_bug_report_id_bug_reports_id_fk" FOREIGN KEY ("bug_report_id") REFERENCES "public"."bug_reports"("id") ON DELETE cascade ON UPDATE no action;
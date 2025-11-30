CREATE TABLE "annual_leave_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"allocated_days" integer DEFAULT 30 NOT NULL,
	"year" integer NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "annual_leave_settings_year_unique" UNIQUE("year")
);

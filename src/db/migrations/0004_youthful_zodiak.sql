ALTER TABLE "gl_journals" ADD COLUMN "adjustment_reason" text;--> statement-breakpoint
ALTER TABLE "gl_journals" ADD COLUMN "reversal_of_journal_id" integer;--> statement-breakpoint
ALTER TABLE "gl_periods" ADD COLUMN "reopened_at" timestamp;--> statement-breakpoint
ALTER TABLE "gl_periods" ADD COLUMN "reopened_by" text;--> statement-breakpoint
ALTER TABLE "gl_periods" ADD COLUMN "last_status_change_reason" text;--> statement-breakpoint
ALTER TABLE "gl_journals" ADD CONSTRAINT "gl_journals_reversal_of_fk" FOREIGN KEY ("reversal_of_journal_id") REFERENCES "public"."gl_journals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_periods" ADD CONSTRAINT "gl_periods_reopened_by_user_id_fk" FOREIGN KEY ("reopened_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gl_journals_reversal_idx" ON "gl_journals" USING btree ("reversal_of_journal_id");
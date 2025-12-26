ALTER TABLE "projects" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
CREATE INDEX "projects_organization_idx" ON "projects" USING btree ("organization_id");
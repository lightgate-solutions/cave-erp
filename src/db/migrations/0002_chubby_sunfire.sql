CREATE TABLE "balance_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"transaction_type" text DEFAULT 'top-up' NOT NULL,
	"description" text,
	"balance_before" numeric(15, 2) NOT NULL,
	"balance_after" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_user_id_employees_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "balance_transactions_user_idx" ON "balance_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "balance_transactions_date_idx" ON "balance_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "balance_transactions_type_idx" ON "balance_transactions" USING btree ("transaction_type");
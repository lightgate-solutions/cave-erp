CREATE TYPE "public"."bill_payment_method" AS ENUM('Cash', 'Bank Transfer', 'Check', 'Credit Card', 'Debit Card', 'Mobile Money', 'Other');--> statement-breakpoint
CREATE TYPE "public"."bill_status" AS ENUM('Draft', 'Open', 'Paid', 'Overdue', 'Partially Paid', 'Void');--> statement-breakpoint
CREATE TABLE "bill_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"description" text NOT NULL,
	"category" text,
	"quantity" numeric(10, 2) DEFAULT '1.00' NOT NULL,
	"unit_price" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"payment_method" "bill_payment_method" NOT NULL,
	"reference_number" text,
	"bank_account_id" integer,
	"notes" text,
	"recorded_by" text,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_number" text NOT NULL,
	"supplier_id" integer NOT NULL,
	"bill_date" date NOT NULL,
	"due_date" date NOT NULL,
	"status" "bill_status" DEFAULT 'Draft' NOT NULL,
	"currency_id" integer NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"amount_paid" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"amount_due" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"notes" text,
	"attachment_path" text,
	"organization_id" text NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"tax_id" text,
	"address" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text,
	"currency_id" integer,
	"payment_terms" text,
	"notes" text,
	"website" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"organization_id" text NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_bank_account_id_company_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."company_bank_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_currency_id_organization_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."organization_currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_currency_id_organization_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."organization_currencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bill_items_bill_idx" ON "bill_items" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "bill_payments_bill_idx" ON "bill_payments" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "bill_payments_org_idx" ON "bill_payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "bill_payments_date_idx" ON "bill_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "bills_supplier_idx" ON "bills" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "bills_status_idx" ON "bills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bills_org_idx" ON "bills" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "bills_due_date_idx" ON "bills" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "suppliers_org_idx" ON "suppliers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "suppliers_active_idx" ON "suppliers" USING btree ("is_active");
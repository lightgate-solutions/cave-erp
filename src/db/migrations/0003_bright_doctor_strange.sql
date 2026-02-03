CREATE TYPE "public"."bill_activity_type" AS ENUM('Bill Created', 'Bill Approved', 'Status Changed', 'Payment Recorded', 'Payment Deleted', 'Email Sent', 'Bill Updated', 'Bill Cancelled', 'Note Added', 'PO Matched');--> statement-breakpoint
CREATE TYPE "public"."bill_document_type" AS ENUM('Vendor Invoice', 'Payment Receipt', 'Tax Document', 'Delivery Note', 'Other');--> statement-breakpoint
CREATE TYPE "public"."bill_status" AS ENUM('Draft', 'Pending', 'Approved', 'Paid', 'Overdue', 'Cancelled', 'Partially Paid');--> statement-breakpoint
CREATE TYPE "public"."bill_tax_type" AS ENUM('VAT', 'WHT', 'Sales Tax', 'GST', 'Custom');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('Bank Transfer', 'Wire', 'Check', 'Cash');--> statement-breakpoint
CREATE TYPE "public"."po_status" AS ENUM('Draft', 'Pending Approval', 'Approved', 'Sent', 'Partially Received', 'Received', 'Closed', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."vendor_category" AS ENUM('Services', 'Goods', 'Utilities', 'Custom');--> statement-breakpoint
CREATE TYPE "public"."vendor_status" AS ENUM('Active', 'Inactive', 'Suspended', 'Archived');--> statement-breakpoint
CREATE TABLE "bill_activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"activity_type" "bill_activity_type" NOT NULL,
	"description" text NOT NULL,
	"performed_by" text,
	"metadata" jsonb,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"document_type" "bill_document_type" NOT NULL,
	"document_name" text NOT NULL,
	"original_file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" numeric(10, 2) NOT NULL,
	"mime_type" text,
	"uploaded_by" text,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"po_line_item_id" integer,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1.00' NOT NULL,
	"po_unit_price" numeric(12, 2),
	"po_amount" numeric(12, 2),
	"unit_price" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"reference_number" text,
	"notes" text,
	"confirmation_email_sent_at" timestamp,
	"confirmation_email_sent_to" text,
	"recorded_by" text,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_taxes" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"tax_type" "bill_tax_type" NOT NULL,
	"tax_name" text NOT NULL,
	"tax_percentage" numeric(5, 2) NOT NULL,
	"tax_amount" numeric(12, 2) NOT NULL,
	"is_withholding_tax" boolean DEFAULT false NOT NULL,
	"wht_certificate_number" text,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payables_bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_number" text NOT NULL,
	"vendor_invoice_number" text NOT NULL,
	"vendor_id" integer NOT NULL,
	"po_id" integer,
	"bank_account_id" integer,
	"bill_date" date NOT NULL,
	"due_date" date NOT NULL,
	"received_date" date NOT NULL,
	"status" "bill_status" DEFAULT 'Draft' NOT NULL,
	"currency_id" integer NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"amount_paid" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"amount_due" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_frequency" text,
	"recurring_end_date" date,
	"notes" text,
	"payment_terms" text,
	"duplicate_check_hash" text,
	"pdf_path" text,
	"confirmation_email_sent_at" timestamp,
	"paid_at" timestamp,
	"approved_at" timestamp,
	"cancelled_at" timestamp,
	"organization_id" text NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payables_bills_bill_number_unique" UNIQUE("bill_number")
);
--> statement-breakpoint
CREATE TABLE "payables_tax_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"tax_type" "bill_tax_type" NOT NULL,
	"tax_name" text NOT NULL,
	"default_rate" numeric(5, 2) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "po_line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_id" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1.00' NOT NULL,
	"unit_price" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"received_quantity" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"billed_quantity" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_number" text NOT NULL,
	"vendor_id" integer NOT NULL,
	"po_date" date NOT NULL,
	"expected_delivery_date" date,
	"status" "po_status" DEFAULT 'Draft' NOT NULL,
	"currency_id" integer NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"received_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"billed_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"notes" text,
	"terms_and_conditions" text,
	"delivery_address" text,
	"approved_by" text,
	"approved_at" timestamp,
	"sent_at" timestamp,
	"closed_at" timestamp,
	"cancelled_at" timestamp,
	"organization_id" text NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_orders_po_number_unique" UNIQUE("po_number")
);
--> statement-breakpoint
CREATE TABLE "vendor_bank_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"account_name" text NOT NULL,
	"bank_name" text NOT NULL,
	"account_number" text NOT NULL,
	"routing_number" text,
	"swift_code" text,
	"iban" text,
	"currency" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"role" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_custom_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_custom_categories_org_name_idx" UNIQUE("organization_id","name")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_code" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company_name" text,
	"tax_id" text,
	"cac_number" text,
	"category" "vendor_category" NOT NULL,
	"custom_category" text,
	"billing_address" text,
	"billing_city" text,
	"billing_state" text,
	"billing_postal_code" text,
	"billing_country" text,
	"website" text,
	"notes" text,
	"status" "vendor_status" DEFAULT 'Active' NOT NULL,
	"default_payment_terms" text,
	"default_payment_method" "payment_method",
	"organization_id" text NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_vendor_code_unique" UNIQUE("vendor_code")
);
--> statement-breakpoint
ALTER TABLE "bill_activity_log" ADD CONSTRAINT "bill_activity_log_bill_id_payables_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."payables_bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_activity_log" ADD CONSTRAINT "bill_activity_log_performed_by_user_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_activity_log" ADD CONSTRAINT "bill_activity_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_documents" ADD CONSTRAINT "bill_documents_bill_id_payables_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."payables_bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_documents" ADD CONSTRAINT "bill_documents_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_documents" ADD CONSTRAINT "bill_documents_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_line_items" ADD CONSTRAINT "bill_line_items_bill_id_payables_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."payables_bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_line_items" ADD CONSTRAINT "bill_line_items_po_line_item_id_po_line_items_id_fk" FOREIGN KEY ("po_line_item_id") REFERENCES "public"."po_line_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_line_items" ADD CONSTRAINT "bill_line_items_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_bill_id_payables_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."payables_bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_taxes" ADD CONSTRAINT "bill_taxes_bill_id_payables_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."payables_bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_taxes" ADD CONSTRAINT "bill_taxes_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payables_bills" ADD CONSTRAINT "payables_bills_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payables_bills" ADD CONSTRAINT "payables_bills_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payables_bills" ADD CONSTRAINT "payables_bills_bank_account_id_company_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."company_bank_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payables_bills" ADD CONSTRAINT "payables_bills_currency_id_organization_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."organization_currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payables_bills" ADD CONSTRAINT "payables_bills_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payables_bills" ADD CONSTRAINT "payables_bills_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payables_bills" ADD CONSTRAINT "payables_bills_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payables_tax_config" ADD CONSTRAINT "payables_tax_config_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_line_items" ADD CONSTRAINT "po_line_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_line_items" ADD CONSTRAINT "po_line_items_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_currency_id_organization_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."organization_currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_bank_accounts" ADD CONSTRAINT "vendor_bank_accounts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_bank_accounts" ADD CONSTRAINT "vendor_bank_accounts_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD CONSTRAINT "vendor_contacts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD CONSTRAINT "vendor_contacts_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_custom_categories" ADD CONSTRAINT "vendor_custom_categories_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bill_activity_bill_idx" ON "bill_activity_log" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "bill_activity_type_idx" ON "bill_activity_log" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "bill_activity_organization_idx" ON "bill_activity_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "bill_documents_bill_idx" ON "bill_documents" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "bill_documents_organization_idx" ON "bill_documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "bill_line_items_bill_idx" ON "bill_line_items" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "bill_line_items_organization_idx" ON "bill_line_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "bill_payments_bill_idx" ON "bill_payments" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "bill_payments_date_idx" ON "bill_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "bill_payments_organization_idx" ON "bill_payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "bill_taxes_bill_idx" ON "bill_taxes" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "bill_taxes_organization_idx" ON "bill_taxes" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "bill_taxes_type_idx" ON "bill_taxes" USING btree ("tax_type");--> statement-breakpoint
CREATE INDEX "payables_bills_vendor_idx" ON "payables_bills" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "payables_bills_po_idx" ON "payables_bills" USING btree ("po_id");--> statement-breakpoint
CREATE INDEX "payables_bills_status_idx" ON "payables_bills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payables_bills_organization_idx" ON "payables_bills" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payables_bills_due_date_idx" ON "payables_bills" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "payables_bills_bill_date_idx" ON "payables_bills" USING btree ("bill_date");--> statement-breakpoint
CREATE INDEX "payables_bills_duplicate_hash_idx" ON "payables_bills" USING btree ("duplicate_check_hash");--> statement-breakpoint
CREATE INDEX "payables_bills_vendor_invoice_idx" ON "payables_bills" USING btree ("vendor_id","vendor_invoice_number");--> statement-breakpoint
CREATE INDEX "payables_tax_config_org_idx" ON "payables_tax_config" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "po_line_items_po_idx" ON "po_line_items" USING btree ("po_id");--> statement-breakpoint
CREATE INDEX "po_line_items_organization_idx" ON "po_line_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_vendor_idx" ON "purchase_orders" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "purchase_orders_organization_idx" ON "purchase_orders" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_po_date_idx" ON "purchase_orders" USING btree ("po_date");--> statement-breakpoint
CREATE INDEX "vendor_bank_accounts_vendor_idx" ON "vendor_bank_accounts" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_bank_accounts_organization_idx" ON "vendor_bank_accounts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vendor_bank_accounts_active_idx" ON "vendor_bank_accounts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "vendor_contacts_vendor_idx" ON "vendor_contacts" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_contacts_organization_idx" ON "vendor_contacts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vendor_custom_categories_org_idx" ON "vendor_custom_categories" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vendors_email_idx" ON "vendors" USING btree ("email");--> statement-breakpoint
CREATE INDEX "vendors_organization_idx" ON "vendors" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vendors_category_idx" ON "vendors" USING btree ("category");--> statement-breakpoint
CREATE INDEX "vendors_status_idx" ON "vendors" USING btree ("status");
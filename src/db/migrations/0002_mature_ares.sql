CREATE TYPE "public"."attendance_warning_type" AS ENUM('late_arrival', 'early_departure', 'missing_signout', 'general');--> statement-breakpoint
CREATE TYPE "public"."project_access_level" AS ENUM('read', 'write');--> statement-breakpoint
CREATE TYPE "public"."driver_status" AS ENUM('Active', 'Inactive', 'Suspended');--> statement-breakpoint
CREATE TYPE "public"."fleet_expense_category" AS ENUM('Fuel', 'Maintenance', 'Insurance', 'Registration', 'Repairs', 'Tires', 'Parts', 'Inspection', 'Other');--> statement-breakpoint
CREATE TYPE "public"."incident_resolution_status" AS ENUM('Reported', 'Under Investigation', 'Resolved', 'Closed');--> statement-breakpoint
CREATE TYPE "public"."incident_severity" AS ENUM('Minor', 'Major', 'Critical');--> statement-breakpoint
CREATE TYPE "public"."incident_type" AS ENUM('Accident', 'Damage', 'Theft', 'Breakdown', 'Other');--> statement-breakpoint
CREATE TYPE "public"."maintenance_type" AS ENUM('Oil Change', 'Tire Rotation', 'Inspection', 'Repair', 'Brake Service', 'Battery Replacement', 'Transmission Service', 'Other');--> statement-breakpoint
CREATE TYPE "public"."vehicle_document_type" AS ENUM('Registration', 'Insurance', 'Maintenance', 'Inspection', 'Purchase', 'Photos', 'Other');--> statement-breakpoint
CREATE TYPE "public"."vehicle_fuel_type" AS ENUM('Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'Other');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('Active', 'Inactive', 'Maintenance');--> statement-breakpoint
CREATE TYPE "public"."candidate_document_type" AS ENUM('Resume', 'Cover Letter', 'Portfolio', 'Certificate', 'ID Proof', 'Other');--> statement-breakpoint
CREATE TYPE "public"."candidate_status" AS ENUM('Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."interview_recommendation" AS ENUM('Strong Hire', 'Hire', 'Maybe', 'No Hire');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('Scheduled', 'Completed', 'Cancelled', 'Rescheduled', 'No Show');--> statement-breakpoint
CREATE TYPE "public"."interview_type" AS ENUM('Phone Screening', 'Technical', 'Behavioral', 'HR Round', 'Final Round');--> statement-breakpoint
CREATE TYPE "public"."job_posting_status" AS ENUM('Draft', 'Published', 'Closed', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('Draft', 'Pending Approval', 'Approved', 'Sent', 'Accepted', 'Rejected', 'Expired');--> statement-breakpoint
CREATE TYPE "public"."recruitment_activity_type" AS ENUM('Application Received', 'Status Changed', 'Interview Scheduled', 'Interview Completed', 'Offer Generated', 'Offer Sent', 'Offer Accepted', 'Offer Rejected', 'Document Uploaded', 'Note Added', 'Email Sent');--> statement-breakpoint
CREATE TYPE "public"."invoicing_activity_type" AS ENUM('Invoice Created', 'Invoice Sent', 'Status Changed', 'Payment Recorded', 'Payment Deleted', 'Email Sent', 'Reminder Sent', 'Invoice Updated', 'Invoice Cancelled', 'PDF Generated', 'Client Updated', 'Note Added');--> statement-breakpoint
CREATE TYPE "public"."invoicing_document_type" AS ENUM('Invoice PDF', 'Payment Receipt', 'Credit Note', 'Tax Document', 'Other');--> statement-breakpoint
CREATE TYPE "public"."invoicing_payment_method" AS ENUM('Cash', 'Bank Transfer', 'Check', 'Credit Card', 'Debit Card', 'Mobile Money', 'Other');--> statement-breakpoint
CREATE TYPE "public"."invoicing_status" AS ENUM('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled', 'Partially Paid');--> statement-breakpoint
CREATE TYPE "public"."invoicing_template" AS ENUM('Modern', 'Classic', 'Minimal', 'Detailed', 'Professional');--> statement-breakpoint
CREATE TYPE "public"."asset_document_type" AS ENUM('Receipt', 'Invoice', 'Warranty', 'Photos', 'Manual', 'Maintenance Record', 'Inspection Report', 'Disposal Certificate', 'Other');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('Active', 'In Maintenance', 'Retired', 'Disposed', 'Lost/Stolen');--> statement-breakpoint
CREATE TYPE "public"."assignment_target_type" AS ENUM('Employee', 'Department', 'Project');--> statement-breakpoint
CREATE TYPE "public"."depreciation_method" AS ENUM('Straight-Line');--> statement-breakpoint
CREATE TYPE "public"."maintenance_interval_unit" AS ENUM('Days', 'Weeks', 'Months', 'Years');--> statement-breakpoint
CREATE TYPE "public"."asset_maintenance_status" AS ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Overdue');--> statement-breakpoint
CREATE TYPE "public"."value_adjustment_type" AS ENUM('Depreciation', 'Appreciation', 'Impairment', 'Revaluation');--> statement-breakpoint
ALTER TYPE "public"."theme" ADD VALUE 'ocean';--> statement-breakpoint
ALTER TYPE "public"."theme" ADD VALUE 'forest';--> statement-breakpoint
ALTER TYPE "public"."theme" ADD VALUE 'sunset';--> statement-breakpoint
CREATE TABLE "attendance_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"sign_in_start_hour" integer DEFAULT 6 NOT NULL,
	"sign_in_end_hour" integer DEFAULT 9 NOT NULL,
	"sign_out_start_hour" integer DEFAULT 14 NOT NULL,
	"sign_out_end_hour" integer DEFAULT 20 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_warnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"attendance_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"warning_type" "attendance_warning_type" NOT NULL,
	"reason" text NOT NULL,
	"message" text NOT NULL,
	"issued_by_user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"access_level" "project_access_level" DEFAULT 'read' NOT NULL,
	"granted_by" text,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_access_unique" UNIQUE("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "driver_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"driver_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"notes" text,
	"assigned_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"license_number" text NOT NULL,
	"license_expiry_date" date,
	"license_class" text,
	"date_of_birth" date,
	"employee_id" integer,
	"hire_date" date,
	"status" "driver_status" DEFAULT 'Active' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fleet_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"vehicle_id" integer NOT NULL,
	"driver_id" integer,
	"incident_type" "incident_type" NOT NULL,
	"severity" "incident_severity" NOT NULL,
	"incident_date" timestamp NOT NULL,
	"location" text,
	"description" text NOT NULL,
	"estimated_cost" numeric(15, 2),
	"resolution_status" "incident_resolution_status" DEFAULT 'Reported' NOT NULL,
	"resolution_notes" text,
	"resolved_at" timestamp,
	"reported_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fleet_maintenance" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"vehicle_id" integer NOT NULL,
	"maintenance_type" "maintenance_type" NOT NULL,
	"maintenance_date" date NOT NULL,
	"description" text NOT NULL,
	"cost" numeric(15, 2) NOT NULL,
	"mileage_at_service" numeric(10, 2),
	"performed_by" text,
	"next_service_due" text,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"vehicle_id" integer NOT NULL,
	"document_type" "vehicle_document_type" NOT NULL,
	"document_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" numeric(10, 2) NOT NULL,
	"mime_type" text,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"vin" text,
	"license_plate" text NOT NULL,
	"color" text,
	"current_mileage" numeric(10, 2) DEFAULT '0' NOT NULL,
	"fuel_type" "vehicle_fuel_type" NOT NULL,
	"status" "vehicle_status" DEFAULT 'Active' NOT NULL,
	"purchase_date" date,
	"purchase_price" numeric(15, 2),
	"current_value" numeric(15, 2),
	"depreciation_rate" numeric(5, 2),
	"insurance_policy_number" text,
	"insurance_provider" text,
	"insurance_expiry_date" date,
	"insurance_premium_amount" numeric(15, 2),
	"registration_number" text,
	"registration_expiry_date" date,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"billing_period_start" timestamp NOT NULL,
	"billing_period_end" timestamp NOT NULL,
	"due_date" date,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"document_type" "candidate_document_type" NOT NULL,
	"document_name" text NOT NULL,
	"original_file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" numeric(10, 2) NOT NULL,
	"mime_type" text,
	"uploaded_by" text,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_posting_id" integer NOT NULL,
	"candidate_code" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"current_company" text,
	"current_position" text,
	"years_experience" integer,
	"expected_salary" integer,
	"notice_period" text,
	"linkedin_url" text,
	"portfolio_url" text,
	"referred_by" text,
	"notes" text,
	"status" "candidate_status" DEFAULT 'Applied' NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"screened_by" text,
	"screened_at" timestamp,
	"screening_notes" text,
	"rejection_reason" text,
	"rejected_at" timestamp,
	"rejected_by" text,
	"hired_at" timestamp,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "candidates_candidate_code_unique" UNIQUE("candidate_code")
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"interview_type" "interview_type" NOT NULL,
	"round" integer DEFAULT 1 NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"scheduled_end_date" timestamp,
	"location" text,
	"interviewer_ids" text[],
	"status" "interview_status" DEFAULT 'Scheduled' NOT NULL,
	"feedback" text,
	"rating" integer,
	"recommendation" "interview_recommendation",
	"conducted_at" timestamp,
	"scheduled_by" text,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_postings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"code" text NOT NULL,
	"department" "employees_department" NOT NULL,
	"position" text NOT NULL,
	"description" text NOT NULL,
	"requirements" text,
	"responsibilities" text,
	"employment_type" "employment_type" NOT NULL,
	"salary_range_min" integer,
	"salary_range_max" integer,
	"location" text,
	"openings" integer DEFAULT 1 NOT NULL,
	"status" "job_posting_status" DEFAULT 'Draft' NOT NULL,
	"published_at" timestamp,
	"closed_at" timestamp,
	"posted_by" text,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_postings_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"job_posting_id" integer NOT NULL,
	"offer_code" text NOT NULL,
	"position" text NOT NULL,
	"department" "employees_department" NOT NULL,
	"employment_type" "employment_type" NOT NULL,
	"salary" integer NOT NULL,
	"start_date" date NOT NULL,
	"joining_bonus" integer DEFAULT 0,
	"benefits" text,
	"valid_until" date NOT NULL,
	"status" "offer_status" DEFAULT 'Draft' NOT NULL,
	"offer_letter_path" text,
	"sent_at" timestamp,
	"accepted_at" timestamp,
	"rejected_at" timestamp,
	"candidate_response" text,
	"prepared_by" text,
	"approved_by" text,
	"approved_at" timestamp,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "offers_offer_code_unique" UNIQUE("offer_code")
);
--> statement-breakpoint
CREATE TABLE "recruitment_activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"activity_type" "recruitment_activity_type" NOT NULL,
	"description" text NOT NULL,
	"performed_by" text,
	"metadata" jsonb,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruitment_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_posting_id" integer NOT NULL,
	"total_applications" integer DEFAULT 0 NOT NULL,
	"screened" integer DEFAULT 0 NOT NULL,
	"interviewed" integer DEFAULT 0 NOT NULL,
	"offered" integer DEFAULT 0 NOT NULL,
	"hired" integer DEFAULT 0 NOT NULL,
	"rejected" integer DEFAULT 0 NOT NULL,
	"avg_time_to_hire" integer DEFAULT 0,
	"avg_time_to_interview" integer DEFAULT 0,
	"organization_id" text NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_code" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company_name" text,
	"tax_id" text,
	"billing_address" text,
	"billing_city" text,
	"billing_state" text,
	"billing_postal_code" text,
	"billing_country" text,
	"shipping_address" text,
	"shipping_city" text,
	"shipping_state" text,
	"shipping_postal_code" text,
	"shipping_country" text,
	"website" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"organization_id" text NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clients_client_code_unique" UNIQUE("client_code")
);
--> statement-breakpoint
CREATE TABLE "company_bank_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_name" text NOT NULL,
	"bank_name" text NOT NULL,
	"account_number" text NOT NULL,
	"routing_number" text,
	"swift_code" text,
	"currency" text NOT NULL,
	"organization_id" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"activity_type" "invoicing_activity_type" NOT NULL,
	"description" text NOT NULL,
	"performed_by" text,
	"metadata" jsonb,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"document_type" "invoicing_document_type" NOT NULL,
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
CREATE TABLE "invoice_line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1.00' NOT NULL,
	"unit_price" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"total_revenue" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"paid_revenue" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"pending_revenue" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"overdue_revenue" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total_invoices" integer DEFAULT 0 NOT NULL,
	"draft_invoices" integer DEFAULT 0 NOT NULL,
	"sent_invoices" integer DEFAULT 0 NOT NULL,
	"paid_invoices" integer DEFAULT 0 NOT NULL,
	"overdue_invoices" integer DEFAULT 0 NOT NULL,
	"partially_paid_invoices" integer DEFAULT 0 NOT NULL,
	"cancelled_invoices" integer DEFAULT 0 NOT NULL,
	"avg_payment_time" integer DEFAULT 0,
	"avg_invoice_value" numeric(12, 2) DEFAULT '0.00',
	"total_clients" integer DEFAULT 0 NOT NULL,
	"active_clients" integer DEFAULT 0 NOT NULL,
	"period_type" text NOT NULL,
	"period_value" text,
	"organization_id" text NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_metrics_org_period_idx" UNIQUE("organization_id","period_type","period_value")
);
--> statement-breakpoint
CREATE TABLE "invoice_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"payment_method" "invoicing_payment_method" NOT NULL,
	"reference_number" text,
	"notes" text,
	"recorded_by" text,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_taxes" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"tax_name" text NOT NULL,
	"tax_percentage" numeric(5, 2) NOT NULL,
	"tax_amount" numeric(12, 2) NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_currencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"currency_code" text NOT NULL,
	"currency_symbol" text NOT NULL,
	"currency_name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"exchange_rate" numeric(12, 6) DEFAULT '1.000000',
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "org_currencies_org_code_idx" UNIQUE("organization_id","currency_code")
);
--> statement-breakpoint
CREATE TABLE "asset_assignment_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"asset_id" integer NOT NULL,
	"transfer_date" timestamp NOT NULL,
	"from_target_type" "assignment_target_type",
	"from_employee_id" text,
	"from_department" text,
	"from_project_id" integer,
	"to_target_type" "assignment_target_type",
	"to_employee_id" text,
	"to_department" text,
	"to_project_id" integer,
	"reason" text NOT NULL,
	"notes" text,
	"transferred_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"asset_id" integer NOT NULL,
	"target_type" "assignment_target_type" NOT NULL,
	"employee_id" text,
	"department" text,
	"project_id" integer,
	"assigned_date" date NOT NULL,
	"expected_return_date" date,
	"actual_return_date" date,
	"notes" text,
	"assigned_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"code_prefix" text NOT NULL,
	"depreciation_method" "depreciation_method" DEFAULT 'Straight-Line',
	"default_useful_life_years" integer,
	"default_residual_value_percent" numeric(5, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_categories_org_prefix_unique" UNIQUE("organization_id","code_prefix")
);
--> statement-breakpoint
CREATE TABLE "asset_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"asset_id" integer NOT NULL,
	"document_type" "asset_document_type" NOT NULL,
	"document_name" text NOT NULL,
	"original_file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" numeric(10, 2) NOT NULL,
	"mime_type" text,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"type" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_maintenance" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"asset_id" integer NOT NULL,
	"schedule_id" integer,
	"title" text NOT NULL,
	"description" text,
	"scheduled_date" date NOT NULL,
	"completed_date" date,
	"status" "asset_maintenance_status" DEFAULT 'Scheduled' NOT NULL,
	"cost" numeric(15, 2),
	"performed_by" text,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_maintenance_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"asset_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"interval_value" integer NOT NULL,
	"interval_unit" "maintenance_interval_unit" NOT NULL,
	"last_performed_date" date,
	"next_due_date" date,
	"estimated_cost" numeric(15, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_management_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"can_manage_assets" boolean DEFAULT false NOT NULL,
	"can_approve_disposal" boolean DEFAULT false NOT NULL,
	"can_perform_adjustments" boolean DEFAULT false NOT NULL,
	"added_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_management_teams_user_unique" UNIQUE("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "asset_value_adjustments" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"asset_id" integer NOT NULL,
	"adjustment_type" "value_adjustment_type" NOT NULL,
	"adjustment_date" date NOT NULL,
	"previous_value" numeric(15, 2) NOT NULL,
	"adjustment_amount" numeric(15, 2) NOT NULL,
	"new_value" numeric(15, 2) NOT NULL,
	"reason" text NOT NULL,
	"notes" text,
	"calculation_details" jsonb,
	"adjusted_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"asset_code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_id" integer NOT NULL,
	"location_id" integer,
	"purchase_date" date,
	"purchase_price" numeric(15, 2),
	"vendor" text,
	"po_number" text,
	"current_value" numeric(15, 2),
	"depreciation_method" "depreciation_method" DEFAULT 'Straight-Line',
	"useful_life_years" integer,
	"residual_value" numeric(15, 2),
	"depreciation_start_date" date,
	"accumulated_depreciation" numeric(15, 2) DEFAULT '0',
	"warranty_start_date" date,
	"warranty_end_date" date,
	"warranty_provider" text,
	"warranty_terms" text,
	"serial_number" text,
	"model" text,
	"manufacturer" text,
	"barcode" text,
	"requires_maintenance" boolean DEFAULT false NOT NULL,
	"status" "asset_status" DEFAULT 'Active' NOT NULL,
	"disposal_date" date,
	"disposal_reason" text,
	"disposal_price" numeric(15, 2),
	"disposed_by" text,
	"notes" text,
	"custom_fields" jsonb,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assets_asset_code_unique" UNIQUE("asset_code")
);
--> statement-breakpoint
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_invoice_id_invoices_id_fk";
--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_subscription_id_subscriptions_id_fk";
--> statement-breakpoint
DROP INDEX "invoice_subscription_idx";--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "status" SET DATA TYPE "public"."invoicing_status" USING "status"::text::"public"."invoicing_status";--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'Draft';--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "due_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "sign_in_latitude" numeric(10, 8);--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "sign_in_longitude" numeric(11, 8);--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "sign_in_location" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "company_expenses" ADD COLUMN "is_fleet_expense" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "company_expenses" ADD COLUMN "vehicle_id" integer;--> statement-breakpoint
ALTER TABLE "company_expenses" ADD COLUMN "fleet_expense_category" "fleet_expense_category";--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "invoice_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "client_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "bank_account_id" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "invoice_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "currency_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "subtotal" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "tax_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "total" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "amount_paid" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "amount_due" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "terms_and_conditions" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "footer_note" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "template" "invoicing_template" DEFAULT 'Modern' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "pdf_path" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "email_sent_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "last_reminder_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "reminder_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "attendance_settings" ADD CONSTRAINT "attendance_settings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_warnings" ADD CONSTRAINT "attendance_warnings_attendance_id_attendance_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_warnings" ADD CONSTRAINT "attendance_warnings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_warnings" ADD CONSTRAINT "attendance_warnings_issued_by_user_id_user_id_fk" FOREIGN KEY ("issued_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_warnings" ADD CONSTRAINT "attendance_warnings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_access" ADD CONSTRAINT "project_access_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_access" ADD CONSTRAINT "project_access_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_access" ADD CONSTRAINT "project_access_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_access" ADD CONSTRAINT "project_access_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_incidents" ADD CONSTRAINT "fleet_incidents_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_incidents" ADD CONSTRAINT "fleet_incidents_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_incidents" ADD CONSTRAINT "fleet_incidents_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_incidents" ADD CONSTRAINT "fleet_incidents_reported_by_user_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_maintenance" ADD CONSTRAINT "fleet_maintenance_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_maintenance" ADD CONSTRAINT "fleet_maintenance_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_maintenance" ADD CONSTRAINT "fleet_maintenance_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions_invoices" ADD CONSTRAINT "subscriptions_invoices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_screened_by_user_id_fk" FOREIGN KEY ("screened_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_rejected_by_user_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_scheduled_by_user_id_fk" FOREIGN KEY ("scheduled_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_posted_by_user_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_prepared_by_user_id_fk" FOREIGN KEY ("prepared_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_activity_log" ADD CONSTRAINT "recruitment_activity_log_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_activity_log" ADD CONSTRAINT "recruitment_activity_log_performed_by_user_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_activity_log" ADD CONSTRAINT "recruitment_activity_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_metrics" ADD CONSTRAINT "recruitment_metrics_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_metrics" ADD CONSTRAINT "recruitment_metrics_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_bank_accounts" ADD CONSTRAINT "company_bank_accounts_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_activity_log" ADD CONSTRAINT "invoice_activity_log_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_activity_log" ADD CONSTRAINT "invoice_activity_log_performed_by_user_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_activity_log" ADD CONSTRAINT "invoice_activity_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_documents" ADD CONSTRAINT "invoice_documents_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_documents" ADD CONSTRAINT "invoice_documents_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_documents" ADD CONSTRAINT "invoice_documents_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_metrics" ADD CONSTRAINT "invoice_metrics_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_taxes" ADD CONSTRAINT "invoice_taxes_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_taxes" ADD CONSTRAINT "invoice_taxes_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_currencies" ADD CONSTRAINT "organization_currencies_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignment_history" ADD CONSTRAINT "asset_assignment_history_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignment_history" ADD CONSTRAINT "asset_assignment_history_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignment_history" ADD CONSTRAINT "asset_assignment_history_from_employee_id_user_id_fk" FOREIGN KEY ("from_employee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignment_history" ADD CONSTRAINT "asset_assignment_history_from_project_id_projects_id_fk" FOREIGN KEY ("from_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignment_history" ADD CONSTRAINT "asset_assignment_history_to_employee_id_user_id_fk" FOREIGN KEY ("to_employee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignment_history" ADD CONSTRAINT "asset_assignment_history_to_project_id_projects_id_fk" FOREIGN KEY ("to_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignment_history" ADD CONSTRAINT "asset_assignment_history_transferred_by_user_id_fk" FOREIGN KEY ("transferred_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_employee_id_user_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_documents" ADD CONSTRAINT "asset_documents_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_documents" ADD CONSTRAINT "asset_documents_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_documents" ADD CONSTRAINT "asset_documents_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_locations" ADD CONSTRAINT "asset_locations_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_locations" ADD CONSTRAINT "asset_locations_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenance" ADD CONSTRAINT "asset_maintenance_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenance" ADD CONSTRAINT "asset_maintenance_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenance" ADD CONSTRAINT "asset_maintenance_schedule_id_asset_maintenance_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."asset_maintenance_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenance" ADD CONSTRAINT "asset_maintenance_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenance_schedules" ADD CONSTRAINT "asset_maintenance_schedules_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenance_schedules" ADD CONSTRAINT "asset_maintenance_schedules_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenance_schedules" ADD CONSTRAINT "asset_maintenance_schedules_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_management_teams" ADD CONSTRAINT "asset_management_teams_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_management_teams" ADD CONSTRAINT "asset_management_teams_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_management_teams" ADD CONSTRAINT "asset_management_teams_added_by_user_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_value_adjustments" ADD CONSTRAINT "asset_value_adjustments_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_value_adjustments" ADD CONSTRAINT "asset_value_adjustments_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_value_adjustments" ADD CONSTRAINT "asset_value_adjustments_adjusted_by_user_id_fk" FOREIGN KEY ("adjusted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_category_id_asset_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."asset_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_location_id_asset_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."asset_locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_disposed_by_user_id_fk" FOREIGN KEY ("disposed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_warnings_user_idx" ON "attendance_warnings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "attendance_warnings_attendance_idx" ON "attendance_warnings" USING btree ("attendance_id");--> statement-breakpoint
CREATE INDEX "project_access_project_idx" ON "project_access" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_access_user_idx" ON "project_access" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_access_organization_idx" ON "project_access" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "driver_assignments_organization_idx" ON "driver_assignments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "driver_assignments_driver_idx" ON "driver_assignments" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "driver_assignments_vehicle_idx" ON "driver_assignments" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "driver_assignments_active_idx" ON "driver_assignments" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "drivers_organization_idx" ON "drivers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "drivers_status_idx" ON "drivers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "drivers_license_idx" ON "drivers" USING btree ("license_number");--> statement-breakpoint
CREATE INDEX "drivers_employee_idx" ON "drivers" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "fleet_incidents_organization_idx" ON "fleet_incidents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "fleet_incidents_vehicle_idx" ON "fleet_incidents" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "fleet_incidents_driver_idx" ON "fleet_incidents" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "fleet_incidents_date_idx" ON "fleet_incidents" USING btree ("incident_date");--> statement-breakpoint
CREATE INDEX "fleet_incidents_status_idx" ON "fleet_incidents" USING btree ("resolution_status");--> statement-breakpoint
CREATE INDEX "fleet_incidents_severity_idx" ON "fleet_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "fleet_maintenance_organization_idx" ON "fleet_maintenance" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "fleet_maintenance_vehicle_idx" ON "fleet_maintenance" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "fleet_maintenance_date_idx" ON "fleet_maintenance" USING btree ("maintenance_date");--> statement-breakpoint
CREATE INDEX "fleet_maintenance_type_idx" ON "fleet_maintenance" USING btree ("maintenance_type");--> statement-breakpoint
CREATE INDEX "vehicle_documents_organization_idx" ON "vehicle_documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vehicle_documents_vehicle_idx" ON "vehicle_documents" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "vehicle_documents_type_idx" ON "vehicle_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "vehicles_organization_idx" ON "vehicles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vehicles_status_idx" ON "vehicles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vehicles_license_plate_idx" ON "vehicles" USING btree ("license_plate");--> statement-breakpoint
CREATE INDEX "vehicles_vin_idx" ON "vehicles" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "invoice_subscription_idx" ON "subscriptions_invoices" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "candidate_documents_candidate_idx" ON "candidate_documents" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "candidate_documents_type_idx" ON "candidate_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "candidate_documents_organization_idx" ON "candidate_documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "candidates_job_posting_idx" ON "candidates" USING btree ("job_posting_id");--> statement-breakpoint
CREATE INDEX "candidates_status_idx" ON "candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "candidates_email_idx" ON "candidates" USING btree ("email");--> statement-breakpoint
CREATE INDEX "candidates_organization_idx" ON "candidates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "interviews_candidate_idx" ON "interviews" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "interviews_status_idx" ON "interviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "interviews_scheduled_date_idx" ON "interviews" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "interviews_organization_idx" ON "interviews" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "job_postings_department_idx" ON "job_postings" USING btree ("department");--> statement-breakpoint
CREATE INDEX "job_postings_status_idx" ON "job_postings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_postings_organization_idx" ON "job_postings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "offers_candidate_idx" ON "offers" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "offers_status_idx" ON "offers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "offers_job_posting_idx" ON "offers" USING btree ("job_posting_id");--> statement-breakpoint
CREATE INDEX "offers_organization_idx" ON "offers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "recruitment_activity_candidate_idx" ON "recruitment_activity_log" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "recruitment_activity_type_idx" ON "recruitment_activity_log" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "recruitment_activity_organization_idx" ON "recruitment_activity_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "recruitment_metrics_job_posting_idx" ON "recruitment_metrics" USING btree ("job_posting_id");--> statement-breakpoint
CREATE INDEX "recruitment_metrics_organization_idx" ON "recruitment_metrics" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "clients_email_idx" ON "clients" USING btree ("email");--> statement-breakpoint
CREATE INDEX "clients_organization_idx" ON "clients" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "clients_active_idx" ON "clients" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "company_bank_accounts_org_idx" ON "company_bank_accounts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "company_bank_accounts_active_idx" ON "company_bank_accounts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "invoice_activity_invoice_idx" ON "invoice_activity_log" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_activity_type_idx" ON "invoice_activity_log" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "invoice_activity_organization_idx" ON "invoice_activity_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoice_documents_invoice_idx" ON "invoice_documents" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_documents_organization_idx" ON "invoice_documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoice_line_items_invoice_idx" ON "invoice_line_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_line_items_organization_idx" ON "invoice_line_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoice_metrics_organization_idx" ON "invoice_metrics" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoice_metrics_period_idx" ON "invoice_metrics" USING btree ("period_type","period_value");--> statement-breakpoint
CREATE INDEX "invoice_payments_invoice_idx" ON "invoice_payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_payments_date_idx" ON "invoice_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "invoice_payments_organization_idx" ON "invoice_payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoice_taxes_invoice_idx" ON "invoice_taxes" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_taxes_organization_idx" ON "invoice_taxes" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "org_currencies_organization_idx" ON "organization_currencies" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "asset_assignment_history_organization_idx" ON "asset_assignment_history" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "asset_assignment_history_asset_idx" ON "asset_assignment_history" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "asset_assignment_history_date_idx" ON "asset_assignment_history" USING btree ("transfer_date");--> statement-breakpoint
CREATE INDEX "asset_assignments_organization_idx" ON "asset_assignments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "asset_assignments_asset_idx" ON "asset_assignments" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "asset_assignments_employee_idx" ON "asset_assignments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "asset_assignments_project_idx" ON "asset_assignments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "asset_assignments_department_idx" ON "asset_assignments" USING btree ("department");--> statement-breakpoint
CREATE INDEX "asset_assignments_active_idx" ON "asset_assignments" USING btree ("actual_return_date");--> statement-breakpoint
CREATE INDEX "asset_categories_organization_idx" ON "asset_categories" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "asset_categories_code_prefix_idx" ON "asset_categories" USING btree ("code_prefix");--> statement-breakpoint
CREATE INDEX "asset_documents_organization_idx" ON "asset_documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "asset_documents_asset_idx" ON "asset_documents" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "asset_documents_type_idx" ON "asset_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "asset_locations_organization_idx" ON "asset_locations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "asset_locations_name_idx" ON "asset_locations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "asset_maintenance_organization_idx" ON "asset_maintenance" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "asset_maintenance_asset_idx" ON "asset_maintenance" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "asset_maintenance_schedule_idx" ON "asset_maintenance" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "asset_maintenance_status_idx" ON "asset_maintenance" USING btree ("status");--> statement-breakpoint
CREATE INDEX "asset_maintenance_scheduled_date_idx" ON "asset_maintenance" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "asset_maintenance_schedules_organization_idx" ON "asset_maintenance_schedules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "asset_maintenance_schedules_asset_idx" ON "asset_maintenance_schedules" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "asset_maintenance_schedules_next_due_idx" ON "asset_maintenance_schedules" USING btree ("next_due_date");--> statement-breakpoint
CREATE INDEX "asset_management_teams_organization_idx" ON "asset_management_teams" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "asset_management_teams_user_idx" ON "asset_management_teams" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "asset_value_adjustments_organization_idx" ON "asset_value_adjustments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "asset_value_adjustments_asset_idx" ON "asset_value_adjustments" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "asset_value_adjustments_type_idx" ON "asset_value_adjustments" USING btree ("adjustment_type");--> statement-breakpoint
CREATE INDEX "asset_value_adjustments_date_idx" ON "asset_value_adjustments" USING btree ("adjustment_date");--> statement-breakpoint
CREATE INDEX "assets_organization_idx" ON "assets" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "assets_code_idx" ON "assets" USING btree ("asset_code");--> statement-breakpoint
CREATE INDEX "assets_category_idx" ON "assets" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "assets_location_idx" ON "assets" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "assets_status_idx" ON "assets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "assets_serial_number_idx" ON "assets" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX "assets_warranty_end_idx" ON "assets" USING btree ("warranty_end_date");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_expenses" ADD CONSTRAINT "company_expenses_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_subscriptions_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."subscriptions_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_bank_account_id_company_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."company_bank_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_currency_id_organization_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."organization_currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_created_by_idx" ON "projects" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "company_expenses_vehicle_idx" ON "company_expenses" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "company_expenses_fleet_idx" ON "company_expenses" USING btree ("is_fleet_expense");--> statement-breakpoint
CREATE INDEX "invoices_client_idx" ON "invoices" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoices_organization_idx" ON "invoices" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoices_due_date_idx" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "invoices_invoice_date_idx" ON "invoices" USING btree ("invoice_date");--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "subscription_id";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "amount";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "currency";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "billing_period_start";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "billing_period_end";--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number");
CREATE TYPE "public"."allowance_type" AS ENUM('one-time', 'monthly', 'annual', 'bi-annual', 'quarterly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."deduction_type" AS ENUM('recurring', 'one-time', 'statutory', 'loan', 'advance');--> statement-breakpoint
CREATE TYPE "public"."payroll_detail_type" AS ENUM('base_salary', 'allowance', 'deduction', 'bonus', 'overtime', 'commission', 'reimbursement', 'tax', 'loan', 'advance');--> statement-breakpoint
CREATE TYPE "public"."payroll_item_type" AS ENUM('salary', 'allowance', 'bonus', 'overtime', 'commission', 'reimbursement');--> statement-breakpoint
CREATE TYPE "public"."payroll_run_status" AS ENUM('draft', 'pending', 'processing', 'completed', 'approved', 'paid', 'archived');--> statement-breakpoint
CREATE TYPE "public"."payrun_type" AS ENUM('salary', 'allowance');--> statement-breakpoint
CREATE TYPE "public"."ask_hr_category" AS ENUM('General', 'Benefits', 'Payroll', 'Leave', 'Employment', 'Workplace', 'Training', 'Other');--> statement-breakpoint
CREATE TYPE "public"."ask_hr_status" AS ENUM('Open', 'In Progress', 'Redirected', 'Answered', 'Closed');--> statement-breakpoint
CREATE TYPE "public"."loan_amount_type" AS ENUM('fixed', 'percentage');--> statement-breakpoint
CREATE TYPE "public"."loan_application_status" AS ENUM('pending', 'hr_approved', 'hr_rejected', 'disbursed', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."repayment_status" AS ENUM('pending', 'paid', 'partial', 'overdue', 'waived');--> statement-breakpoint
CREATE TYPE "public"."news_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"date" date,
	"time" time,
	"sign_out_time" time,
	"checked_in" boolean,
	"approved_by" integer,
	"sign_out_approved" boolean DEFAULT false,
	"sign_out_approved_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees_bank" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"bank_name" text NOT NULL,
	"account_name" text NOT NULL,
	"account_number" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"document_type" text NOT NULL,
	"document_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" numeric(10, 2) NOT NULL,
	"mime_type" text,
	"uploaded_by" integer,
	"department" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employment_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"start_date" date,
	"end_date" date,
	"department" text,
	"employment_type" "employment_type",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_label_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"label_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_labels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "allowances" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "allowance_type" DEFAULT 'one-time' NOT NULL,
	"percentage" numeric(5, 2),
	"amount" numeric(15, 2),
	"taxable" boolean DEFAULT false NOT NULL,
	"tax_percentage" numeric(5, 2),
	"description" text,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deductions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"percentage" numeric(5, 2),
	"amount" numeric(15, 2),
	"type" "deduction_type" DEFAULT 'recurring' NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_allowances" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"allowance_id" integer NOT NULL,
	"effective_from" timestamp DEFAULT now(),
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_deductions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"employee_id" integer NOT NULL,
	"salary_structure_id" integer NOT NULL,
	"type" "deduction_type",
	"amount" numeric(15, 2),
	"percentage" numeric(5, 2),
	"original_amount" numeric(15, 2),
	"remaining_amount" numeric(15, 2),
	"active" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp DEFAULT now(),
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_salary" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"salary_structure_id" integer NOT NULL,
	"effective_from" timestamp DEFAULT now(),
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payrun" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "payrun_type" DEFAULT 'salary' NOT NULL,
	"allowance_id" integer,
	"day" integer NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"total_employees" integer DEFAULT 0 NOT NULL,
	"total_gross_pay" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_deductions" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_net_pay" numeric(15, 2) DEFAULT '0' NOT NULL,
	"status" "payroll_run_status" DEFAULT 'draft',
	"generated_by" integer NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp,
	"completed_by" integer,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_payrun_payroll_period" UNIQUE("year","month","day","type","allowance_id")
);
--> statement-breakpoint
CREATE TABLE "payrun_item_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"payrun_item_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"detail_type" "payroll_detail_type" NOT NULL,
	"description" text NOT NULL,
	"allowance_id" integer,
	"deduction_id" integer,
	"employee_allowance_id" integer,
	"employee_deduction_id" integer,
	"loan_application_id" integer,
	"amount" numeric(15, 2) NOT NULL,
	"original_amount" numeric(15, 2),
	"remaining_amount" numeric(15, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payrun_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "payroll_item_type" DEFAULT 'salary' NOT NULL,
	"payrun_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"base_salary" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_allowances" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_deductions" numeric(15, 2) DEFAULT '0' NOT NULL,
	"gross_pay" numeric(15, 2) DEFAULT '0' NOT NULL,
	"taxable_income" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_taxes" numeric(15, 2) DEFAULT '0' NOT NULL,
	"net_pay" numeric(15, 2) DEFAULT '0' NOT NULL,
	"status" "payroll_run_status" DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_payrun_item" UNIQUE("payrun_id","employee_id")
);
--> statement-breakpoint
CREATE TABLE "payslips" (
	"id" serial PRIMARY KEY NOT NULL,
	"payroll_item_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"file_path" text,
	"generated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "salary_allowances" (
	"id" serial PRIMARY KEY NOT NULL,
	"salary_structure_id" integer NOT NULL,
	"allowance_id" integer NOT NULL,
	"effective_from" timestamp DEFAULT now(),
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_deductions" (
	"id" serial PRIMARY KEY NOT NULL,
	"salary_structure_id" integer NOT NULL,
	"deduction_id" integer NOT NULL,
	"effective_from" timestamp DEFAULT now(),
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_structure" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"base_salary" numeric(15, 2) NOT NULL,
	"description" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"employee_count" integer DEFAULT 0 NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ask_hr_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"title" text NOT NULL,
	"question" text NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"allow_public_responses" boolean DEFAULT false NOT NULL,
	"category" "ask_hr_category" NOT NULL,
	"status" "ask_hr_status" DEFAULT 'Open' NOT NULL,
	"redirected_to" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ask_hr_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"respondent_id" integer NOT NULL,
	"response" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_number" text NOT NULL,
	"employee_id" integer NOT NULL,
	"loan_type_id" integer NOT NULL,
	"requested_amount" numeric(15, 2) NOT NULL,
	"approved_amount" numeric(15, 2),
	"monthly_deduction" numeric(15, 2),
	"tenure_months" integer NOT NULL,
	"reason" text NOT NULL,
	"status" "loan_application_status" DEFAULT 'pending' NOT NULL,
	"hr_reviewed_by" integer,
	"hr_reviewed_at" timestamp,
	"hr_remarks" text,
	"disbursed_by" integer,
	"disbursed_at" timestamp,
	"disbursement_remarks" text,
	"employee_deduction_id" integer,
	"total_repaid" numeric(15, 2) DEFAULT '0' NOT NULL,
	"remaining_balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "loan_applications_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "loan_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_application_id" integer NOT NULL,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"performed_by" integer,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_repayments" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_application_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"installment_number" integer NOT NULL,
	"due_date" timestamp NOT NULL,
	"expected_amount" numeric(15, 2) NOT NULL,
	"paid_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"balance_after" numeric(15, 2),
	"status" "repayment_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"payrun_id" integer,
	"payrun_item_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_loan_installment" UNIQUE("loan_application_id","installment_number")
);
--> statement-breakpoint
CREATE TABLE "loan_type_salary_structures" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_type_id" integer NOT NULL,
	"salary_structure_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_loan_type_salary_structure" UNIQUE("loan_type_id","salary_structure_id")
);
--> statement-breakpoint
CREATE TABLE "loan_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"amount_type" "loan_amount_type" DEFAULT 'fixed' NOT NULL,
	"fixed_amount" numeric(15, 2),
	"max_percentage" numeric(5, 2),
	"tenure_months" integer NOT NULL,
	"interest_rate" numeric(5, 2) DEFAULT '0',
	"min_service_months" integer DEFAULT 0,
	"max_active_loans" integer DEFAULT 1,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "loan_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"author_id" serial NOT NULL,
	"status" "news_status" DEFAULT 'draft' NOT NULL,
	"comments_enabled" boolean DEFAULT true NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"user_id" serial NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'Todo'::text;--> statement-breakpoint
DROP TYPE "public"."task_status";--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('Backlog', 'Todo', 'In Progress', 'Technical Review', 'Paused', 'Completed');--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'Todo'::"public"."task_status";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DATA TYPE "public"."task_status" USING "status"::"public"."task_status";--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "status" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "links" jsonb;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "progress_completed" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "progress_total" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_sign_out_approved_by_employees_id_fk" FOREIGN KEY ("sign_out_approved_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees_bank" ADD CONSTRAINT "employees_bank_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees_documents" ADD CONSTRAINT "employees_documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees_documents" ADD CONSTRAINT "employees_documents_uploaded_by_employees_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employment_history" ADD CONSTRAINT "employment_history_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_label_assignments" ADD CONSTRAINT "task_label_assignments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_label_assignments" ADD CONSTRAINT "task_label_assignments_label_id_task_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."task_labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allowances" ADD CONSTRAINT "allowances_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allowances" ADD CONSTRAINT "allowances_updated_by_employees_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deductions" ADD CONSTRAINT "deductions_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deductions" ADD CONSTRAINT "deductions_updated_by_employees_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_allowances" ADD CONSTRAINT "employee_allowances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_allowances" ADD CONSTRAINT "employee_allowances_allowance_id_allowances_id_fk" FOREIGN KEY ("allowance_id") REFERENCES "public"."allowances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_deductions" ADD CONSTRAINT "employee_deductions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_deductions" ADD CONSTRAINT "employee_deductions_salary_structure_id_salary_structure_id_fk" FOREIGN KEY ("salary_structure_id") REFERENCES "public"."salary_structure"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary" ADD CONSTRAINT "employee_salary_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary" ADD CONSTRAINT "employee_salary_salary_structure_id_salary_structure_id_fk" FOREIGN KEY ("salary_structure_id") REFERENCES "public"."salary_structure"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrun" ADD CONSTRAINT "payrun_allowance_id_allowances_id_fk" FOREIGN KEY ("allowance_id") REFERENCES "public"."allowances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrun" ADD CONSTRAINT "payrun_generated_by_employees_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrun" ADD CONSTRAINT "payrun_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrun" ADD CONSTRAINT "payrun_completed_by_employees_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrun_item_details" ADD CONSTRAINT "payrun_item_details_payrun_item_id_payrun_items_id_fk" FOREIGN KEY ("payrun_item_id") REFERENCES "public"."payrun_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrun_item_details" ADD CONSTRAINT "payrun_item_details_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrun_item_details" ADD CONSTRAINT "payrun_item_details_allowance_id_allowances_id_fk" FOREIGN KEY ("allowance_id") REFERENCES "public"."allowances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrun_item_details" ADD CONSTRAINT "payrun_item_details_deduction_id_deductions_id_fk" FOREIGN KEY ("deduction_id") REFERENCES "public"."deductions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrun_item_details" ADD CONSTRAINT "payrun_item_details_employee_allowance_id_employee_allowances_id_fk" FOREIGN KEY ("employee_allowance_id") REFERENCES "public"."employee_allowances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrun_item_details" ADD CONSTRAINT "payrun_item_details_employee_deduction_id_employee_deductions_id_fk" FOREIGN KEY ("employee_deduction_id") REFERENCES "public"."employee_deductions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrun_items" ADD CONSTRAINT "payrun_items_payrun_id_payrun_id_fk" FOREIGN KEY ("payrun_id") REFERENCES "public"."payrun"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrun_items" ADD CONSTRAINT "payrun_items_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_item_id_payrun_items_id_fk" FOREIGN KEY ("payroll_item_id") REFERENCES "public"."payrun_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_allowances" ADD CONSTRAINT "salary_allowances_salary_structure_id_salary_structure_id_fk" FOREIGN KEY ("salary_structure_id") REFERENCES "public"."salary_structure"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_allowances" ADD CONSTRAINT "salary_allowances_allowance_id_allowances_id_fk" FOREIGN KEY ("allowance_id") REFERENCES "public"."allowances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_deductions" ADD CONSTRAINT "salary_deductions_salary_structure_id_salary_structure_id_fk" FOREIGN KEY ("salary_structure_id") REFERENCES "public"."salary_structure"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_deductions" ADD CONSTRAINT "salary_deductions_deduction_id_deductions_id_fk" FOREIGN KEY ("deduction_id") REFERENCES "public"."deductions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structure" ADD CONSTRAINT "salary_structure_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structure" ADD CONSTRAINT "salary_structure_updated_by_employees_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ask_hr_questions" ADD CONSTRAINT "ask_hr_questions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ask_hr_questions" ADD CONSTRAINT "ask_hr_questions_redirected_to_employees_id_fk" FOREIGN KEY ("redirected_to") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ask_hr_responses" ADD CONSTRAINT "ask_hr_responses_question_id_ask_hr_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."ask_hr_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ask_hr_responses" ADD CONSTRAINT "ask_hr_responses_respondent_id_employees_id_fk" FOREIGN KEY ("respondent_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_loan_type_id_loan_types_id_fk" FOREIGN KEY ("loan_type_id") REFERENCES "public"."loan_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_hr_reviewed_by_employees_id_fk" FOREIGN KEY ("hr_reviewed_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_disbursed_by_employees_id_fk" FOREIGN KEY ("disbursed_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_employee_deduction_id_employee_deductions_id_fk" FOREIGN KEY ("employee_deduction_id") REFERENCES "public"."employee_deductions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_history" ADD CONSTRAINT "loan_history_loan_application_id_loan_applications_id_fk" FOREIGN KEY ("loan_application_id") REFERENCES "public"."loan_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_history" ADD CONSTRAINT "loan_history_performed_by_employees_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_repayments" ADD CONSTRAINT "loan_repayments_loan_application_id_loan_applications_id_fk" FOREIGN KEY ("loan_application_id") REFERENCES "public"."loan_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_repayments" ADD CONSTRAINT "loan_repayments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_type_salary_structures" ADD CONSTRAINT "loan_type_salary_structures_loan_type_id_loan_types_id_fk" FOREIGN KEY ("loan_type_id") REFERENCES "public"."loan_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_type_salary_structures" ADD CONSTRAINT "loan_type_salary_structures_salary_structure_id_salary_structure_id_fk" FOREIGN KEY ("salary_structure_id") REFERENCES "public"."salary_structure"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_types" ADD CONSTRAINT "loan_types_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_types" ADD CONSTRAINT "loan_types_updated_by_employees_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_author_id_employees_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_attachments" ADD CONSTRAINT "news_attachments_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_user_id_employees_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendence_employee_idx" ON "attendance" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "attendence_approved_idx" ON "attendance" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "attendance_employee_date_idx" ON "attendance" USING btree ("employee_id","date");--> statement-breakpoint
CREATE INDEX "attendance_date_idx" ON "attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "attendance_signout_approved_idx" ON "attendance" USING btree ("sign_out_approved");--> statement-breakpoint
CREATE INDEX "attendance_signout_approved_by_idx" ON "attendance" USING btree ("sign_out_approved_by");--> statement-breakpoint
CREATE INDEX "history_employee_idx" ON "employment_history" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employment_history_active_idx" ON "employment_history" USING btree ("end_date") WHERE end_date IS NULL;--> statement-breakpoint
CREATE INDEX "task_label_assignments_task_idx" ON "task_label_assignments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_label_assignments_label_idx" ON "task_label_assignments" USING btree ("label_id");--> statement-breakpoint
CREATE INDEX "allowance_amount_idx" ON "allowances" USING btree ("amount");--> statement-breakpoint
CREATE INDEX "employee_allowance_id_idx" ON "employee_allowances" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_allowance_active_idx" ON "employee_allowances" USING btree ("employee_id","allowance_id") WHERE effective_to IS NULL;--> statement-breakpoint
CREATE INDEX "emp_deduction_employee_idx" ON "employee_deductions" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_salary_active_idx" ON "employee_salary" USING btree ("employee_id") WHERE effective_to IS NULL;--> statement-breakpoint
CREATE INDEX "employee_salary_employee_idx" ON "employee_salary" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "payrun_status_idx" ON "payrun" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payrun_date_idx" ON "payrun" USING btree ("year","month");--> statement-breakpoint
CREATE INDEX "payrun_type_idx" ON "payrun" USING btree ("type");--> statement-breakpoint
CREATE INDEX "payroll_item_details_payroll_item_idx" ON "payrun_item_details" USING btree ("payrun_item_id");--> statement-breakpoint
CREATE INDEX "payroll_item_details_employee_idx" ON "payrun_item_details" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "payroll_item_details_type_idx" ON "payrun_item_details" USING btree ("detail_type");--> statement-breakpoint
CREATE INDEX "payroll_item_details_allowance_idx" ON "payrun_item_details" USING btree ("allowance_id");--> statement-breakpoint
CREATE INDEX "payroll_item_details_deduction_idx" ON "payrun_item_details" USING btree ("deduction_id");--> statement-breakpoint
CREATE INDEX "payrun_items_employee_idx" ON "payrun_items" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "payrun_items_run_idx" ON "payrun_items" USING btree ("payrun_id");--> statement-breakpoint
CREATE INDEX "payroll_items_status_idx" ON "payrun_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "salary_allowance_id_idx" ON "salary_allowances" USING btree ("salary_structure_id");--> statement-breakpoint
CREATE INDEX "salary_deduction_table_id_idx" ON "salary_deductions" USING btree ("salary_structure_id");--> statement-breakpoint
CREATE INDEX "payroll_amount_idx" ON "salary_structure" USING btree ("base_salary");--> statement-breakpoint
CREATE INDEX "ask_hr_questions_employee_idx" ON "ask_hr_questions" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "ask_hr_questions_status_idx" ON "ask_hr_questions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ask_hr_questions_category_idx" ON "ask_hr_questions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "ask_hr_questions_redirected_to_idx" ON "ask_hr_questions" USING btree ("redirected_to");--> statement-breakpoint
CREATE INDEX "ask_hr_responses_question_idx" ON "ask_hr_responses" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "ask_hr_responses_respondent_idx" ON "ask_hr_responses" USING btree ("respondent_id");--> statement-breakpoint
CREATE INDEX "loan_app_employee_idx" ON "loan_applications" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "loan_app_type_idx" ON "loan_applications" USING btree ("loan_type_id");--> statement-breakpoint
CREATE INDEX "loan_app_status_idx" ON "loan_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "loan_app_reference_idx" ON "loan_applications" USING btree ("reference_number");--> statement-breakpoint
CREATE INDEX "loan_app_hr_reviewed_idx" ON "loan_applications" USING btree ("hr_reviewed_by");--> statement-breakpoint
CREATE INDEX "loan_app_disbursed_idx" ON "loan_applications" USING btree ("disbursed_by");--> statement-breakpoint
CREATE INDEX "loan_app_active_idx" ON "loan_applications" USING btree ("employee_id","status") WHERE status IN ('active', 'disbursed', 'hr_approved', 'pending');--> statement-breakpoint
CREATE INDEX "loan_history_loan_idx" ON "loan_history" USING btree ("loan_application_id");--> statement-breakpoint
CREATE INDEX "loan_history_action_idx" ON "loan_history" USING btree ("action");--> statement-breakpoint
CREATE INDEX "loan_history_date_idx" ON "loan_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "loan_repayment_loan_idx" ON "loan_repayments" USING btree ("loan_application_id");--> statement-breakpoint
CREATE INDEX "loan_repayment_employee_idx" ON "loan_repayments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "loan_repayment_status_idx" ON "loan_repayments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "loan_repayment_due_idx" ON "loan_repayments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "loan_type_structure_loan_idx" ON "loan_type_salary_structures" USING btree ("loan_type_id");--> statement-breakpoint
CREATE INDEX "loan_type_structure_salary_idx" ON "loan_type_salary_structures" USING btree ("salary_structure_id");--> statement-breakpoint
CREATE INDEX "loan_type_active_idx" ON "loan_types" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "loan_type_name_idx" ON "loan_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");
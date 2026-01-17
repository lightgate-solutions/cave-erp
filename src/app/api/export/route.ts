import { auth } from "@/lib/auth";
import { db } from "@/db";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { createObjectCsvStringifier } from "csv-writer";
import {
  employees,
  employeesDocuments,
  attendance,
  employeesBank,
  leaveApplications,
  leaveBalances,
} from "@/db/schema/hr";
import {
  salaryStructure,
  allowances,
  deductions,
  payrun,
  payrunItems,
} from "@/db/schema/payroll";
import { loanApplications, loanRepayments, loanTypes } from "@/db/schema/loans";
import { tasks, taskSubmissions } from "@/db/schema/tasks";
import { projects } from "@/db/schema/projects";
import { document, documentLogs } from "@/db/schema/documents";
import { newsArticles } from "@/db/schema/news";
import { user, session, member } from "@/db/schema/auth";
import { companyExpenses, balanceTransactions } from "@/db/schema/finance";
import { askHrQuestions } from "@/db/schema/ask-hr";
import { eq, and, gte, lte, inArray, desc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

type ExportDataset =
  | "employees"
  | "salary-structures"
  | "allowances"
  | "deductions"
  | "loans-all"
  | "loans-active"
  | "loans-unpaid"
  | "loans-settled"
  | "loan-types"
  | "loan-repayments"
  | "payruns"
  | "payrun-items"
  | "news"
  | "projects"
  | "projects-pending"
  | "projects-in-progress"
  | "projects-completed"
  | "tasks"
  | "tasks-pending"
  | "tasks-in-progress"
  | "tasks-completed"
  | "tasks-overdue"
  | "task-submissions"
  | "user-sessions"
  | "users"
  | "documents"
  | "document-logs"
  | "attendance"
  | "leave-applications"
  | "leave-balances"
  | "company-expenses"
  | "balance-transactions"
  | "ask-hr"
  | "employee-banks"
  | "employee-documents";

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const authSession = await auth.api.getSession({
      headers: headersList,
    });

    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organization = await auth.api.getFullOrganization({
      headers: headersList,
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 403 },
      );
    }

    const userRole = authSession.user.role?.toLowerCase().trim();
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const dataset = searchParams.get("dataset") as ExportDataset;
    const format = searchParams.get("format") || "csv";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!dataset) {
      return NextResponse.json(
        { error: "Dataset parameter is required" },
        { status: 400 },
      );
    }

    const dateFilters = {
      start: startDate ? new Date(startDate) : undefined,
      end: endDate ? new Date(endDate) : undefined,
    };

    const {
      data,
      headers: csvHeaders,
      filename,
    } = await fetchDataset(dataset, dateFilters, organization.id);

    if (format === "json") {
      return NextResponse.json({ data, count: data.length });
    }

    // CSV format
    const csvStringifier = createObjectCsvStringifier({
      header: csvHeaders.map((h) => ({ id: h.id, title: h.title })),
    });

    const csv =
      csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(data);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to export data" },
      { status: 500 },
    );
  }
}

async function fetchDataset(
  dataset: ExportDataset,
  dateFilters: { start?: Date; end?: Date },
  organizationId: string,
) {
  // Create aliases for joins
  const manager = alias(employees, "manager");
  const approver = alias(employees, "approver");
  const assignedToEmployee = alias(employees, "assignedTo");
  const assignedByEmployee = alias(employees, "assignedBy");
  const submitter = alias(employees, "submitter");
  const supervisor = alias(employees, "supervisor");
  const uploader = alias(employees, "uploader");
  const generatedByUser = alias(user, "generatedBy");
  const approvedByUser = alias(user, "approvedBy");

  switch (dataset) {
    case "employees": {
      const data = await db
        .select({
          name: employees.name,
          email: employees.email,
          phone: employees.phone,
          staffNumber: employees.staffNumber,
          role: employees.role,
          department: employees.department,
          status: employees.status,
          employmentType: employees.employmentType,
          maritalStatus: employees.maritalStatus,
          dateOfBirth: employees.dateOfBirth,
          address: employees.address,
          isManager: employees.isManager,
          managerName: manager.name,
          createdAt: employees.createdAt,
        })
        .from(employees)
        .leftJoin(manager, eq(employees.managerId, manager.id))
        .where(eq(employees.organizationId, organizationId))
        .orderBy(desc(employees.createdAt));

      return {
        data: data.map((e) => ({
          ...e,
          isManager: e.isManager ? "Yes" : "No",
          createdAt: e.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "name", title: "Name" },
          { id: "email", title: "Email" },
          { id: "phone", title: "Phone" },
          { id: "staffNumber", title: "Staff Number" },
          { id: "role", title: "Role" },
          { id: "department", title: "Department" },
          { id: "status", title: "Status" },
          { id: "employmentType", title: "Employment Type" },
          { id: "maritalStatus", title: "Marital Status" },
          { id: "dateOfBirth", title: "Date of Birth" },
          { id: "address", title: "Address" },
          { id: "isManager", title: "Is Manager" },
          { id: "managerName", title: "Manager" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "employees_export",
      };
    }

    case "salary-structures": {
      const data = await db
        .select({
          name: salaryStructure.name,
          baseSalary: salaryStructure.baseSalary,
          description: salaryStructure.description,
          active: salaryStructure.active,
          employeeCount: salaryStructure.employeeCount,
          createdAt: salaryStructure.createdAt,
        })
        .from(salaryStructure)
        .where(eq(salaryStructure.organizationId, organizationId))
        .orderBy(desc(salaryStructure.createdAt));

      return {
        data: data.map((s) => ({
          ...s,
          baseSalary: s.baseSalary?.toString(),
          active: s.active ? "Yes" : "No",
          createdAt: s.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "name", title: "Name" },
          { id: "baseSalary", title: "Base Salary" },
          { id: "description", title: "Description" },
          { id: "active", title: "Active" },
          { id: "employeeCount", title: "Employee Count" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "salary_structures_export",
      };
    }

    case "allowances": {
      const data = await db
        .select({
          name: allowances.name,
          type: allowances.type,
          percentage: allowances.percentage,
          amount: allowances.amount,
          taxable: allowances.taxable,
          taxPercentage: allowances.taxPercentage,
          description: allowances.description,
          createdAt: allowances.createdAt,
        })
        .from(allowances)
        .where(eq(allowances.organizationId, organizationId))
        .orderBy(desc(allowances.createdAt));

      return {
        data: data.map((a) => ({
          ...a,
          amount: a.amount?.toString(),
          taxable: a.taxable ? "Yes" : "No",
          createdAt: a.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "name", title: "Name" },
          { id: "type", title: "Type" },
          { id: "percentage", title: "Percentage" },
          { id: "amount", title: "Amount" },
          { id: "taxable", title: "Taxable" },
          { id: "taxPercentage", title: "Tax Percentage" },
          { id: "description", title: "Description" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "allowances_export",
      };
    }

    case "deductions": {
      const data = await db
        .select({
          name: deductions.name,
          type: deductions.type,
          percentage: deductions.percentage,
          amount: deductions.amount,
          createdAt: deductions.createdAt,
        })
        .from(deductions)
        .where(eq(deductions.organizationId, organizationId))
        .orderBy(desc(deductions.createdAt));

      return {
        data: data.map((d) => ({
          ...d,
          amount: d.amount?.toString(),
          createdAt: d.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "name", title: "Name" },
          { id: "type", title: "Type" },
          { id: "percentage", title: "Percentage" },
          { id: "amount", title: "Amount" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "deductions_export",
      };
    }

    case "loans-all":
    case "loans-active":
    case "loans-unpaid":
    case "loans-settled": {
      const baseQuery = db
        .select({
          referenceNumber: loanApplications.referenceNumber,
          employeeName: employees.name,
          loanType: loanTypes.name,
          requestedAmount: loanApplications.requestedAmount,
          approvedAmount: loanApplications.approvedAmount,
          monthlyDeduction: loanApplications.monthlyDeduction,
          tenureMonths: loanApplications.tenureMonths,
          status: loanApplications.status,
          totalRepaid: loanApplications.totalRepaid,
          remainingBalance: loanApplications.remainingBalance,
          appliedAt: loanApplications.appliedAt,
          disbursedAt: loanApplications.disbursedAt,
          completedAt: loanApplications.completedAt,
        })
        .from(loanApplications)
        .leftJoin(employees, eq(loanApplications.userId, employees.authId))
        .leftJoin(loanTypes, eq(loanApplications.loanTypeId, loanTypes.id));

      const conditions = [eq(loanApplications.organizationId, organizationId)];

      if (dataset === "loans-active") {
        conditions.push(eq(loanApplications.status, "active"));
      } else if (dataset === "loans-unpaid") {
        conditions.push(
          inArray(loanApplications.status, [
            "active",
            "disbursed",
            "hr_approved",
          ]),
        );
      } else if (dataset === "loans-settled") {
        conditions.push(eq(loanApplications.status, "completed"));
      }

      if (dateFilters.start && dateFilters.end) {
        conditions.push(gte(loanApplications.appliedAt, dateFilters.start));
        conditions.push(lte(loanApplications.appliedAt, dateFilters.end));
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(loanApplications.appliedAt));

      return {
        data: data.map((l) => ({
          ...l,
          requestedAmount: l.requestedAmount?.toString(),
          approvedAmount: l.approvedAmount?.toString(),
          monthlyDeduction: l.monthlyDeduction?.toString(),
          totalRepaid: l.totalRepaid?.toString(),
          remainingBalance: l.remainingBalance?.toString(),
          appliedAt: l.appliedAt?.toISOString().split("T")[0],
          disbursedAt: l.disbursedAt?.toISOString().split("T")[0],
          completedAt: l.completedAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "referenceNumber", title: "Reference Number" },
          { id: "employeeName", title: "Employee" },
          { id: "loanType", title: "Loan Type" },
          { id: "requestedAmount", title: "Requested Amount" },
          { id: "approvedAmount", title: "Approved Amount" },
          { id: "monthlyDeduction", title: "Monthly Deduction" },
          { id: "tenureMonths", title: "Tenure (Months)" },
          { id: "status", title: "Status" },
          { id: "totalRepaid", title: "Total Repaid" },
          { id: "remainingBalance", title: "Remaining Balance" },
          { id: "appliedAt", title: "Applied At" },
          { id: "disbursedAt", title: "Disbursed At" },
          { id: "completedAt", title: "Completed At" },
        ],
        filename: `loans_${dataset.replace("loans-", "")}_export`,
      };
    }

    case "loan-types": {
      const data = await db
        .select({
          name: loanTypes.name,
          description: loanTypes.description,
          amountType: loanTypes.amountType,
          fixedAmount: loanTypes.fixedAmount,
          maxPercentage: loanTypes.maxPercentage,
          tenureMonths: loanTypes.tenureMonths,
          interestRate: loanTypes.interestRate,
          minServiceMonths: loanTypes.minServiceMonths,
          maxActiveLoans: loanTypes.maxActiveLoans,
          isActive: loanTypes.isActive,
          createdAt: loanTypes.createdAt,
        })
        .from(loanTypes)
        .where(eq(loanTypes.organizationId, organizationId))
        .orderBy(desc(loanTypes.createdAt));

      return {
        data: data.map((lt) => ({
          ...lt,
          fixedAmount: lt.fixedAmount?.toString(),
          isActive: lt.isActive ? "Yes" : "No",
          createdAt: lt.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "name", title: "Name" },
          { id: "description", title: "Description" },
          { id: "amountType", title: "Amount Type" },
          { id: "fixedAmount", title: "Fixed Amount" },
          { id: "maxPercentage", title: "Max Percentage" },
          { id: "tenureMonths", title: "Tenure (Months)" },
          { id: "interestRate", title: "Interest Rate" },
          { id: "minServiceMonths", title: "Min Service Months" },
          { id: "maxActiveLoans", title: "Max Active Loans" },
          { id: "isActive", title: "Is Active" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "loan_types_export",
      };
    }

    case "loan-repayments": {
      const baseQuery = db
        .select({
          employeeName: employees.name,
          installmentNumber: loanRepayments.installmentNumber,
          dueDate: loanRepayments.dueDate,
          expectedAmount: loanRepayments.expectedAmount,
          paidAmount: loanRepayments.paidAmount,
          balanceAfter: loanRepayments.balanceAfter,
          status: loanRepayments.status,
          paidAt: loanRepayments.paidAt,
        })
        .from(loanRepayments)
        .leftJoin(employees, eq(loanRepayments.userId, employees.authId));

      const conditions = [eq(loanRepayments.organizationId, organizationId)];
      if (dateFilters.start && dateFilters.end) {
        conditions.push(gte(loanRepayments.dueDate, dateFilters.start));
        conditions.push(lte(loanRepayments.dueDate, dateFilters.end));
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(loanRepayments.dueDate));

      return {
        data: data.map((r) => ({
          ...r,
          expectedAmount: r.expectedAmount?.toString(),
          paidAmount: r.paidAmount?.toString(),
          balanceAfter: r.balanceAfter?.toString(),
          dueDate: r.dueDate?.toISOString().split("T")[0],
          paidAt: r.paidAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "employeeName", title: "Employee" },
          { id: "installmentNumber", title: "Installment Number" },
          { id: "dueDate", title: "Due Date" },
          { id: "expectedAmount", title: "Expected Amount" },
          { id: "paidAmount", title: "Paid Amount" },
          { id: "balanceAfter", title: "Balance After" },
          { id: "status", title: "Status" },
          { id: "paidAt", title: "Paid At" },
        ],
        filename: "loan_repayments_export",
      };
    }

    case "payruns": {
      const generatedByEmployee = alias(employees, "generatedByEmployee");
      const approvedByEmployee = alias(employees, "approvedByEmployee");
      const baseQuery = db
        .select({
          name: payrun.name,
          type: payrun.type,
          month: payrun.month,
          year: payrun.year,
          totalEmployees: payrun.totalEmployees,
          totalGrossPay: payrun.totalGrossPay,
          totalDeductions: payrun.totalDeductions,
          totalNetPay: payrun.totalNetPay,
          status: payrun.status,
          generatedBy: generatedByEmployee.name,
          approvedBy: approvedByEmployee.name,
          createdAt: payrun.createdAt,
          approvedAt: payrun.approvedAt,
        })
        .from(payrun)
        .leftJoin(
          generatedByEmployee,
          and(
            eq(payrun.generatedByUserId, generatedByEmployee.authId),
            eq(generatedByEmployee.organizationId, organizationId),
          ),
        )
        .leftJoin(
          approvedByEmployee,
          and(
            eq(payrun.approvedByUserId, approvedByEmployee.authId),
            eq(approvedByEmployee.organizationId, organizationId),
          ),
        );

      const conditions = [eq(payrun.organizationId, organizationId)];
      if (dateFilters.start && dateFilters.end) {
        conditions.push(gte(payrun.createdAt, dateFilters.start));
        conditions.push(lte(payrun.createdAt, dateFilters.end));
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(payrun.createdAt));

      return {
        data: data.map((p) => ({
          ...p,
          totalGrossPay: p.totalGrossPay?.toString(),
          totalDeductions: p.totalDeductions?.toString(),
          totalNetPay: p.totalNetPay?.toString(),
          createdAt: p.createdAt?.toISOString().split("T")[0],
          approvedAt: p.approvedAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "name", title: "Name" },
          { id: "type", title: "Type" },
          { id: "month", title: "Month" },
          { id: "year", title: "Year" },
          { id: "totalEmployees", title: "Total Employees" },
          { id: "totalGrossPay", title: "Total Gross Pay" },
          { id: "totalDeductions", title: "Total Deductions" },
          { id: "totalNetPay", title: "Total Net Pay" },
          { id: "status", title: "Status" },
          { id: "generatedBy", title: "Generated By" },
          { id: "approvedBy", title: "Approved By" },
          { id: "createdAt", title: "Created At" },
          { id: "approvedAt", title: "Approved At" },
        ],
        filename: "payruns_export",
      };
    }

    case "payrun-items": {
      const baseQuery = db
        .select({
          payrunName: payrun.name,
          employeeName: employees.name,
          type: payrunItems.type,
          baseSalary: payrunItems.baseSalary,
          totalAllowances: payrunItems.totalAllowances,
          totalDeductions: payrunItems.totalDeductions,
          grossPay: payrunItems.grossPay,
          taxableIncome: payrunItems.taxableIncome,
          totalTaxes: payrunItems.totalTaxes,
          netPay: payrunItems.netPay,
          status: payrunItems.status,
          createdAt: payrunItems.createdAt,
        })
        .from(payrunItems)
        .leftJoin(payrun, eq(payrunItems.payrunId, payrun.id))
        .leftJoin(employees, eq(payrunItems.userId, employees.authId));

      const conditions = [eq(payrunItems.organizationId, organizationId)];
      if (dateFilters.start && dateFilters.end) {
        conditions.push(gte(payrunItems.createdAt, dateFilters.start));
        conditions.push(lte(payrunItems.createdAt, dateFilters.end));
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(payrunItems.createdAt));

      return {
        data: data.map((pi) => ({
          ...pi,
          baseSalary: pi.baseSalary?.toString(),
          totalAllowances: pi.totalAllowances?.toString(),
          totalDeductions: pi.totalDeductions?.toString(),
          grossPay: pi.grossPay?.toString(),
          taxableIncome: pi.taxableIncome?.toString(),
          totalTaxes: pi.totalTaxes?.toString(),
          netPay: pi.netPay?.toString(),
          createdAt: pi.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "payrunName", title: "Payrun" },
          { id: "employeeName", title: "Employee" },
          { id: "type", title: "Type" },
          { id: "baseSalary", title: "Base Salary" },
          { id: "totalAllowances", title: "Total Allowances" },
          { id: "totalDeductions", title: "Total Deductions" },
          { id: "grossPay", title: "Gross Pay" },
          { id: "taxableIncome", title: "Taxable Income" },
          { id: "totalTaxes", title: "Total Taxes" },
          { id: "netPay", title: "Net Pay" },
          { id: "status", title: "Status" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "payrun_items_export",
      };
    }

    case "news": {
      const baseQuery = db
        .select({
          title: newsArticles.title,
          excerpt: newsArticles.excerpt,
          authorName: employees.name,
          status: newsArticles.status,
          viewCount: newsArticles.viewCount,
          commentsEnabled: newsArticles.commentsEnabled,
          isPinned: newsArticles.isPinned,
          publishedAt: newsArticles.publishedAt,
          createdAt: newsArticles.createdAt,
        })
        .from(newsArticles)
        .leftJoin(employees, eq(newsArticles.authorId, employees.authId));

      const conditions = [eq(newsArticles.organizationId, organizationId)];
      if (dateFilters.start && dateFilters.end) {
        conditions.push(gte(newsArticles.createdAt, dateFilters.start));
        conditions.push(lte(newsArticles.createdAt, dateFilters.end));
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(newsArticles.createdAt));

      return {
        data: data.map((n) => ({
          ...n,
          commentsEnabled: n.commentsEnabled ? "Yes" : "No",
          isPinned: n.isPinned ? "Yes" : "No",
          publishedAt: n.publishedAt?.toISOString().split("T")[0],
          createdAt: n.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "title", title: "Title" },
          { id: "excerpt", title: "Excerpt" },
          { id: "authorName", title: "Author" },
          { id: "status", title: "Status" },
          { id: "viewCount", title: "View Count" },
          { id: "commentsEnabled", title: "Comments Enabled" },
          { id: "isPinned", title: "Is Pinned" },
          { id: "publishedAt", title: "Published At" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "news_articles_export",
      };
    }

    case "projects":
    case "projects-pending":
    case "projects-in-progress":
    case "projects-completed": {
      const supervisorEmployee = alias(employees, "supervisorEmployee");
      const baseQuery = db
        .select({
          name: projects.name,
          code: projects.code,
          description: projects.description,
          location: projects.location,
          status: projects.status,
          budgetPlanned: projects.budgetPlanned,
          budgetActual: projects.budgetActual,
          supervisorName: supervisorEmployee.name,
          createdAt: projects.createdAt,
        })
        .from(projects)
        .leftJoin(
          supervisorEmployee,
          and(
            eq(projects.supervisorId, supervisorEmployee.id),
            eq(supervisorEmployee.organizationId, organizationId),
          ),
        );

      const conditions = [eq(projects.organizationId, organizationId)];

      if (dataset === "projects-pending") {
        conditions.push(eq(projects.status, "pending"));
      } else if (dataset === "projects-in-progress") {
        conditions.push(eq(projects.status, "in-progress"));
      } else if (dataset === "projects-completed") {
        conditions.push(eq(projects.status, "completed"));
      }

      if (dateFilters.start && dateFilters.end) {
        conditions.push(gte(projects.createdAt, dateFilters.start));
        conditions.push(lte(projects.createdAt, dateFilters.end));
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(projects.createdAt));

      return {
        data: data.map((p) => ({
          ...p,
          budgetPlanned: p.budgetPlanned?.toString(),
          budgetActual: p.budgetActual?.toString(),
          createdAt: p.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "name", title: "Name" },
          { id: "code", title: "Code" },
          { id: "description", title: "Description" },
          { id: "location", title: "Location" },
          { id: "status", title: "Status" },
          { id: "budgetPlanned", title: "Budget Planned" },
          { id: "budgetActual", title: "Budget Actual" },
          { id: "supervisorName", title: "Supervisor" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: `projects_${dataset.replace("projects-", "") || "all"}_export`,
      };
    }

    case "tasks":
    case "tasks-pending":
    case "tasks-in-progress":
    case "tasks-completed":
    case "tasks-overdue": {
      const assignedToEmployeeAlias = alias(
        employees,
        "assignedToEmployeeAlias",
      );
      const assignedByEmployeeAlias = alias(
        employees,
        "assignedByEmployeeAlias",
      );
      const baseQuery = db
        .select({
          title: tasks.title,
          description: tasks.description,
          assignedToName: assignedToEmployeeAlias.name,
          assignedByName: assignedByEmployeeAlias.name,
          status: tasks.status,
          priority: tasks.priority,
          dueDate: tasks.dueDate,
          createdAt: tasks.createdAt,
        })
        .from(tasks)
        .leftJoin(
          assignedToEmployeeAlias,
          and(
            eq(tasks.assignedTo, assignedToEmployeeAlias.authId),
            eq(assignedToEmployeeAlias.organizationId, organizationId),
          ),
        )
        .leftJoin(
          assignedByEmployeeAlias,
          and(
            eq(tasks.assignedBy, assignedByEmployeeAlias.authId),
            eq(assignedByEmployeeAlias.organizationId, organizationId),
          ),
        );

      const conditions = [eq(tasks.organizationId, organizationId)];

      if (dataset === "tasks-pending") {
        conditions.push(eq(tasks.status, "Todo"));
      } else if (dataset === "tasks-in-progress") {
        conditions.push(eq(tasks.status, "In Progress"));
      } else if (dataset === "tasks-completed") {
        conditions.push(eq(tasks.status, "Completed"));
      }
      if (dateFilters.start && dateFilters.end) {
        conditions.push(gte(tasks.createdAt, dateFilters.start));
        conditions.push(lte(tasks.createdAt, dateFilters.end));
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(tasks.createdAt));

      return {
        data: data.map((t) => ({
          ...t,
          createdAt: t.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "title", title: "Title" },
          { id: "description", title: "Description" },
          { id: "assignedToName", title: "Assigned To" },
          { id: "assignedByName", title: "Assigned By" },
          { id: "status", title: "Status" },
          { id: "priority", title: "Priority" },
          { id: "dueDate", title: "Due Date" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: `tasks_${dataset.replace("tasks-", "") || "all"}_export`,
      };
    }

    case "task-submissions": {
      const submitterEmployee = alias(employees, "submitterEmployee");
      const baseQuery = db
        .select({
          taskTitle: tasks.title,
          submittedByName: submitterEmployee.name,
          submissionNote: taskSubmissions.submissionNote,
          submittedAt: taskSubmissions.submittedAt,
        })
        .from(taskSubmissions)
        .leftJoin(
          tasks,
          and(
            eq(taskSubmissions.taskId, tasks.id),
            eq(tasks.organizationId, organizationId),
          ),
        )
        .leftJoin(
          submitterEmployee,
          and(
            eq(taskSubmissions.submittedBy, submitterEmployee.authId),
            eq(submitterEmployee.organizationId, organizationId),
          ),
        );

      const conditions = [eq(taskSubmissions.organizationId, organizationId)];
      if (dateFilters.start && dateFilters.end) {
        conditions.push(gte(taskSubmissions.submittedAt, dateFilters.start));
        conditions.push(lte(taskSubmissions.submittedAt, dateFilters.end));
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(taskSubmissions.submittedAt));

      return {
        data: data.map((ts) => ({
          ...ts,
          submittedAt: ts.submittedAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "taskTitle", title: "Task" },
          { id: "submittedByName", title: "Submitted By" },
          { id: "submissionNote", title: "Submission Note" },
          { id: "submittedAt", title: "Submitted At" },
        ],
        filename: "task_submissions_export",
      };
    }

    case "users": {
      const data = await db
        .select({
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          role: user.role,
          banned: user.banned,
          createdAt: user.createdAt,
        })
        .from(user)
        .innerJoin(member, eq(member.userId, user.id))
        .where(eq(member.organizationId, organizationId))
        .orderBy(desc(user.createdAt));

      return {
        data: data.map((u) => ({
          ...u,
          emailVerified: u.emailVerified ? "Yes" : "No",
          banned: u.banned ? "Yes" : "No",
          createdAt: u.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "name", title: "Name" },
          { id: "email", title: "Email" },
          { id: "emailVerified", title: "Email Verified" },
          { id: "role", title: "Role" },
          { id: "banned", title: "Banned" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "users_export",
      };
    }

    case "user-sessions": {
      const sessionEmployee = alias(employees, "sessionEmployee");
      const baseQuery = db
        .select({
          userName: sessionEmployee.name,
          userEmail: sessionEmployee.email,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        })
        .from(session)
        .leftJoin(
          sessionEmployee,
          and(
            eq(session.userId, sessionEmployee.authId),
            eq(sessionEmployee.organizationId, organizationId),
          ),
        );

      const conditions = [];
      conditions.push(eq(session.activeOrganizationId, organizationId));

      if (dateFilters.start && dateFilters.end) {
        conditions.push(gte(session.createdAt, dateFilters.start));
        conditions.push(lte(session.createdAt, dateFilters.end));
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(session.createdAt));

      return {
        data: data.map((s) => ({
          ...s,
          createdAt: s.createdAt?.toISOString(),
          expiresAt: s.expiresAt?.toISOString(),
        })),
        headers: [
          { id: "userName", title: "User" },
          { id: "userEmail", title: "Email" },
          { id: "ipAddress", title: "IP Address" },
          { id: "userAgent", title: "User Agent" },
          { id: "createdAt", title: "Login Time" },
          { id: "expiresAt", title: "Expires At" },
        ],
        filename: "user_sessions_export",
      };
    }

    case "documents": {
      const uploaderEmployee = alias(employees, "uploaderEmployee");
      const baseQuery = db
        .select({
          title: document.title,
          description: document.description,
          department: document.department,
          currentVersion: document.currentVersion,
          public: document.public,
          uploadedByName: uploaderEmployee.name,
          status: document.status,
          createdAt: document.createdAt,
        })
        .from(document)
        .leftJoin(
          uploaderEmployee,
          and(
            eq(document.uploadedBy, uploaderEmployee.authId),
            eq(uploaderEmployee.organizationId, organizationId),
          ),
        );

      const conditions = [eq(document.organizationId, organizationId)];
      if (dateFilters.start && dateFilters.end) {
        conditions.push(gte(document.createdAt, dateFilters.start));
        conditions.push(lte(document.createdAt, dateFilters.end));
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(document.createdAt));

      return {
        data: data.map((d) => ({
          ...d,
          public: d.public ? "Yes" : "No",
          createdAt: d.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "title", title: "Title" },
          { id: "description", title: "Description" },
          { id: "department", title: "Department" },
          { id: "currentVersion", title: "Current Version" },
          { id: "public", title: "Public" },
          { id: "uploadedByName", title: "Uploaded By" },
          { id: "status", title: "Status" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "documents_export",
      };
    }

    case "document-logs": {
      const logEmployee = alias(employees, "logEmployee");
      const baseQuery = db
        .select({
          userName: logEmployee.name,
          documentTitle: document.title,
          action: documentLogs.action,
          details: documentLogs.details,
          createdAt: documentLogs.createdAt,
        })
        .from(documentLogs)
        .leftJoin(
          logEmployee,
          and(
            eq(documentLogs.userId, logEmployee.authId),
            eq(logEmployee.organizationId, organizationId),
          ),
        )
        .leftJoin(
          document,
          and(
            eq(documentLogs.documentId, document.id),
            eq(document.organizationId, organizationId),
          ),
        );

      const conditions = [eq(documentLogs.organizationId, organizationId)];
      if (dateFilters.start && dateFilters.end) {
        conditions.push(gte(documentLogs.createdAt, dateFilters.start));
        conditions.push(lte(documentLogs.createdAt, dateFilters.end));
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(documentLogs.createdAt));

      return {
        data: data.map((dl) => ({
          ...dl,
          createdAt: dl.createdAt?.toISOString(),
        })),
        headers: [
          { id: "userName", title: "User" },
          { id: "documentTitle", title: "Document" },
          { id: "action", title: "Action" },
          { id: "details", title: "Details" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "document_logs_export",
      };
    }

    case "attendance": {
      const attendanceEmployee = alias(employees, "attendanceEmployee");
      const baseQuery = db
        .select({
          employeeName: attendanceEmployee.name,
          date: attendance.date,
          time: attendance.signInTime,
          signOutTime: attendance.signOutTime,
          checkedIn: sql<boolean>`(${attendance.signInTime} IS NOT NULL)`.as(
            "checkedIn",
          ),
          createdAt: attendance.createdAt,
        })
        .from(attendance)
        .leftJoin(
          attendanceEmployee,
          and(
            eq(attendance.userId, attendanceEmployee.authId),
            eq(attendanceEmployee.organizationId, organizationId),
          ),
        );

      const conditions = [eq(attendance.organizationId, organizationId)];
      if (dateFilters.start && dateFilters.end) {
        conditions.push(
          gte(attendance.date, dateFilters.start.toISOString().split("T")[0]),
        );
        conditions.push(
          lte(attendance.date, dateFilters.end.toISOString().split("T")[0]),
        );
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(attendance.date));

      return {
        data: data.map((a) => ({
          ...a,
          checkedIn: a.checkedIn ? "Yes" : "No",
          createdAt: a.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "employeeName", title: "Employee" },
          { id: "date", title: "Date" },
          { id: "time", title: "Check In Time" },
          { id: "signOutTime", title: "Sign Out Time" },
          { id: "checkedIn", title: "Checked In" },
          { id: "approvedByName", title: "Approved By" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "attendance_export",
      };
    }

    case "leave-applications": {
      const leaveEmployee = alias(employees, "leaveEmployee");
      const approverEmployee = alias(employees, "approverEmployee");
      const baseQuery = db
        .select({
          employeeName: leaveEmployee.name,
          leaveType: leaveApplications.leaveType,
          startDate: leaveApplications.startDate,
          endDate: leaveApplications.endDate,
          totalDays: leaveApplications.totalDays,
          reason: leaveApplications.reason,
          status: leaveApplications.status,
          approvedByName: approverEmployee.name,
          appliedAt: leaveApplications.appliedAt,
        })
        .from(leaveApplications)
        .leftJoin(
          leaveEmployee,
          and(
            eq(leaveApplications.userId, leaveEmployee.authId),
            eq(leaveEmployee.organizationId, organizationId),
          ),
        )
        .leftJoin(
          approverEmployee,
          and(
            eq(leaveApplications.approvedByUserId, approverEmployee.authId),
            eq(approverEmployee.organizationId, organizationId),
          ),
        );

      const conditions = [eq(leaveApplications.organizationId, organizationId)];
      if (dateFilters.start && dateFilters.end) {
        conditions.push(gte(leaveApplications.appliedAt, dateFilters.start));
        conditions.push(lte(leaveApplications.appliedAt, dateFilters.end));
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(leaveApplications.appliedAt));

      return {
        data: data.map((la) => ({
          ...la,
          appliedAt: la.appliedAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "employeeName", title: "Employee" },
          { id: "leaveType", title: "Leave Type" },
          { id: "startDate", title: "Start Date" },
          { id: "endDate", title: "End Date" },
          { id: "totalDays", title: "Total Days" },
          { id: "reason", title: "Reason" },
          { id: "status", title: "Status" },
          { id: "approvedByName", title: "Approved By" },
          { id: "appliedAt", title: "Applied At" },
        ],
        filename: "leave_applications_export",
      };
    }

    case "leave-balances": {
      const leaveBalanceEmployee = alias(employees, "leaveBalanceEmployee");
      const data = await db
        .select({
          employeeName: leaveBalanceEmployee.name,
          leaveType: leaveBalances.leaveType,
          totalDays: leaveBalances.totalDays,
          usedDays: leaveBalances.usedDays,
          remainingDays: leaveBalances.remainingDays,
          year: leaveBalances.year,
          createdAt: leaveBalances.createdAt,
        })
        .from(leaveBalances)
        .leftJoin(
          leaveBalanceEmployee,
          and(
            eq(leaveBalances.userId, leaveBalanceEmployee.authId),
            eq(leaveBalanceEmployee.organizationId, organizationId),
          ),
        )
        .where(eq(leaveBalances.organizationId, organizationId))
        .orderBy(desc(leaveBalances.createdAt));

      return {
        data: data.map((lb) => ({
          ...lb,
          createdAt: lb.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "employeeName", title: "Employee" },
          { id: "leaveType", title: "Leave Type" },
          { id: "totalDays", title: "Total Days" },
          { id: "usedDays", title: "Used Days" },
          { id: "remainingDays", title: "Remaining Days" },
          { id: "year", title: "Year" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "leave_balances_export",
      };
    }

    case "company-expenses": {
      const baseQuery = db
        .select({
          title: companyExpenses.title,
          description: companyExpenses.description,
          amount: companyExpenses.amount,
          category: companyExpenses.category,
          expenseDate: companyExpenses.expenseDate,
          createdAt: companyExpenses.createdAt,
        })
        .from(companyExpenses);

      const conditions = [eq(companyExpenses.organizationId, organizationId)];
      if (dateFilters.start && dateFilters.end) {
        conditions.push(gte(companyExpenses.expenseDate, dateFilters.start));
        conditions.push(lte(companyExpenses.expenseDate, dateFilters.end));
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(companyExpenses.expenseDate));

      return {
        data: data.map((ce) => ({
          ...ce,
          amount: ce.amount?.toString(),
          expenseDate: ce.expenseDate?.toISOString().split("T")[0],
          createdAt: ce.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "title", title: "Title" },
          { id: "description", title: "Description" },
          { id: "amount", title: "Amount" },
          { id: "category", title: "Category" },
          { id: "expenseDate", title: "Expense Date" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "company_expenses_export",
      };
    }

    case "balance-transactions": {
      const transactionEmployee = alias(employees, "transactionEmployee");
      const baseQuery = db
        .select({
          userName: transactionEmployee.name,
          amount: balanceTransactions.amount,
          transactionType: balanceTransactions.transactionType,
          description: balanceTransactions.description,
          balanceBefore: balanceTransactions.balanceBefore,
          balanceAfter: balanceTransactions.balanceAfter,
          createdAt: balanceTransactions.createdAt,
        })
        .from(balanceTransactions)
        .leftJoin(
          transactionEmployee,
          and(
            eq(balanceTransactions.userId, transactionEmployee.authId),
            eq(transactionEmployee.organizationId, organizationId),
          ),
        );

      const conditions = [
        eq(balanceTransactions.organizationId, organizationId),
      ];
      if (dateFilters.start && dateFilters.end) {
        conditions.push(gte(balanceTransactions.createdAt, dateFilters.start));
        conditions.push(lte(balanceTransactions.createdAt, dateFilters.end));
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(balanceTransactions.createdAt));

      return {
        data: data.map((bt) => ({
          ...bt,
          amount: bt.amount?.toString(),
          balanceBefore: bt.balanceBefore?.toString(),
          balanceAfter: bt.balanceAfter?.toString(),
          createdAt: bt.createdAt?.toISOString(),
        })),
        headers: [
          { id: "userName", title: "User" },
          { id: "amount", title: "Amount" },
          { id: "transactionType", title: "Transaction Type" },
          { id: "description", title: "Description" },
          { id: "balanceBefore", title: "Balance Before" },
          { id: "balanceAfter", title: "Balance After" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "balance_transactions_export",
      };
    }

    case "ask-hr": {
      const askEmployee = alias(employees, "askEmployee");
      const baseQuery = db
        .select({
          employeeName: askEmployee.name,
          title: askHrQuestions.title,
          question: askHrQuestions.question,
          category: askHrQuestions.category,
          status: askHrQuestions.status,
          isAnonymous: askHrQuestions.isAnonymous,
          isPublic: askHrQuestions.isPublic,
          createdAt: askHrQuestions.createdAt,
        })
        .from(askHrQuestions)
        .leftJoin(
          askEmployee,
          and(
            eq(askHrQuestions.userId, askEmployee.authId),
            eq(askEmployee.organizationId, organizationId),
          ),
        );

      const conditions = [eq(askHrQuestions.organizationId, organizationId)];
      if (dateFilters.start && dateFilters.end) {
        conditions.push(gte(askHrQuestions.createdAt, dateFilters.start));
        conditions.push(lte(askHrQuestions.createdAt, dateFilters.end));
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(askHrQuestions.createdAt));

      return {
        data: data.map((q) => ({
          ...q,
          employeeName: q.isAnonymous ? "Anonymous" : q.employeeName,
          isAnonymous: q.isAnonymous ? "Yes" : "No",
          isPublic: q.isPublic ? "Yes" : "No",
          createdAt: q.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "employeeName", title: "Employee" },
          { id: "title", title: "Title" },
          { id: "question", title: "Question" },
          { id: "category", title: "Category" },
          { id: "status", title: "Status" },
          { id: "isAnonymous", title: "Is Anonymous" },
          { id: "isPublic", title: "Is Public" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "ask_hr_questions_export",
      };
    }

    case "employee-banks": {
      const data = await db
        .select({
          employeeName: employees.name,
          bankName: employeesBank.bankName,
          accountName: employeesBank.accountName,
          accountNumber: employeesBank.accountNumber,
          createdAt: employeesBank.createdAt,
        })
        .from(employeesBank)
        .leftJoin(employees, eq(employeesBank.userId, employees.authId))
        .where(eq(employeesBank.organizationId, organizationId))
        .orderBy(desc(employeesBank.createdAt));

      return {
        data: data.map((eb) => ({
          ...eb,
          createdAt: eb.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "employeeName", title: "Employee" },
          { id: "bankName", title: "Bank Name" },
          { id: "accountName", title: "Account Name" },
          { id: "accountNumber", title: "Account Number" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "employee_banks_export",
      };
    }

    case "employee-documents": {
      const docEmployee = alias(employees, "docEmployee");
      const uploaderEmployee = alias(employees, "uploaderEmployee");
      const baseQuery = db
        .select({
          employeeName: docEmployee.name,
          documentType: employeesDocuments.documentType,
          documentName: employeesDocuments.documentName,
          fileSize: employeesDocuments.fileSize,
          mimeType: employeesDocuments.mimeType,
          department: employeesDocuments.department,
          uploadedByName: uploaderEmployee.name,
          createdAt: employeesDocuments.createdAt,
        })
        .from(employeesDocuments)
        .leftJoin(
          docEmployee,
          and(
            eq(employeesDocuments.userId, docEmployee.authId),
            eq(docEmployee.organizationId, organizationId),
          ),
        )
        .leftJoin(
          uploaderEmployee,
          and(
            eq(employeesDocuments.uploadedByUserId, uploaderEmployee.authId),
            eq(uploaderEmployee.organizationId, organizationId),
          ),
        );

      const conditions = [
        eq(employeesDocuments.organizationId, organizationId),
      ];
      if (dateFilters.start && dateFilters.end) {
        conditions.push(gte(employeesDocuments.createdAt, dateFilters.start));
        conditions.push(lte(employeesDocuments.createdAt, dateFilters.end));
      }

      const query =
        conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

      const data = await query.orderBy(desc(employeesDocuments.createdAt));

      return {
        data: data.map((ed) => ({
          ...ed,
          createdAt: ed.createdAt?.toISOString().split("T")[0],
        })),
        headers: [
          { id: "employeeName", title: "Employee" },
          { id: "documentType", title: "Document Type" },
          { id: "documentName", title: "Document Name" },
          { id: "fileSize", title: "File Size" },
          { id: "mimeType", title: "MIME Type" },
          { id: "department", title: "Department" },
          { id: "uploadedByName", title: "Uploaded By" },
          { id: "createdAt", title: "Created At" },
        ],
        filename: "employee_documents_export",
      };
    }

    default:
      throw new Error(`Unknown dataset: ${dataset}`);
  }
}

/**
 * Shared mock infrastructure for server action integration tests.
 *
 * Provides factory functions to configure mocks per-test. All mocks are
 * reset automatically via `beforeEach` so tests don't leak state.
 */

import { vi, beforeEach } from "vitest";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MockSession {
    session: {
        userId: string;
        activeOrganizationId: string | null;
    } | null;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    } | null;
}

export interface MockOrganization {
    id: string;
    name: string;
    ownerId: string;
    membersCount?: number;
}

export interface MockEmployee {
    id: string;
    name: string;
    staffNumber: string;
    role: string;
    email: string;
    phone: string;
    department: string;
    managerId: string | null;
    isManager: boolean;
    userId: string;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

export const DEFAULT_USER_ID = "user-001";
export const DEFAULT_ORG_ID = "org-001";

export const defaultSession: MockSession = {
    session: {
        userId: DEFAULT_USER_ID,
        activeOrganizationId: DEFAULT_ORG_ID,
    },
    user: {
        id: DEFAULT_USER_ID,
        name: "Test User",
        email: "test@example.com",
        role: "admin",
    },
};

export const defaultOrganization: MockOrganization = {
    id: DEFAULT_ORG_ID,
    name: "Test Org",
    ownerId: DEFAULT_USER_ID,
};

export const defaultEmployee: MockEmployee = {
    id: DEFAULT_USER_ID,
    name: "Test User",
    staffNumber: "EMP-001",
    role: "admin",
    email: "test@example.com",
    phone: "1234567890",
    department: "admin",
    managerId: null,
    isManager: false,
    userId: DEFAULT_USER_ID,
};

// ─── Mock: next/headers ─────────────────────────────────────────────────────

export const mockHeaders = vi.fn().mockResolvedValue(new Headers());

vi.mock("next/headers", () => ({
    headers: (...args: unknown[]) => mockHeaders(...args),
}));

// ─── Mock: next/cache ───────────────────────────────────────────────────────

export const mockRevalidatePath = vi.fn();
export const mockRevalidateTag = vi.fn();

vi.mock("next/cache", () => ({
    revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
    revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}));

// ─── Mock: @/lib/auth ───────────────────────────────────────────────────────

export const mockGetSession = vi.fn();
export const mockGetFullOrganization = vi.fn();
export const mockAuthApiBanUser = vi.fn();
export const mockAuthApiUnbanUser = vi.fn();
export const mockAuthApiRemoveUser = vi.fn();
export const mockAuthApiRevokeUserSessions = vi.fn();
export const mockAuthApiCreateUser = vi.fn();
export const mockAuthApiSetRole = vi.fn();

vi.mock("@/lib/auth", () => ({
    auth: {
        api: {
            getSession: (...args: unknown[]) => mockGetSession(...args),
            getFullOrganization: (...args: unknown[]) =>
                mockGetFullOrganization(...args),
            banUser: (...args: unknown[]) => mockAuthApiBanUser(...args),
            unbanUser: (...args: unknown[]) => mockAuthApiUnbanUser(...args),
            removeUser: (...args: unknown[]) => mockAuthApiRemoveUser(...args),
            revokeUserSessions: (...args: unknown[]) =>
                mockAuthApiRevokeUserSessions(...args),
            createUser: (...args: unknown[]) => mockAuthApiCreateUser(...args),
            setRole: (...args: unknown[]) => mockAuthApiSetRole(...args),
        },
    },
}));

// ─── Mock: @/actions/auth/dal ───────────────────────────────────────────────

export const mockRequireAuth = vi.fn();
export const mockRequireHROrAdmin = vi.fn();
export const mockRequireHR = vi.fn();
export const mockRequireAssetAccess = vi.fn();
export const mockGetUser = vi.fn();

vi.mock("@/actions/auth/dal", () => ({
    requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
    requireHROrAdmin: (...args: unknown[]) => mockRequireHROrAdmin(...args),
    requireHR: (...args: unknown[]) => mockRequireHR(...args),
    requireAssetAccess: (...args: unknown[]) => mockRequireAssetAccess(...args),
    verifySession: vi.fn(),
    getUser: (...args: unknown[]) => mockGetUser(...args),
    getSessionRole: vi.fn(),
    requireAdmin: vi.fn(),
    requireManager: vi.fn(),
    requireFinance: vi.fn(),
    requireModuleAccess: vi.fn(),
    requireFleetAccess: vi.fn(),
}));

// ─── Mock: @/db ─────────────────────────────────────────────────────────────

// Chainable query builder mock — each method returns `this` so you can chain.
function createChainableQuery(resolvedValue: unknown = []) {
    const chain: Record<string, ReturnType<typeof vi.fn<(...args: any[]) => any>>> = {};
    const methods = [
        "select",
        "insert",
        "update",
        "delete",
        "from",
        "set",
        "values",
        "where",
        "leftJoin",
        "innerJoin",
        "limit",
        "offset",
        "returning",
        "orderBy",
        "groupBy",
    ];

    for (const method of methods) {
        chain[method] = vi.fn().mockReturnValue(chain);
    }

    // Terminal: `.then()` resolves the chain like a thenable
    chain.then = vi.fn().mockImplementation((resolve) => {
        const nextResult = dbQueryQueue.shift() ?? [];
        return Promise.resolve(resolve(nextResult));
    });

    return chain;
}

// Queue for DB query results (FIFO)
export const dbQueryQueue: unknown[] = [];

/** Queue a result for the next DB chain execution */
export function queueDbResult(value: unknown) {
    dbQueryQueue.push(value);
}

export const mockDbChain = createChainableQuery();

// Transaction mock — calls the callback with the same chain
export const mockTransaction = vi
    .fn()
    .mockImplementation(async (callback) => {
        return callback(mockDbChain);
    });

// Query mock for `db.query.<table>.findFirst()` / `.findMany()`
export const mockQueryFindFirst = vi.fn();
export const mockQueryFindMany = vi.fn();

const queryHandler = {
    get(_target: unknown, _prop: string) {
        // Any table access (db.query.subscriptions, db.query.organization, etc.)
        return {
            findFirst: mockQueryFindFirst,
            findMany: mockQueryFindMany,
        };
    },
};

export const mockDbQuery = new Proxy({}, queryHandler);

vi.mock("@/db", () => ({
    db: {
        select: (...args: unknown[]) => mockDbChain.select(...args),
        insert: (...args: unknown[]) => mockDbChain.insert(...args),
        update: (...args: unknown[]) => mockDbChain.update(...args),
        delete: (...args: unknown[]) => mockDbChain.delete(...args),
        transaction: (...args: unknown[]) => mockTransaction(...args),
        query: new Proxy({}, queryHandler),
    },
}));

// ─── Mock: @/lib/plan-utils ─────────────────────────────────────────────────

export const mockCanCreateOrganization = vi.fn();
export const mockGetUserPlan = vi.fn();
export const mockGetOrgOwnerPlan = vi.fn();

vi.mock("@/lib/plan-utils", () => ({
    canCreateOrganization: (...args: unknown[]) =>
        mockCanCreateOrganization(...args),
    getUserPlan: (...args: unknown[]) => mockGetUserPlan(...args),
    getOrgOwnerPlan: (...args: unknown[]) => mockGetOrgOwnerPlan(...args),
}));

// ─── Mock: better-auth ──────────────────────────────────────────────────────

export const mockGenerateId = vi.fn().mockReturnValue("generated-id-001");

class MockAPIError extends Error {
    status: string;
    constructor(status: string, options?: { message?: string }) {
        super(options?.message ?? status);
        this.name = "APIError";
        this.status = status;
    }
}

vi.mock("better-auth", () => ({
    generateId: (...args: unknown[]) => mockGenerateId(...args),
    APIError: MockAPIError,
}));

// ─── Mock: better-auth/api ──────────────────────────────────────────────────
// auth.ts imports APIError from "better-auth/api" — re-export the same class.

vi.mock("better-auth/api", () => ({
    APIError: MockAPIError,
}));

// ─── Mock: @/actions/notification/notification ──────────────────────────────

export const mockCreateNotification = vi.fn().mockResolvedValue({
    success: true,
    data: null,
    error: null,
});

vi.mock("@/actions/notification/notification", () => ({
    createNotification: (...args: unknown[]) =>
        mockCreateNotification(...args),
}));

// ─── Mock: @/db/schema ──────────────────────────────────────────────────────

vi.mock("@/db/schema", () => {
    // Provide table-like objects with column-like properties.
    // The actual column refs are only used as keys in eq()/and() calls which
    // are also mocked, so plain strings work fine.
    const makeTable = (name: string, cols: string[]) => {
        const table: Record<string, string> = {};
        for (const col of cols) {
            table[col] = `${name}.${col}`;
        }
        return table;
    };

    return {
        employees: makeTable("employees", [
            "authId", "email", "role", "name", "department", "employmentType",
            "phone", "isManager", "dateOfBirth", "staffNumber", "status",
            "maritalStatus", "organizationId", "managerId", "documentCount",
            "address", "createdAt", "updatedAt",
        ]),
        employmentHistory: makeTable("employmentHistory", [
            "userId", "startDate",
        ]),
        user: makeTable("user", ["id", "name", "email", "role"]),
        documentFolders: makeTable("documentFolders", [
            "name", "createdBy", "department", "root", "status", "public",
            "departmental", "organizationId",
        ]),
        notification_preferences: makeTable("notification_preferences", [
            "user_id", "email_notifications", "in_app_notifications",
            "email_on_in_app_message", "email_on_task_notification",
            "email_on_general_notification", "notify_on_message", "organizationId",
        ]),
        subscriptions: makeTable("subscriptions", [
            "userId", "plan",
        ]),
        organization: makeTable("organization", [
            "id", "ownerId", "membersCount",
        ]),
        invitation: makeTable("invitation", [
            "id", "organizationId", "role", "status", "department", "expiresAt",
        ]),
        member: makeTable("member", [
            "id", "organizationId", "userId", "role", "createdAt",
        ]),
        // ── Invoicing tables ────────────────────────────────────────────
        receivablesInvoices: makeTable("receivablesInvoices", [
            "id", "invoiceNumber", "clientId", "currencyId", "bankAccountId",
            "invoiceDate", "dueDate", "status", "subtotal", "taxAmount", "total",
            "amountPaid", "amountDue", "notes", "termsAndConditions", "footerNote",
            "template", "organizationId", "createdBy", "updatedBy", "sentAt",
            "cancelledAt", "createdAt",
        ]),
        invoiceLineItems: makeTable("invoiceLineItems", [
            "id", "invoiceId", "description", "quantity", "unitPrice", "amount",
            "sortOrder", "organizationId",
        ]),
        invoiceTaxes: makeTable("invoiceTaxes", [
            "id", "invoiceId", "taxName", "taxPercentage", "taxAmount",
            "organizationId",
        ]),
        invoiceActivityLog: makeTable("invoiceActivityLog", [
            "id", "invoiceId", "activityType", "description", "performedBy",
            "metadata", "organizationId", "createdAt",
        ]),
        organizationCurrencies: makeTable("organizationCurrencies", [
            "id", "currencySymbol", "organizationId",
        ]),
        companyBankAccounts: makeTable("companyBankAccounts", [
            "id", "organizationId",
        ]),
        glAccounts: makeTable("glAccounts", [
            "id", "code", "name", "organizationId",
        ]),
        glJournals: makeTable("glJournals", [
            "id", "organizationId", "source", "sourceId",
        ]),
        // ── Payables tables ─────────────────────────────────────────────
        payablesBills: makeTable("payablesBills", [
            "id", "billNumber", "vendorInvoiceNumber", "vendorId", "poId",
            "bankAccountId", "billDate", "dueDate", "receivedDate", "status",
            "currencyId", "subtotal", "taxAmount", "total", "amountPaid",
            "amountDue", "notes", "paymentTerms", "isRecurring",
            "recurringFrequency", "recurringEndDate", "duplicateCheckHash",
            "organizationId", "createdBy", "updatedBy", "createdAt",
        ]),
        billLineItems: makeTable("billLineItems", [
            "id", "billId", "poLineItemId", "description", "quantity",
            "poUnitPrice", "poAmount", "unitPrice", "amount", "sortOrder",
            "organizationId",
        ]),
        billTaxes: makeTable("billTaxes", [
            "id", "billId", "taxType", "taxName", "taxPercentage",
            "taxAmount", "isWithholdingTax", "whtCertificateNumber",
            "organizationId",
        ]),
        billActivityLog: makeTable("billActivityLog", [
            "id", "billId", "activityType", "description", "performedBy",
            "metadata", "organizationId", "createdAt",
        ]),
        vendors: makeTable("vendors", [
            "id", "name", "email", "organizationId",
        ]),
        vendorContacts: makeTable("vendorContacts", [
            "id", "vendorId", "name", "email", "phone", "role", "isPrimary",
            "organizationId",
        ]),
        vendorBankAccounts: makeTable("vendorBankAccounts", [
            "id", "vendorId", "accountName", "bankName", "accountNumber",
            "routingNumber", "swiftCode", "iban", "currency", "isDefault",
            "isActive", "organizationId",
        ]),
        purchaseOrders: makeTable("purchaseOrders", [
            "id", "poNumber", "vendorId", "currencyId", "poDate",
            "expectedDeliveryDate", "status", "subtotal", "taxAmount", "total",
            "receivedAmount", "billedAmount", "notes", "termsAndConditions",
            "deliveryAddress", "organizationId", "createdBy", "updatedBy",
            "approvedBy", "approvedAt", "sentAt", "closedAt", "cancelledAt",
            "createdAt",
        ]),
        poLineItems: makeTable("poLineItems", [
            "id", "poId", "description", "quantity", "unitPrice", "amount",
            "receivedQuantity", "billedQuantity", "sortOrder", "organizationId",
        ]),
        billPayments: makeTable("billPayments", [
            "id", "billId", "amount", "paymentDate", "paymentMethod",
            "referenceNumber", "notes", "recordedBy", "organizationId",
            "confirmationEmailSentAt", "createdAt",
        ]),
        clients: makeTable("clients", [
            "id", "clientCode", "name", "email", "phone", "companyName",
            "taxId", "billingAddress", "billingCity", "billingState",
            "billingPostalCode", "billingCountry", "shippingAddress",
            "shippingCity", "shippingState", "shippingPostalCode",
            "shippingCountry", "website", "notes", "isActive",
            "organizationId", "createdBy", "createdAt",
        ]),
        invoicePayments: makeTable("invoicePayments", [
            "id", "invoiceId", "amount", "paymentDate", "paymentMethod",
            "referenceNumber", "notes", "recordedBy", "organizationId",
            "createdAt",
        ]),
        payablesTaxConfig: makeTable("payablesTaxConfig", [
            "id", "taxType", "taxName", "defaultRate", "description",
            "isActive", "organizationId",
        ]),
        vendorCustomCategories: makeTable("vendorCustomCategories", [
            "id", "name", "description", "isActive", "organizationId",
        ]),
        // ── HR / Attendance tables ───────────────────────────────────────
        attendance: makeTable("attendance", [
            "id", "userId", "date", "signInTime", "signOutTime",
            "signInLatitude", "signInLongitude", "signInLocation",
            "status", "rejectionReason", "rejectedByUserId",
            "organizationId", "updatedAt",
        ]),
        attendanceWarnings: makeTable("attendanceWarnings", [
            "id", "attendanceId", "userId", "warningType", "reason",
            "message", "issuedByUserId", "organizationId",
        ]),
        attendanceSettings: makeTable("attendanceSettings", [
            "id", "signInStartHour", "signInEndHour", "signOutStartHour",
            "signOutEndHour", "isActive", "organizationId", "updatedAt",
        ]),
        // ── Assets tables ────────────────────────────────────────────────
        assets: makeTable("assets", [
            "id", "organizationId", "assetCode", "name", "description",
            "categoryId", "locationId", "purchaseDate", "purchasePrice",
            "vendor", "poNumber", "currentValue", "depreciationMethod",
            "usefulLifeYears", "residualValue", "depreciationStartDate",
            "accumulatedDepreciation", "warrantyStartDate", "warrantyEndDate",
            "warrantyProvider", "warrantyTerms", "serialNumber", "model",
            "manufacturer", "barcode", "requiresMaintenance", "status",
            "disposalDate", "disposalReason", "disposalPrice", "disposedBy",
            "notes", "customFields", "createdBy", "createdAt", "updatedAt",
        ]),
        assetCategories: makeTable("assetCategories", [
            "id", "organizationId", "name", "description", "codePrefix",
            "defaultUsefulLifeYears", "defaultResidualValuePercent",
            "isActive", "createdBy", "createdAt", "updatedAt",
        ]),
        assetLocations: makeTable("assetLocations", [
            "id", "organizationId", "name", "address", "createdAt",
        ]),
        assetAssignments: makeTable("assetAssignments", [
            "id", "assetId", "targetType", "employeeId", "department",
            "projectId", "assignedDate", "expectedReturnDate",
            "actualReturnDate", "notes", "organizationId",
        ]),
        // ── Recruitment tables ───────────────────────────────────────────
        candidates: makeTable("candidates", [
            "id", "candidateCode", "name", "email", "phone", "status",
            "jobPostingId", "currentCompany", "currentPosition",
            "yearsExperience", "expectedSalary", "noticePeriod",
            "linkedinUrl", "portfolioUrl", "referredBy", "notes",
            "screenedBy", "screenedAt", "rejectedBy", "rejectedAt",
            "rejectionReason", "hiredAt", "organizationId", "createdAt",
        ]),
        recruitmentActivityLog: makeTable("recruitmentActivityLog", [
            "id", "candidateId", "activityType", "description",
            "performedBy", "metadata", "organizationId", "createdAt",
        ]),
        recruitmentMetrics: makeTable("recruitmentMetrics", [
            "id", "jobPostingId", "totalApplications", "screened",
            "interviewed", "offered", "hired", "rejected", "organizationId",
        ]),
        jobPostings: makeTable("jobPostings", [
            "id", "title", "department", "description", "requirements",
            "type", "status", "location", "salaryMin", "salaryMax",
            "currency", "closingDate", "organizationId", "createdBy", "createdAt",
        ]),
        offers: makeTable("offers", [
            "id", "candidateId", "jobPostingId", "offeredSalary", "currency",
            "startDate", "status", "offerLetterUrl", "notes",
            "offeredBy", "acceptedAt", "rejectedAt", "rejectionReason",
            "organizationId", "createdAt",
        ]),
        interviews: makeTable("interviews", [
            "id", "candidateId", "jobPostingId", "scheduledAt", "duration",
            "type", "location", "interviewers", "status", "feedback",
            "rating", "cancelledAt", "cancelReason", "organizationId", "createdAt",
        ]),
        // ── Tasks tables ─────────────────────────────────────────────────
        tasks: makeTable("tasks", [
            "id", "title", "description", "status", "priority", "dueDate",
            "assignedTo", "assignedBy", "attachments", "organizationId",
            "createdAt", "updatedAt",
        ]),
        taskAssignees: makeTable("taskAssignees", [
            "id", "taskId", "userId", "organizationId",
        ]),
        taskMessages: makeTable("taskMessages", [
            "id", "taskId", "userId", "message", "organizationId", "createdAt",
        ]),
        taskReviews: makeTable("taskReviews", [
            "id", "taskId", "reviewerId", "rating", "comment", "organizationId", "createdAt",
        ]),
        taskSubmissions: makeTable("taskSubmissions", [
            "id", "taskId", "submittedBy", "content", "attachments",
            "status", "reviewedBy", "reviewedAt", "organizationId", "createdAt",
        ]),
        // ── Projects tables ──────────────────────────────────────────────
        projects: makeTable("projects", [
            "id", "name", "description", "status", "startDate", "endDate",
            "managerId", "organizationId", "createdAt", "updatedAt",
        ]),
        projectMembers: makeTable("projectMembers", [
            "id", "projectId", "userId", "role", "organizationId", "createdAt",
        ]),
        // ── Settings / Preferences / Branding tables ─────────────────────
        organizationSettings: makeTable("organizationSettings", [
            "id", "organizationId", "key", "value", "updatedAt",
        ]),
        userPreferences: makeTable("userPreferences", [
            "id", "userId", "key", "value", "organizationId", "updatedAt",
        ]),
        branding: makeTable("branding", [
            "id", "organizationId", "logoUrl", "primaryColor", "secondaryColor",
            "fontFamily", "updatedAt",
        ]),
        // ── News tables ──────────────────────────────────────────────────
        news: makeTable("news", [
            "id", "title", "content", "publishedAt", "organizationId",
            "createdBy", "createdAt",
        ]),
        // ── Notification tables ──────────────────────────────────────────
        notifications: makeTable("notifications", [
            "id", "userId", "title", "message", "notificationType",
            "referenceId", "readAt", "organizationId", "createdAt",
        ]),
        // ── HR Leave tables ──────────────────────────────────────────────
        leaveApplications: makeTable("leaveApplications", [
            "id", "userId", "leaveType", "startDate", "endDate", "totalDays",
            "reason", "status", "approvedByUserId", "approvedAt",
            "rejectionReason", "appliedAt", "organizationId", "createdAt", "updatedAt",
        ]),
        leaveBalances: makeTable("leaveBalances", [
            "id", "userId", "leaveType", "year", "totalDays", "usedDays",
            "remainingDays", "organizationId", "updatedAt",
        ]),
        leaveTypes: makeTable("leaveTypes", [
            "id", "name", "description", "maxDaysPerYear", "isPaid",
            "organizationId",
        ]),
        annualLeaveSettings: makeTable("annualLeaveSettings", [
            "id", "year", "allocatedDays", "description", "organizationId",
            "createdAt", "updatedAt",
        ]),
    };
});

// ─── Mock: @/db/schema/general-ledger ───────────────────────────────────────

vi.mock("@/db/schema/general-ledger", () => {
    const makeTable = (name: string, cols: string[]) => {
        const table: Record<string, string> = {};
        for (const col of cols) {
            table[col] = `${name}.${col}`;
        }
        return table;
    };
    return {
        glJournals: makeTable("glJournals", [
            "id", "organizationId", "journalNumber", "transactionDate",
            "postingDate", "description", "reference", "source", "sourceId",
            "status", "totalDebits", "totalCredits", "createdBy", "postedBy",
            "createdAt", "updatedAt",
        ]),
        glJournalLines: makeTable("glJournalLines", [
            "id", "journalId", "accountId", "description", "debit", "credit",
            "entityId", "organizationId",
        ]),
        glAccounts: makeTable("glAccounts", [
            "id", "code", "name", "type", "organizationId", "currentBalance",
        ]),
        glPeriods: makeTable("glPeriods", [
            "id", "organizationId", "status", "startDate", "endDate",
        ]),
    };
});

// ─── Mock: @/db/schema/hr ───────────────────────────────────────────────────
// auth.ts imports employees from this sub-path.

vi.mock("@/db/schema/hr", () => {
    const makeTable = (name: string, cols: string[]) => {
        const table: Record<string, string> = {};
        for (const col of cols) {
            table[col] = `${name}.${col}`;
        }
        return table;
    };
    return {
        employees: makeTable("employees", [
            "authId", "id", "email", "role", "name", "department", "employmentType",
            "phone", "isManager", "dateOfBirth", "staffNumber", "status",
            "maritalStatus", "organizationId", "managerId", "documentCount",
            "address", "createdAt", "updatedAt",
        ]),
        employeesBank: makeTable("employeesBank", [
            "id", "userId", "bankName", "accountName", "accountNumber",
            "organizationId", "createdAt", "updatedAt",
        ]),
        employeeDocuments: makeTable("employeeDocuments", [
            "id", "userId", "name", "type", "url", "size",
            "organizationId", "uploadedBy", "createdAt",
        ]),
        employmentHistory: makeTable("employmentHistory", [
            "id", "userId", "title", "department", "startDate", "endDate",
            "employmentType", "salary", "notes", "organizationId", "createdAt",
        ]),
        leaves: makeTable("leaves", [
            "id", "userId", "type", "startDate", "endDate", "days",
            "reason", "status", "approvedBy", "approvedAt", "rejectionReason",
            "organizationId", "createdAt",
        ]),
    };
});

// ─── Mock: @/db/schema/payroll ──────────────────────────────────────────────

vi.mock("@/db/schema/payroll", () => {
    const makeTable = (name: string, cols: string[]) => {
        const table: Record<string, string> = {};
        for (const col of cols) {
            table[col] = `${name}.${col}`;
        }
        return table;
    };
    return {
        salaryStructure: makeTable("salaryStructure", [
            "id", "name", "baseSalary", "description", "active",
            "employeeCount", "organizationId", "createdByUserId",
            "updatedByUserId", "createdAt", "updatedAt",
        ]),
        allowances: makeTable("allowances", [
            "id", "name", "type", "percentage", "amount", "taxable",
            "taxPercentage", "description", "organizationId",
            "createdByUserId", "updatedByUserId", "createdAt", "updatedAt",
        ]),
        deductions: makeTable("deductions", [
            "id", "name", "type", "percentage", "amount", "description",
            "organizationId", "createdByUserId", "updatedByUserId",
            "createdAt", "updatedAt",
        ]),
        salaryAllowances: makeTable("salaryAllowances", [
            "id", "salaryStructureId", "allowanceId", "effectiveFrom",
            "effectiveTo", "organizationId",
        ]),
        salaryDeductions: makeTable("salaryDeductions", [
            "id", "salaryStructureId", "deductionId", "effectiveFrom",
            "effectiveTo", "organizationId",
        ]),
        employeeAllowances: makeTable("employeeAllowances", [
            "id", "userId", "allowanceId", "effectiveFrom", "effectiveTo",
            "organizationId",
        ]),
        employeeDeductions: makeTable("employeeDeductions", [
            "id", "userId", "name", "type", "percentage", "amount",
            "active", "effectiveFrom", "effectiveTo", "organizationId",
        ]),
        employeeSalary: makeTable("employeeSalary", [
            "id", "userId", "salaryStructureId", "effectiveFrom", "effectiveTo",
            "organizationId", "createdAt", "updatedAt",
        ]),
        payrun: makeTable("payrun", [
            "id", "name", "type", "allowanceId", "day", "month", "year",
            "totalEmployees", "totalGrossPay", "totalDeductions", "totalNetPay",
            "status", "generatedByUserId", "approvedByUserId", "approvedAt",
            "organizationId", "createdAt",
        ]),
        payrunItems: makeTable("payrunItems", [
            "id", "payrunId", "userId", "type", "baseSalary", "totalAllowances",
            "totalDeductions", "grossPay", "taxableIncome", "totalTaxes",
            "netPay", "status", "organizationId",
        ]),
        payrunItemDetails: makeTable("payrunItemDetails", [
            "id", "payrunItemId", "userId", "detailType", "description",
            "allowanceId", "deductionId", "employeeAllowanceId",
            "employeeDeductionId", "loanApplicationId", "amount",
            "originalAmount", "remainingAmount", "organizationId",
        ]),
        // Export enum stubs for type imports
        allowanceTypeEnum: { enumValues: ["monthly", "annual", "one-time"] as const },
        deductionTypeEnum: { enumValues: ["recurring", "one-time", "loan"] as const },
    };
});

// ─── Mock: @/db/schema/loans ────────────────────────────────────────────────

vi.mock("@/db/schema/loans", () => {
    const makeTable = (name: string, cols: string[]) => {
        const table: Record<string, string> = {};
        for (const col of cols) {
            table[col] = `${name}.${col}`;
        }
        return table;
    };
    return {
        loanApplications: makeTable("loanApplications", [
            "id", "userId", "amount", "purpose", "monthlyDeduction",
            "remainingBalance", "status", "approvedBy", "approvedAt",
            "organizationId", "createdAt",
        ]),
        loanRepayments: makeTable("loanRepayments", [
            "id", "loanApplicationId", "amount", "paymentDate", "organizationId",
        ]),
    };
});

// ─── Mock: @/actions/auth/dal-invoicing ─────────────────────────────────────

export const mockRequireInvoicingViewAccess = vi.fn();
export const mockRequireInvoicingWriteAccess = vi.fn();
export const mockRequireFinanceOrAdmin = vi.fn();

vi.mock("@/actions/auth/dal-invoicing", () => ({
    requireInvoicingViewAccess: (...args: unknown[]) =>
        mockRequireInvoicingViewAccess(...args),
    requireInvoicingWriteAccess: (...args: unknown[]) =>
        mockRequireInvoicingWriteAccess(...args),
    requireFinanceOrAdmin: (...args: unknown[]) =>
        mockRequireFinanceOrAdmin(...args),
}));

// ─── Mock: @/actions/auth/dal-payables ──────────────────────────────────────

export const mockRequirePayablesViewAccess = vi.fn();
export const mockRequirePayablesWriteAccess = vi.fn();
export const mockRequirePayablesApprovalAccess = vi.fn();

vi.mock("@/actions/auth/dal-payables", () => ({
    requirePayablesViewAccess: (...args: unknown[]) =>
        mockRequirePayablesViewAccess(...args),
    requirePayablesWriteAccess: (...args: unknown[]) =>
        mockRequirePayablesWriteAccess(...args),
    requirePayablesApprovalAccess: (...args: unknown[]) =>
        mockRequirePayablesApprovalAccess(...args),
}));

// ─── Mock: @/actions/hr/employees ───────────────────────────────────────────
// tasks.ts imports getEmployee from hr/employees
// Use importOriginal to preserve all other exports (getAllEmployees, etc.)

export const mockGetEmployee = vi.fn();

vi.mock("@/actions/hr/employees", async (importOriginal) => {
    const original = await importOriginal<typeof import("@/actions/hr/employees")>();
    return {
        ...original,
        getEmployee: (...args: unknown[]) => mockGetEmployee(...args),
    };
});

// ─── Mock: @/actions/finance/gl/journals ────────────────────────────────────

export const mockCreateJournal = vi.fn().mockResolvedValue({ success: true });

// vi.mock("@/actions/finance/gl/journals", () => ({
//     createJournal: (...args: unknown[]) => mockCreateJournal(...args),
// }));

// ─── Mock: @/actions/finance/gl/accounts ────────────────────────────────────
// NOTE: vi.mock for this module is NOT registered globally — it conflicts with
// gl-accounts.test.ts which tests the real module. Add it locally in
// invoices.test.ts and bills.test.ts instead.

export const mockEnsureDefaultGLAccounts = vi.fn().mockResolvedValue(undefined);

// ─── Mock: @/lib/billing-utils ──────────────────────────────────────────────

export const mockCalculateAnniversaryDay = vi.fn().mockReturnValue(15);
export const mockCalculateNextPeriodEnd = vi.fn().mockReturnValue(
    new Date("2026-03-15"),
);
export const mockCalculatePlanChangeProration = vi.fn().mockReturnValue({
    netAmount: 5000,
    remainingDays: 15,
    totalDays: 30,
});

vi.mock("@/lib/billing-utils", () => ({
    calculateAnniversaryDay: (...args: unknown[]) =>
        mockCalculateAnniversaryDay(...args),
    calculateNextPeriodEnd: (...args: unknown[]) =>
        mockCalculateNextPeriodEnd(...args),
    calculatePlanChangeProration: (...args: unknown[]) =>
        mockCalculatePlanChangeProration(...args),
}));

// ─── Mock: @/lib/invoicing-utils ────────────────────────────────────────────

export const mockCalculateInvoiceAmounts = vi.fn().mockReturnValue({
    subtotal: 1000,
    taxAmount: 75,
    total: 1075,
});

vi.mock("@/lib/invoicing-utils", () => ({
    calculateInvoiceAmounts: (...args: unknown[]) =>
        mockCalculateInvoiceAmounts(...args),
}));

// ─── Mock: @/lib/payables-utils ─────────────────────────────────────────────

export const mockCalculateBillAmounts = vi.fn().mockReturnValue({
    subtotal: 2000,
    taxAmount: 150,
    total: 2150,
});
export const mockGenerateDuplicateCheckHash = vi.fn().mockReturnValue("hash-abc");
export const mockCalculateDuplicateSimilarity = vi.fn().mockReturnValue({
    similarity: 0.95,
});
export const mockCalculateStringSimilarity = vi.fn().mockReturnValue(0.9);

vi.mock("@/lib/payables-utils", () => ({
    calculateBillAmounts: (...args: unknown[]) =>
        mockCalculateBillAmounts(...args),
    generateDuplicateCheckHash: (...args: unknown[]) =>
        mockGenerateDuplicateCheckHash(...args),
    calculateDuplicateSimilarity: (...args: unknown[]) =>
        mockCalculateDuplicateSimilarity(...args),
    calculateStringSimilarity: (...args: unknown[]) =>
        mockCalculateStringSimilarity(...args),
}));

// ─── Mock: @/lib/pdf/invoice-pdf ────────────────────────────────────────────

export const mockGenerateInvoicePdf = vi.fn().mockResolvedValue(
    new Uint8Array([37, 80, 68, 70]),  // fake PDF bytes
);

vi.mock("@/lib/pdf/invoice-pdf", () => ({
    generateInvoicePdf: (...args: unknown[]) =>
        mockGenerateInvoicePdf(...args),
}));

// ─── Mock: @aws-sdk/client-s3 ───────────────────────────────────────────────

export const MockPutObjectCommand = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
    PutObjectCommand: MockPutObjectCommand,
}));

// ─── Mock: @/lib/r2Client ───────────────────────────────────────────────────

export const mockR2Send = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/r2Client", () => ({
    r2Client: { send: (...args: unknown[]) => mockR2Send(...args) },
}));

// ─── Mock: @/lib/emails ─────────────────────────────────────────────────────

export const mockSendInvoiceEmail = vi.fn().mockResolvedValue(undefined);
export const mockSendBillReceivedConfirmationEmail = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/emails", () => ({
    sendInvoiceEmail: (...args: unknown[]) => mockSendInvoiceEmail(...args),
    sendBillReceivedConfirmationEmail: (...args: unknown[]) =>
        mockSendBillReceivedConfirmationEmail(...args),
}));

// ─── Mock: next/navigation ──────────────────────────────────────────────────

export const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
    redirect: (...args: unknown[]) => mockRedirect(...args),
}));

// ─── Mock: @/actions/payables/purchase-orders ───────────────────────────────

export const mockUpdatePOBilledAmount = vi.fn().mockResolvedValue(undefined);

vi.mock("@/actions/payables/purchase-orders", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/actions/payables/purchase-orders")>();
    return {
        ...actual,
        updatePOBilledAmount: (...args: unknown[]) =>
            mockUpdatePOBilledAmount(...args),
    };
});

// ─── Mock: @/db/schema/subscriptions ────────────────────────────────────────

vi.mock("@/db/schema/subscriptions", () => {
    const makeTable = (name: string, cols: string[]) => {
        const table: Record<string, string> = {};
        for (const col of cols) {
            table[col] = `${name}.${col}`;
        }
        return table;
    };
    return {
        subscriptions: makeTable("subscriptions", [
            "id", "userId", "plan", "status", "pricePerMember",
            "currentPeriodStart", "currentPeriodEnd",
            "billingAnniversaryDay", "lastInvoicedAt",
            "cancelAtPeriodEnd", "canceledAt",
        ]),
        invoices: makeTable("invoices", [
            "id", "subscriptionId", "status", "amount", "currency",
            "billingPeriodStart", "billingPeriodEnd", "dueDate", "createdAt",
        ]),
        invoiceItems: makeTable("invoiceItems", [
            "id", "invoiceId", "memberId", "organizationId",
            "description", "amount", "prorated",
            "billingPeriodStart", "billingPeriodEnd",
        ]),
    };
});

// ─── Mock: @/db/schema/auth ─────────────────────────────────────────────────

vi.mock("@/db/schema/auth", () => {
    const makeTable = (name: string, cols: string[]) => {
        const table: Record<string, string> = {};
        for (const col of cols) {
            table[col] = `${name}.${col}`;
        }
        return table;
    };
    return {
        organization: makeTable("organization", ["id", "ownerId", "membersCount"]),
        member: makeTable("member", [
            "id", "organizationId", "userId", "role", "createdAt",
        ]),
    };
});

// ─── Mock: dayjs ────────────────────────────────────────────────────────────
// billing.ts uses dayjs.extend(utc) and dayjs.utc().add().format()

vi.mock("dayjs/plugin/utc", () => ({ default: vi.fn() }));

const dayjsChain = {
    add: vi.fn().mockReturnThis(),
    format: vi.fn().mockReturnValue("2026-03-15"),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dayjsMock: any = Object.assign(
    (..._args: unknown[]) => dayjsChain,
    {
        extend: vi.fn(),
        utc: vi.fn().mockReturnValue(dayjsChain),
    },
);

vi.mock("dayjs", () => ({ default: dayjsMock }));

// ─── Mock: @/types/* ────────────────────────────────────────────────────────
// Type-only imports do not need mocking.

// ─── Mock: server-only ──────────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

// ─── Factory helpers ────────────────────────────────────────────────────────

/** Configure DAL `requireAuth` to resolve with defaults (or overrides). */
export function mockAuthSession(
    overrides: Partial<{
        userId: string;
        role: string;
        employee: Partial<MockEmployee>;
    }> = {},
) {
    const data = {
        userId: overrides.userId ?? DEFAULT_USER_ID,
        role: overrides.role ?? "admin",
        employee: { ...defaultEmployee, ...overrides.employee },
    };
    mockRequireAuth.mockResolvedValue(data);
    mockRequireHROrAdmin.mockResolvedValue(data);
    return data;
}

/** Configure `auth.api.getSession` to return a session. */
/** Configure `auth.api.getSession` to return a session. */
export function mockSessionApi(
    userOverrides: Partial<NonNullable<MockSession["user"]>> = {},
    sessionOverrides: Partial<NonNullable<MockSession["session"]>> = {}
) {
    const session: MockSession = {
        session: { ...defaultSession.session!, ...sessionOverrides },
        user: { ...defaultSession.user!, ...userOverrides },
    };
    mockGetSession.mockResolvedValue(session);
    return session;
}

/** Configure `auth.api.getFullOrganization` to return an org. */
export function mockOrgApi(overrides: Partial<MockOrganization> = {}) {
    const org = { ...defaultOrganization, ...overrides };
    mockGetFullOrganization.mockResolvedValue(org);
    return org;
}

/** Configure DB chain to resolve with a specific value. */
export function mockDbResult(value: unknown) {
    queueDbResult(value);
}

// ─── Auto-reset ─────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();

    // Reset the one-time value queues for query mocks that use
    // mockResolvedValueOnce – clearAllMocks does NOT clear these queues.
    mockQueryFindFirst.mockReset();
    mockQueryFindMany.mockReset();
    mockGetSession.mockReset();

    // Clear DB result queue
    dbQueryQueue.length = 0;

    // Re-apply sensible defaults after clearing
    mockHeaders.mockResolvedValue(new Headers());
    mockGenerateId.mockReturnValue("generated-id-001");

    // Re-build the db chain so `.then()` resolves to `[]` by default (via empty queue -> [])
    const methods = [
        "select", "insert", "update", "delete", "from", "set",
        "values", "where", "leftJoin", "innerJoin", "limit",
        "returning", "orderBy",
    ];
    for (const method of methods) {
        mockDbChain[method].mockReturnValue(mockDbChain);
    }
    // Restore default implementation to use the queue
    mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) => {
        const next = dbQueryQueue.shift() ?? [];
        return Promise.resolve(resolve(next));
    }) as (...args: unknown[]) => unknown);
    mockTransaction.mockImplementation(async (callback: (tx: unknown) => unknown) => {
        return callback(mockDbChain);
    });
});

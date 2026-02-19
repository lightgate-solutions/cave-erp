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

vi.mock("next/cache", () => ({
    revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
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
export const mockGetUser = vi.fn();

vi.mock("@/actions/auth/dal", () => ({
    requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
    requireHROrAdmin: (...args: unknown[]) => mockRequireHROrAdmin(...args),
    verifySession: vi.fn(),
    getUser: (...args: unknown[]) => mockGetUser(...args),
    getSessionRole: vi.fn(),
    requireAdmin: vi.fn(),
    requireManager: vi.fn(),
    requireHR: vi.fn(),
    requireFinance: vi.fn(),
    requireModuleAccess: vi.fn(),
    requireFleetAccess: vi.fn(),
    requireAssetAccess: vi.fn(),
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
        "returning",
        "orderBy",
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
        clients: makeTable("clients", [
            "id", "name", "email", "companyName", "organizationId",
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
            "id", "status", "organizationId",
        ]),
        poLineItems: makeTable("poLineItems", [
            "id", "poId", "description", "quantity", "unitPrice", "amount",
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
            "authId", "email", "role", "name", "department", "employmentType",
            "phone", "isManager", "dateOfBirth", "staffNumber", "status",
            "maritalStatus", "organizationId", "managerId", "documentCount",
            "address", "createdAt", "updatedAt",
        ]),
    };
});

// ─── Mock: @/actions/auth/dal-invoicing ─────────────────────────────────────

export const mockRequireInvoicingViewAccess = vi.fn();
export const mockRequireInvoicingWriteAccess = vi.fn();

vi.mock("@/actions/auth/dal-invoicing", () => ({
    requireInvoicingViewAccess: (...args: unknown[]) =>
        mockRequireInvoicingViewAccess(...args),
    requireInvoicingWriteAccess: (...args: unknown[]) =>
        mockRequireInvoicingWriteAccess(...args),
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

// ─── Mock: @/actions/finance/gl/journals ────────────────────────────────────

export const mockCreateJournal = vi.fn().mockResolvedValue({ success: true });

// vi.mock("@/actions/finance/gl/journals", () => ({
//     createJournal: (...args: unknown[]) => mockCreateJournal(...args),
// }));

// ─── Mock: @/actions/finance/gl/accounts ────────────────────────────────────

export const mockEnsureDefaultGLAccounts = vi.fn().mockResolvedValue(undefined);

vi.mock("@/actions/finance/gl/accounts", () => ({
    ensureDefaultGLAccounts: (...args: unknown[]) =>
        mockEnsureDefaultGLAccounts(...args),
}));

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

vi.mock("@/actions/payables/purchase-orders", () => ({
    updatePOBilledAmount: (...args: unknown[]) =>
        mockUpdatePOBilledAmount(...args),
}));

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

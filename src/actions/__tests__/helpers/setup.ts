/**
 * Shared mock infrastructure for server action integration tests.
 *
 * Provides factory functions to configure mocks per-test. All mocks are
 * reset automatically via `beforeEach` so tests don't leak state.
 */

import { vi, beforeEach } from "vitest";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MockSession {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
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

vi.mock("@/actions/auth/dal", () => ({
    requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
    requireHROrAdmin: (...args: unknown[]) => mockRequireHROrAdmin(...args),
    verifySession: vi.fn(),
    getUser: vi.fn(),
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
    const chain: Record<string, ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>> = {};
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
        return Promise.resolve(resolve(resolvedValue));
    });

    return chain;
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
export function mockSessionApi(overrides: Partial<MockSession["user"]> = {}) {
    const session: MockSession = {
        user: { ...defaultSession.user, ...overrides },
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
    mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) => {
        return Promise.resolve(resolve(value));
    }) as (...args: unknown[]) => unknown);
}

// ─── Auto-reset ─────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();

    // Re-apply sensible defaults after clearing
    mockHeaders.mockResolvedValue(new Headers());
    mockGenerateId.mockReturnValue("generated-id-001");

    // Re-build the db chain so `.then()` resolves to `[]` by default
    const methods = [
        "select", "insert", "update", "delete", "from", "set",
        "values", "where", "leftJoin", "innerJoin", "limit",
        "returning", "orderBy",
    ];
    for (const method of methods) {
        mockDbChain[method].mockReturnValue(mockDbChain);
    }
    mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) => {
        return Promise.resolve(resolve([]));
    }) as (...args: unknown[]) => unknown);
    mockTransaction.mockImplementation(async (callback: (tx: unknown) => unknown) => {
        return callback(mockDbChain);
    });
});

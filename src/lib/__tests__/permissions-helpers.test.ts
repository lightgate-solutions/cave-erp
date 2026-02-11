import { describe, it, expect } from "vitest";
import {
    canAccessModule,
    canAccessRoute,
    getUnauthorizedRedirect,
    filterModulesByPermission,
} from "../permissions/helpers";
import { MODULES, DEPARTMENTS } from "../permissions/types";
import type { UserPermissionContext } from "../permissions/types";

describe("permissions/helpers", () => {
    const adminDeptUser: UserPermissionContext = {
        department: DEPARTMENTS.ADMIN,
        role: "user",
        isManager: false,
    };

    const adminRoleUser: UserPermissionContext = {
        department: DEPARTMENTS.OPERATIONS,
        role: "admin",
        isManager: false,
    };

    const hrUser: UserPermissionContext = {
        department: DEPARTMENTS.HR,
        role: "user",
        isManager: false,
    };

    const financeUser: UserPermissionContext = {
        department: DEPARTMENTS.FINANCE,
        role: "user",
        isManager: false,
    };

    const opsUser: UserPermissionContext = {
        department: DEPARTMENTS.OPERATIONS,
        role: "user",
        isManager: false,
    };

    describe("canAccessModule", () => {
        it("should grant admin department access to all modules", () => {
            expect(canAccessModule(adminDeptUser, MODULES.FINANCE)).toBe(true);
            expect(canAccessModule(adminDeptUser, MODULES.HR_EMPLOYEES)).toBe(true);
            expect(canAccessModule(adminDeptUser, MODULES.PAYROLL)).toBe(true);
            expect(canAccessModule(adminDeptUser, MODULES.RECRUITMENT)).toBe(true);
        });

        it("should grant admin role access to all modules regardless of department", () => {
            expect(canAccessModule(adminRoleUser, MODULES.FINANCE)).toBe(true);
            expect(canAccessModule(adminRoleUser, MODULES.HR_EMPLOYEES)).toBe(true);
            expect(canAccessModule(adminRoleUser, MODULES.PAYROLL)).toBe(true);
        });

        it("should allow HR users to access HR-specific modules", () => {
            expect(canAccessModule(hrUser, MODULES.HR_EMPLOYEES)).toBe(true);
            expect(canAccessModule(hrUser, MODULES.PAYROLL)).toBe(true);
            expect(canAccessModule(hrUser, MODULES.RECRUITMENT)).toBe(true);
            expect(canAccessModule(hrUser, MODULES.DASHBOARD)).toBe(true);
        });

        it("should deny HR users access to finance-only modules", () => {
            expect(canAccessModule(hrUser, MODULES.FINANCE)).toBe(false);
        });

        it("should allow finance users to access finance modules", () => {
            expect(canAccessModule(financeUser, MODULES.FINANCE)).toBe(true);
            expect(canAccessModule(financeUser, MODULES.INVOICING)).toBe(true);
        });

        it("should deny finance users access to HR-specific modules", () => {
            expect(canAccessModule(financeUser, MODULES.HR_EMPLOYEES)).toBe(false);
            expect(canAccessModule(financeUser, MODULES.PAYROLL)).toBe(false);
            expect(canAccessModule(financeUser, MODULES.RECRUITMENT)).toBe(false);
        });

        it("should give operations users only general access", () => {
            expect(canAccessModule(opsUser, MODULES.DASHBOARD)).toBe(true);
            expect(canAccessModule(opsUser, MODULES.ATTENDANCE)).toBe(true);
            expect(canAccessModule(opsUser, MODULES.TASKS)).toBe(true);
            expect(canAccessModule(opsUser, MODULES.FINANCE)).toBe(false);
            expect(canAccessModule(opsUser, MODULES.HR_EMPLOYEES)).toBe(false);
            expect(canAccessModule(opsUser, MODULES.PAYROLL)).toBe(false);
        });
    });

    describe("canAccessRoute", () => {
        it("should allow access to mapped routes for authorized users", () => {
            expect(canAccessRoute(hrUser, "/hr/employees")).toBe(true);
            expect(canAccessRoute(financeUser, "/finance")).toBe(true);
        });

        it("should deny access to mapped routes for unauthorized users", () => {
            expect(canAccessRoute(opsUser, "/finance")).toBe(false);
            expect(canAccessRoute(opsUser, "/hr/employees")).toBe(false);
        });

        it("should allow access to unmapped routes by default", () => {
            expect(canAccessRoute(opsUser, "/some-unknown-route")).toBe(true);
        });

        it("should normalize trailing slashes", () => {
            expect(canAccessRoute(financeUser, "/finance/")).toBe(true);
            expect(canAccessRoute(opsUser, "/finance/")).toBe(false);
        });

        it("should not strip slash from root route", () => {
            expect(canAccessRoute(opsUser, "/")).toBe(true);
        });

        it("should grant admin role access to all routes", () => {
            expect(canAccessRoute(adminRoleUser, "/finance")).toBe(true);
            expect(canAccessRoute(adminRoleUser, "/hr/employees")).toBe(true);
            expect(canAccessRoute(adminRoleUser, "/payroll")).toBe(true);
        });
    });

    describe("getUnauthorizedRedirect", () => {
        it("should return root path", () => {
            expect(getUnauthorizedRedirect()).toBe("/");
        });
    });

    describe("filterModulesByPermission", () => {
        it("should filter modules based on user permissions", () => {
            const allModules = [
                MODULES.DASHBOARD,
                MODULES.FINANCE,
                MODULES.HR_EMPLOYEES,
                MODULES.PAYROLL,
            ];
            const filtered = filterModulesByPermission(opsUser, allModules);

            expect(filtered).toContain(MODULES.DASHBOARD);
            expect(filtered).not.toContain(MODULES.FINANCE);
            expect(filtered).not.toContain(MODULES.HR_EMPLOYEES);
            expect(filtered).not.toContain(MODULES.PAYROLL);
        });

        it("should return all modules for admin department", () => {
            const modules = [MODULES.FINANCE, MODULES.PAYROLL, MODULES.HR_EMPLOYEES];
            const filtered = filterModulesByPermission(adminDeptUser, modules);
            expect(filtered).toEqual(modules);
        });

        it("should return empty array for empty input", () => {
            const filtered = filterModulesByPermission(opsUser, []);
            expect(filtered).toEqual([]);
        });
    });
});

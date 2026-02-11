import { describe, it, expect } from "vitest";
import {
    getModuleAccessByDepartment,
    ROUTE_MODULE_MAP,
} from "../permissions/config";
import { DEPARTMENTS, MODULES } from "../permissions/types";

describe("permissions/config", () => {
    describe("getModuleAccessByDepartment", () => {
        it("should give admin department access to all modules", () => {
            const adminModules = getModuleAccessByDepartment(DEPARTMENTS.ADMIN);
            const allModules = Object.values(MODULES);

            for (const mod of allModules) {
                expect(adminModules).toContain(mod);
            }
        });

        it("should give HR department correct modules", () => {
            const hrModules = getModuleAccessByDepartment(DEPARTMENTS.HR);

            // HR should have general + HR-specific modules
            expect(hrModules).toContain(MODULES.DASHBOARD);
            expect(hrModules).toContain(MODULES.ATTENDANCE);
            expect(hrModules).toContain(MODULES.HR_EMPLOYEES);
            expect(hrModules).toContain(MODULES.PAYROLL);
            expect(hrModules).toContain(MODULES.RECRUITMENT);
            expect(hrModules).toContain(MODULES.NEWS_MANAGE);

            // HR should NOT have finance
            expect(hrModules).not.toContain(MODULES.FINANCE);
        });

        it("should give finance department correct modules", () => {
            const financeModules = getModuleAccessByDepartment(DEPARTMENTS.FINANCE);

            expect(financeModules).toContain(MODULES.FINANCE);
            expect(financeModules).toContain(MODULES.INVOICING);
            expect(financeModules).toContain(MODULES.DASHBOARD);

            // Finance should NOT have HR-specific
            expect(financeModules).not.toContain(MODULES.HR_EMPLOYEES);
            expect(financeModules).not.toContain(MODULES.PAYROLL);
            expect(financeModules).not.toContain(MODULES.RECRUITMENT);
        });

        it("should give operations department only general access", () => {
            const opsModules = getModuleAccessByDepartment(DEPARTMENTS.OPERATIONS);

            expect(opsModules).toContain(MODULES.DASHBOARD);
            expect(opsModules).toContain(MODULES.ATTENDANCE);
            expect(opsModules).toContain(MODULES.DOCUMENTS);
            expect(opsModules).toContain(MODULES.TASKS);

            // Operations should NOT have specialized modules
            expect(opsModules).not.toContain(MODULES.FINANCE);
            expect(opsModules).not.toContain(MODULES.HR_EMPLOYEES);
            expect(opsModules).not.toContain(MODULES.PAYROLL);
            expect(opsModules).not.toContain(MODULES.INVOICING);
        });

        it("should return empty array for unknown department", () => {
            const modules = getModuleAccessByDepartment(
                "unknown" as typeof DEPARTMENTS.ADMIN,
            );
            expect(modules).toEqual([]);
        });

        it("should include common modules for all departments", () => {
            const commonModules = [
                MODULES.DASHBOARD,
                MODULES.ATTENDANCE,
                MODULES.DOCUMENTS,
                MODULES.MAIL,
                MODULES.TASKS,
                MODULES.SUPPORT,
            ];

            for (const dept of [
                DEPARTMENTS.HR,
                DEPARTMENTS.FINANCE,
                DEPARTMENTS.OPERATIONS,
            ]) {
                const deptModules = getModuleAccessByDepartment(dept);
                for (const mod of commonModules) {
                    expect(deptModules).toContain(mod);
                }
            }
        });
    });

    describe("ROUTE_MODULE_MAP", () => {
        it("should map root to dashboard", () => {
            expect(ROUTE_MODULE_MAP["/"]).toBe(MODULES.DASHBOARD);
        });

        it("should map finance routes to finance module", () => {
            expect(ROUTE_MODULE_MAP["/finance"]).toBe(MODULES.FINANCE);
            expect(ROUTE_MODULE_MAP["/finance/balance"]).toBe(MODULES.FINANCE);
            expect(ROUTE_MODULE_MAP["/finance/payruns"]).toBe(MODULES.FINANCE);
        });

        it("should map HR routes correctly", () => {
            expect(ROUTE_MODULE_MAP["/hr/employees"]).toBe(MODULES.HR_EMPLOYEES);
            expect(ROUTE_MODULE_MAP["/hr/attendance"]).toBe(MODULES.ATTENDANCE);
        });

        it("should map invoicing routes correctly", () => {
            expect(ROUTE_MODULE_MAP["/invoicing"]).toBe(MODULES.INVOICING);
            expect(ROUTE_MODULE_MAP["/invoicing/invoices"]).toBe(MODULES.INVOICING);
            expect(ROUTE_MODULE_MAP["/invoicing/clients"]).toBe(MODULES.INVOICING);
        });

        it("should map all payroll routes to payroll module", () => {
            expect(ROUTE_MODULE_MAP["/payroll"]).toBe(MODULES.PAYROLL);
            expect(ROUTE_MODULE_MAP["/payroll/structure"]).toBe(MODULES.PAYROLL);
            expect(ROUTE_MODULE_MAP["/payroll/employees"]).toBe(MODULES.PAYROLL);
        });

        it("should map fleet routes correctly", () => {
            expect(ROUTE_MODULE_MAP["/fleet"]).toBe(MODULES.FLEET);
            expect(ROUTE_MODULE_MAP["/fleet/vehicles"]).toBe(MODULES.FLEET);
            expect(ROUTE_MODULE_MAP["/fleet/drivers"]).toBe(MODULES.FLEET);
        });

        it("should map notification routes correctly", () => {
            expect(ROUTE_MODULE_MAP["/notification"]).toBe(MODULES.NOTIFICATIONS);
            expect(ROUTE_MODULE_MAP["/notification-preferences"]).toBe(
                MODULES.NOTIFICATIONS,
            );
        });
    });
});

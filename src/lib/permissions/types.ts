// Department enum matching the existing schema
export const DEPARTMENTS = {
  ADMIN: "admin",
  HR: "hr",
  FINANCE: "finance",
  OPERATIONS: "operations",
} as const;

export type Department = (typeof DEPARTMENTS)[keyof typeof DEPARTMENTS];

// Module/Feature identifiers
export const MODULES = {
  DASHBOARD: "dashboard",
  ATTENDANCE: "attendance",
  DOCUMENTS: "documents",
  MAIL: "mail",
  PROJECTS: "projects",
  TASKS: "tasks",
  HR_EMPLOYEES: "hr-employees",
  ASK_HR: "ask-hr",
  LOAN_MANAGEMENT: "loan-management",
  LEAVE_MANAGEMENT: "leave-management",
  RECRUITMENT: "recruitment",
  FINANCE: "finance",
  FLEET: "fleet",
  PAYROLL: "payroll",
  NOTIFICATIONS: "notifications",
  NEWS_VIEW: "news-view",
  NEWS_MANAGE: "news-manage",
  SUPPORT: "support",
  DATA_EXPORT: "data-export",
} as const;

export type Module = (typeof MODULES)[keyof typeof MODULES];

// User context for permission checks
export interface UserPermissionContext {
  department: Department;
  role: "admin" | "user";
  isManager: boolean;
}

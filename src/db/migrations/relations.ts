import { relations } from "drizzle-orm/relations";
import {
  user,
  session,
  twoFactor,
  organization,
  employees,
  employeesBank,
  email,
  documentFolders,
  document,
  documentComments,
  companyExpenses,
  vehicles,
  employeeAllowances,
  allowances,
  salaryDeductions,
  salaryStructure,
  deductions,
  subscriptions,
  subscriptionsInvoices,
  loanTypes,
  loanTypeSalaryStructures,
  clients,
  invoices,
  companyBankAccounts,
  organizationCurrencies,
  account,
  invitation,
  member,
  annualLeaveSettings,
  attendance,
  attendanceSettings,
  attendanceWarnings,
  employeesDocuments,
  employmentHistory,
  leaveApplications,
  leaveBalances,
  leaveTypes,
  emailAttachment,
  emailRecipient,
  projects,
  expenses,
  milestones,
  projectAccess,
  documentAccess,
  documentLogs,
  documentVersions,
  documentSharedLink,
  documentTags,
  notifications,
  notificationPreferences,
  payments,
  tasks,
  taskReviews,
  taskSubmissions,
  taskMessages,
  taskAssignees,
  taskLabelAssignments,
  taskLabels,
  balanceTransactions,
  companyBalance,
  driverAssignments,
  drivers,
  fleetIncidents,
  fleetMaintenance,
  vehicleDocuments,
  employeeDeductions,
  employeeSalary,
  payrun,
  payrunItemDetails,
  payrunItems,
  payslips,
  salaryAllowances,
  userPreferences,
  askHrQuestions,
  askHrResponses,
  loanApplications,
  loanHistory,
  loanRepayments,
  newsArticles,
  newsAttachments,
  newsComments,
  bugReports,
  bugReportAttachments,
  invoiceItems,
  candidates,
  candidateDocuments,
  jobPostings,
  interviews,
  offers,
  recruitmentActivityLog,
  recruitmentMetrics,
  invoiceMetrics,
  assetAssignmentHistory,
  assets,
  assetAssignments,
  assetCategories,
  assetDocuments,
  assetLocations,
  assetMaintenance,
  assetMaintenanceSchedules,
  assetManagementTeams,
  assetValueAdjustments,
  invoiceActivityLog,
  invoiceDocuments,
  invoiceLineItems,
  invoicePayments,
  invoiceTaxes,
  billPayments,
} from "./schema";

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  twoFactors: many(twoFactor),
  organizations: many(organization),
  employees_authId: many(employees, {
    relationName: "employees_authId_user_id",
  }),
  employees_managerId: many(employees, {
    relationName: "employees_managerId_user_id",
  }),
  employeesBanks: many(employeesBank),
  emails: many(email),
  documents: many(document),
  documentComments: many(documentComments),
  employeeAllowances: many(employeeAllowances),
  subscriptions: many(subscriptions),
  clients: many(clients),
  invoices_createdBy: many(invoices, {
    relationName: "invoices_createdBy_user_id",
  }),
  invoices_updatedBy: many(invoices, {
    relationName: "invoices_updatedBy_user_id",
  }),
  accounts: many(account),
  invitations: many(invitation),
  members: many(member),
  attendances_userId: many(attendance, {
    relationName: "attendance_userId_user_id",
  }),
  attendances_rejectedByUserId: many(attendance, {
    relationName: "attendance_rejectedByUserId_user_id",
  }),
  attendanceWarnings_userId: many(attendanceWarnings, {
    relationName: "attendanceWarnings_userId_user_id",
  }),
  attendanceWarnings_issuedByUserId: many(attendanceWarnings, {
    relationName: "attendanceWarnings_issuedByUserId_user_id",
  }),
  employeesDocuments_userId: many(employeesDocuments, {
    relationName: "employeesDocuments_userId_user_id",
  }),
  employeesDocuments_uploadedByUserId: many(employeesDocuments, {
    relationName: "employeesDocuments_uploadedByUserId_user_id",
  }),
  employmentHistories: many(employmentHistory),
  leaveApplications_userId: many(leaveApplications, {
    relationName: "leaveApplications_userId_user_id",
  }),
  leaveApplications_approvedByUserId: many(leaveApplications, {
    relationName: "leaveApplications_approvedByUserId_user_id",
  }),
  leaveBalances: many(leaveBalances),
  emailRecipients: many(emailRecipient),
  projectAccesses_userId: many(projectAccess, {
    relationName: "projectAccess_userId_user_id",
  }),
  projectAccesses_grantedBy: many(projectAccess, {
    relationName: "projectAccess_grantedBy_user_id",
  }),
  projects_supervisorId: many(projects, {
    relationName: "projects_supervisorId_user_id",
  }),
  projects_createdBy: many(projects, {
    relationName: "projects_createdBy_user_id",
  }),
  documentAccesses_userId: many(documentAccess, {
    relationName: "documentAccess_userId_user_id",
  }),
  documentAccesses_grantedBy: many(documentAccess, {
    relationName: "documentAccess_grantedBy_user_id",
  }),
  documentFolders: many(documentFolders),
  documentLogs: many(documentLogs),
  documentSharedLinks: many(documentSharedLink),
  documentVersions: many(documentVersions),
  notifications_userId: many(notifications, {
    relationName: "notifications_userId_user_id",
  }),
  notifications_createdBy: many(notifications, {
    relationName: "notifications_createdBy_user_id",
  }),
  notificationPreferences: many(notificationPreferences),
  taskReviews: many(taskReviews),
  taskSubmissions: many(taskSubmissions),
  tasks_assignedTo: many(tasks, {
    relationName: "tasks_assignedTo_user_id",
  }),
  tasks_assignedBy: many(tasks, {
    relationName: "tasks_assignedBy_user_id",
  }),
  taskMessages: many(taskMessages),
  taskAssignees: many(taskAssignees),
  balanceTransactions: many(balanceTransactions),
  driverAssignments: many(driverAssignments),
  drivers: many(drivers),
  fleetIncidents: many(fleetIncidents),
  fleetMaintenances: many(fleetMaintenance),
  vehicleDocuments: many(vehicleDocuments),
  vehicles: many(vehicles),
  allowances_createdByUserId: many(allowances, {
    relationName: "allowances_createdByUserId_user_id",
  }),
  allowances_updatedByUserId: many(allowances, {
    relationName: "allowances_updatedByUserId_user_id",
  }),
  deductions_createdByUserId: many(deductions, {
    relationName: "deductions_createdByUserId_user_id",
  }),
  deductions_updatedByUserId: many(deductions, {
    relationName: "deductions_updatedByUserId_user_id",
  }),
  employeeDeductions: many(employeeDeductions),
  employeeSalaries: many(employeeSalary),
  payruns_generatedByUserId: many(payrun, {
    relationName: "payrun_generatedByUserId_user_id",
  }),
  payruns_approvedByUserId: many(payrun, {
    relationName: "payrun_approvedByUserId_user_id",
  }),
  payruns_completedByUserId: many(payrun, {
    relationName: "payrun_completedByUserId_user_id",
  }),
  payrunItemDetails: many(payrunItemDetails),
  payrunItems: many(payrunItems),
  payslips: many(payslips),
  salaryStructures_createdByUserId: many(salaryStructure, {
    relationName: "salaryStructure_createdByUserId_user_id",
  }),
  salaryStructures_updatedByUserId: many(salaryStructure, {
    relationName: "salaryStructure_updatedByUserId_user_id",
  }),
  userPreferences: many(userPreferences),
  askHrQuestions_userId: many(askHrQuestions, {
    relationName: "askHrQuestions_userId_user_id",
  }),
  askHrQuestions_redirectedToUserId: many(askHrQuestions, {
    relationName: "askHrQuestions_redirectedToUserId_user_id",
  }),
  askHrResponses: many(askHrResponses),
  loanApplications_userId: many(loanApplications, {
    relationName: "loanApplications_userId_user_id",
  }),
  loanApplications_hrReviewedByUserId: many(loanApplications, {
    relationName: "loanApplications_hrReviewedByUserId_user_id",
  }),
  loanApplications_disbursedByUserId: many(loanApplications, {
    relationName: "loanApplications_disbursedByUserId_user_id",
  }),
  loanHistories: many(loanHistory),
  loanRepayments: many(loanRepayments),
  loanTypes_createdByUserId: many(loanTypes, {
    relationName: "loanTypes_createdByUserId_user_id",
  }),
  loanTypes_updatedByUserId: many(loanTypes, {
    relationName: "loanTypes_updatedByUserId_user_id",
  }),
  newsArticles: many(newsArticles),
  newsComments: many(newsComments),
  candidateDocuments: many(candidateDocuments),
  candidates_screenedBy: many(candidates, {
    relationName: "candidates_screenedBy_user_id",
  }),
  candidates_rejectedBy: many(candidates, {
    relationName: "candidates_rejectedBy_user_id",
  }),
  interviews: many(interviews),
  jobPostings: many(jobPostings),
  offers_preparedBy: many(offers, {
    relationName: "offers_preparedBy_user_id",
  }),
  offers_approvedBy: many(offers, {
    relationName: "offers_approvedBy_user_id",
  }),
  recruitmentActivityLogs: many(recruitmentActivityLog),
  assetAssignmentHistories_fromEmployeeId: many(assetAssignmentHistory, {
    relationName: "assetAssignmentHistory_fromEmployeeId_user_id",
  }),
  assetAssignmentHistories_toEmployeeId: many(assetAssignmentHistory, {
    relationName: "assetAssignmentHistory_toEmployeeId_user_id",
  }),
  assetAssignmentHistories_transferredBy: many(assetAssignmentHistory, {
    relationName: "assetAssignmentHistory_transferredBy_user_id",
  }),
  assetAssignments_employeeId: many(assetAssignments, {
    relationName: "assetAssignments_employeeId_user_id",
  }),
  assetAssignments_assignedBy: many(assetAssignments, {
    relationName: "assetAssignments_assignedBy_user_id",
  }),
  assetCategories: many(assetCategories),
  assetDocuments: many(assetDocuments),
  assetLocations: many(assetLocations),
  assetMaintenances: many(assetMaintenance),
  assetMaintenanceSchedules: many(assetMaintenanceSchedules),
  assetManagementTeams_userId: many(assetManagementTeams, {
    relationName: "assetManagementTeams_userId_user_id",
  }),
  assetManagementTeams_addedBy: many(assetManagementTeams, {
    relationName: "assetManagementTeams_addedBy_user_id",
  }),
  assetValueAdjustments: many(assetValueAdjustments),
  assets_disposedBy: many(assets, {
    relationName: "assets_disposedBy_user_id",
  }),
  assets_createdBy: many(assets, {
    relationName: "assets_createdBy_user_id",
  }),
  invoiceActivityLogs: many(invoiceActivityLog),
  invoiceDocuments: many(invoiceDocuments),
  invoicePayments: many(invoicePayments),
  billPayments: many(billPayments),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(
  organization,
  ({ one, many }) => ({
    user: one(user, {
      fields: [organization.ownerId],
      references: [user.id],
    }),
    employees: many(employees),
    employeesBanks: many(employeesBank),
    emails: many(email),
    documents: many(document),
    documentComments: many(documentComments),
    companyExpenses: many(companyExpenses),
    employeeAllowances: many(employeeAllowances),
    salaryDeductions: many(salaryDeductions),
    loanTypeSalaryStructures: many(loanTypeSalaryStructures),
    clients: many(clients),
    invoices: many(invoices),
    invitations: many(invitation),
    members: many(member),
    annualLeaveSettings: many(annualLeaveSettings),
    attendances: many(attendance),
    attendanceSettings: many(attendanceSettings),
    attendanceWarnings: many(attendanceWarnings),
    employeesDocuments: many(employeesDocuments),
    employmentHistories: many(employmentHistory),
    leaveApplications: many(leaveApplications),
    leaveBalances: many(leaveBalances),
    leaveTypes: many(leaveTypes),
    emailAttachments: many(emailAttachment),
    emailRecipients: many(emailRecipient),
    expenses: many(expenses),
    milestones: many(milestones),
    projectAccesses: many(projectAccess),
    projects: many(projects),
    documentAccesses: many(documentAccess),
    documentFolders: many(documentFolders),
    documentLogs: many(documentLogs),
    documentSharedLinks: many(documentSharedLink),
    documentTags: many(documentTags),
    documentVersions: many(documentVersions),
    notifications: many(notifications),
    notificationPreferences: many(notificationPreferences),
    payments: many(payments),
    taskReviews: many(taskReviews),
    taskSubmissions: many(taskSubmissions),
    tasks: many(tasks),
    taskMessages: many(taskMessages),
    taskAssignees: many(taskAssignees),
    taskLabelAssignments: many(taskLabelAssignments),
    taskLabels: many(taskLabels),
    balanceTransactions: many(balanceTransactions),
    companyBalances: many(companyBalance),
    driverAssignments: many(driverAssignments),
    drivers: many(drivers),
    fleetIncidents: many(fleetIncidents),
    fleetMaintenances: many(fleetMaintenance),
    vehicleDocuments: many(vehicleDocuments),
    vehicles: many(vehicles),
    allowances: many(allowances),
    deductions: many(deductions),
    employeeDeductions: many(employeeDeductions),
    employeeSalaries: many(employeeSalary),
    payruns: many(payrun),
    payrunItemDetails: many(payrunItemDetails),
    payrunItems: many(payrunItems),
    payslips: many(payslips),
    salaryAllowances: many(salaryAllowances),
    salaryStructures: many(salaryStructure),
    userPreferences: many(userPreferences),
    askHrQuestions: many(askHrQuestions),
    askHrResponses: many(askHrResponses),
    loanApplications: many(loanApplications),
    loanHistories: many(loanHistory),
    loanRepayments: many(loanRepayments),
    loanTypes: many(loanTypes),
    newsArticles: many(newsArticles),
    newsAttachments: many(newsAttachments),
    newsComments: many(newsComments),
    bugReportAttachments: many(bugReportAttachments),
    bugReports: many(bugReports),
    invoiceItems: many(invoiceItems),
    candidateDocuments: many(candidateDocuments),
    candidates: many(candidates),
    interviews: many(interviews),
    jobPostings: many(jobPostings),
    offers: many(offers),
    recruitmentActivityLogs: many(recruitmentActivityLog),
    recruitmentMetrics: many(recruitmentMetrics),
    companyBankAccounts: many(companyBankAccounts),
    invoiceMetrics: many(invoiceMetrics),
    assetAssignmentHistories: many(assetAssignmentHistory),
    assetAssignments: many(assetAssignments),
    assetCategories: many(assetCategories),
    assetDocuments: many(assetDocuments),
    assetLocations: many(assetLocations),
    assetMaintenances: many(assetMaintenance),
    assetMaintenanceSchedules: many(assetMaintenanceSchedules),
    assetManagementTeams: many(assetManagementTeams),
    assetValueAdjustments: many(assetValueAdjustments),
    assets: many(assets),
    organizationCurrencies: many(organizationCurrencies),
    invoiceActivityLogs: many(invoiceActivityLog),
    invoiceDocuments: many(invoiceDocuments),
    invoiceLineItems: many(invoiceLineItems),
    invoicePayments: many(invoicePayments),
    invoiceTaxes: many(invoiceTaxes),
    billPayments: many(billPayments),
  }),
);

export const employeesRelations = relations(employees, ({ one, many }) => ({
  organization: one(organization, {
    fields: [employees.organizationId],
    references: [organization.id],
  }),
  user_authId: one(user, {
    fields: [employees.authId],
    references: [user.id],
    relationName: "employees_authId_user_id",
  }),
  user_managerId: one(user, {
    fields: [employees.managerId],
    references: [user.id],
    relationName: "employees_managerId_user_id",
  }),
  drivers: many(drivers),
}));

export const employeesBankRelations = relations(employeesBank, ({ one }) => ({
  user: one(user, {
    fields: [employeesBank.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [employeesBank.organizationId],
    references: [organization.id],
  }),
}));

export const emailRelations = relations(email, ({ one, many }) => ({
  user: one(user, {
    fields: [email.senderId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [email.organizationId],
    references: [organization.id],
  }),
  emailAttachments: many(emailAttachment),
  emailRecipients: many(emailRecipient),
}));

export const documentRelations = relations(document, ({ one, many }) => ({
  documentFolder: one(documentFolders, {
    fields: [document.folderId],
    references: [documentFolders.id],
  }),
  user: one(user, {
    fields: [document.uploadedBy],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [document.organizationId],
    references: [organization.id],
  }),
  documentComments: many(documentComments),
  emailAttachments: many(emailAttachment),
  documentAccesses: many(documentAccess),
  documentLogs: many(documentLogs),
  documentSharedLinks: many(documentSharedLink),
  documentTags: many(documentTags),
  documentVersions: many(documentVersions),
}));

export const documentFoldersRelations = relations(
  documentFolders,
  ({ one, many }) => ({
    documents: many(document),
    user: one(user, {
      fields: [documentFolders.createdBy],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [documentFolders.organizationId],
      references: [organization.id],
    }),
    documentFolder: one(documentFolders, {
      fields: [documentFolders.parentId],
      references: [documentFolders.id],
      relationName: "documentFolders_parentId_documentFolders_id",
    }),
    documentFolders: many(documentFolders, {
      relationName: "documentFolders_parentId_documentFolders_id",
    }),
  }),
);

export const documentCommentsRelations = relations(
  documentComments,
  ({ one }) => ({
    document: one(document, {
      fields: [documentComments.documentId],
      references: [document.id],
    }),
    user: one(user, {
      fields: [documentComments.userId],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [documentComments.organizationId],
      references: [organization.id],
    }),
  }),
);

export const companyExpensesRelations = relations(
  companyExpenses,
  ({ one }) => ({
    organization: one(organization, {
      fields: [companyExpenses.organizationId],
      references: [organization.id],
    }),
    vehicle: one(vehicles, {
      fields: [companyExpenses.vehicleId],
      references: [vehicles.id],
    }),
  }),
);

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  companyExpenses: many(companyExpenses),
  driverAssignments: many(driverAssignments),
  fleetIncidents: many(fleetIncidents),
  fleetMaintenances: many(fleetMaintenance),
  vehicleDocuments: many(vehicleDocuments),
  organization: one(organization, {
    fields: [vehicles.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [vehicles.createdBy],
    references: [user.id],
  }),
}));

export const employeeAllowancesRelations = relations(
  employeeAllowances,
  ({ one }) => ({
    user: one(user, {
      fields: [employeeAllowances.userId],
      references: [user.id],
    }),
    allowance: one(allowances, {
      fields: [employeeAllowances.allowanceId],
      references: [allowances.id],
    }),
    organization: one(organization, {
      fields: [employeeAllowances.organizationId],
      references: [organization.id],
    }),
  }),
);

export const allowancesRelations = relations(allowances, ({ one, many }) => ({
  employeeAllowances: many(employeeAllowances),
  organization: one(organization, {
    fields: [allowances.organizationId],
    references: [organization.id],
  }),
  user_createdByUserId: one(user, {
    fields: [allowances.createdByUserId],
    references: [user.id],
    relationName: "allowances_createdByUserId_user_id",
  }),
  user_updatedByUserId: one(user, {
    fields: [allowances.updatedByUserId],
    references: [user.id],
    relationName: "allowances_updatedByUserId_user_id",
  }),
  payruns: many(payrun),
  payrunItemDetails: many(payrunItemDetails),
  salaryAllowances: many(salaryAllowances),
}));

export const salaryDeductionsRelations = relations(
  salaryDeductions,
  ({ one }) => ({
    organization: one(organization, {
      fields: [salaryDeductions.organizationId],
      references: [organization.id],
    }),
    salaryStructure: one(salaryStructure, {
      fields: [salaryDeductions.salaryStructureId],
      references: [salaryStructure.id],
    }),
    deduction: one(deductions, {
      fields: [salaryDeductions.deductionId],
      references: [deductions.id],
    }),
  }),
);

export const salaryStructureRelations = relations(
  salaryStructure,
  ({ one, many }) => ({
    salaryDeductions: many(salaryDeductions),
    employeeDeductions: many(employeeDeductions),
    employeeSalaries: many(employeeSalary),
    salaryAllowances: many(salaryAllowances),
    organization: one(organization, {
      fields: [salaryStructure.organizationId],
      references: [organization.id],
    }),
    user_createdByUserId: one(user, {
      fields: [salaryStructure.createdByUserId],
      references: [user.id],
      relationName: "salaryStructure_createdByUserId_user_id",
    }),
    user_updatedByUserId: one(user, {
      fields: [salaryStructure.updatedByUserId],
      references: [user.id],
      relationName: "salaryStructure_updatedByUserId_user_id",
    }),
  }),
);

export const deductionsRelations = relations(deductions, ({ one, many }) => ({
  salaryDeductions: many(salaryDeductions),
  organization: one(organization, {
    fields: [deductions.organizationId],
    references: [organization.id],
  }),
  user_createdByUserId: one(user, {
    fields: [deductions.createdByUserId],
    references: [user.id],
    relationName: "deductions_createdByUserId_user_id",
  }),
  user_updatedByUserId: one(user, {
    fields: [deductions.updatedByUserId],
    references: [user.id],
    relationName: "deductions_updatedByUserId_user_id",
  }),
  payrunItemDetails: many(payrunItemDetails),
}));

export const subscriptionsInvoicesRelations = relations(
  subscriptionsInvoices,
  ({ one, many }) => ({
    subscription: one(subscriptions, {
      fields: [subscriptionsInvoices.subscriptionId],
      references: [subscriptions.id],
    }),
    invoiceItems: many(invoiceItems),
  }),
);

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one, many }) => ({
    subscriptionsInvoices: many(subscriptionsInvoices),
    user: one(user, {
      fields: [subscriptions.userId],
      references: [user.id],
    }),
  }),
);

export const loanTypeSalaryStructuresRelations = relations(
  loanTypeSalaryStructures,
  ({ one }) => ({
    loanType: one(loanTypes, {
      fields: [loanTypeSalaryStructures.loanTypeId],
      references: [loanTypes.id],
    }),
    organization: one(organization, {
      fields: [loanTypeSalaryStructures.organizationId],
      references: [organization.id],
    }),
  }),
);

export const loanTypesRelations = relations(loanTypes, ({ one, many }) => ({
  loanTypeSalaryStructures: many(loanTypeSalaryStructures),
  loanApplications: many(loanApplications),
  organization: one(organization, {
    fields: [loanTypes.organizationId],
    references: [organization.id],
  }),
  user_createdByUserId: one(user, {
    fields: [loanTypes.createdByUserId],
    references: [user.id],
    relationName: "loanTypes_createdByUserId_user_id",
  }),
  user_updatedByUserId: one(user, {
    fields: [loanTypes.updatedByUserId],
    references: [user.id],
    relationName: "loanTypes_updatedByUserId_user_id",
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  organization: one(organization, {
    fields: [clients.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [clients.createdBy],
    references: [user.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  companyBankAccount: one(companyBankAccounts, {
    fields: [invoices.bankAccountId],
    references: [companyBankAccounts.id],
  }),
  organizationCurrency: one(organizationCurrencies, {
    fields: [invoices.currencyId],
    references: [organizationCurrencies.id],
  }),
  organization: one(organization, {
    fields: [invoices.organizationId],
    references: [organization.id],
  }),
  user_createdBy: one(user, {
    fields: [invoices.createdBy],
    references: [user.id],
    relationName: "invoices_createdBy_user_id",
  }),
  user_updatedBy: one(user, {
    fields: [invoices.updatedBy],
    references: [user.id],
    relationName: "invoices_updatedBy_user_id",
  }),
  invoiceActivityLogs: many(invoiceActivityLog),
  invoiceDocuments: many(invoiceDocuments),
  invoiceLineItems: many(invoiceLineItems),
  invoicePayments: many(invoicePayments),
  invoiceTaxes: many(invoiceTaxes),
}));

export const companyBankAccountsRelations = relations(
  companyBankAccounts,
  ({ one, many }) => ({
    invoices: many(invoices),
    organization: one(organization, {
      fields: [companyBankAccounts.organizationId],
      references: [organization.id],
    }),
    billPayments: many(billPayments),
  }),
);

export const organizationCurrenciesRelations = relations(
  organizationCurrencies,
  ({ one, many }) => ({
    invoices: many(invoices),
    organization: one(organization, {
      fields: [organizationCurrencies.organizationId],
      references: [organization.id],
    }),
  }),
);

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const memberRelations = relations(member, ({ one, many }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
  invoiceItems: many(invoiceItems),
}));

export const annualLeaveSettingsRelations = relations(
  annualLeaveSettings,
  ({ one }) => ({
    organization: one(organization, {
      fields: [annualLeaveSettings.organizationId],
      references: [organization.id],
    }),
  }),
);

export const attendanceRelations = relations(attendance, ({ one, many }) => ({
  user_userId: one(user, {
    fields: [attendance.userId],
    references: [user.id],
    relationName: "attendance_userId_user_id",
  }),
  organization: one(organization, {
    fields: [attendance.organizationId],
    references: [organization.id],
  }),
  user_rejectedByUserId: one(user, {
    fields: [attendance.rejectedByUserId],
    references: [user.id],
    relationName: "attendance_rejectedByUserId_user_id",
  }),
  attendanceWarnings: many(attendanceWarnings),
}));

export const attendanceSettingsRelations = relations(
  attendanceSettings,
  ({ one }) => ({
    organization: one(organization, {
      fields: [attendanceSettings.organizationId],
      references: [organization.id],
    }),
  }),
);

export const attendanceWarningsRelations = relations(
  attendanceWarnings,
  ({ one }) => ({
    attendance: one(attendance, {
      fields: [attendanceWarnings.attendanceId],
      references: [attendance.id],
    }),
    user_userId: one(user, {
      fields: [attendanceWarnings.userId],
      references: [user.id],
      relationName: "attendanceWarnings_userId_user_id",
    }),
    user_issuedByUserId: one(user, {
      fields: [attendanceWarnings.issuedByUserId],
      references: [user.id],
      relationName: "attendanceWarnings_issuedByUserId_user_id",
    }),
    organization: one(organization, {
      fields: [attendanceWarnings.organizationId],
      references: [organization.id],
    }),
  }),
);

export const employeesDocumentsRelations = relations(
  employeesDocuments,
  ({ one }) => ({
    user_userId: one(user, {
      fields: [employeesDocuments.userId],
      references: [user.id],
      relationName: "employeesDocuments_userId_user_id",
    }),
    organization: one(organization, {
      fields: [employeesDocuments.organizationId],
      references: [organization.id],
    }),
    user_uploadedByUserId: one(user, {
      fields: [employeesDocuments.uploadedByUserId],
      references: [user.id],
      relationName: "employeesDocuments_uploadedByUserId_user_id",
    }),
  }),
);

export const employmentHistoryRelations = relations(
  employmentHistory,
  ({ one }) => ({
    user: one(user, {
      fields: [employmentHistory.userId],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [employmentHistory.organizationId],
      references: [organization.id],
    }),
  }),
);

export const leaveApplicationsRelations = relations(
  leaveApplications,
  ({ one }) => ({
    user_userId: one(user, {
      fields: [leaveApplications.userId],
      references: [user.id],
      relationName: "leaveApplications_userId_user_id",
    }),
    organization: one(organization, {
      fields: [leaveApplications.organizationId],
      references: [organization.id],
    }),
    user_approvedByUserId: one(user, {
      fields: [leaveApplications.approvedByUserId],
      references: [user.id],
      relationName: "leaveApplications_approvedByUserId_user_id",
    }),
  }),
);

export const leaveBalancesRelations = relations(leaveBalances, ({ one }) => ({
  user: one(user, {
    fields: [leaveBalances.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [leaveBalances.organizationId],
    references: [organization.id],
  }),
}));

export const leaveTypesRelations = relations(leaveTypes, ({ one }) => ({
  organization: one(organization, {
    fields: [leaveTypes.organizationId],
    references: [organization.id],
  }),
}));

export const emailAttachmentRelations = relations(
  emailAttachment,
  ({ one }) => ({
    email: one(email, {
      fields: [emailAttachment.emailId],
      references: [email.id],
    }),
    document: one(document, {
      fields: [emailAttachment.documentId],
      references: [document.id],
    }),
    organization: one(organization, {
      fields: [emailAttachment.organizationId],
      references: [organization.id],
    }),
  }),
);

export const emailRecipientRelations = relations(emailRecipient, ({ one }) => ({
  email: one(email, {
    fields: [emailRecipient.emailId],
    references: [email.id],
  }),
  user: one(user, {
    fields: [emailRecipient.recipientId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [emailRecipient.organizationId],
    references: [organization.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  project: one(projects, {
    fields: [expenses.projectId],
    references: [projects.id],
  }),
  organization: one(organization, {
    fields: [expenses.organizationId],
    references: [organization.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  expenses: many(expenses),
  milestones: many(milestones),
  projectAccesses: many(projectAccess),
  user_supervisorId: one(user, {
    fields: [projects.supervisorId],
    references: [user.id],
    relationName: "projects_supervisorId_user_id",
  }),
  user_createdBy: one(user, {
    fields: [projects.createdBy],
    references: [user.id],
    relationName: "projects_createdBy_user_id",
  }),
  organization: one(organization, {
    fields: [projects.organizationId],
    references: [organization.id],
  }),
  assetAssignmentHistories_fromProjectId: many(assetAssignmentHistory, {
    relationName: "assetAssignmentHistory_fromProjectId_projects_id",
  }),
  assetAssignmentHistories_toProjectId: many(assetAssignmentHistory, {
    relationName: "assetAssignmentHistory_toProjectId_projects_id",
  }),
  assetAssignments: many(assetAssignments),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  project: one(projects, {
    fields: [milestones.projectId],
    references: [projects.id],
  }),
  organization: one(organization, {
    fields: [milestones.organizationId],
    references: [organization.id],
  }),
}));

export const projectAccessRelations = relations(projectAccess, ({ one }) => ({
  project: one(projects, {
    fields: [projectAccess.projectId],
    references: [projects.id],
  }),
  user_userId: one(user, {
    fields: [projectAccess.userId],
    references: [user.id],
    relationName: "projectAccess_userId_user_id",
  }),
  user_grantedBy: one(user, {
    fields: [projectAccess.grantedBy],
    references: [user.id],
    relationName: "projectAccess_grantedBy_user_id",
  }),
  organization: one(organization, {
    fields: [projectAccess.organizationId],
    references: [organization.id],
  }),
}));

export const documentAccessRelations = relations(documentAccess, ({ one }) => ({
  document: one(document, {
    fields: [documentAccess.documentId],
    references: [document.id],
  }),
  user_userId: one(user, {
    fields: [documentAccess.userId],
    references: [user.id],
    relationName: "documentAccess_userId_user_id",
  }),
  user_grantedBy: one(user, {
    fields: [documentAccess.grantedBy],
    references: [user.id],
    relationName: "documentAccess_grantedBy_user_id",
  }),
  organization: one(organization, {
    fields: [documentAccess.organizationId],
    references: [organization.id],
  }),
}));

export const documentLogsRelations = relations(documentLogs, ({ one }) => ({
  user: one(user, {
    fields: [documentLogs.userId],
    references: [user.id],
  }),
  document: one(document, {
    fields: [documentLogs.documentId],
    references: [document.id],
  }),
  documentVersion: one(documentVersions, {
    fields: [documentLogs.documentVersionId],
    references: [documentVersions.id],
  }),
  organization: one(organization, {
    fields: [documentLogs.organizationId],
    references: [organization.id],
  }),
}));

export const documentVersionsRelations = relations(
  documentVersions,
  ({ one, many }) => ({
    documentLogs: many(documentLogs),
    document: one(document, {
      fields: [documentVersions.documentId],
      references: [document.id],
    }),
    user: one(user, {
      fields: [documentVersions.uploadedBy],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [documentVersions.organizationId],
      references: [organization.id],
    }),
  }),
);

export const documentSharedLinkRelations = relations(
  documentSharedLink,
  ({ one }) => ({
    document: one(document, {
      fields: [documentSharedLink.documentId],
      references: [document.id],
    }),
    user: one(user, {
      fields: [documentSharedLink.createdBy],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [documentSharedLink.organizationId],
      references: [organization.id],
    }),
  }),
);

export const documentTagsRelations = relations(documentTags, ({ one }) => ({
  document: one(document, {
    fields: [documentTags.documentId],
    references: [document.id],
  }),
  organization: one(organization, {
    fields: [documentTags.organizationId],
    references: [organization.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user_userId: one(user, {
    fields: [notifications.userId],
    references: [user.id],
    relationName: "notifications_userId_user_id",
  }),
  organization: one(organization, {
    fields: [notifications.organizationId],
    references: [organization.id],
  }),
  user_createdBy: one(user, {
    fields: [notifications.createdBy],
    references: [user.id],
    relationName: "notifications_createdBy_user_id",
  }),
}));

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ one }) => ({
    user: one(user, {
      fields: [notificationPreferences.userId],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [notificationPreferences.organizationId],
      references: [organization.id],
    }),
  }),
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  organization: one(organization, {
    fields: [payments.organizationId],
    references: [organization.id],
  }),
}));

export const taskReviewsRelations = relations(taskReviews, ({ one }) => ({
  task: one(tasks, {
    fields: [taskReviews.taskId],
    references: [tasks.id],
  }),
  taskSubmission: one(taskSubmissions, {
    fields: [taskReviews.submissionId],
    references: [taskSubmissions.id],
  }),
  user: one(user, {
    fields: [taskReviews.reviewedBy],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [taskReviews.organizationId],
    references: [organization.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  taskReviews: many(taskReviews),
  taskSubmissions: many(taskSubmissions),
  user_assignedTo: one(user, {
    fields: [tasks.assignedTo],
    references: [user.id],
    relationName: "tasks_assignedTo_user_id",
  }),
  user_assignedBy: one(user, {
    fields: [tasks.assignedBy],
    references: [user.id],
    relationName: "tasks_assignedBy_user_id",
  }),
  organization: one(organization, {
    fields: [tasks.organizationId],
    references: [organization.id],
  }),
  taskMessages: many(taskMessages),
  taskAssignees: many(taskAssignees),
  taskLabelAssignments: many(taskLabelAssignments),
}));

export const taskSubmissionsRelations = relations(
  taskSubmissions,
  ({ one, many }) => ({
    taskReviews: many(taskReviews),
    task: one(tasks, {
      fields: [taskSubmissions.taskId],
      references: [tasks.id],
    }),
    user: one(user, {
      fields: [taskSubmissions.submittedBy],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [taskSubmissions.organizationId],
      references: [organization.id],
    }),
  }),
);

export const taskMessagesRelations = relations(taskMessages, ({ one }) => ({
  task: one(tasks, {
    fields: [taskMessages.taskId],
    references: [tasks.id],
  }),
  user: one(user, {
    fields: [taskMessages.senderId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [taskMessages.organizationId],
    references: [organization.id],
  }),
}));

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignees.taskId],
    references: [tasks.id],
  }),
  user: one(user, {
    fields: [taskAssignees.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [taskAssignees.organizationId],
    references: [organization.id],
  }),
}));

export const taskLabelAssignmentsRelations = relations(
  taskLabelAssignments,
  ({ one }) => ({
    task: one(tasks, {
      fields: [taskLabelAssignments.taskId],
      references: [tasks.id],
    }),
    taskLabel: one(taskLabels, {
      fields: [taskLabelAssignments.labelId],
      references: [taskLabels.id],
    }),
    organization: one(organization, {
      fields: [taskLabelAssignments.organizationId],
      references: [organization.id],
    }),
  }),
);

export const taskLabelsRelations = relations(taskLabels, ({ one, many }) => ({
  taskLabelAssignments: many(taskLabelAssignments),
  organization: one(organization, {
    fields: [taskLabels.organizationId],
    references: [organization.id],
  }),
}));

export const balanceTransactionsRelations = relations(
  balanceTransactions,
  ({ one }) => ({
    user: one(user, {
      fields: [balanceTransactions.userId],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [balanceTransactions.organizationId],
      references: [organization.id],
    }),
  }),
);

export const companyBalanceRelations = relations(companyBalance, ({ one }) => ({
  organization: one(organization, {
    fields: [companyBalance.organizationId],
    references: [organization.id],
  }),
}));

export const driverAssignmentsRelations = relations(
  driverAssignments,
  ({ one }) => ({
    organization: one(organization, {
      fields: [driverAssignments.organizationId],
      references: [organization.id],
    }),
    driver: one(drivers, {
      fields: [driverAssignments.driverId],
      references: [drivers.id],
    }),
    vehicle: one(vehicles, {
      fields: [driverAssignments.vehicleId],
      references: [vehicles.id],
    }),
    user: one(user, {
      fields: [driverAssignments.assignedBy],
      references: [user.id],
    }),
  }),
);

export const driversRelations = relations(drivers, ({ one, many }) => ({
  driverAssignments: many(driverAssignments),
  organization: one(organization, {
    fields: [drivers.organizationId],
    references: [organization.id],
  }),
  employee: one(employees, {
    fields: [drivers.employeeId],
    references: [employees.id],
  }),
  user: one(user, {
    fields: [drivers.createdBy],
    references: [user.id],
  }),
  fleetIncidents: many(fleetIncidents),
}));

export const fleetIncidentsRelations = relations(fleetIncidents, ({ one }) => ({
  organization: one(organization, {
    fields: [fleetIncidents.organizationId],
    references: [organization.id],
  }),
  vehicle: one(vehicles, {
    fields: [fleetIncidents.vehicleId],
    references: [vehicles.id],
  }),
  driver: one(drivers, {
    fields: [fleetIncidents.driverId],
    references: [drivers.id],
  }),
  user: one(user, {
    fields: [fleetIncidents.reportedBy],
    references: [user.id],
  }),
}));

export const fleetMaintenanceRelations = relations(
  fleetMaintenance,
  ({ one }) => ({
    organization: one(organization, {
      fields: [fleetMaintenance.organizationId],
      references: [organization.id],
    }),
    vehicle: one(vehicles, {
      fields: [fleetMaintenance.vehicleId],
      references: [vehicles.id],
    }),
    user: one(user, {
      fields: [fleetMaintenance.createdBy],
      references: [user.id],
    }),
  }),
);

export const vehicleDocumentsRelations = relations(
  vehicleDocuments,
  ({ one }) => ({
    organization: one(organization, {
      fields: [vehicleDocuments.organizationId],
      references: [organization.id],
    }),
    vehicle: one(vehicles, {
      fields: [vehicleDocuments.vehicleId],
      references: [vehicles.id],
    }),
    user: one(user, {
      fields: [vehicleDocuments.uploadedBy],
      references: [user.id],
    }),
  }),
);

export const employeeDeductionsRelations = relations(
  employeeDeductions,
  ({ one }) => ({
    organization: one(organization, {
      fields: [employeeDeductions.organizationId],
      references: [organization.id],
    }),
    user: one(user, {
      fields: [employeeDeductions.userId],
      references: [user.id],
    }),
    salaryStructure: one(salaryStructure, {
      fields: [employeeDeductions.salaryStructureId],
      references: [salaryStructure.id],
    }),
  }),
);

export const employeeSalaryRelations = relations(employeeSalary, ({ one }) => ({
  organization: one(organization, {
    fields: [employeeSalary.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [employeeSalary.userId],
    references: [user.id],
  }),
  salaryStructure: one(salaryStructure, {
    fields: [employeeSalary.salaryStructureId],
    references: [salaryStructure.id],
  }),
}));

export const payrunRelations = relations(payrun, ({ one, many }) => ({
  organization: one(organization, {
    fields: [payrun.organizationId],
    references: [organization.id],
  }),
  allowance: one(allowances, {
    fields: [payrun.allowanceId],
    references: [allowances.id],
  }),
  user_generatedByUserId: one(user, {
    fields: [payrun.generatedByUserId],
    references: [user.id],
    relationName: "payrun_generatedByUserId_user_id",
  }),
  user_approvedByUserId: one(user, {
    fields: [payrun.approvedByUserId],
    references: [user.id],
    relationName: "payrun_approvedByUserId_user_id",
  }),
  user_completedByUserId: one(user, {
    fields: [payrun.completedByUserId],
    references: [user.id],
    relationName: "payrun_completedByUserId_user_id",
  }),
  payrunItems: many(payrunItems),
}));

export const payrunItemDetailsRelations = relations(
  payrunItemDetails,
  ({ one }) => ({
    organization: one(organization, {
      fields: [payrunItemDetails.organizationId],
      references: [organization.id],
    }),
    payrunItem: one(payrunItems, {
      fields: [payrunItemDetails.payrunItemId],
      references: [payrunItems.id],
    }),
    user: one(user, {
      fields: [payrunItemDetails.userId],
      references: [user.id],
    }),
    allowance: one(allowances, {
      fields: [payrunItemDetails.allowanceId],
      references: [allowances.id],
    }),
    deduction: one(deductions, {
      fields: [payrunItemDetails.deductionId],
      references: [deductions.id],
    }),
  }),
);

export const payrunItemsRelations = relations(payrunItems, ({ one, many }) => ({
  payrunItemDetails: many(payrunItemDetails),
  organization: one(organization, {
    fields: [payrunItems.organizationId],
    references: [organization.id],
  }),
  payrun: one(payrun, {
    fields: [payrunItems.payrunId],
    references: [payrun.id],
  }),
  user: one(user, {
    fields: [payrunItems.userId],
    references: [user.id],
  }),
  payslips: many(payslips),
}));

export const payslipsRelations = relations(payslips, ({ one }) => ({
  organization: one(organization, {
    fields: [payslips.organizationId],
    references: [organization.id],
  }),
  payrunItem: one(payrunItems, {
    fields: [payslips.payrollItemId],
    references: [payrunItems.id],
  }),
  user: one(user, {
    fields: [payslips.userId],
    references: [user.id],
  }),
}));

export const salaryAllowancesRelations = relations(
  salaryAllowances,
  ({ one }) => ({
    salaryStructure: one(salaryStructure, {
      fields: [salaryAllowances.salaryStructureId],
      references: [salaryStructure.id],
    }),
    allowance: one(allowances, {
      fields: [salaryAllowances.allowanceId],
      references: [allowances.id],
    }),
    organization: one(organization, {
      fields: [salaryAllowances.organizationId],
      references: [organization.id],
    }),
  }),
);

export const userPreferencesRelations = relations(
  userPreferences,
  ({ one }) => ({
    user: one(user, {
      fields: [userPreferences.userId],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [userPreferences.organizationId],
      references: [organization.id],
    }),
  }),
);

export const askHrQuestionsRelations = relations(
  askHrQuestions,
  ({ one, many }) => ({
    user_userId: one(user, {
      fields: [askHrQuestions.userId],
      references: [user.id],
      relationName: "askHrQuestions_userId_user_id",
    }),
    organization: one(organization, {
      fields: [askHrQuestions.organizationId],
      references: [organization.id],
    }),
    user_redirectedToUserId: one(user, {
      fields: [askHrQuestions.redirectedToUserId],
      references: [user.id],
      relationName: "askHrQuestions_redirectedToUserId_user_id",
    }),
    askHrResponses: many(askHrResponses),
  }),
);

export const askHrResponsesRelations = relations(askHrResponses, ({ one }) => ({
  askHrQuestion: one(askHrQuestions, {
    fields: [askHrResponses.questionId],
    references: [askHrQuestions.id],
  }),
  user: one(user, {
    fields: [askHrResponses.respondentUserId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [askHrResponses.organizationId],
    references: [organization.id],
  }),
}));

export const loanApplicationsRelations = relations(
  loanApplications,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [loanApplications.organizationId],
      references: [organization.id],
    }),
    user_userId: one(user, {
      fields: [loanApplications.userId],
      references: [user.id],
      relationName: "loanApplications_userId_user_id",
    }),
    loanType: one(loanTypes, {
      fields: [loanApplications.loanTypeId],
      references: [loanTypes.id],
    }),
    user_hrReviewedByUserId: one(user, {
      fields: [loanApplications.hrReviewedByUserId],
      references: [user.id],
      relationName: "loanApplications_hrReviewedByUserId_user_id",
    }),
    user_disbursedByUserId: one(user, {
      fields: [loanApplications.disbursedByUserId],
      references: [user.id],
      relationName: "loanApplications_disbursedByUserId_user_id",
    }),
    loanHistories: many(loanHistory),
    loanRepayments: many(loanRepayments),
  }),
);

export const loanHistoryRelations = relations(loanHistory, ({ one }) => ({
  organization: one(organization, {
    fields: [loanHistory.organizationId],
    references: [organization.id],
  }),
  loanApplication: one(loanApplications, {
    fields: [loanHistory.loanApplicationId],
    references: [loanApplications.id],
  }),
  user: one(user, {
    fields: [loanHistory.performedByUserId],
    references: [user.id],
  }),
}));

export const loanRepaymentsRelations = relations(loanRepayments, ({ one }) => ({
  organization: one(organization, {
    fields: [loanRepayments.organizationId],
    references: [organization.id],
  }),
  loanApplication: one(loanApplications, {
    fields: [loanRepayments.loanApplicationId],
    references: [loanApplications.id],
  }),
  user: one(user, {
    fields: [loanRepayments.userId],
    references: [user.id],
  }),
}));

export const newsArticlesRelations = relations(
  newsArticles,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [newsArticles.organizationId],
      references: [organization.id],
    }),
    user: one(user, {
      fields: [newsArticles.authorId],
      references: [user.id],
    }),
    newsAttachments: many(newsAttachments),
    newsComments: many(newsComments),
  }),
);

export const newsAttachmentsRelations = relations(
  newsAttachments,
  ({ one }) => ({
    organization: one(organization, {
      fields: [newsAttachments.organizationId],
      references: [organization.id],
    }),
    newsArticle: one(newsArticles, {
      fields: [newsAttachments.articleId],
      references: [newsArticles.id],
    }),
  }),
);

export const newsCommentsRelations = relations(newsComments, ({ one }) => ({
  organization: one(organization, {
    fields: [newsComments.organizationId],
    references: [organization.id],
  }),
  newsArticle: one(newsArticles, {
    fields: [newsComments.articleId],
    references: [newsArticles.id],
  }),
  user: one(user, {
    fields: [newsComments.userId],
    references: [user.id],
  }),
}));

export const bugReportAttachmentsRelations = relations(
  bugReportAttachments,
  ({ one }) => ({
    bugReport: one(bugReports, {
      fields: [bugReportAttachments.bugReportId],
      references: [bugReports.id],
    }),
    organization: one(organization, {
      fields: [bugReportAttachments.organizationId],
      references: [organization.id],
    }),
  }),
);

export const bugReportsRelations = relations(bugReports, ({ one, many }) => ({
  bugReportAttachments: many(bugReportAttachments),
  organization: one(organization, {
    fields: [bugReports.organizationId],
    references: [organization.id],
  }),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  subscriptionsInvoice: one(subscriptionsInvoices, {
    fields: [invoiceItems.invoiceId],
    references: [subscriptionsInvoices.id],
  }),
  member: one(member, {
    fields: [invoiceItems.memberId],
    references: [member.id],
  }),
  organization: one(organization, {
    fields: [invoiceItems.organizationId],
    references: [organization.id],
  }),
}));

export const candidateDocumentsRelations = relations(
  candidateDocuments,
  ({ one }) => ({
    candidate: one(candidates, {
      fields: [candidateDocuments.candidateId],
      references: [candidates.id],
    }),
    user: one(user, {
      fields: [candidateDocuments.uploadedBy],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [candidateDocuments.organizationId],
      references: [organization.id],
    }),
  }),
);

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  candidateDocuments: many(candidateDocuments),
  jobPosting: one(jobPostings, {
    fields: [candidates.jobPostingId],
    references: [jobPostings.id],
  }),
  user_screenedBy: one(user, {
    fields: [candidates.screenedBy],
    references: [user.id],
    relationName: "candidates_screenedBy_user_id",
  }),
  user_rejectedBy: one(user, {
    fields: [candidates.rejectedBy],
    references: [user.id],
    relationName: "candidates_rejectedBy_user_id",
  }),
  organization: one(organization, {
    fields: [candidates.organizationId],
    references: [organization.id],
  }),
  interviews: many(interviews),
  offers: many(offers),
  recruitmentActivityLogs: many(recruitmentActivityLog),
}));

export const jobPostingsRelations = relations(jobPostings, ({ one, many }) => ({
  candidates: many(candidates),
  user: one(user, {
    fields: [jobPostings.postedBy],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [jobPostings.organizationId],
    references: [organization.id],
  }),
  offers: many(offers),
  recruitmentMetrics: many(recruitmentMetrics),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  candidate: one(candidates, {
    fields: [interviews.candidateId],
    references: [candidates.id],
  }),
  user: one(user, {
    fields: [interviews.scheduledBy],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [interviews.organizationId],
    references: [organization.id],
  }),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  candidate: one(candidates, {
    fields: [offers.candidateId],
    references: [candidates.id],
  }),
  jobPosting: one(jobPostings, {
    fields: [offers.jobPostingId],
    references: [jobPostings.id],
  }),
  user_preparedBy: one(user, {
    fields: [offers.preparedBy],
    references: [user.id],
    relationName: "offers_preparedBy_user_id",
  }),
  user_approvedBy: one(user, {
    fields: [offers.approvedBy],
    references: [user.id],
    relationName: "offers_approvedBy_user_id",
  }),
  organization: one(organization, {
    fields: [offers.organizationId],
    references: [organization.id],
  }),
}));

export const recruitmentActivityLogRelations = relations(
  recruitmentActivityLog,
  ({ one }) => ({
    candidate: one(candidates, {
      fields: [recruitmentActivityLog.candidateId],
      references: [candidates.id],
    }),
    user: one(user, {
      fields: [recruitmentActivityLog.performedBy],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [recruitmentActivityLog.organizationId],
      references: [organization.id],
    }),
  }),
);

export const recruitmentMetricsRelations = relations(
  recruitmentMetrics,
  ({ one }) => ({
    jobPosting: one(jobPostings, {
      fields: [recruitmentMetrics.jobPostingId],
      references: [jobPostings.id],
    }),
    organization: one(organization, {
      fields: [recruitmentMetrics.organizationId],
      references: [organization.id],
    }),
  }),
);

export const invoiceMetricsRelations = relations(invoiceMetrics, ({ one }) => ({
  organization: one(organization, {
    fields: [invoiceMetrics.organizationId],
    references: [organization.id],
  }),
}));

export const assetAssignmentHistoryRelations = relations(
  assetAssignmentHistory,
  ({ one }) => ({
    organization: one(organization, {
      fields: [assetAssignmentHistory.organizationId],
      references: [organization.id],
    }),
    asset: one(assets, {
      fields: [assetAssignmentHistory.assetId],
      references: [assets.id],
    }),
    user_fromEmployeeId: one(user, {
      fields: [assetAssignmentHistory.fromEmployeeId],
      references: [user.id],
      relationName: "assetAssignmentHistory_fromEmployeeId_user_id",
    }),
    project_fromProjectId: one(projects, {
      fields: [assetAssignmentHistory.fromProjectId],
      references: [projects.id],
      relationName: "assetAssignmentHistory_fromProjectId_projects_id",
    }),
    user_toEmployeeId: one(user, {
      fields: [assetAssignmentHistory.toEmployeeId],
      references: [user.id],
      relationName: "assetAssignmentHistory_toEmployeeId_user_id",
    }),
    project_toProjectId: one(projects, {
      fields: [assetAssignmentHistory.toProjectId],
      references: [projects.id],
      relationName: "assetAssignmentHistory_toProjectId_projects_id",
    }),
    user_transferredBy: one(user, {
      fields: [assetAssignmentHistory.transferredBy],
      references: [user.id],
      relationName: "assetAssignmentHistory_transferredBy_user_id",
    }),
  }),
);

export const assetsRelations = relations(assets, ({ one, many }) => ({
  assetAssignmentHistories: many(assetAssignmentHistory),
  assetAssignments: many(assetAssignments),
  assetDocuments: many(assetDocuments),
  assetMaintenances: many(assetMaintenance),
  assetMaintenanceSchedules: many(assetMaintenanceSchedules),
  assetValueAdjustments: many(assetValueAdjustments),
  organization: one(organization, {
    fields: [assets.organizationId],
    references: [organization.id],
  }),
  assetCategory: one(assetCategories, {
    fields: [assets.categoryId],
    references: [assetCategories.id],
  }),
  assetLocation: one(assetLocations, {
    fields: [assets.locationId],
    references: [assetLocations.id],
  }),
  user_disposedBy: one(user, {
    fields: [assets.disposedBy],
    references: [user.id],
    relationName: "assets_disposedBy_user_id",
  }),
  user_createdBy: one(user, {
    fields: [assets.createdBy],
    references: [user.id],
    relationName: "assets_createdBy_user_id",
  }),
}));

export const assetAssignmentsRelations = relations(
  assetAssignments,
  ({ one }) => ({
    organization: one(organization, {
      fields: [assetAssignments.organizationId],
      references: [organization.id],
    }),
    asset: one(assets, {
      fields: [assetAssignments.assetId],
      references: [assets.id],
    }),
    user_employeeId: one(user, {
      fields: [assetAssignments.employeeId],
      references: [user.id],
      relationName: "assetAssignments_employeeId_user_id",
    }),
    project: one(projects, {
      fields: [assetAssignments.projectId],
      references: [projects.id],
    }),
    user_assignedBy: one(user, {
      fields: [assetAssignments.assignedBy],
      references: [user.id],
      relationName: "assetAssignments_assignedBy_user_id",
    }),
  }),
);

export const assetCategoriesRelations = relations(
  assetCategories,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [assetCategories.organizationId],
      references: [organization.id],
    }),
    user: one(user, {
      fields: [assetCategories.createdBy],
      references: [user.id],
    }),
    assets: many(assets),
  }),
);

export const assetDocumentsRelations = relations(assetDocuments, ({ one }) => ({
  organization: one(organization, {
    fields: [assetDocuments.organizationId],
    references: [organization.id],
  }),
  asset: one(assets, {
    fields: [assetDocuments.assetId],
    references: [assets.id],
  }),
  user: one(user, {
    fields: [assetDocuments.uploadedBy],
    references: [user.id],
  }),
}));

export const assetLocationsRelations = relations(
  assetLocations,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [assetLocations.organizationId],
      references: [organization.id],
    }),
    user: one(user, {
      fields: [assetLocations.createdBy],
      references: [user.id],
    }),
    assets: many(assets),
  }),
);

export const assetMaintenanceRelations = relations(
  assetMaintenance,
  ({ one }) => ({
    organization: one(organization, {
      fields: [assetMaintenance.organizationId],
      references: [organization.id],
    }),
    asset: one(assets, {
      fields: [assetMaintenance.assetId],
      references: [assets.id],
    }),
    assetMaintenanceSchedule: one(assetMaintenanceSchedules, {
      fields: [assetMaintenance.scheduleId],
      references: [assetMaintenanceSchedules.id],
    }),
    user: one(user, {
      fields: [assetMaintenance.createdBy],
      references: [user.id],
    }),
  }),
);

export const assetMaintenanceSchedulesRelations = relations(
  assetMaintenanceSchedules,
  ({ one, many }) => ({
    assetMaintenances: many(assetMaintenance),
    organization: one(organization, {
      fields: [assetMaintenanceSchedules.organizationId],
      references: [organization.id],
    }),
    asset: one(assets, {
      fields: [assetMaintenanceSchedules.assetId],
      references: [assets.id],
    }),
    user: one(user, {
      fields: [assetMaintenanceSchedules.createdBy],
      references: [user.id],
    }),
  }),
);

export const assetManagementTeamsRelations = relations(
  assetManagementTeams,
  ({ one }) => ({
    organization: one(organization, {
      fields: [assetManagementTeams.organizationId],
      references: [organization.id],
    }),
    user_userId: one(user, {
      fields: [assetManagementTeams.userId],
      references: [user.id],
      relationName: "assetManagementTeams_userId_user_id",
    }),
    user_addedBy: one(user, {
      fields: [assetManagementTeams.addedBy],
      references: [user.id],
      relationName: "assetManagementTeams_addedBy_user_id",
    }),
  }),
);

export const assetValueAdjustmentsRelations = relations(
  assetValueAdjustments,
  ({ one }) => ({
    organization: one(organization, {
      fields: [assetValueAdjustments.organizationId],
      references: [organization.id],
    }),
    asset: one(assets, {
      fields: [assetValueAdjustments.assetId],
      references: [assets.id],
    }),
    user: one(user, {
      fields: [assetValueAdjustments.adjustedBy],
      references: [user.id],
    }),
  }),
);

export const invoiceActivityLogRelations = relations(
  invoiceActivityLog,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [invoiceActivityLog.invoiceId],
      references: [invoices.id],
    }),
    user: one(user, {
      fields: [invoiceActivityLog.performedBy],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [invoiceActivityLog.organizationId],
      references: [organization.id],
    }),
  }),
);

export const invoiceDocumentsRelations = relations(
  invoiceDocuments,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [invoiceDocuments.invoiceId],
      references: [invoices.id],
    }),
    user: one(user, {
      fields: [invoiceDocuments.uploadedBy],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [invoiceDocuments.organizationId],
      references: [organization.id],
    }),
  }),
);

export const invoiceLineItemsRelations = relations(
  invoiceLineItems,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [invoiceLineItems.invoiceId],
      references: [invoices.id],
    }),
    organization: one(organization, {
      fields: [invoiceLineItems.organizationId],
      references: [organization.id],
    }),
  }),
);

export const invoicePaymentsRelations = relations(
  invoicePayments,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [invoicePayments.invoiceId],
      references: [invoices.id],
    }),
    user: one(user, {
      fields: [invoicePayments.recordedBy],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [invoicePayments.organizationId],
      references: [organization.id],
    }),
  }),
);

export const invoiceTaxesRelations = relations(invoiceTaxes, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceTaxes.invoiceId],
    references: [invoices.id],
  }),
  organization: one(organization, {
    fields: [invoiceTaxes.organizationId],
    references: [organization.id],
  }),
}));

export const billPaymentsRelations = relations(billPayments, ({ one }) => ({
  companyBankAccount: one(companyBankAccounts, {
    fields: [billPayments.bankAccountId],
    references: [companyBankAccounts.id],
  }),
  user: one(user, {
    fields: [billPayments.recordedBy],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [billPayments.organizationId],
    references: [organization.id],
  }),
}));

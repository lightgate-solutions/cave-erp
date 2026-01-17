import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  index,
  integer,
  serial,
  numeric,
  pgEnum,
  date,
  boolean,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";
import { projects } from "./projects";

// ============================================
// ENUMS
// ============================================

export const assetStatusEnum = pgEnum("asset_status", [
  "Active",
  "In Maintenance",
  "Retired",
  "Disposed",
  "Lost/Stolen",
]);

export const assetDocumentTypeEnum = pgEnum("asset_document_type", [
  "Receipt",
  "Invoice",
  "Warranty",
  "Photos",
  "Manual",
  "Maintenance Record",
  "Inspection Report",
  "Disposal Certificate",
  "Other",
]);

export const valueAdjustmentTypeEnum = pgEnum("value_adjustment_type", [
  "Depreciation",
  "Appreciation",
  "Impairment",
  "Revaluation",
]);

export const maintenanceStatusEnum = pgEnum("asset_maintenance_status", [
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
  "Overdue",
]);

export const maintenanceIntervalUnitEnum = pgEnum("maintenance_interval_unit", [
  "Days",
  "Weeks",
  "Months",
  "Years",
]);

export const assignmentTargetTypeEnum = pgEnum("assignment_target_type", [
  "Employee",
  "Department",
  "Project",
]);

export const depreciationMethodEnum = pgEnum("depreciation_method", [
  "Straight-Line",
]);

// ============================================
// TABLES
// ============================================

// 1. Asset Categories
export const assetCategories = pgTable(
  "asset_categories",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    codePrefix: text("code_prefix").notNull(),
    depreciationMethod: depreciationMethodEnum("depreciation_method").default(
      "Straight-Line",
    ),
    defaultUsefulLifeYears: integer("default_useful_life_years"),
    defaultResidualValuePercent: numeric("default_residual_value_percent", {
      precision: 5,
      scale: 2,
    }),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("asset_categories_organization_idx").on(table.organizationId),
    index("asset_categories_code_prefix_idx").on(table.codePrefix),
    unique("asset_categories_org_prefix_unique").on(
      table.organizationId,
      table.codePrefix,
    ),
  ],
);

// 2. Asset Locations
export const assetLocations = pgTable(
  "asset_locations",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    address: text("address"),
    type: text("type"),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("asset_locations_organization_idx").on(table.organizationId),
    index("asset_locations_name_idx").on(table.name),
  ],
);

// 3. Assets (Main Table)
export const assets = pgTable(
  "assets",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Auto-generated code: YEAR-CATEGORY-SEQUENCE (e.g., 2026-COMP-0001)
    assetCode: text("asset_code").notNull().unique(),

    // Basic Information
    name: text("name").notNull(),
    description: text("description"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => assetCategories.id, { onDelete: "restrict" }),
    locationId: integer("location_id").references(() => assetLocations.id, {
      onDelete: "set null",
    }),

    // Acquisition Details
    purchaseDate: date("purchase_date", { mode: "date" }),
    purchasePrice: numeric("purchase_price", { precision: 15, scale: 2 }),
    vendor: text("vendor"),
    poNumber: text("po_number"),

    // Current Value Tracking
    currentValue: numeric("current_value", { precision: 15, scale: 2 }),

    // Depreciation Settings
    depreciationMethod: depreciationMethodEnum("depreciation_method").default(
      "Straight-Line",
    ),
    usefulLifeYears: integer("useful_life_years"),
    residualValue: numeric("residual_value", { precision: 15, scale: 2 }),
    depreciationStartDate: date("depreciation_start_date", { mode: "date" }),
    accumulatedDepreciation: numeric("accumulated_depreciation", {
      precision: 15,
      scale: 2,
    }).default("0"),

    // Warranty Information
    warrantyStartDate: date("warranty_start_date", { mode: "date" }),
    warrantyEndDate: date("warranty_end_date", { mode: "date" }),
    warrantyProvider: text("warranty_provider"),
    warrantyTerms: text("warranty_terms"),

    // Physical Details
    serialNumber: text("serial_number"),
    model: text("model"),
    manufacturer: text("manufacturer"),
    barcode: text("barcode"),

    // Maintenance Flag
    requiresMaintenance: boolean("requires_maintenance")
      .notNull()
      .default(false),

    // Status
    status: assetStatusEnum("status").notNull().default("Active"),

    // Disposal Information
    disposalDate: date("disposal_date", { mode: "date" }),
    disposalReason: text("disposal_reason"),
    disposalPrice: numeric("disposal_price", { precision: 15, scale: 2 }),
    disposedBy: text("disposed_by").references(() => user.id, {
      onDelete: "set null",
    }),

    // Metadata
    notes: text("notes"),
    customFields: jsonb("custom_fields"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("assets_organization_idx").on(table.organizationId),
    index("assets_code_idx").on(table.assetCode),
    index("assets_category_idx").on(table.categoryId),
    index("assets_location_idx").on(table.locationId),
    index("assets_status_idx").on(table.status),
    index("assets_serial_number_idx").on(table.serialNumber),
    index("assets_warranty_end_idx").on(table.warrantyEndDate),
  ],
);

// 4. Asset Documents
export const assetDocuments = pgTable(
  "asset_documents",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    assetId: integer("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    documentType: assetDocumentTypeEnum("document_type").notNull(),
    documentName: text("document_name").notNull(),
    originalFileName: text("original_file_name").notNull(),
    filePath: text("file_path").notNull(),
    fileSize: numeric("file_size", { scale: 2, precision: 10 }).notNull(),
    mimeType: text("mime_type"),
    uploadedBy: text("uploaded_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("asset_documents_organization_idx").on(table.organizationId),
    index("asset_documents_asset_idx").on(table.assetId),
    index("asset_documents_type_idx").on(table.documentType),
  ],
);

// 5. Asset Assignments (Current)
export const assetAssignments = pgTable(
  "asset_assignments",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    assetId: integer("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),

    // Polymorphic assignment target
    targetType: assignmentTargetTypeEnum("target_type").notNull(),
    employeeId: text("employee_id").references(() => user.id, {
      onDelete: "set null",
    }),
    department: text("department"),
    projectId: integer("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),

    assignedDate: date("assigned_date", { mode: "date" }).notNull(),
    expectedReturnDate: date("expected_return_date", { mode: "date" }),
    actualReturnDate: date("actual_return_date", { mode: "date" }),
    notes: text("notes"),

    assignedBy: text("assigned_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("asset_assignments_organization_idx").on(table.organizationId),
    index("asset_assignments_asset_idx").on(table.assetId),
    index("asset_assignments_employee_idx").on(table.employeeId),
    index("asset_assignments_project_idx").on(table.projectId),
    index("asset_assignments_department_idx").on(table.department),
    index("asset_assignments_active_idx").on(table.actualReturnDate),
  ],
);

// 6. Asset Assignment History (Transfer Records)
export const assetAssignmentHistory = pgTable(
  "asset_assignment_history",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    assetId: integer("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),

    // Transfer details
    transferDate: timestamp("transfer_date").notNull(),

    // From assignment
    fromTargetType: assignmentTargetTypeEnum("from_target_type"),
    fromEmployeeId: text("from_employee_id").references(() => user.id, {
      onDelete: "set null",
    }),
    fromDepartment: text("from_department"),
    fromProjectId: integer("from_project_id").references(() => projects.id, {
      onDelete: "set null",
    }),

    // To assignment
    toTargetType: assignmentTargetTypeEnum("to_target_type"),
    toEmployeeId: text("to_employee_id").references(() => user.id, {
      onDelete: "set null",
    }),
    toDepartment: text("to_department"),
    toProjectId: integer("to_project_id").references(() => projects.id, {
      onDelete: "set null",
    }),

    reason: text("reason").notNull(),
    notes: text("notes"),
    transferredBy: text("transferred_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("asset_assignment_history_organization_idx").on(table.organizationId),
    index("asset_assignment_history_asset_idx").on(table.assetId),
    index("asset_assignment_history_date_idx").on(table.transferDate),
  ],
);

// 7. Asset Maintenance Schedules (Recurring Setup)
export const assetMaintenanceSchedules = pgTable(
  "asset_maintenance_schedules",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    assetId: integer("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),

    // Fixed interval scheduling
    intervalValue: integer("interval_value").notNull(),
    intervalUnit: maintenanceIntervalUnitEnum("interval_unit").notNull(),

    lastPerformedDate: date("last_performed_date", { mode: "date" }),
    nextDueDate: date("next_due_date", { mode: "date" }),

    estimatedCost: numeric("estimated_cost", { precision: 15, scale: 2 }),
    isActive: boolean("is_active").notNull().default(true),

    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("asset_maintenance_schedules_organization_idx").on(
      table.organizationId,
    ),
    index("asset_maintenance_schedules_asset_idx").on(table.assetId),
    index("asset_maintenance_schedules_next_due_idx").on(table.nextDueDate),
  ],
);

// 8. Asset Maintenance Records
export const assetMaintenance = pgTable(
  "asset_maintenance",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    assetId: integer("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    scheduleId: integer("schedule_id").references(
      () => assetMaintenanceSchedules.id,
      {
        onDelete: "set null",
      },
    ),

    title: text("title").notNull(),
    description: text("description"),

    scheduledDate: date("scheduled_date", { mode: "date" }).notNull(),
    completedDate: date("completed_date", { mode: "date" }),

    status: maintenanceStatusEnum("status").notNull().default("Scheduled"),

    cost: numeric("cost", { precision: 15, scale: 2 }),
    performedBy: text("performed_by"),

    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("asset_maintenance_organization_idx").on(table.organizationId),
    index("asset_maintenance_asset_idx").on(table.assetId),
    index("asset_maintenance_schedule_idx").on(table.scheduleId),
    index("asset_maintenance_status_idx").on(table.status),
    index("asset_maintenance_scheduled_date_idx").on(table.scheduledDate),
  ],
);

// 9. Asset Value Adjustments (Depreciation/Appreciation Ledger)
export const assetValueAdjustments = pgTable(
  "asset_value_adjustments",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    assetId: integer("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),

    adjustmentType: valueAdjustmentTypeEnum("adjustment_type").notNull(),
    adjustmentDate: date("adjustment_date", { mode: "date" }).notNull(),

    previousValue: numeric("previous_value", {
      precision: 15,
      scale: 2,
    }).notNull(),
    adjustmentAmount: numeric("adjustment_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    newValue: numeric("new_value", { precision: 15, scale: 2 }).notNull(),

    reason: text("reason").notNull(),
    notes: text("notes"),

    calculationDetails: jsonb("calculation_details"),

    adjustedBy: text("adjusted_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("asset_value_adjustments_organization_idx").on(table.organizationId),
    index("asset_value_adjustments_asset_idx").on(table.assetId),
    index("asset_value_adjustments_type_idx").on(table.adjustmentType),
    index("asset_value_adjustments_date_idx").on(table.adjustmentDate),
  ],
);

// 10. Asset Management Teams
export const assetManagementTeams = pgTable(
  "asset_management_teams",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    canManageAssets: boolean("can_manage_assets").notNull().default(false),
    canApproveDisposal: boolean("can_approve_disposal")
      .notNull()
      .default(false),
    canPerformAdjustments: boolean("can_perform_adjustments")
      .notNull()
      .default(false),

    addedBy: text("added_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("asset_management_teams_organization_idx").on(table.organizationId),
    index("asset_management_teams_user_idx").on(table.userId),
    unique("asset_management_teams_user_unique").on(
      table.organizationId,
      table.userId,
    ),
  ],
);

// ============================================
// RELATIONS
// ============================================

export const assetCategoriesRelations = relations(
  assetCategories,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [assetCategories.organizationId],
      references: [organization.id],
    }),
    creator: one(user, {
      fields: [assetCategories.createdBy],
      references: [user.id],
    }),
    assets: many(assets),
  }),
);

export const assetLocationsRelations = relations(
  assetLocations,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [assetLocations.organizationId],
      references: [organization.id],
    }),
    creator: one(user, {
      fields: [assetLocations.createdBy],
      references: [user.id],
    }),
    assets: many(assets),
  }),
);

export const assetsRelations = relations(assets, ({ one, many }) => ({
  organization: one(organization, {
    fields: [assets.organizationId],
    references: [organization.id],
  }),
  category: one(assetCategories, {
    fields: [assets.categoryId],
    references: [assetCategories.id],
  }),
  location: one(assetLocations, {
    fields: [assets.locationId],
    references: [assetLocations.id],
  }),
  creator: one(user, {
    fields: [assets.createdBy],
    references: [user.id],
  }),
  disposer: one(user, {
    fields: [assets.disposedBy],
    references: [user.id],
    relationName: "disposer",
  }),
  documents: many(assetDocuments),
  assignments: many(assetAssignments),
  assignmentHistory: many(assetAssignmentHistory),
  maintenanceSchedules: many(assetMaintenanceSchedules),
  maintenance: many(assetMaintenance),
  valueAdjustments: many(assetValueAdjustments),
}));

export const assetDocumentsRelations = relations(assetDocuments, ({ one }) => ({
  organization: one(organization, {
    fields: [assetDocuments.organizationId],
    references: [organization.id],
  }),
  asset: one(assets, {
    fields: [assetDocuments.assetId],
    references: [assets.id],
  }),
  uploader: one(user, {
    fields: [assetDocuments.uploadedBy],
    references: [user.id],
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
    employee: one(user, {
      fields: [assetAssignments.employeeId],
      references: [user.id],
      relationName: "assignedEmployee",
    }),
    project: one(projects, {
      fields: [assetAssignments.projectId],
      references: [projects.id],
    }),
    assigner: one(user, {
      fields: [assetAssignments.assignedBy],
      references: [user.id],
      relationName: "assigner",
    }),
  }),
);

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
    fromEmployee: one(user, {
      fields: [assetAssignmentHistory.fromEmployeeId],
      references: [user.id],
      relationName: "fromEmployee",
    }),
    toEmployee: one(user, {
      fields: [assetAssignmentHistory.toEmployeeId],
      references: [user.id],
      relationName: "toEmployee",
    }),
    fromProject: one(projects, {
      fields: [assetAssignmentHistory.fromProjectId],
      references: [projects.id],
      relationName: "fromProject",
    }),
    toProject: one(projects, {
      fields: [assetAssignmentHistory.toProjectId],
      references: [projects.id],
      relationName: "toProject",
    }),
    transferrer: one(user, {
      fields: [assetAssignmentHistory.transferredBy],
      references: [user.id],
      relationName: "transferrer",
    }),
  }),
);

export const assetMaintenanceSchedulesRelations = relations(
  assetMaintenanceSchedules,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [assetMaintenanceSchedules.organizationId],
      references: [organization.id],
    }),
    asset: one(assets, {
      fields: [assetMaintenanceSchedules.assetId],
      references: [assets.id],
    }),
    creator: one(user, {
      fields: [assetMaintenanceSchedules.createdBy],
      references: [user.id],
    }),
    maintenanceRecords: many(assetMaintenance),
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
    schedule: one(assetMaintenanceSchedules, {
      fields: [assetMaintenance.scheduleId],
      references: [assetMaintenanceSchedules.id],
    }),
    creator: one(user, {
      fields: [assetMaintenance.createdBy],
      references: [user.id],
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
    adjuster: one(user, {
      fields: [assetValueAdjustments.adjustedBy],
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
    user: one(user, {
      fields: [assetManagementTeams.userId],
      references: [user.id],
    }),
    addedByUser: one(user, {
      fields: [assetManagementTeams.addedBy],
      references: [user.id],
      relationName: "addedBy",
    }),
  }),
);

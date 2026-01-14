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
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";
import { employees } from "./hr";

// Enums
export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "Active",
  "Inactive",
  "Maintenance",
]);

export const vehicleFuelTypeEnum = pgEnum("vehicle_fuel_type", [
  "Petrol",
  "Diesel",
  "Electric",
  "Hybrid",
  "CNG",
  "Other",
]);

export const driverStatusEnum = pgEnum("driver_status", [
  "Active",
  "Inactive",
  "Suspended",
]);

export const incidentTypeEnum = pgEnum("incident_type", [
  "Accident",
  "Damage",
  "Theft",
  "Breakdown",
  "Other",
]);

export const incidentSeverityEnum = pgEnum("incident_severity", [
  "Minor",
  "Major",
  "Critical",
]);

export const incidentResolutionStatusEnum = pgEnum(
  "incident_resolution_status",
  ["Reported", "Under Investigation", "Resolved", "Closed"],
);

export const maintenanceTypeEnum = pgEnum("maintenance_type", [
  "Oil Change",
  "Tire Rotation",
  "Inspection",
  "Repair",
  "Brake Service",
  "Battery Replacement",
  "Transmission Service",
  "Other",
]);

export const fleetExpenseCategoryEnum = pgEnum("fleet_expense_category", [
  "Fuel",
  "Maintenance",
  "Insurance",
  "Registration",
  "Repairs",
  "Tires",
  "Parts",
  "Inspection",
  "Other",
]);

export const vehicleDocumentTypeEnum = pgEnum("vehicle_document_type", [
  "Registration",
  "Insurance",
  "Maintenance",
  "Inspection",
  "Purchase",
  "Photos",
  "Other",
]);

// Main Tables

// 1. Vehicles
export const vehicles = pgTable(
  "vehicles",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Basic Information
    make: text("make").notNull(),
    model: text("model").notNull(),
    year: integer("year").notNull(),
    vin: text("vin"),
    licensePlate: text("license_plate").notNull(),
    color: text("color"),

    // Operational Details
    currentMileage: numeric("current_mileage", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    fuelType: vehicleFuelTypeEnum("fuel_type").notNull(),
    status: vehicleStatusEnum("status").notNull().default("Active"),

    // Ownership
    purchaseDate: date("purchase_date", { mode: "date" }),
    purchasePrice: numeric("purchase_price", { precision: 15, scale: 2 }),
    currentValue: numeric("current_value", { precision: 15, scale: 2 }),
    depreciationRate: numeric("depreciation_rate", { precision: 5, scale: 2 }), // percentage

    // Insurance
    insurancePolicyNumber: text("insurance_policy_number"),
    insuranceProvider: text("insurance_provider"),
    insuranceExpiryDate: date("insurance_expiry_date", { mode: "date" }),
    insurancePremiumAmount: numeric("insurance_premium_amount", {
      precision: 15,
      scale: 2,
    }),

    // Registration
    registrationNumber: text("registration_number"),
    registrationExpiryDate: date("registration_expiry_date", { mode: "date" }),

    // Metadata
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("vehicles_organization_idx").on(table.organizationId),
    index("vehicles_status_idx").on(table.status),
    index("vehicles_license_plate_idx").on(table.licensePlate),
    index("vehicles_vin_idx").on(table.vin),
  ],
);

// 2. Drivers
export const drivers = pgTable(
  "drivers",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Basic Information
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),

    // License Details
    licenseNumber: text("license_number").notNull(),
    licenseExpiryDate: date("license_expiry_date", { mode: "date" }),
    licenseClass: text("license_class"),

    // Personal
    dateOfBirth: date("date_of_birth", { mode: "date" }),

    // Employment
    employeeId: integer("employee_id").references(() => employees.id, {
      onDelete: "set null",
    }), // Link to employee if internal
    hireDate: date("hire_date", { mode: "date" }),
    status: driverStatusEnum("status").notNull().default("Active"),

    // Metadata
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("drivers_organization_idx").on(table.organizationId),
    index("drivers_status_idx").on(table.status),
    index("drivers_license_idx").on(table.licenseNumber),
    index("drivers_employee_idx").on(table.employeeId),
  ],
);

// 3. Driver Vehicle Assignments (Junction Table with History)
export const driverAssignments = pgTable(
  "driver_assignments",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    driverId: integer("driver_id")
      .notNull()
      .references(() => drivers.id, { onDelete: "cascade" }),
    vehicleId: integer("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),

    startDate: date("start_date", { mode: "date" }).notNull(),
    endDate: date("end_date", { mode: "date" }), // null = current assignment

    notes: text("notes"),
    assignedBy: text("assigned_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("driver_assignments_organization_idx").on(table.organizationId),
    index("driver_assignments_driver_idx").on(table.driverId),
    index("driver_assignments_vehicle_idx").on(table.vehicleId),
    index("driver_assignments_active_idx").on(table.endDate), // for finding active assignments
  ],
);

// 4. Fleet Maintenance Records
export const fleetMaintenance = pgTable(
  "fleet_maintenance",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    vehicleId: integer("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),

    maintenanceType: maintenanceTypeEnum("maintenance_type").notNull(),
    maintenanceDate: date("maintenance_date", { mode: "date" }).notNull(),
    description: text("description").notNull(),
    cost: numeric("cost", { precision: 15, scale: 2 }).notNull(),
    mileageAtService: numeric("mileage_at_service", {
      precision: 10,
      scale: 2,
    }),
    performedBy: text("performed_by"), // vendor/shop name
    nextServiceDue: text("next_service_due"), // manual entry, e.g., "5000 km" or "6 months"

    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("fleet_maintenance_organization_idx").on(table.organizationId),
    index("fleet_maintenance_vehicle_idx").on(table.vehicleId),
    index("fleet_maintenance_date_idx").on(table.maintenanceDate),
    index("fleet_maintenance_type_idx").on(table.maintenanceType),
  ],
);

// 5. Fleet Incidents
export const fleetIncidents = pgTable(
  "fleet_incidents",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    vehicleId: integer("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),

    driverId: integer("driver_id").references(() => drivers.id, {
      onDelete: "set null",
    }), // nullable - driver may be unknown

    incidentType: incidentTypeEnum("incident_type").notNull(),
    severity: incidentSeverityEnum("severity").notNull(),
    incidentDate: timestamp("incident_date").notNull(),
    location: text("location"),
    description: text("description").notNull(),
    estimatedCost: numeric("estimated_cost", { precision: 15, scale: 2 }),

    resolutionStatus: incidentResolutionStatusEnum("resolution_status")
      .notNull()
      .default("Reported"),
    resolutionNotes: text("resolution_notes"),
    resolvedAt: timestamp("resolved_at"),

    reportedBy: text("reported_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("fleet_incidents_organization_idx").on(table.organizationId),
    index("fleet_incidents_vehicle_idx").on(table.vehicleId),
    index("fleet_incidents_driver_idx").on(table.driverId),
    index("fleet_incidents_date_idx").on(table.incidentDate),
    index("fleet_incidents_status_idx").on(table.resolutionStatus),
    index("fleet_incidents_severity_idx").on(table.severity),
  ],
);

// 6. Vehicle Documents (Junction Table)
export const vehicleDocuments = pgTable(
  "vehicle_documents",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    vehicleId: integer("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),

    documentType: vehicleDocumentTypeEnum("document_type").notNull(),
    documentName: text("document_name").notNull(),
    filePath: text("file_path").notNull(), // R2 storage path
    fileSize: numeric("file_size", { scale: 2, precision: 10 }).notNull(),
    mimeType: text("mime_type"),

    uploadedBy: text("uploaded_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("vehicle_documents_organization_idx").on(table.organizationId),
    index("vehicle_documents_vehicle_idx").on(table.vehicleId),
    index("vehicle_documents_type_idx").on(table.documentType),
  ],
);

// Relations
export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  organization: one(organization, {
    fields: [vehicles.organizationId],
    references: [organization.id],
  }),
  creator: one(user, {
    fields: [vehicles.createdBy],
    references: [user.id],
  }),
  assignments: many(driverAssignments),
  maintenance: many(fleetMaintenance),
  incidents: many(fleetIncidents),
  documents: many(vehicleDocuments),
}));

export const driversRelations = relations(drivers, ({ one, many }) => ({
  organization: one(organization, {
    fields: [drivers.organizationId],
    references: [organization.id],
  }),
  employee: one(employees, {
    fields: [drivers.employeeId],
    references: [employees.id],
  }),
  creator: one(user, {
    fields: [drivers.createdBy],
    references: [user.id],
  }),
  assignments: many(driverAssignments),
  incidents: many(fleetIncidents),
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
    assigner: one(user, {
      fields: [driverAssignments.assignedBy],
      references: [user.id],
    }),
  }),
);

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
    creator: one(user, {
      fields: [fleetMaintenance.createdBy],
      references: [user.id],
    }),
  }),
);

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
  reporter: one(user, {
    fields: [fleetIncidents.reportedBy],
    references: [user.id],
  }),
}));

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
    uploader: one(user, {
      fields: [vehicleDocuments.uploadedBy],
      references: [user.id],
    }),
  }),
);

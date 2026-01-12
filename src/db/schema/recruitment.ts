import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  index,
  integer,
  serial,
  date,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";
import { employeesDepartmentEnum, employmentTypeEnum } from "./hr";

// ============================================
// ENUMS
// ============================================

export const jobPostingStatusEnum = pgEnum("job_posting_status", [
  "Draft",
  "Published",
  "Closed",
  "Cancelled",
]);

export const candidateStatusEnum = pgEnum("candidate_status", [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
]);

export const candidateDocumentTypeEnum = pgEnum("candidate_document_type", [
  "Resume",
  "Cover Letter",
  "Portfolio",
  "Certificate",
  "ID Proof",
  "Other",
]);

export const interviewTypeEnum = pgEnum("interview_type", [
  "Phone Screening",
  "Technical",
  "Behavioral",
  "HR Round",
  "Final Round",
]);

export const interviewStatusEnum = pgEnum("interview_status", [
  "Scheduled",
  "Completed",
  "Cancelled",
  "Rescheduled",
  "No Show",
]);

export const interviewRecommendationEnum = pgEnum("interview_recommendation", [
  "Strong Hire",
  "Hire",
  "Maybe",
  "No Hire",
]);

export const offerStatusEnum = pgEnum("offer_status", [
  "Draft",
  "Pending Approval",
  "Approved",
  "Sent",
  "Accepted",
  "Rejected",
  "Expired",
]);

export const recruitmentActivityTypeEnum = pgEnum("recruitment_activity_type", [
  "Application Received",
  "Status Changed",
  "Interview Scheduled",
  "Interview Completed",
  "Offer Generated",
  "Offer Sent",
  "Offer Accepted",
  "Offer Rejected",
  "Document Uploaded",
  "Note Added",
  "Email Sent",
]);

// ============================================
// TABLES
// ============================================

/**
 * Job Postings - Internal job opportunities
 */
export const jobPostings = pgTable(
  "job_postings",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    code: text("code").notNull().unique(), // e.g., "JOB-2026-001"
    department: employeesDepartmentEnum("department").notNull(),
    position: text("position").notNull(),
    description: text("description").notNull(),
    requirements: text("requirements"),
    responsibilities: text("responsibilities"),
    employmentType: employmentTypeEnum("employment_type").notNull(),
    salaryRangeMin: integer("salary_range_min"),
    salaryRangeMax: integer("salary_range_max"),
    location: text("location"),
    openings: integer("openings").notNull().default(1),
    status: jobPostingStatusEnum("status").notNull().default("Draft"),
    publishedAt: timestamp("published_at"),
    closedAt: timestamp("closed_at"),
    postedBy: text("posted_by").references(() => user.id, {
      onDelete: "set null",
    }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("job_postings_department_idx").on(table.department),
    index("job_postings_status_idx").on(table.status),
    index("job_postings_organization_idx").on(table.organizationId),
  ],
);

/**
 * Candidates - Job applicants
 */
export const candidates = pgTable(
  "candidates",
  {
    id: serial("id").primaryKey(),
    jobPostingId: integer("job_posting_id")
      .notNull()
      .references(() => jobPostings.id, { onDelete: "cascade" }),
    candidateCode: text("candidate_code").notNull().unique(), // e.g., "CAN-2026-0001"
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    currentCompany: text("current_company"),
    currentPosition: text("current_position"),
    yearsExperience: integer("years_experience"),
    expectedSalary: integer("expected_salary"),
    noticePeriod: text("notice_period"), // e.g., "30 days", "Immediate"
    linkedinUrl: text("linkedin_url"),
    portfolioUrl: text("portfolio_url"),
    referredBy: text("referred_by"),
    notes: text("notes"),
    status: candidateStatusEnum("status").notNull().default("Applied"),
    appliedAt: timestamp("applied_at").notNull().defaultNow(),
    screenedBy: text("screened_by").references(() => user.id),
    screenedAt: timestamp("screened_at"),
    screeningNotes: text("screening_notes"),
    rejectionReason: text("rejection_reason"),
    rejectedAt: timestamp("rejected_at"),
    rejectedBy: text("rejected_by").references(() => user.id),
    hiredAt: timestamp("hired_at"),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("candidates_job_posting_idx").on(table.jobPostingId),
    index("candidates_status_idx").on(table.status),
    index("candidates_email_idx").on(table.email),
    index("candidates_organization_idx").on(table.organizationId),
  ],
);

/**
 * Candidate Documents - Resumes, certificates, portfolios
 */
export const candidateDocuments = pgTable(
  "candidate_documents",
  {
    id: serial("id").primaryKey(),
    candidateId: integer("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    documentType: candidateDocumentTypeEnum("document_type").notNull(),
    documentName: text("document_name").notNull(),
    originalFileName: text("original_file_name").notNull(),
    filePath: text("file_path").notNull(), // R2 storage path
    fileSize: numeric("file_size", { scale: 2, precision: 10 }).notNull(),
    mimeType: text("mime_type"),
    uploadedBy: text("uploaded_by").references(() => user.id),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("candidate_documents_candidate_idx").on(table.candidateId),
    index("candidate_documents_type_idx").on(table.documentType),
    index("candidate_documents_organization_idx").on(table.organizationId),
  ],
);

/**
 * Interviews - Scheduled interviews with candidates
 */
export const interviews = pgTable(
  "interviews",
  {
    id: serial("id").primaryKey(),
    candidateId: integer("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    interviewType: interviewTypeEnum("interview_type").notNull(),
    round: integer("round").notNull().default(1), // 1st round, 2nd round, etc.
    scheduledDate: timestamp("scheduled_date").notNull(),
    scheduledEndDate: timestamp("scheduled_end_date"),
    location: text("location"), // "Office - Room 201" or "Zoom Link: https://..."
    interviewerIds: text("interviewer_ids").array(), // Array of user IDs
    status: interviewStatusEnum("status").notNull().default("Scheduled"),
    feedback: text("feedback"),
    rating: integer("rating"), // 1-5 scale
    recommendation: interviewRecommendationEnum("recommendation"),
    conductedAt: timestamp("conducted_at"),
    scheduledBy: text("scheduled_by").references(() => user.id),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("interviews_candidate_idx").on(table.candidateId),
    index("interviews_status_idx").on(table.status),
    index("interviews_scheduled_date_idx").on(table.scheduledDate),
    index("interviews_organization_idx").on(table.organizationId),
  ],
);

/**
 * Offers - Job offers sent to candidates
 */
export const offers = pgTable(
  "offers",
  {
    id: serial("id").primaryKey(),
    candidateId: integer("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    jobPostingId: integer("job_posting_id")
      .notNull()
      .references(() => jobPostings.id, { onDelete: "cascade" }),
    offerCode: text("offer_code").notNull().unique(), // e.g., "OFFER-2026-0001"
    position: text("position").notNull(),
    department: employeesDepartmentEnum("department").notNull(),
    employmentType: employmentTypeEnum("employment_type").notNull(),
    salary: integer("salary").notNull(),
    startDate: date("start_date").notNull(),
    joiningBonus: integer("joining_bonus").default(0),
    benefits: text("benefits"),
    validUntil: date("valid_until").notNull(),
    status: offerStatusEnum("status").notNull().default("Draft"),
    offerLetterPath: text("offer_letter_path"), // R2 path to generated PDF
    sentAt: timestamp("sent_at"),
    acceptedAt: timestamp("accepted_at"),
    rejectedAt: timestamp("rejected_at"),
    candidateResponse: text("candidate_response"),
    preparedBy: text("prepared_by").references(() => user.id),
    approvedBy: text("approved_by").references(() => user.id),
    approvedAt: timestamp("approved_at"),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("offers_candidate_idx").on(table.candidateId),
    index("offers_status_idx").on(table.status),
    index("offers_job_posting_idx").on(table.jobPostingId),
    index("offers_organization_idx").on(table.organizationId),
  ],
);

/**
 * Recruitment Activity Log - Audit trail for all recruitment actions
 */
export const recruitmentActivityLog = pgTable(
  "recruitment_activity_log",
  {
    id: serial("id").primaryKey(),
    candidateId: integer("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    activityType: recruitmentActivityTypeEnum("activity_type").notNull(),
    description: text("description").notNull(),
    performedBy: text("performed_by").references(() => user.id),
    metadata: jsonb("metadata"), // Store additional data (e.g., previous status, new status)
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("recruitment_activity_candidate_idx").on(table.candidateId),
    index("recruitment_activity_type_idx").on(table.activityType),
    index("recruitment_activity_organization_idx").on(table.organizationId),
  ],
);

/**
 * Recruitment Metrics - Cached metrics for dashboard performance
 */
export const recruitmentMetrics = pgTable(
  "recruitment_metrics",
  {
    id: serial("id").primaryKey(),
    jobPostingId: integer("job_posting_id")
      .notNull()
      .references(() => jobPostings.id, { onDelete: "cascade" }),
    totalApplications: integer("total_applications").default(0).notNull(),
    screened: integer("screened").default(0).notNull(),
    interviewed: integer("interviewed").default(0).notNull(),
    offered: integer("offered").default(0).notNull(),
    hired: integer("hired").default(0).notNull(),
    rejected: integer("rejected").default(0).notNull(),
    avgTimeToHire: integer("avg_time_to_hire").default(0), // in days
    avgTimeToInterview: integer("avg_time_to_interview").default(0), // in days
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    lastUpdated: timestamp("last_updated")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("recruitment_metrics_job_posting_idx").on(table.jobPostingId),
    index("recruitment_metrics_organization_idx").on(table.organizationId),
  ],
);

// ============================================
// RELATIONS
// ============================================

export const jobPostingsRelations = relations(jobPostings, ({ one, many }) => ({
  postedByUser: one(user, {
    fields: [jobPostings.postedBy],
    references: [user.id],
  }),
  candidates: many(candidates),
  offers: many(offers),
  metrics: many(recruitmentMetrics),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  jobPosting: one(jobPostings, {
    fields: [candidates.jobPostingId],
    references: [jobPostings.id],
  }),
  screenedByUser: one(user, {
    fields: [candidates.screenedBy],
    references: [user.id],
  }),
  rejectedByUser: one(user, {
    fields: [candidates.rejectedBy],
    references: [user.id],
  }),
  documents: many(candidateDocuments),
  interviews: many(interviews),
  offers: many(offers),
  activityLog: many(recruitmentActivityLog),
}));

export const candidateDocumentsRelations = relations(
  candidateDocuments,
  ({ one }) => ({
    candidate: one(candidates, {
      fields: [candidateDocuments.candidateId],
      references: [candidates.id],
    }),
    uploadedByUser: one(user, {
      fields: [candidateDocuments.uploadedBy],
      references: [user.id],
    }),
  }),
);

export const interviewsRelations = relations(interviews, ({ one }) => ({
  candidate: one(candidates, {
    fields: [interviews.candidateId],
    references: [candidates.id],
  }),
  scheduledByUser: one(user, {
    fields: [interviews.scheduledBy],
    references: [user.id],
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
  preparedByUser: one(user, {
    fields: [offers.preparedBy],
    references: [user.id],
  }),
  approvedByUser: one(user, {
    fields: [offers.approvedBy],
    references: [user.id],
  }),
}));

export const recruitmentActivityLogRelations = relations(
  recruitmentActivityLog,
  ({ one }) => ({
    candidate: one(candidates, {
      fields: [recruitmentActivityLog.candidateId],
      references: [candidates.id],
    }),
    performedByUser: one(user, {
      fields: [recruitmentActivityLog.performedBy],
      references: [user.id],
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
  }),
);

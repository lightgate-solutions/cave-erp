# Finance Module & General Ledger Scope

This document maps the ERP Finance Module (per standard ERP definitions) to what is implemented in Cave ERP and what remains for future work.

## Default Chart of Accounts

Every organization automatically gets these **system** GL accounts (created on first use; not deletable or editable):

| Code | Name                | Type     | Purpose                                      |
|------|---------------------|----------|----------------------------------------------|
| 1000 | Cash / Bank         | Asset    | Payment received (debit)                     |
| 1200 | Accounts Receivable | Asset    | Invoice sent (debit), payment (credit)      |
| 2000 | Accounts Payable    | Liability| Bill (credit), payment (debit)              |
| 4000 | Sales Revenue       | Income   | Invoice sent (credit)                       |
| 6000 | Expenses            | Expense  | Bill (debit)                                 |

They are created when the org first loads Chart of Accounts, Financial Reports, or when invoicing/payables post to the GL. You can add more accounts; system accounts cannot be deleted or edited.

## Multitenancy

All general ledger data is **organization-scoped**:

- **Chart of accounts**, **journals**, **journal lines**, and **fiscal periods** have `organizationId` and are filtered by the active organization from the session.
- Server actions resolve `organizationId` from `auth.api.getSession()` (server) and do **not** trust client-provided org for mutations. Reads use session org when available and fall back to passed org for compatibility.
- Invoicing and payables already use `organization.id` from auth and post to GL with the same org.

## Implemented (General Ledger & Finance Hub)

| Article feature / process | Status | Notes |
|---------------------------|--------|--------|
| **1. General ledger** | Done | Chart of accounts, journal entries, double-entry, trial balance, P&L, balance sheet |
| **2. Accounts payable** | Done | Bills, vendor management, payment tracking; posts to GL (AP + expense accounts) |
| **3. Accounts receivable** | Done | Invoicing, clients, payment recording; posts to GL (AR + revenue accounts) |
| **4. Profit tracking** | Done | Income statement, balance sheet, retained earnings |
| **5. Reporting and analytics** | Done | Trial balance, income statement, balance sheet, date-range reports |
| **6. Cash flow visibility** | Done | GL dashboard with receivables vs payables and cash flow chart |
| **7. Period close** | Done | Fiscal periods (create, open/close/lock); posting only in open periods when periods exist |
| **8. Audit trail (basic)** | Done | `createdBy`, `postedBy` on journals; source/reference for AR/AP |
| **9. Risk / access** | Partial | Role-based module access; GL mutations scoped to session org |

## General Ledger — control objectives vs implementation

Reference mapping for ERP GL expectations (items 4–11 style). **Done** = enforced in code or available in UI; **Partial** = subset or simplified; **Not yet** = not built.

| Objective | Status | How it works in Cave ERP today |
|-----------|--------|--------------------------------|
| **4. Account balances & running totals** | Partial | Posted activity rolls into `gl_accounts.currentBalance`. **Trial balance** (date range) now includes **opening** (before range), **period** debits/credits, **closing** roll-forward, and **calendar YTD** through range end. Multi-period history = run TB for successive ranges. |
| **5. Financial period management** | Partial | `gl_periods`: Open / Closed / Locked; posting only if date falls in an **Open** period when any period exists. **Locked** and **Closed** block posting with explicit errors. **Reopen** records `reopenedAt`, `reopenedBy`, and optional **lastStatusChangeReason** (prompt on reopen). Financial **year** = you model via period names / boundaries (no separate FY table). |
| **6. Trial balance engine** | Partial | Account, period debits/credits, opening/closing/YTD columns, and row totals; UI shows **period debits vs credits** balance check. |
| **7. Financial statements** | Partial | **P&L** (Income/Expense by account), **Balance sheet** (Assets/Liabilities/Equity + dynamic retained earnings). **Cash flow**: new **indirect operating** approximation (NI ± ΔAR 1200 / ΔAP 2000); investing/financing placeholders until accounts are mapped. **Cost of Sales** / COS section on P&L: use `account_class` **Cost of Goods Sold** in COA — statement grouping can be extended. |
| **8. Adjustments, accruals, reversals** | Partial | **adjustment_reason** on journals for documentation. **reversePostedJournal()** posts an opposite **Posted** entry with `reversal_of_journal_id` (no deletion of posted history). **Year-end close** = manual/system journals + closed periods (no automated close wizard). |
| **9. Audit trail & compliance** | Partial | Journals: `created_by`, `posted_by`, timestamps, source, reference, adjustment reason, reversal link. **Period** reopen and status reason stored. **Not yet**: field-level before/after log table or approval workflow. |
| **10. Multi-entity & dimensions** | Partial | `entity_id` on **journal lines** for branch/BU-style tagging. **Not yet**: department / project / cost center columns, multicurrency, consolidated reporting. |
| **11. Key business rules** | Partial | **Journals must balance** (create/post/update). **Closed/locked periods** cannot receive posts (including `createJournal` with `Posted`). **Posted journals** are not edited or deleted — use **reversal**. **Account types** drive BS vs P&L placement. Source modules map to default GL accounts (1000, 1200, 2000, 4000, 6000). |

## Not Implemented (Future Work)

| Article feature / process | Priority | Notes |
|---------------------------|----------|--------|
| **Asset management (GL)** | Medium | Asset lifecycle, depreciation, retirement; schema exists elsewhere |
| **Budget to approval** | Medium | Budget targets, consolidation, approval workflow |
| **Expense report to reimbursement** | Medium | Expense reports, policies, reimbursement workflow |
| **Bank transaction to cash position** | Medium | Bank feeds, reconciliation, cash position by account |
| **Multicurrency** | Medium | Multiple currencies, rates, revaluation; base currency (e.g. NGN) only today |
| **Tax management (GL)** | Medium | Tax provisions, statutory filing; invoicing/bills have line-level tax |
| **Revenue recognition (contract to revenue)** | Lower | Performance obligations, allocation, time-based recognition |
| **Vendor management (deep)** | Lower | Vendor performance, compliance, contract lifecycle |
| **Banking management** | Lower | Balances/transactions per bank account; some schema exists |
| **AI / predictive** | Lower | Cash forecasting, anomaly detection |

## Processes (summary)

- **Supplier invoice to payment**: Supported via payables (bills → payment).
- **Customer invoice to receipt**: Supported via receivables (invoices → payment).
- **Period close to financial report**: Supported via fiscal periods and GL reports.
- **Daily close / report to forecast**: Not implemented (no forecasting engine).
- **Tax provision to statutory filing**: Not implemented.
- **Customer contract to revenue**: Not implemented (no contract/revenue recognition engine).

## Summary

The current implementation is sufficient for a **core general ledger**: chart of accounts, journal entries, integration with receivables and payables, financial statements, and period-based posting control. It is **multitenant** by organization. Gaps are mainly advanced areas (multicurrency, tax, budgeting, banking reconciliation, asset lifecycle, revenue recognition), which can be added incrementally.

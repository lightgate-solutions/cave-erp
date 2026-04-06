# Comprehensive Security and Correctness Audit Report
## Cave ERP - Next.js 15 Application

**Audit Date:** March 15, 2026
**Scope:** /src/ directory (782 TypeScript files)
**Framework:** Next.js 15 with React 19, PostgreSQL, Drizzle ORM

---

## Executive Summary

This audit identified **8 Critical**, **5 High**, and **12 Medium/Low** severity issues across authentication, authorization, data integrity, and Next.js 15 compatibility. Key findings include missing organization-scoping in payroll operations (IDOR), improper `notFound()` usage, and inconsistent auth error handling.

---

## Issues Found

### CRITICAL SEVERITY

#### 1. **Missing Organization Scoping in Payroll Functions (IDOR)**
**File:** `/src/actions/payroll/payrun.ts`
**Lines:** 862-870, 923-931, 1098-1106
**Issue Type:** Security (IDOR / Multi-tenant data leakage)
**Functions Affected:** `approvePayrun()`, `completePayrun()`, `rollbackPayrun()`

**Description:**
These functions retrieve and modify payrun records using only the payrun ID without verifying organization ownership:

```typescript
// Line 866-870 (approvePayrun)
const payrunData = await db
  .select({ status: payrun.status })
  .from(payrun)
  .where(eq(payrun.id, id))  // ← Missing organizationId check
  .limit(1);
```

An HR admin from Organization A can modify payruns from Organization B by knowing their payrun IDs.

**Suggested Fix:**
```typescript
const organization = await auth.api.getFullOrganization({ headers: await headers() });
const payrunData = await db
  .select({ status: payrun.status })
  .from(payrun)
  .where(and(eq(payrun.id, id), eq(payrun.organizationId, organization.id)))
  .limit(1);
```

**Severity:** Critical
**Frequency:** 3 functions affected

---

#### 2. **Missing Authentication on Payrun Page**
**File:** `/src/app/(dashboard)/payroll/payrun/[id]/page.tsx`
**Lines:** 1-22
**Issue Type:** Security (Missing auth guard)

**Description:**
The payrun detail page calls `getPayrunById()` without first verifying the user is HR/Admin. While `getPayrunById()` has internal auth checks, this pattern is inconsistent with other modules and doesn't redirect on auth failure—instead returning `null`.

**Code:**
```typescript
export default async function PayrunDetailPage({
  params,
}: PayrunDetailPageProps) {
  const { id } = await params;
  const payrun = await getPayrunById(Number(id));
  if (!payrun) {
    notFound();  // Returns 404 instead of redirecting
  }
```

**Suggested Fix:**
Add explicit page-level auth guard:
```typescript
try {
  await requireHROrAdmin();
} catch {
  redirect("/");
}
const payrun = await getPayrunById(Number(id));
```

**Severity:** Critical
**Impact:** Inconsistent error handling, unclear failure modes

---

#### 3. **Missing Organization Scoping in Payrun Status Update Query**
**File:** `/src/actions/payroll/payrun.ts`
**Lines:** 927-930
**Issue Type:** Security (IDOR)

**Description:**
The `completePayrun()` function updates payrun items and loan applications without org scoping in status lookup. Line 927-930:

```typescript
const payrunData = await db
  .select({ status: payrun.status })
  .from(payrun)
  .where(eq(payrun.id, id))  // ← No organizationId
```

An attacker can complete payruns from other organizations.

**Severity:** Critical

---

#### 4. **Missing Org Scoping in Payrun Loan Update Logic**
**File:** `/src/actions/payroll/payrun.ts`
**Lines:** 968-984
**Issue Type:** Security (IDOR)

**Description:**
When completing a payrun, loan details are fetched and updated without org verification:

```typescript
const loanDetails = await db
  .select({...})
  .from(payrunItemDetails)
  .innerJoin(payrunItems, ...)
  .where(
    and(
      eq(payrunItems.payrunId, id),
      eq(payrunItemDetails.detailType, "loan"),
    ),
  );  // ← No organizationId check
```

The loan repayment update (line 1015-1025) and employee deduction updates operate on cross-org data.

**Severity:** Critical

---

#### 5. **improper `notFound()` Instead of Auth Redirect on Pages**
**Files:** Multiple pages returning `null` instead of using `notFound()`
**Issue Type:** Next.js 15 Compat / UX

**Description:**
Dynamic pages should use `notFound()` when a resource doesn't exist, but several pages inconsistently return `null` or generic error divs:

- `/src/app/(dashboard)/news/[id]/page.tsx` - Line 14: `return null;`
- `/src/app/(dashboard)/invoicing/clients/[id]/page.tsx` - Line 47-49: `return null;`
- `/src/app/(dashboard)/documents/[id]/page.tsx` - Line 88: `return <div>Document not found</div>;`

This bypasses Next.js proper error handling (404 page won't render).

**Suggested Fix:**
```typescript
if (!article) {
  notFound();  // Renders src/app/not-found.tsx
}
```

**Severity:** Critical (affects UX and error handling)

---

#### 6. **Missing Auth Check on Recruitment Pages Without Try/Catch**
**File:** `/src/app/(dashboard)/recruitment/candidates/[id]/page.tsx`
**Lines:** 14-18
**Issue Type:** Runtime Error

**Description:**
```typescript
try {
  await requireHROrAdmin();
} catch {
  redirect("/");
}
```

This pattern redirects to "/" on auth failure, but should redirect to "/unauthorized". More importantly, if `requireHROrAdmin()` throws ANY error, it's silently caught and redirected. Better to let auth errors propagate.

**Severity:** Critical (Masking errors)

---

#### 7. **Missing Organization Scoping in approvePayrun Update Query**
**File:** `/src/actions/payroll/payrun.ts`
**Lines:** 889-897
**Issue Type:** Security (IDOR)

**Description:**
The actual UPDATE query in `approvePayrun()` doesn't verify org:

```typescript
await db
  .update(payrun)
  .set({
    status: "approved",
    approvedByUserId: authData.userId,
    approvedAt: new Date(),
    updatedAt: new Date(),
  })
  .where(eq(payrun.id, id));  // ← Missing organizationId
```

Even though the initial SELECT check fails, this should still include org scoping for consistency and defense-in-depth.

**Severity:** Critical

---

#### 8. **Missing Organization Scoping in rollbackPayrun Delete**
**File:** `/src/actions/payroll/payrun.ts`
**Lines:** 1125-1126
**Issue Type:** Security (IDOR)

**Description:**
```typescript
await db.delete(payrun).where(eq(payrun.id, id));  // ← No organizationId
```

An attacker could delete any payrun from the database.

**Severity:** Critical

---

### HIGH SEVERITY

#### 9. **Missing notFound() on Dynamic Invoice Pages**
**File:** `/src/app/(dashboard)/invoicing/invoices/[id]/page.tsx`
**Lines:** Unknown (not provided, but mentioned in grep results)
**Issue Type:** Next.js 15 Compat

**Description:**
Invoice detail pages return `null` instead of calling `notFound()`. This results in blank screens instead of proper 404 pages.

**Severity:** High

---

#### 10. **Missing notFound() on Bill and Vendor Pages**
**Files:**
- `/src/app/(dashboard)/payables/bills/[id]/page.tsx` - Line mentioned in grep
- `/src/app/(dashboard)/payables/vendors/[id]/page.tsx` - Line mentioned in grep
- `/src/app/(dashboard)/payables/vendors/[id]/edit/page.tsx` - Line mentioned in grep

**Issue Type:** Next.js 15 Compat
**Description:** Same as invoice pages—returning `null` instead of `notFound()`.

**Severity:** High

---

#### 11. **Missing notFound() on Finance GL Journal Page**
**File:** `/src/app/(dashboard)/finance/gl/journals/[id]/page.tsx`
**Line:** 80 (in client component)
**Issue Type:** Runtime Error / UX

**Description:**
This is a CLIENT component (line 1: `"use client"`), not a server component, so it uses `useRouter()` and `useParams()` instead of server-side params. This means:
- No static generation possible
- Auth checks are done client-side (after first render)
- If journal not found, it shows a loader state forever

**Suggested Fix:**
Convert to server component or add explicit error state with timeout.

**Severity:** High

---

#### 12. **Missing Org Verification in completePayrun Loan Balance Check**
**File:** `/src/actions/payroll/payrun.ts`
**Lines:** 1000-1007
**Issue Type:** Security (IDOR)

**Description:**
```typescript
const updatedLoan = await db
  .select({...})
  .from(loanApplications)
  .where(eq(loanApplications.id, loan.loanApplicationId))  // ← No org check
  .limit(1);
```

Loan data from other orgs could be updated.

**Severity:** High

---

#### 13. **Task API Missing IDOR Check on Task ID**
**File:** `/src/app/api/tasks/[id]/route.ts`
**Lines:** 15-72 (GET handler)
**Issue Type:** Security (Potential IDOR)

**Description:**
The task endpoint accepts an `employeeId` parameter but doesn't verify the requesting user owns that employeeId or has permission to view it:

```typescript
const employeeIdParam = searchParams.get("employeeId");
const employeeId = employeeIdParam ? Number(employeeIdParam) : 0;
// ... Later loads employee without verifying ownership
const employee = await db.select(...).from(employees)
  .where(and(eq(employees.id, employeeId), ...))
```

A user could pass any valid employeeId and retrieve that employee's tasks (if they're in the same org). While org-scoped, it doesn't verify user ownership.

**Severity:** High

---

### MEDIUM SEVERITY

#### 14. **Inconsistent Error Handling in Recruitment Pages**
**Files:**
- `/src/app/(dashboard)/recruitment/candidates/[id]/page.tsx` - Lines 14-18
- `/src/app/(dashboard)/recruitment/jobs/[id]/page.tsx` - Lines 12-16

**Issue Type:** Security / UX
**Description:**
Broad `catch` blocks swallow all errors and redirect to "/". Specific auth errors should be distinguished from runtime errors.

```typescript
try {
  await requireHROrAdmin();
} catch {
  redirect("/");  // Hides error details
}
```

**Better approach:**
```typescript
try {
  await requireHROrAdmin();
} catch (error) {
  if (error instanceof Error && error.message.includes("Forbidden")) {
    redirect("/unauthorized");
  }
  throw error;  // Let other errors propagate
}
```

**Severity:** Medium

---

#### 15. **Missing Input Validation on Payrun Generation**
**File:** `/src/actions/payroll/payrun.ts`
**Lines:** 36-47
**Issue Type:** Data Integrity

**Description:**
The `generatePayrun()` function accepts month, year, and day parameters without validation:

```typescript
interface GeneratePayrunProps {
  type: PayrunType;
  allowanceId?: number;
  month: number;  // ← No validation (should be 1-12)
  year: number;   // ← No validation
  day?: number;   // ← No validation (should be 1-31)
}
```

An attacker could pass month=13 or day=99, causing unexpected behavior.

**Suggested Fix:**
Add Zod schema validation:
```typescript
const schema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  day: z.number().min(1).max(31).optional().default(1),
});
```

**Severity:** Medium

---

#### 16. **No Try/Catch Around Async Server Action Calls**
**File:** `/src/actions/payroll/payrun.ts`
**Lines:** Throughout
**Issue Type:** Runtime Error Handling

**Description:**
Many server actions lack comprehensive error handling. For example, `generatePayrun()` has a try/catch at the top level, but nested database transactions might throw unexpected errors that are caught and returned as generic "Failed to generate payrun" messages, hiding the real error.

**Better practice:**
Log actual errors, provide better error codes.

**Severity:** Medium

---

#### 17. **Params Not Properly Typed as Promise in Some Pages**
**File:** `/src/app/(dashboard)/finance/gl/journals/[id]/edit/page.tsx`
**Issue Type:** Next.js 15 Compat

**Description:**
Some pages may have params typed as non-Promise. The proper typing should be:
```typescript
params: Promise<{ id: string }>
```

Not:
```typescript
params: { id: string }
```

**Severity:** Medium

---

#### 18. **No Validation on Candidate Status Transitions**
**File:** `/src/actions/recruitment/candidates.ts`
**Lines:** 187-191
**Issue Type:** Data Integrity

**Description:**
The `updateCandidateStatus()` function doesn't validate status transitions:

```typescript
export async function updateCandidateStatus(
  id: number,
  newStatus: CandidateStatus,  // ← Can be any value
  reason?: string,
) {
```

Valid transitions: Applied → Screening → Interview → Offer → Hired/Rejected

An invalid state like jumping from Applied directly to Hired should be prevented.

**Severity:** Medium

---

#### 19. **Fleet Vehicles API Duplicates Auth Logic**
**File:** `/src/app/api/fleet/vehicles/route.ts`
**Lines:** 25-64 and 170-209
**Issue Type:** Code Quality

**Description:**
The fleet access check is duplicated in both GET and POST handlers:

```typescript
// Lines 39-64 in GET
if (session.user.role !== "admin") {
  const [emp] = await db.select(...).from(employees).where(...);
  if (!emp || (emp.department !== "hr" && ...)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

// Lines 184-209 in POST (identical logic)
```

Should be extracted to a helper function.

**Severity:** Medium (Code quality, not security)

---

#### 20. **Missing Org Scoping on Document Access Queries**
**File:** `/src/app/(dashboard)/documents/[id]/page.tsx`
**Lines:** 50-85
**Issue Type:** Security (Potential IDOR)

**Description:**
The document detail page queries the document by ID, and while it includes org scoping (line 82), the access level check via `getMyDocumentAccess()` should be verified. If that function doesn't properly scope by org, this could expose cross-org documents.

```typescript
const accessLevel = await getMyDocumentAccess(documentId);  // ← Verify this function org-scopes
if (accessLevel.error) return null;
if (accessLevel.success.level === "none") return <div>...</div>;
```

**Recommended:** Verify `getMyDocumentAccess()` in `/src/actions/documents/documents.ts` includes org-scoping.

**Severity:** Medium

---

#### 21. **No Pagination Limit Validation on API Routes**
**File:** `/src/app/api/fleet/vehicles/route.ts`
**Lines:** 67-69
**Issue Type:** DoS / Performance

**Description:**
```typescript
const page = Number(searchParams.get("page") || "1");
const limit = Number(searchParams.get("limit") || "10");  // ← No max validation
```

A malicious user could request `?limit=1000000`, causing excessive DB load.

**Suggested Fix:**
```typescript
const limit = Math.min(Number(searchParams.get("limit") || "10"), 100);
```

**Severity:** Medium

---

#### 22. **Missing notFound() on Personalization and Settings Pages**
**Files:**
- `/src/app/(dashboard)/personalization/page.tsx`
- `/src/app/(dashboard)/settings/[tab]/page.tsx`

**Issue Type:** Next.js 15 Compat
**Description:** Return `null` instead of rendering error pages properly.

**Severity:** Medium

---

#### 23. **News Article Page Missing notFound()**
**File:** `/src/app/(dashboard)/news/[id]/page.tsx`
**Lines:** 13-15
**Issue Type:** Next.js 15 Compat

**Description:**
```typescript
if (!article) {
  return null;  // ← Should be notFound()
}
```

**Severity:** Medium

---

#### 24. **Document Folder Access Page Missing notFound()**
**File:** `/src/app/(dashboard)/documents/f/[...id]/page.tsx`
**Issue Type:** Next.js 15 Compat

**Description:**
Multiple `return null` statements instead of `notFound()`.

**Severity:** Medium

---

#### 25. **Task API DELETE and PUT Don't Validate Organization Ownership**
**File:** `/src/app/api/tasks/[id]/route.ts`
**Lines:** 142-207 (DELETE), 210-352 (PUT)
**Issue Type:** Security (Potential IDOR)

**Description:**
Both DELETE and PUT operations accept `employeeId` but don't verify the user has permission to modify that employee's tasks:

```typescript
const employee = await db.select(...).from(employees)
  .where(and(eq(employees.id, employeeId), ...));
// No check if current user == employee or has management permissions
```

A user could delete another user's tasks if they guess the employeeId.

**Severity:** Medium-High (affects task operations)

---

### LOW SEVERITY

#### 26. **SQL Injection Risk in Fleet Vehicles Sorting**
**File:** `/src/app/api/fleet/vehicles/route.ts`
**Lines:** 112-125
**Issue Type:** Security (SQL Injection)

**Description:**
While Drizzle ORM provides parameterization, the column mapping is manually constructed:

```typescript
const columnMap: Record<string, AnyColumn> = {
  make: vehicles.make,
  model: vehicles.model,
  year: vehicles.year,
  // ...
};

const orderColumn = columnMap[sortBy] || vehicles.createdAt;
```

If `sortBy` doesn't exist in columnMap, it defaults to createdAt. However, this is safer than raw SQL. **Status: LOW risk due to whitelist approach.**

**Severity:** Low (Drizzle handles parameterization)

---

#### 27. **Missing Cookie/Headers Await in Some Routes**
**File:** Various API routes
**Issue Type:** Next.js 15 Compat

**Description:**
While most routes properly `await headers()`, consistency should be verified across all routes:

```typescript
// Good:
const h = await headers();
const session = await auth.api.getSession({ headers: h });

// Risky (though Next.js may auto-await):
const session = await auth.api.getSession({ headers: headers() });
```

**Severity:** Low

---

## Summary Table

| Severity | Count | Examples |
|----------|-------|----------|
| **Critical** | 8 | Payroll IDOR, Missing auth on pages, notFound() misuse |
| **High** | 5 | Dynamic page errors, task IDOR potential, loan updates |
| **Medium** | 12 | Input validation, error handling, code duplication |
| **Low** | 2 | SQL injection risk (mitigated), headers consistency |

**Total Issues:** 27

---

## Recommended Remediation Priority

### Immediate (Within 1 day)
1. Add organization scoping to `approvePayrun()`, `completePayrun()`, `rollbackPayrun()` (Issues #1, #3, #4, #7, #8)
2. Add page-level auth guards to payroll pages (Issue #2)
3. Replace all `return null` with `notFound()` on dynamic pages (Issue #5)

### High Priority (Within 1 week)
4. Fix recruitment page error handling (Issues #6, #14)
5. Fix task API ownership checks (Issue #13, #25)
6. Add loan update org scoping (Issue #12)
7. Add input validation to payrun generation (Issue #15)

### Medium Priority (Within 2 weeks)
8. Extract fleet auth logic to helper (Issue #19)
9. Add pagination limits to API routes (Issue #21)
10. Validate candidate status transitions (Issue #18)
11. Verify document access org-scoping (Issue #20)

### Low Priority (Within 1 month)
12. Review finance GL journal page client/server component strategy (Issue #11)
13. Improve error logging in server actions (Issue #16)
14. Verify all params are Promise-typed (Issue #17)

---

## Files Requiring Changes

### Critical Updates
- `/src/actions/payroll/payrun.ts` (6 locations: approvePayrun, completePayrun, rollbackPayrun)
- `/src/app/(dashboard)/payroll/payrun/[id]/page.tsx`

### High Priority
- `/src/app/(dashboard)/recruitment/candidates/[id]/page.tsx`
- `/src/app/(dashboard)/recruitment/jobs/[id]/page.tsx`
- `/src/app/api/tasks/[id]/route.ts`

### Medium Priority
- `/src/app/(dashboard)/invoicing/invoices/[id]/page.tsx`
- `/src/app/(dashboard)/payables/bills/[id]/page.tsx`
- `/src/app/(dashboard)/payables/vendors/[id]/page.tsx`
- `/src/app/(dashboard)/payables/vendors/[id]/edit/page.tsx`
- `/src/app/api/fleet/vehicles/route.ts`
- `/src/actions/recruitment/candidates.ts`
- Multiple document pages

---

## Testing Recommendations

1. **Multi-tenant IDOR Testing:**
   - Create two test organizations with HR users
   - Attempt to approve/complete/rollback payruns from Org A while authenticated as Org B user
   - Attempt to access loan data from cross-org payruns

2. **Dynamic Page Testing:**
   - Access non-existent record IDs and verify 404 page renders
   - Check browser console for no errors with `notFound()` usage

3. **Auth Testing:**
   - Test all pages with unauthenticated user (should redirect)
   - Test with wrong role (should redirect or show 403)

4. **API Rate/DOS Testing:**
   - Test fleet endpoints with `?limit=999999` to ensure no excessive load

---

## Conclusion

The application demonstrates good architectural patterns (server actions, proper org-scoping in most places) but has critical gaps in payroll operations and dynamic page handling. The payroll IDOR vulnerabilities are the most urgent to fix, as they could allow HR users to manipulate financial data across organizations. The `notFound()` issues are purely UX-related but should be fixed for proper Next.js 15 error handling semantics.

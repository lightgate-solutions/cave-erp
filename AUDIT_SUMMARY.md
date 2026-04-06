# Security Audit Summary - Quick Reference

**Date:** March 15, 2026
**Application:** Cave ERP (Next.js 15)
**Auditor:** Claude Code Security Analysis
**Status:** 27 issues identified (8 Critical, 5 High, 14 Medium/Low)

---

## Critical Issues (Fix Immediately)

### 1. Payroll IDOR Vulnerability

**Risk Level:** 🔴 CRITICAL
**Files Affected:** `/src/actions/payroll/payrun.ts`
**Impact:** Cross-organization payroll data breach

An HR user in Organization A can:

- Approve payruns from Organization B
- Complete payruns from Organization B
- Delete payruns from Organization B
- Modify loan repayments across organizations

**Root Cause:** Missing `organizationId` check in WHERE clauses

**Locations:**

- Line 866: `approvePayrun()` - SELECT query
- Line 889: `approvePayrun()` - UPDATE query
- Line 927: `completePayrun()` - SELECT query
- Line 947: `completePayrun()` - UPDATE query
- Line 1000: `completePayrun()` - loan SELECT query
- Line 1098: `rollbackPayrun()` - SELECT query
- Line 1125: `rollbackPayrun()` - DELETE query

**Fix:** Add `eq(payrun.organizationId, organization.id)` to all WHERE clauses

**Estimated Time to Fix:** 30 minutes
**Risk if Not Fixed:** Data exfiltration, financial records manipulation

---

### 2. Missing Page-Level Auth Guards

**Risk Level:** 🔴 CRITICAL
**Files Affected:** `/src/app/(dashboard)/payroll/payrun/[id]/page.tsx`
**Impact:** Weak authorization checks

The payrun detail page doesn't verify HR/Admin access before rendering.

**Fix:** Add try/catch around `requireHROrAdmin()` with redirect to "/unauthorized"

**Estimated Time to Fix:** 10 minutes

---

## High Priority Issues (Fix Within 1 Week)

### 3. Task API IDOR

**Risk Level:** 🟠 HIGH
**File:** `/src/app/api/tasks/[id]/route.ts`
**Impact:** Users can access other users' tasks

The endpoint accepts an `employeeId` but doesn't verify the requesting user has permission to view that employee's data.

**Fix:** Add authorization check before task retrieval

**Estimated Time to Fix:** 45 minutes

---

### 4. Recruitment Page Error Handling

**Risk Level:** 🟠 HIGH
**Files:** `/src/app/(dashboard)/recruitment/candidates/[id]/page.tsx` and `/jobs/[id]/page.tsx`
**Impact:** Auth errors redirected to "/" instead of "/unauthorized"

**Fix:** Replace broad catch with specific error type checking

**Estimated Time to Fix:** 15 minutes

---

### 5. Finance GL Journal Page Client Component

**Risk Level:** 🟠 HIGH
**File:** `/src/app/(dashboard)/finance/gl/journals/[id]/page.tsx`
**Impact:** Client-side rendering prevents static generation

This page is a client component, causing auth checks to run client-side.

**Fix:** Convert to server component or implement proper error boundaries

**Estimated Time to Fix:** 30 minutes

---

## Medium Priority Issues (Fix Within 2 Weeks)

### 6. Input Validation Missing

**Risk Level:** 🟡 MEDIUM
**File:** `/src/actions/payroll/payrun.ts`
**Impact:** Invalid data could be written to database

Month (1-12), year (2000-2100), day (1-31) parameters not validated.

**Fix:** Add Zod schema validation

**Estimated Time to Fix:** 20 minutes

---

### 7. Pagination DoS Risk

**Risk Level:** 🟡 MEDIUM
**File:** `/src/app/api/fleet/vehicles/route.ts`
**Impact:** Excessive database load from large limit parameter

No maximum validation on pagination limit.

**Fix:** Add `Math.min(limit, 100)` to all paginated endpoints

**Estimated Time to Fix:** 10 minutes (per endpoint)

---

### 8. Code Duplication

**Risk Level:** 🟡 MEDIUM
**File:** `/src/app/api/fleet/vehicles/route.ts`
**Impact:** Maintenance burden

Fleet auth check duplicated in GET and POST handlers.

**Fix:** Extract to helper function

**Estimated Time to Fix:** 15 minutes

---

### 9. Candidate Status Validation

**Risk Level:** 🟡 MEDIUM
**File:** `/src/actions/recruitment/candidates.ts`
**Impact:** Invalid status transitions allowed

No validation of status workflow (Applied → Screening → Interview → Offer → Hired/Rejected)

**Fix:** Add validation schema for status transitions

**Estimated Time to Fix:** 25 minutes

---

## Remediation Timeline

### Immediate (Today)

- [ ] Fix payroll IDOR in `approvePayrun`, `completePayrun`, `rollbackPayrun` (30 min)
- [ ] Fix dynamic page `notFound()` usage (15 min)
- [ ] Fix payroll page auth guard (10 min)

**Total: ~55 minutes**

### This Week

- [ ] Fix task API IDOR (45 min)
- [ ] Fix recruitment page error handling (15 min)
- [ ] Add input validation to payrun (20 min)
- [ ] Add pagination limits to all APIs (30 min)
- [ ] Fix finance journal page (30 min)

**Total: ~140 minutes (2.3 hours)**

### This Month

- [ ] Extract duplicated code (15 min)
- [ ] Add candidate status validation (25 min)
- [ ] Verify document access org-scoping (30 min)
- [ ] Add audit logging to payroll (60 min)

**Total: ~130 minutes (2.2 hours)**

---

## Testing Strategy

### Automated Tests (Recommended)

```typescript
// Test: Payroll IDOR
describe("Payroll IDOR Protection", () => {
  it("should reject payrun approval from different organization", async () => {
    const org1Payrun = 42;  // exists in org-1
    const org2Session = createSession("org-2", "admin");

    const result = await approvePayrun(org1Payrun, "/finance/payruns", org2Session);

    expect(result.error).toBeDefined();
    expect(result.error.reason).toBe("Payrun not found");
  });
});

// Test: notFound() Usage
describe("Dynamic Pages 404 Handling", () => {
  it("should return 404 for non-existent news article", async () => {
    const response = await GET("/news/999999");
    expect(response.status).toBe(404);
    expect(response.body).toContain("not found");
  });
});

// Test: Task API Authorization
describe("Task API Authorization", () => {
  it("should reject access to other user's tasks", async () => {
    const user1Session = createSession("user1");
    const user2Id = 99;

    const response = await taskApi.GET(
      { employeeId: user2Id },
      user1Session
    );

    expect(response.status).toBe(403);
  });
});
```

### Manual Testing

1. Create two test organizations
2. Create HR users in each org
3. Generate payruns in org-1
4. Login as org-2 HR user
5. Try to approve/complete/delete org-1 payruns
6. Verify all operations fail with "Payrun not found"

---

## Risk Assessment

### Current Risk Level: 🔴 HIGH

**Vulnerability Scope:**

- Payroll data accessible across organizations
- Task data accessible without proper authorization
- Dynamic routes return improper error states

**Affected Users:**

- All organizations in system (multi-tenant exposure)
- All employees in organization (cross-user task exposure)

**Potential Damage:**

- Financial data breach/manipulation
- Compliance violations
- Unauthorized access to sensitive HR data

### Post-Remediation Risk Level: 🟢 LOW

All critical issues resolved, security patterns properly implemented across codebase.

---

## Files Requiring Changes

### Critical (Do First)

1. `/src/actions/payroll/payrun.ts` - 7 locations
2. `/src/app/(dashboard)/payroll/payrun/[id]/page.tsx` - 1 location
3. `/src/app/(dashboard)/news/[id]/page.tsx` - 1 location
4. `/src/app/(dashboard)/documents/[id]/page.tsx` - 1 location
5. Other dynamic pages (5+ files)

### High Priority

6. `/src/app/api/tasks/[id]/route.ts` - 3 locations
2. `/src/app/(dashboard)/recruitment/candidates/[id]/page.tsx` - 1 location
3. `/src/app/(dashboard)/recruitment/jobs/[id]/page.tsx` - 1 location

### Medium Priority

9. `/src/app/api/fleet/vehicles/route.ts` - 2 locations
2. `/src/actions/recruitment/candidates.ts` - 1 location
3. `/src/actions/payroll/payrun.ts` - input validation

---

## Detailed Reports Available

- **SECURITY_AUDIT_REPORT.md** - Full audit with all 27 issues
- **SECURITY_AUDIT_FIXES.md** - Code examples and remediation steps
- **AUDIT_SUMMARY.md** - This file

---

## Next Steps

1. **Review** this summary with your development team
2. **Assign** critical fixes to developers
3. **Schedule** code review for payroll changes (high complexity)
4. **Test** using provided test cases
5. **Deploy** to staging for integration testing
6. **Monitor** for any related issues post-deployment

---

## Questions?

Refer to the detailed audit reports for:

- Specific line numbers
- Code examples (before/after)
- Test cases
- Security best practices
- OWASP references

---

**Generated:** March 15, 2026
**Next Review Recommended:** After remediation completion

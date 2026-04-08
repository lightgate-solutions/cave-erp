# Security Audit - Detailed Fixes

## Critical Issues - Code Examples and Solutions

### Issue #1-8: Payroll Function IDOR (Missing Organization Scoping)

#### Problem
All payroll modification functions (`approvePayrun`, `completePayrun`, `rollbackPayrun`) query and update records using only ID without verifying organization ownership.

#### Current Code (VULNERABLE)
```typescript
// File: src/actions/payroll/payrun.ts - Line 866-870
export async function approvePayrun(id: number, pathname: string) {
  const authData = await requireHROrAdmin();

  try {
    const payrunData = await db
      .select({ status: payrun.status })
      .from(payrun)
      .where(eq(payrun.id, id))  // ← VULNERABLE: Missing organizationId
      .limit(1);
```

#### Fixed Code
```typescript
export async function approvePayrun(id: number, pathname: string) {
  const authData = await requireHROrAdmin();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  try {
    const payrunData = await db
      .select({ status: payrun.status })
      .from(payrun)
      .where(and(eq(payrun.id, id), eq(payrun.organizationId, organization.id)))
      .limit(1);

    if (payrunData.length === 0) {
      return {
        error: { reason: "Payrun not found" },
        success: null,
      };
    }

    await db
      .update(payrun)
      .set({
        status: "approved",
        approvedByUserId: authData.userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(payrun.id, id), eq(payrun.organizationId, organization.id)));
```

#### Apply Same Fix To:
1. `completePayrun()` - Lines 923-931, 947-955
2. `rollbackPayrun()` - Lines 1098-1106, 1125-1126

#### Test Case
```typescript
// Multi-org IDOR test
const org1Admin = { organizationId: 'org-1', role: 'admin' };
const org2Admin = { organizationId: 'org-2', role: 'admin' };

// Create payrun in org-2
const payrunId = 42;  // Exists in org-2

// Attempt to approve from org-1
const result = await approvePayrun(42, '/finance/payruns');
// Expected: Should fail with "Payrun not found" (returns error, not error in org validation)
// Actual (before fix): Successfully approves org-2 payrun
```

---

### Issue #2: Missing Auth Guard on Payrun Page

#### Current Code (WEAK)
```typescript
// File: src/app/(dashboard)/payroll/payrun/[id]/page.tsx - Lines 1-22
export default async function PayrunDetailPage({
  params,
}: PayrunDetailPageProps) {
  const { id } = await params;
  const payrun = await getPayrunById(Number(id));

  if (!payrun) {
    notFound();  // Returns 404 if auth error or not found (ambiguous)
  }
```

#### Fixed Code
```typescript
import { requireHROrAdmin } from "@/actions/auth/dal";
import { getPayrunById } from "@/actions/payroll/payrun";
import { PayrunDetail } from "@/components/payroll/payrun-detail";
import { notFound, redirect } from "next/navigation";

interface PayrunDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PayrunDetailPage({
  params,
}: PayrunDetailPageProps) {
  // Step 1: Verify user is HR or Admin
  try {
    await requireHROrAdmin();
  } catch {
    redirect("/unauthorized");  // Explicit auth failure
  }

  // Step 2: Fetch payrun (now guaranteed user has permission)
  const { id } = await params;
  const payrun = await getPayrunById(Number(id));

  // Step 3: Handle not found
  if (!payrun) {
    notFound();
  }

  return <PayrunDetail payrun={payrun} />;
}
```

---

### Issue #5: Replace `return null` with `notFound()`

#### Problem Files and Fixes

##### News Article Page
**File:** `/src/app/(dashboard)/news/[id]/page.tsx`

**Current (WRONG):**
```typescript
if (!article) {
  return null;  // Shows blank page
}
```

**Fixed:**
```typescript
import { notFound } from "next/navigation";

if (!article) {
  notFound();  // Renders your 404.tsx or default 404
}
```

##### Invoice Detail Page
**File:** `/src/app/(dashboard)/invoicing/invoices/[id]/page.tsx`

**Same fix applies - replace `return null` with `notFound()`**

##### Bill Detail Page
**File:** `/src/app/(dashboard)/payables/bills/[id]/page.tsx`

**Same fix applies**

##### Vendor Pages
**Files:**
- `/src/app/(dashboard)/payables/vendors/[id]/page.tsx`
- `/src/app/(dashboard)/payables/vendors/[id]/edit/page.tsx`

**Same fix applies**

##### Document Detail Page
**File:** `/src/app/(dashboard)/documents/[id]/page.tsx`

**Current:**
```typescript
const baseDoc = doc[0];
if (!baseDoc) return <div>Document not found</div>;  // Wrong
```

**Fixed:**
```typescript
const baseDoc = doc[0];
if (!baseDoc) notFound();  // Correct
```

---

### Issue #6: Recruitment Page Error Handling

#### Current Code (PROBLEMATIC)
```typescript
// File: src/app/(dashboard)/recruitment/candidates/[id]/page.tsx - Lines 14-18
try {
  await requireHROrAdmin();
} catch {
  redirect("/");  // Swallows all errors, wrong redirect path
}
```

#### Fixed Code
```typescript
import { requireHROrAdmin } from "@/actions/auth/dal";
import { notFound, redirect } from "next/navigation";

export default async function CandidateDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Explicit auth check with proper error handling
  try {
    await requireHROrAdmin();
  } catch (error) {
    // Distinguish between auth errors and other errors
    if (error instanceof Error) {
      if (error.message.includes("Forbidden") || error.message.includes("HR")) {
        redirect("/unauthorized");  // Proper auth-denied page
      }
      // Other errors: let them propagate to error boundary
      throw error;
    }
    redirect("/unauthorized");
  }

  const { id } = await params;
  const candidateId = Number.parseInt(id, 10);

  // Now safe to fetch candidate
  const candidate = await getCandidate(candidateId);
  if (!candidate) {
    notFound();  // Proper 404
  }

  // ... rest of component
}
```

---

### Issue #13: Task API IDOR - Missing User Ownership Verification

#### Current Code (VULNERABLE)
```typescript
// File: src/app/api/tasks/[id]/route.ts - Lines 34-55
const employeeIdParam = searchParams.get("employeeId");
const employeeId = employeeIdParam ? Number(employeeIdParam) : 0;

const employee = await db
  .select({ id: employees.id, authId: employees.authId })
  .from(employees)
  .where(
    and(
      eq(employees.id, employeeId),
      eq(employees.organizationId, organization.id),
    ),
  )
  .limit(1)
  .then((res) => res[0]);

// ← PROBLEM: No verification that current user is this employee or their manager
if (!employee?.authId) {
  return NextResponse.json(
    { error: "Employee not found" },
    { status: 400 },
  );
}

const userId = employee.authId;
let task: CreateTask | undefined;
if (role === "manager") {
  task = await getTaskByManager(employee.authId, id);
} else {
  task = await getTaskForEmployee(userId, id);  // ← Employee can access anyone's tasks!
}
```

#### Fixed Code
```typescript
// File: src/app/api/tasks/[id]/route.ts

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 401 },
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: idParam } = await params;
    const id = Number(idParam);
    const { searchParams } = _request.nextUrl;
    const employeeIdParam = searchParams.get("employeeId");
    const employeeId = employeeIdParam ? Number(employeeIdParam) : 0;
    const role = searchParams.get("role");

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 },
      );
    }

    // Get requesting user's employee record
    const [currentUserEmployee] = await db
      .select({ id: employees.id, authId: employees.authId, managerId: employees.managerId, isManager: employees.isManager })
      .from(employees)
      .where(
        and(
          eq(employees.authId, session.user.id),
          eq(employees.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!currentUserEmployee?.authId) {
      return NextResponse.json(
        { error: "Current user not found in organization" },
        { status: 403 },
      );
    }

    // Get target employee
    const [targetEmployee] = await db
      .select({ id: employees.id, authId: employees.authId, managerId: employees.managerId })
      .from(employees)
      .where(
        and(
          eq(employees.id, employeeId),
          eq(employees.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!targetEmployee?.authId) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 400 },
      );
    }

    // FIX: Verify permission to view this employee's tasks
    // Allowed if:
    // 1. Viewing own tasks (currentUserEmployee.id === employeeId)
    // 2. Current user is manager of target employee
    // 3. Current user is admin
    const isOwnTasks = currentUserEmployee.id === employeeId;
    const isManagerOfEmployee = currentUserEmployee.isManager &&
                               currentUserEmployee.authId === targetEmployee.managerId;
    const isAdmin = session.user.role === "admin";

    if (!isOwnTasks && !isManagerOfEmployee && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this employee's tasks" },
        { status: 403 },
      );
    }

    // Now safe to fetch task
    const userId = targetEmployee.authId;
    let task: CreateTask | undefined;
    if (role === "manager") {
      task = await getTaskByManager(targetEmployee.authId, id);
    } else {
      task = await getTaskForEmployee(userId, id);
    }

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // ... rest of handler
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 },
    );
  }
}
```

#### Test Case
```typescript
// Before fix - VULNERABLE
const user1Id = "emp-1";
const user2Id = "emp-2";  // Different employee

// user1 can access user2's tasks
const response = await GET(request, {
  params: Promise.resolve({ id: "123" }),
  searchParams: new URLSearchParams({ employeeId: "emp-2" }),
});
// Before fix: Returns user2's tasks ← BUG
// After fix: Returns 403 Forbidden ✓
```

---

### Issue #15: Input Validation for Payrun Generation

#### Current Code (NO VALIDATION)
```typescript
// File: src/actions/payroll/payrun.ts - Lines 28-34
interface GeneratePayrunProps {
  type: PayrunType;
  allowanceId?: number;
  month: number;      // ← No validation
  year: number;       // ← No validation
  day?: number;       // ← No validation
}

export async function generatePayrun(
  data: GeneratePayrunProps,
  pathname: string,
) {
  const authData = await requireHROrAdmin();
  // ... immediately uses data.month, data.year, data.day without checks
```

#### Fixed Code - Add Zod Validation
```typescript
import { z } from "zod";

// Add at top of file
const GeneratePayrunSchema = z.object({
  type: z.enum(["salary", "allowance"] as const),
  allowanceId: z.number().int().positive().optional(),
  month: z.number().int().min(1).max(12).describe("Month must be 1-12"),
  year: z.number().int().min(2000).max(2100).describe("Year must be 2000-2100"),
  day: z.number().int().min(1).max(31).default(1).describe("Day must be 1-31"),
});

type GeneratePayrunProps = z.infer<typeof GeneratePayrunSchema>;

export async function generatePayrun(
  data: unknown,  // Accept unknown to validate
  pathname: string,
) {
  const authData = await requireHROrAdmin();

  // Validate input
  const validation = GeneratePayrunSchema.safeParse(data);
  if (!validation.success) {
    return {
      error: {
        reason: `Invalid payrun parameters: ${validation.error.message}`,
      },
      success: null,
    };
  }

  const { type, allowanceId, month, year, day = 1 } = validation.data;
  // ... rest of function uses validated data
```

---

### Issue #19: Extract Duplicated Fleet Auth Check

#### Current Code (DUPLICATION)
```typescript
// File: src/app/api/fleet/vehicles/route.ts
// Lines 25-64 in GET handler
export async function GET(request: NextRequest) {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      const [emp] = await db
        .select({ department: employees.department })
        .from(employees)
        .where(
          and(
            eq(employees.authId, session.user.id),
            eq(employees.organizationId, organization.id),
          ),
        )
        .limit(1);
      if (
        !emp ||
        (emp.department !== "hr" &&
          emp.department !== "finance" &&
          emp.department !== "admin")
      ) {
        return NextResponse.json(
          {
            error:
              "Forbidden: Fleet access requires HR, Finance, or Admin department",
          },
          { status: 403 },
        );
      }
    }
    // ... rest of handler
  } catch (error) {
    // ...
  }
}

// Lines 170-209 in POST handler
export async function POST(request: NextRequest) {
  try {
    // ← IDENTICAL auth check repeated here
```

#### Fixed Code - Extract to Helper
```typescript
// Add at top of file
async function requireFleetAccess() {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (session.user.role !== "admin") {
    const [emp] = await db
      .select({ department: employees.department })
      .from(employees)
      .where(
        and(
          eq(employees.authId, session.user.id),
          eq(employees.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (
      !emp ||
      (emp.department !== "hr" &&
        emp.department !== "finance" &&
        emp.department !== "admin")
    ) {
      throw new Error(
        "Forbidden: Fleet access requires HR, Finance, or Admin department",
      );
    }
  }

  return { organization, session };
}

// Now use in handlers
export async function GET(request: NextRequest) {
  try {
    const { organization } = await requireFleetAccess();
    // ... rest of handler
  } catch (error) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organization } = await requireFleetAccess();
    // ... rest of handler
  } catch (error) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status });
  }
}
```

---

### Issue #21: Add Pagination Limit Validation

#### Current Code (VULNERABLE)
```typescript
// File: src/app/api/fleet/vehicles/route.ts - Lines 67-69
const searchParams = request.nextUrl.searchParams;
const page = Number(searchParams.get("page") || "1");
const limit = Number(searchParams.get("limit") || "10");  // ← No max
const offset = (page - 1) * limit;
```

#### Fixed Code
```typescript
const searchParams = request.nextUrl.searchParams;
const page = Math.max(1, Number(searchParams.get("page") || "1"));
const rawLimit = Number(searchParams.get("limit") || "10");
const limit = Math.min(Math.max(1, rawLimit), 100);  // Clamp between 1-100
const offset = (page - 1) * limit;
```

---

## Testing Checklist

### For Payroll IDOR Fixes
- [ ] Create org-1 and org-2 with separate data
- [ ] As org-1 HR, try to approve/complete/delete org-2 payrun ID
- [ ] Verify proper "Payrun not found" error returned
- [ ] Verify in logs that org mismatch prevented operation

### For Page Auth Fixes
- [ ] Access recruitment candidate page without auth → redirect /
- [ ] Access recruitment candidate page with wrong role → redirect /unauthorized
- [ ] Access recruitment candidate page with correct role → load page

### For notFound() Fixes
- [ ] Access /news/999 → see proper 404 page
- [ ] Check Network tab → status code 404
- [ ] Check UI framework default 404 renders

### For Task API Fixes
- [ ] As user A, request tasks for user B → 403
- [ ] As manager, request tasks for direct report → 200
- [ ] As admin, request tasks for any user → 200

---

## Additional Security Recommendations

1. **Add Request Rate Limiting** to all public APIs using middleware
2. **Add Input Size Limits** to all request bodies (prevent XXL payloads)
3. **Add Audit Logging** to all CRUD operations in payroll module
4. **Add Request ID Tracking** across org-scoped operations for debugging
5. **Add Security Headers** (CSP, X-Content-Type-Options, etc.) in layout

---

## References

- OWASP Top 10 A01:2021 - Broken Access Control (IDOR)
- OWASP Top 10 A07:2021 - Identification and Authentication Failures
- Next.js 15 App Router Documentation on dynamic routes
- Drizzle ORM security practices

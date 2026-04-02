# Vercel React Best Practices Audit

**Date**: 2026-03-15
**Codebase**: Cave ERP (Next.js 15 + React 19)

---

## Summary Table

| Category | Severity | Issues Found | Quick Wins | Larger Refactors |
|----------|----------|-------------|-----------|-----------------|
| Waterfalls | CRITICAL | 6-8 | Parallelize auth+org lookups (30+ uses) | Restructure requireAuth to return org |
| Bundle Size | CRITICAL | 2-3 | None currently critical | Split projects-table (574 lines) |
| Server-Side | HIGH | 3-5 | Cache org in requireAuth | Move isHrAdmin compute server-side |
| Client-Side Data | MEDIUM-HIGH | 2-3 | Add React Query staleTime | Cross-component query deduplication |
| Re-renders | MEDIUM | 2 | URL state instead of useState+useEffect | Convert derived state to useMemo |
| Rendering | MEDIUM | 2 | Extract static style constants | Add content-visibility / virtual scroll |
| JS Performance | LOW-MEDIUM | 3-4 | Use flatMap instead of filter+map | Minor |
| Advanced Patterns | LOW | 0 | N/A | N/A |

---

## 1. Eliminating Waterfalls (CRITICAL)

### Sequential auth + organization fetches

Pattern repeated 6+ times across the codebase — two independent async calls awaited sequentially when they could be parallelized.

**Affected files:**
- `src/actions/auth/dal.ts:14-30` — verifySession → getUser
- `src/actions/hr/employees.ts:24-29` — getAllEmployees
- `src/actions/recruitment/candidates.ts:46-50` — createCandidate
- `src/actions/recruitment/candidates.ts:127-129` — updateCandidate
- `src/app/api/dashboard/stats/route.ts:38-40` — GET handler
- `src/app/api/hr/employees/current/route.ts:10-17` — GET handler

**Current pattern:**
```typescript
const session = await auth.api.getSession({ headers: await headers() });
// ... later ...
const organization = await auth.api.getFullOrganization({ headers: await headers() });
```

**Fix:**
```typescript
const [session, organization] = await Promise.all([
  auth.api.getSession({ headers: await headers() }),
  auth.api.getFullOrganization({ headers: await headers() }),
]);
```

**Impact:** ~50-100ms saved per request.

---

### Auth check followed by organization lookup in actions

Pattern in `src/actions/recruitment/candidates.ts` and similar action files:

```typescript
const { employee } = await requireHROrAdmin();  // point 1
const organization = await auth.api.getFullOrganization({ headers: await headers() }); // point 2
```

Since `requireHROrAdmin` already calls `getSession`, the org lookup is a separate round-trip that could be included in the DAL response.

---

### Sequential DB queries in API routes

`src/app/api/tasks/route.ts:68-126` — employee lookup and task assignees lookup are not parallelized.

---

### Cascading useEffects

`src/components/mail/document-selection-dialog.tsx:69-101` — three chained useEffects where each depends on the result of the previous.

---

### Good patterns already in use

- `src/app/api/dashboard/stats/route.ts:94-109` — `Promise.all()` used correctly for task stats
- `src/app/(dashboard)/finance/page.tsx:47-71` — all 5 API calls parallelized correctly

---

## 2. Bundle Size Optimization (CRITICAL)

### Good patterns already in use

- `src/components/dashboard/AdminDashboard.tsx:19-32` — ActivityChart and BudgetBreakdownChart lazily loaded
- `src/app/(dashboard)/finance/page.tsx:18-27` — FinanceChart with SSR disabled
- `src/components/hr/dashboard/hr-dashboard-tabs.tsx` — dynamic imports used
- Direct imports used throughout (e.g., `from "@/components/ui/button"` not barrel `from "@/components/ui"`)

### Issues

**Large monolithic component:**
- `src/components/projects/projects-table.tsx` — 574 lines, includes grid/list view switcher, dialogs, tables, and chart icons in one bundle. Grid and list views could be split into separate lazy-loaded components.

**No lazy loading for:**
- `src/components/projects/projects-cards.tsx` — fetches stats on mount, not lazy loaded
- `src/components/dashboard/ManagerDashboard.tsx:115-147` — fetches 5 endpoints on mount without progressive loading

---

## 3. Server-Side Performance (HIGH)

### Good patterns already in use

- `src/actions/auth/dal.ts` — all DAL functions use `cache()` from React for per-request deduplication
- `verifySession`, `getUser`, `requireAuth`, `requireHROrAdmin` — all cached

### Organization re-fetched on every action call

Nearly every server action does:
```typescript
await requireAuth(); // fetches session
const organization = await auth.api.getFullOrganization({ headers: await headers() });
```

This pattern appears 50+ times. The org data should be included in the `requireAuth()` return value to avoid re-fetching.

### isHrAdmin computed client-side

`src/components/hr/ask-hr/ask-hr-table.tsx:64-70`:
```typescript
const { data: currentUser } = useQuery(/* fetch employee */);
const isHrAdmin = currentUser?.department === "hr" || currentUser?.role === "admin";
```

This derived boolean should be computed server-side and passed as a prop, not re-fetched on the client.

Same pattern in `src/components/hr/ask-hr/ask-hr-question-detail.tsx:64-79`.

### Manual post-query enrichment (N+1 risk)

`src/app/api/tasks/route.ts:117-225`:
1. Line 117-126: Fetches taskAssignees for user
2. Line 165: Calls `getTasksForEmployee()`
3. Line 180-196: Fetches employee data for assignedTo/assignedBy
4. Line 206-220: Fetches assignees data per task

Better to use a JOIN in the initial query rather than manual enrichment in application code.

---

## 4. Client-Side Data Fetching (MEDIUM-HIGH)

### Duplicate user fetches across components

`src/components/hr/ask-hr/ask-hr-table.tsx` and `src/components/hr/ask-hr/ask-hr-question-detail.tsx` both independently fetch `currentUser` with `useQuery`. Since React Query deduplicates by query key, this only matters if the query keys differ or components are on different pages. Verify the key is consistent: `["current-employee"]`.

### Missing staleTime on stats fetches

`src/components/projects/projects-cards.tsx:23` — fetches with `cache: "no-store"`. Good for freshness, but no `staleTime` on the React Query wrapper means unnecessary re-fetches on tab focus.

---

## 5. Re-render Optimization (MEDIUM)

### useEffect used to sync URL state

`src/components/hr/ask-hr/ask-hr-table.tsx:90-104`:
```typescript
useEffect(() => {
  const params = new URLSearchParams();
  // builds params from state...
  router.replace(newUrl);
}, [category, status, debouncedSearch, page, activeTab, router]);
```

This is a useState → useEffect → router sync pattern. Better to use URL as source of truth (read params from `useSearchParams`, update directly via `router.push`), eliminating the intermediate state.

Same pattern in `src/components/projects/projects-table.tsx:94-106` where a `useRef` + `useEffect` is used to detect filter changes and reset page.

---

## 6. Rendering Performance (MEDIUM)

### Static JSX class strings recreated on every render

`src/components/projects/projects-cards.tsx:55-105` — gradient class strings are inline and recreated each render.

**Current:**
```tsx
<Card className="relative overflow-hidden border-none bg-gradient-to-br from-blue-500 to-blue-600 text-white">
```

**Better:**
```typescript
const CARD_VARIANTS = {
  blue: "relative overflow-hidden border-none bg-gradient-to-br from-blue-500 to-blue-600 text-white",
} as const;

<Card className={CARD_VARIANTS.blue}>
```

### Long lists without content-visibility

`src/components/hr/ask-hr/ask-hr-table.tsx:317-410` — tables with potentially 300+ rows. Adding `content-visibility: auto` via CSS or using a virtual scroller would improve paint performance on large datasets.

---

## 7. JavaScript Performance (LOW-MEDIUM)

### Separate filter + map chains

**`src/app/api/dashboard/manager/team-members/route.ts:75-76`:**
```typescript
.map((s) => s.authId)
.filter((id): id is string => id !== null)
```
**Better:**
```typescript
.flatMap((s) => (s.authId ? [s.authId] : []))
```

**`src/app/api/dashboard/staff/documents/route.ts:106, 120`:**
```typescript
const validDocs = recentDocs.filter((doc) => { /* ... */ });
const formattedDocs = validDocs.map((doc) => { /* ... */ });
```
**Better:**
```typescript
const formattedDocs = recentDocs.flatMap(doc => isValid(doc) ? [format(doc)] : []);
```

### sort() used where reduce would suffice

`src/components/dashboard/HrDashboard.tsx:258`:
```typescript
.sort((a, b) => (a?.daysUntil || 0) - (b?.daysUntil || 0))
```
If only the minimum value is needed, use `reduce` or `Math.min` instead of sorting the full array.

---

## Top 5 Prioritized Quick Wins

### 1. Parallelize auth+org lookups (30+ call sites)
Replace sequential awaits with `Promise.all()` in action files that call both `requireAuth()` and `auth.api.getFullOrganization()`.
**Effort:** 15-30 min | **Impact:** ~50-100ms saved per request

### 2. Include organization in requireAuth() return value
Modify `src/actions/auth/dal.ts` to return org data alongside session/employee, eliminating the 50+ separate org lookups.
**Effort:** 30 min | **Impact:** ~50% reduction in auth-related DB queries

### 3. Move isHrAdmin to server, pass as prop
Compute `isHrAdmin` in the page server component and pass it down instead of re-fetching current user on the client in ask-hr components.
**Effort:** 20 min | **Impact:** Remove 2 redundant client queries

### 4. Replace filter+map chains with flatMap
4 locations in API routes.
**Effort:** 10 min | **Impact:** Minor memory/CPU savings, cleaner code

### 5. Consolidate URL-sync useEffects
Convert useState+useEffect URL sync in ask-hr-table and projects-table to use `useSearchParams` as source of truth.
**Effort:** 45-60 min | **Impact:** Eliminate ~3 re-renders per filter interaction

---

## Files Requiring Most Attention

| File | Issues |
|------|--------|
| `src/actions/recruitment/candidates.ts` | Waterfall pattern repeated 5x |
| `src/components/projects/projects-table.tsx` | 574 lines, bundle bloat candidate |
| `src/components/hr/ask-hr/ask-hr-table.tsx` | Multiple useEffect chains, duplicate user fetch |
| `src/app/api/tasks/route.ts` | Manual post-query enrichment (N+1 risk) |
| `src/actions/auth/dal.ts` | Core file — waterfalls affect 50+ call sites |

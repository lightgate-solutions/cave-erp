# Quick Start: Landing Page Integration

## Immediate Actions Required

### 1. Update Middleware (CRITICAL - Do This First)

**File**: `middleware.ts`

**Current Code**:
```typescript
export const config = {
  runtime: "nodejs",
  matcher: ["/"], // This protects root route
};
```

**Updated Code**:
```typescript
export const config = {
  runtime: "nodejs",
  // Remove "/" from matcher to allow public landing page
  // Dashboard routes are already protected by their layouts
  matcher: [
    // Only protect specific dashboard routes if needed
    // Or leave empty to rely on layout-level protection
  ],
};
```

**OR** (if you want explicit protection):
```typescript
export const config = {
  runtime: "nodejs",
  matcher: [
    "/dashboard/:path*",
    "/documents/:path*",
    "/finance/:path*",
    "/hr/:path*",
    "/payroll/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/mail/:path*",
    "/settings/:path*",
    "/news/:path*",
    "/notification/:path*",
    "/logs/:path*",
    "/bug/:path*",
    "/personalization/:path*",
  ],
};
```

**Why**: The dashboard routes are already protected by their layouts using `getUser()` which redirects to `/auth/login`. The middleware is redundant for most routes.

---

### 2. Create Directory Structure

Run these commands (or create manually):

```bash
# Create marketing route group
mkdir -p src/app/\(marketing\)

# Create landing components directory
mkdir -p src/components/landing

# Create assets directory
mkdir -p public/landing/images
mkdir -p public/landing/videos
mkdir -p public/landing/icons
```

---

### 3. Create Root Landing Page

**File**: `src/app/(marketing)/page.tsx`

**Template**:
```tsx
import LandingHero from "@/components/landing/landing-hero";
// Import other V0 components here

export default function LandingPage() {
  return (
    <main>
      <LandingHero />
      {/* Paste other V0 sections here */}
    </main>
  );
}
```

---

### 4. Copy V0 Components

**Action**: Copy each V0 component file to `src/components/landing/`

**Example**:
- V0 file: `components/hero.tsx`
- Copy to: `src/components/landing/hero.tsx` or `src/components/landing/landing-hero.tsx`

**Update imports in each component**:
```typescript
// Change V0 imports like this:
import { Button } from "@/components/ui/button"; // ✅ Correct
import { Card } from "@/components/ui/card";      // ✅ Correct
import { cn } from "@/lib/utils";                 // ✅ Correct
```

---

### 5. Copy Assets

**Action**: Copy all images/videos/icons to `public/landing/`

**Update references in components**:
```tsx
// Change from:
<img src="/images/hero.png" />

// To:
<img src="/landing/images/hero.png" />
// OR use Next.js Image:
import Image from "next/image";
<Image src="/landing/images/hero.png" width={1200} height={600} alt="Hero" />
```

---

### 6. Fix Common V0 Issues

#### Remove Mock Data
```tsx
// ❌ Remove this:
const mockData = { users: [...] };

// ✅ Use static content or remove
```

#### Remove API Calls
```tsx
// ❌ Remove this:
const data = await fetch('/api/demo');

// ✅ Use static content
```

#### Remove Environment Variables
```tsx
// ❌ Remove this:
const apiKey = process.env.NEXT_PUBLIC_DEMO_KEY;

// ✅ Remove or use static value
```

#### Fix Auth Links
```tsx
// ✅ Update CTAs to point to actual routes:
<Button asChild>
  <Link href="/auth/register">Get Started</Link>
</Button>
<Button asChild variant="outline">
  <Link href="/auth/login">Sign In</Link>
</Button>
```

---

### 7. Test Build

```bash
# Install dependencies (if V0 added any)
pnpm install

# Build project
pnpm build

# If build succeeds, test locally
pnpm dev
```

**Verify**:
- Visit `http://localhost:3000` → Should show landing page
- Visit `http://localhost:3000/auth/login` → Should show login
- Visit `http://localhost:3000/dashboard` → Should redirect to login (if not authenticated)

---

## Common Import Fixes

### If V0 uses relative imports:
```typescript
// ❌ V0 might have:
import { Button } from "../ui/button";

// ✅ Change to:
import { Button } from "@/components/ui/button";
```

### If V0 uses different component paths:
```typescript
// ❌ V0 might have:
import { Button } from "@/components/button";

// ✅ Change to:
import { Button } from "@/components/ui/button";
```

### If V0 uses different utils:
```typescript
// ❌ V0 might have:
import { cn } from "@/utils/cn";

// ✅ Change to:
import { cn } from "@/lib/utils";
```

---

## Verification Checklist

After integration, verify:

- [ ] `pnpm build` completes without errors
- [ ] `pnpm dev` starts without errors
- [ ] `/` shows landing page (no auth required)
- [ ] `/auth/login` still works
- [ ] `/dashboard` redirects to login (if not authenticated)
- [ ] `/dashboard` works (if authenticated)
- [ ] All images load on landing page
- [ ] No console errors
- [ ] Responsive design works

---

## If Something Breaks

### Build Errors
1. Check import paths
2. Verify components exist in `src/components/ui/`
3. Check TypeScript errors in terminal

### Runtime Errors
1. Check browser console
2. Verify asset paths
3. Check for missing dependencies

### Styling Issues
1. Verify Tailwind classes
2. Check CSS variable usage
3. Ensure no global style conflicts

### Routing Issues
1. Verify middleware matcher
2. Check route group structure
3. Verify no conflicting routes

---

## Next Steps

After successful integration:
1. Test on different browsers
2. Test responsive design
3. Verify all CTAs link correctly
4. Check analytics (if applicable)
5. Get team review

---

**Remember**: Take it step by step. Test after each major change.


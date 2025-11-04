# Legacy Archive Example

This file demonstrates how to use the legacy archive system with a concrete example.

## Example: Deprecating "Old Dashboard"

Let's say you have an old dashboard that's been replaced by a new one.

### Before Deprecation

Your file structure looks like:
```
src/
├── pages/
│   ├── OldDashboard.tsx    # ← Will be deprecated
│   └── NewDashboard.tsx
└── App.tsx                  # Routes to both dashboards
```

### Step 1: Move to Legacy

```bash
mv src/pages/OldDashboard.tsx src/legacy/pages/OldDashboard.tsx
```

### Step 2: Add to Legacy Routes Index

Edit `src/legacy/pages/LegacyIndex.tsx`:

```typescript
export const legacyRoutes: LegacyRouteInfo[] = [
  {
    path: 'old-dashboard',
    title: 'Old Dashboard (v1)',
    description: 'Original dashboard before the v2 redesign',
    deprecatedDate: '2024-11-04'
  }
]
```

### Step 3: Register in Legacy Routes

Edit `src/legacy/index.tsx`:

```typescript
import React from 'react'
import { Route } from 'react-router-dom'
import { LegacyRoute } from '../components/LegacyRoute'
import { LegacyIndex } from './pages/LegacyIndex'
import { OldDashboard } from './pages/OldDashboard'  // ← Import legacy component

export function getLegacyRoutes() {
  const isLegacyEnabled = import.meta.env.VITE_ENABLE_LEGACY === 'true'

  if (!isLegacyEnabled) {
    return null
  }

  return (
    <Route
      path="/legacy"
      element={
        <LegacyRoute>
          <LegacyIndex />
        </LegacyRoute>
      }
    >
      {/* Add your legacy route here */}
      <Route
        path="old-dashboard"
        element={
          <LegacyRoute>
            <OldDashboard />
          </LegacyRoute>
        }
      />
    </Route>
  )
}
```

### Step 4: Remove from Main App

Edit `src/App.tsx` - remove or comment out the old route:

```typescript
// ❌ Remove this:
// <Route path="/old-dashboard" element={<OldDashboard />} />

// ✅ Keep the new route:
<Route path="/dashboard" element={<NewDashboard />} />
```

### Step 5: Create Redirect (Optional)

If you want to redirect users from the old URL:

```typescript
// src/pages/OldDashboard.tsx (new stub file)
import { Navigate } from 'react-router-dom'

export function OldDashboard() {
  return <Navigate to="/dashboard" replace />
}
```

### Step 6: Test

```bash
# Test production build (legacy excluded)
npm run build
# ✅ Should build successfully
# ✅ Old dashboard not in bundle

# Test with legacy enabled
VITE_ENABLE_LEGACY=true npm run dev
# ✅ Navigate to http://localhost:5173/legacy
# ✅ See "Old Dashboard (v1)" in the list
# ✅ Click to access at /legacy/old-dashboard
```

### After Deprecation

Your file structure now looks like:
```
src/
├── legacy/
│   ├── pages/
│   │   ├── LegacyIndex.tsx
│   │   └── OldDashboard.tsx  # ← Archived here
│   └── index.tsx              # ← Routes registered here
├── pages/
│   ├── NewDashboard.tsx
│   └── OldDashboard.tsx      # ← Optional redirect stub
└── App.tsx                    # Only routes to new dashboard
```

## Result

**Production Build (`VITE_ENABLE_LEGACY=false` or unset):**
- ✅ `/dashboard` → NewDashboard ✓
- ❌ `/legacy` → Redirects to home
- ❌ `/legacy/old-dashboard` → Redirects to home
- ✅ Smaller bundle (OldDashboard excluded)

**Development Build (`VITE_ENABLE_LEGACY=true`):**
- ✅ `/dashboard` → NewDashboard ✓
- ✅ `/legacy` → Lists archived features ✓
- ✅ `/legacy/old-dashboard` → OldDashboard (archived version) ✓
- ℹ️ Larger bundle (legacy code included)

## Rollback Scenario

If users report issues with NewDashboard:

### Quick Verification (No Code Changes)

```bash
# Enable legacy to test old version
VITE_ENABLE_LEGACY=true npm run dev

# Compare behavior:
# - New: http://localhost:5173/dashboard
# - Old: http://localhost:5173/legacy/old-dashboard
```

### Full Rollback (If Needed)

```bash
# Move files back
mv src/legacy/pages/OldDashboard.tsx src/pages/OldDashboard.tsx

# Edit src/App.tsx - restore route
<Route path="/dashboard" element={<OldDashboard />} />

# Remove from legacy
# - Edit src/legacy/index.tsx (remove route)
# - Edit src/legacy/pages/LegacyIndex.tsx (remove from list)

# Deploy
git add -A
git commit -m "Rollback to old dashboard due to user feedback"
git push
```

## Best Practices from This Example

1. **Descriptive Names**: Use clear titles like "Old Dashboard (v1)" not just "Old"
2. **Document Date**: Always include `deprecatedDate` for tracking
3. **Test Both Modes**: Verify builds work with flag on and off
4. **Keep It Simple**: Don't over-engineer legacy code, it's temporary
5. **Set Reminders**: Schedule cleanup 2-4 weeks after deprecation

## Common Patterns

### Pattern 1: Feature Flag → Legacy

If you're using feature flags, legacy is the next step:

```
Feature Flag (ON/OFF toggle) 
  → New feature stable 
    → Remove flag 
      → Move old code to legacy 
        → Grace period 
          → Delete permanently
```

### Pattern 2: Direct Migration → Legacy

For simpler changes:

```
New feature released 
  → Move old code to legacy 
    → Grace period 
      → Delete permanently
```

### Pattern 3: Partial Rollback

Cherry-pick specific components:

```bash
# Don't restore entire feature, just copy what you need
cp src/legacy/components/OldWidget.tsx src/components/
# Then adapt and modernize the component
```

## Anti-Patterns to Avoid

❌ **Don't**: Keep code in legacy indefinitely  
✅ **Do**: Delete after grace period

❌ **Don't**: Build new features in legacy directory  
✅ **Do**: Only move existing code to legacy

❌ **Don't**: Deploy with `VITE_ENABLE_LEGACY=true`  
✅ **Do**: Only enable in development/staging

❌ **Don't**: Fix bugs in legacy code  
✅ **Do**: Restore properly or delete

❌ **Don't**: Create complex nested legacy routes  
✅ **Do**: Keep legacy structure simple and flat

# Legacy Archive System Guide

This project includes a safe legacy-archiving pattern that enables aggressive cleanup while preserving quick rollback capabilities.

## Overview

The legacy archive system allows you to:

- ✅ Remove deprecated code from production builds
- ✅ Keep deprecated code accessible for rollback
- ✅ Manually verify legacy features in development
- ✅ Reduce bundle size without losing code history

## Quick Start

### Enabling Legacy Features (Development Only)

To access legacy features during development:

1. **Set the environment variable:**

   ```bash
   # In terminal
   export VITE_ENABLE_LEGACY=true
   
   # Or create .env.local
   echo "VITE_ENABLE_LEGACY=true" > .env.local
   ```

2. **Start the dev server:**

   ```bash
   npm run dev
   ```

3. **Navigate to the legacy index:**

   ```
   http://localhost:5173/legacy
   ```

### Disabling Legacy Features (Production Default)

Legacy features are disabled by default. To explicitly disable:

```bash
export VITE_ENABLE_LEGACY=false
npm run build
```

Or simply don't set the variable at all - the default is `false`.

## How It Works

### Build-Time Flag

The `VITE_ENABLE_LEGACY` environment variable is checked at **build time**, not runtime:

- **When `false` (default):** Legacy code is tree-shaken from the bundle, routes are not registered, and the `/legacy` path returns a redirect to home
- **When `true`:** Legacy routes are mounted under `/legacy/*` and the legacy index page lists all archived features

### File Structure

```
src/
├── legacy/
│   ├── README.md           # Detailed deprecation policy and restore steps
│   ├── index.tsx           # Legacy routes configuration
│   ├── components/         # Archived components
│   │   └── .gitkeep
│   └── pages/
│       └── LegacyIndex.tsx # Auto-generated index of legacy features
├── components/
│   └── LegacyRoute.tsx     # Route guard for legacy features
└── App.tsx                 # Main app with conditional legacy routes
```

## Using the System

### 1. Deprecating a Feature

When you decide a feature should be deprecated:

#### Step 1: Move Files to Legacy

```bash
# Move a deprecated page
mv src/pages/OldFeature.tsx src/legacy/pages/OldFeature.tsx

# Move a deprecated component
mv src/components/OldWidget.tsx src/legacy/components/OldWidget.tsx
```

#### Step 2: Register the Legacy Route

Edit `src/legacy/pages/LegacyIndex.tsx` to add the route info:

```typescript
export const legacyRoutes: LegacyRouteInfo[] = [
  {
    path: 'old-feature',
    title: 'Old Feature',
    description: 'The original feature before redesign',
    deprecatedDate: '2024-01-15'
  }
]
```

#### Step 3: Add Route to Legacy Configuration

Edit `src/legacy/index.tsx` to register the actual route:

```typescript
import { OldFeature } from './pages/OldFeature'

export function getLegacyRoutes() {
  const isLegacyEnabled = import.meta.env.VITE_ENABLE_LEGACY === 'true'

  if (!isLegacyEnabled) {
    return null
  }

  return (
    <Route path="/legacy" element={<LegacyRoute><LegacyIndex /></LegacyRoute>}>
      <Route 
        path="old-feature" 
        element={<LegacyRoute><OldFeature /></LegacyRoute>} 
      />
    </Route>
  )
}
```

#### Step 4: Update or Remove References

- Remove the route from `src/App.tsx` if it was there
- Update any navigation links to point to the new feature
- Remove imports in non-legacy files

#### Step 5: Create a Stub (Optional)

If needed, create a redirect or notice at the old location:

```typescript
// src/pages/OldFeature.tsx
import { Navigate } from 'react-router-dom'

export function OldFeature() {
  return <Navigate to="/new-feature" replace />
}
```

### 2. Testing Legacy Features

```bash
# Enable legacy mode
VITE_ENABLE_LEGACY=true npm run dev

# Visit the legacy index
open http://localhost:5173/legacy

# Test the specific legacy feature
open http://localhost:5173/legacy/old-feature
```

### 3. Restoring a Feature

If you need to restore a legacy feature:

#### Quick Restore (Temporary Testing)

Just enable the flag and access via `/legacy/*`:

```bash
VITE_ENABLE_LEGACY=true npm run dev
```

#### Permanent Restore

1. Move files back:
   ```bash
   mv src/legacy/pages/OldFeature.tsx src/pages/OldFeature.tsx
   ```

2. Add route back to `src/App.tsx`

3. Remove from legacy configuration:
   - Remove from `src/legacy/index.tsx`
   - Remove from `src/legacy/pages/LegacyIndex.tsx`

4. Update imports throughout the codebase

5. Test thoroughly

6. Commit with explanation

### 4. Permanently Deleting

After the grace period (typically 2-4 weeks):

1. Remove from `src/legacy/index.tsx`
2. Remove from `src/legacy/pages/LegacyIndex.tsx`
3. Delete the file(s)
4. Commit with explanation

## CI/CD Integration

Your CI pipeline should test both modes:

```yaml
# Example GitHub Actions
jobs:
  test-production-build:
    steps:
      - name: Build without legacy
        run: |
          export VITE_ENABLE_LEGACY=false
          npm run build
        
  test-legacy-build:
    steps:
      - name: Build with legacy
        run: |
          export VITE_ENABLE_LEGACY=true
          npm run build
```

Both builds must succeed for the pipeline to pass.

## Best Practices

### DO

- ✅ Document why features are deprecated in commit messages
- ✅ Keep features in legacy for at least one release cycle
- ✅ Test both build modes in CI
- ✅ Remove legacy features after the grace period
- ✅ Use legacy for manual verification and rollback only

### DON'T

- ❌ Write new features in the legacy directory
- ❌ Fix bugs in legacy code (restore properly or delete)
- ❌ Deploy with `VITE_ENABLE_LEGACY=true` to production
- ❌ Keep legacy code indefinitely
- ❌ Rely on legacy features for normal operation

## Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `VITE_ENABLE_LEGACY` | string | `"false"` | Enable legacy routes and features |

**Important:** This is a build-time variable. Changes require a rebuild.

## Troubleshooting

### "Cannot access /legacy in production"

**Solution:** Legacy routes are intentionally excluded from production builds. Set `VITE_ENABLE_LEGACY=true` and rebuild if you need to test legacy features.

### "Legacy import errors during build"

**Solution:** Make sure legacy imports are inside `src/legacy/index.tsx` or other files in the legacy directory. Don't import legacy code in main application files.

### "CI builds failing with legacy enabled"

**Solution:** Check that:
1. All legacy files are valid TypeScript/React
2. Legacy routes don't conflict with main routes
3. Dependencies used by legacy code are still installed

### "Bundle still includes legacy code"

**Solution:** 
1. Ensure `VITE_ENABLE_LEGACY=false` (or unset)
2. Clear build cache: `rm -rf dist node_modules/.vite`
3. Rebuild: `npm run build`
4. Verify tree-shaking is working

## Technical Details

### How Tree-Shaking Works

Vite's tree-shaking eliminates dead code at build time:

1. `getLegacyRoutes()` checks `import.meta.env.VITE_ENABLE_LEGACY`
2. When `false`, it returns `null` immediately
3. Vite detects the imports inside are never used
4. Entire `src/legacy/` directory is excluded from bundle

### Bundle Size Impact

Example savings (your mileage may vary):

- Small legacy feature: 5-10 KB reduction
- Large legacy feature: 50-100+ KB reduction
- Full legacy directory: Proportional to archived code

### Type Safety

TypeScript will type-check legacy code even when `VITE_ENABLE_LEGACY=false`. This is intentional to catch errors before enabling legacy mode.

## FAQ

**Q: Why not just delete deprecated code?**  
A: The legacy archive provides a safety net for quick rollbacks without git operations or redeployments.

**Q: Can I have nested legacy routes?**  
A: Yes! Organize routes in `src/legacy/index.tsx` using React Router's nested routing.

**Q: What about legacy API endpoints or database queries?**  
A: The legacy system is for frontend code only. Handle API/DB deprecation separately with versioning.

**Q: Can I partially restore a feature?**  
A: Yes! You can copy-paste specific components or functions from legacy back to the main codebase.

**Q: How do I handle legacy dependencies?**  
A: Keep dependencies installed if they're used by legacy code. After permanently deleting legacy features, audit and remove unused dependencies.

## Further Reading

- See `src/legacy/README.md` for detailed deprecation policy
- See `src/components/LegacyRoute.tsx` for route guard implementation
- See `src/legacy/index.tsx` for legacy routes configuration

## Support

For questions or issues with the legacy archive system, consult:
1. This guide
2. `src/legacy/README.md`
3. Your team's development lead

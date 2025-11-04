# Legacy Archive

This directory contains deprecated components, pages, and features that have been archived for potential rollback while keeping them out of production builds.

## Deprecation Policy

When a feature, component, or page is deprecated:

1. **Archive Decision**: The team decides a feature is no longer needed or has been replaced
2. **Move to Legacy**: Files are moved from their original location to `src/legacy/`
3. **Stub Original**: If needed, create a stub or redirect at the original location
4. **Update Routes**: Legacy routes are only accessible when `VITE_ENABLE_LEGACY=true`
5. **Grace Period**: Keep in legacy for at least one release cycle (typically 2-4 weeks)
6. **Cleanup**: After the grace period, if no issues arise, permanently delete from legacy

## Directory Structure

Organize legacy files by maintaining their original structure:

```
src/legacy/
├── README.md (this file)
├── components/     # Deprecated components
├── pages/          # Deprecated pages
├── lib/            # Deprecated utilities/libraries
└── index.ts        # Legacy routes index
```

## Moving Files to Legacy

### Step 1: Move the Files

```bash
# Example: moving a deprecated page
mv src/pages/OldFeature.tsx src/legacy/pages/OldFeature.tsx

# Example: moving a deprecated component
mv src/components/OldWidget.tsx src/legacy/components/OldWidget.tsx
```

### Step 2: Update Imports

Update any remaining imports to point to the legacy location, or remove them entirely if the feature is being fully deprecated.

### Step 3: Add to Legacy Routes (if it's a page)

Edit `src/legacy/index.ts` to add the route to the legacy routes list. The route will automatically be mounted under `/legacy/*` when `VITE_ENABLE_LEGACY=true`.

Example:
```typescript
// In src/legacy/index.ts
import { OldFeature } from './pages/OldFeature'

export const legacyRoutes = [
  {
    path: 'old-feature',
    element: <OldFeature />,
    title: 'Old Feature',
    description: 'The original feature before redesign'
  },
  // ... other legacy routes
]
```

### Step 4: Create a Stub (Optional)

If other parts of the codebase depend on the removed file, create a stub at the original location:

```typescript
// src/pages/OldFeature.tsx (stub)
import { Navigate } from 'react-router-dom'

export function OldFeature() {
  // Option 1: Redirect to the new feature
  return <Navigate to="/new-feature" replace />
  
  // Option 2: Show deprecation notice
  return (
    <div className="p-8">
      <h1>This feature has been deprecated</h1>
      <p>Please use the new feature at <a href="/new-feature">/new-feature</a></p>
    </div>
  )
}
```

## Restore Steps

If you need to restore a legacy feature:

### Quick Restore (for testing)

Enable legacy routes temporarily:

```bash
# In your terminal or .env file
export VITE_ENABLE_LEGACY=true

# Or create/edit .env.local
echo "VITE_ENABLE_LEGACY=true" >> .env.local

# Restart dev server
npm run dev
```

Access at: `http://localhost:5173/legacy` (or your dev server URL)

### Full Restore (permanent)

1. Move files back to their original location:
   ```bash
   mv src/legacy/pages/OldFeature.tsx src/pages/OldFeature.tsx
   ```

2. Add route back to `src/App.tsx` (outside of legacy conditional)

3. Update any imports back to the original paths

4. Remove from `src/legacy/index.ts`

5. Test thoroughly

6. Commit the restoration with clear explanation

## Testing Legacy Features

### Local Development

```bash
# Enable legacy features
VITE_ENABLE_LEGACY=true npm run dev

# Navigate to http://localhost:5173/legacy
# You'll see an index of all legacy features
```

### CI/CD

The CI pipeline should test builds in both modes:

```bash
# Test with legacy disabled (production default)
VITE_ENABLE_LEGACY=false npm run build

# Test with legacy enabled
VITE_ENABLE_LEGACY=true npm run build
```

Both builds should succeed without errors.

## Environment Variable

- **Variable**: `VITE_ENABLE_LEGACY`
- **Type**: `boolean` (parsed as string 'true' or 'false')
- **Default**: `false`
- **Production**: Should always be `false`
- **Development**: Can be `true` for manual verification

## What Gets Excluded

When `VITE_ENABLE_LEGACY=false` (production default):

- ✅ Legacy files are tree-shaken from the bundle
- ✅ Legacy routes are not registered
- ✅ Legacy components are not accessible
- ✅ Navigation to `/legacy/*` returns 404
- ✅ Smaller bundle size
- ✅ No legacy code in production

When `VITE_ENABLE_LEGACY=true` (development only):

- ✅ Legacy routes are accessible under `/legacy/*`
- ✅ Legacy index page shows all archived features
- ✅ Can manually verify old functionality
- ✅ Useful for comparison during migration

## Best Practices

1. **Document Why**: When moving files to legacy, document why in the git commit
2. **Update Tests**: Remove or update tests for legacy features
3. **Clean Dependencies**: If legacy code uses unique dependencies, consider removing them
4. **Communication**: Notify the team when features are moved to legacy
5. **Regular Cleanup**: Review and permanently delete legacy code after the grace period
6. **No New Legacy Code**: Don't write new features in the legacy directory

## Frequently Asked Questions

**Q: How long should we keep code in legacy?**  
A: Typically 2-4 weeks (one release cycle). If no rollback is needed, delete permanently.

**Q: Should we commit legacy code?**  
A: Yes! The point is to have it in version control for quick rollback, not to keep it forever.

**Q: Can legacy code access the database?**  
A: Yes, but be careful. Legacy routes should not modify data in incompatible ways.

**Q: What if a legacy feature breaks?**  
A: That's expected and okay! Legacy features are archived and may not receive updates. If they're critical, restore them properly.

**Q: Should we fix bugs in legacy code?**  
A: Generally no. If a bug is found in legacy code, that's a sign it should either be restored properly or deleted entirely.

# Route Pruning Summary - EduSync MVP

## Changes Made

### Routes Removed from App.tsx
1. `/school-report-viewer` - ReportViewer page (demo/report viewer)
2. `/upcoming-features` - UpcomingFeatures page (promotional content)

### Navigation Links Removed from Layout.tsx
1. "Upcoming Features" navigation link removed from header

### Pages Moved to Legacy
The following pages were moved from `src/pages/` to `src/legacy/pages/`:
- `UpcomingFeatures.tsx` - Promotional page listing future features
- `ReportViewer.tsx` - Demo report viewing page

### Code Updated
- **HeadDashboard.tsx**: Updated `handleViewReport` function to copy daily report to clipboard instead of navigating to the removed ReportViewer page. This maintains the functionality while removing the dependency on the deprecated route.

## Routes Kept (Per PRD Requirements)

### Public Routes
- `/creator-login` - CreatorLogin
- `/login` - StaffLogin
- `/` - Redirects to `/login`

### Protected Dashboard Routes
- `/creator` - CreatorDashboard (system-wide oversight)
- `/admin` - AdminDashboard (operational management)
- `/head` - HeadDashboard (principal/full school oversight)
- `/teacher` - TeacherDashboard (class-specific tasks)

### Feature Routes
- `/ai` - AIPage (AI assistant, accessible to creator/admin/head/teacher)
- `/all-behavior-reports` - AllBehaviorReportsPage (head only)
- `/notifications` - AllNotifications (head only)

### System Routes
- `/maintenance` - Maintenance page
- `/legacy` - Legacy routes (gated by VITE_ENABLE_LEGACY env var)

## Acceptance Criteria Met

✅ Navigation shows only the kept modules; no dead links
- Removed "Upcoming Features" link from Layout navigation
- All remaining navigation links point to active routes

✅ Direct URL hits to removed routes render 404
- `/school-report-viewer` and `/upcoming-features` now return React Router's default 404 behavior
- No routes exist for these paths in the router configuration

✅ Build has no unused import warnings from removed pages
- Successfully built with `npm run build`
- No import errors for UpcomingFeatures or ReportViewer
- All removed page imports cleaned from App.tsx

## Legacy Archive
Removed pages are preserved in `src/legacy/pages/` for potential rollback if needed per the legacy system design. They can be restored via the VITE_ENABLE_LEGACY flag if required.

## Testing Recommendations
1. Verify all dashboard routes load correctly
2. Test that `/school-report-viewer` and `/upcoming-features` show 404
3. Confirm "Daily Report" button in HeadDashboard copies to clipboard
4. Check that no console errors occur during navigation
5. Verify AI assistant link works from all permitted roles

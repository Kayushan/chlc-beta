# EduSync Platform — Full Product Requirements Document

**Audience:** Product, Engineering, Design, School Leadership  
**Status:** Draft (Phase 3 scope)

## Table of Contents
- [1. Executive Summary](#1-executive-summary)
- [2. Vision & Objectives](#2-vision--objectives)
- [3. Stakeholders & Personas](#3-stakeholders--personas)
- [4. Product Scope](#4-product-scope)
  - [4.1 In Scope](#41-in-scope)
  - [4.2 Out of Scope / Deferred](#42-out-of-scope--deferred)
- [5. Key Assumptions & Dependencies](#5-key-assumptions--dependencies)
- [6. Detailed Functional Requirements](#6-detailed-functional-requirements)
  - [6.1 Authentication & Session Management](#61-authentication--session-management)
  - [6.2 Application Shell & Navigation](#62-application-shell--navigation)
  - [6.3 Announcements](#63-announcements)
  - [6.4 Role Dashboards](#64-role-dashboards)
    - [6.4.1 Creator Dashboard](#641-creator-dashboard)
    - [6.4.2 Admin Dashboard](#642-admin-dashboard)
    - [6.4.3 Head of School Dashboard](#643-head-of-school-dashboard)
    - [6.4.4 Teacher Dashboard](#644-teacher-dashboard)
  - [6.5 Leave Management](#65-leave-management)
  - [6.6 Attendance & Class Sessions](#66-attendance--class-sessions)
  - [6.7 Behavior Reporting & Notifications](#67-behavior-reporting--notifications)
  - [6.8 AI Assistant & Automation](#68-ai-assistant--automation)
  - [6.9 Events & Calendar Management](#69-events--calendar-management)
  - [6.10 System Diagnostics & Maintenance Controls](#610-system-diagnostics--maintenance-controls)
  - [6.11 Data Export & Reporting](#611-data-export--reporting)
  - [6.12 Feedback Collection](#612-feedback-collection)
- [7. Data Model Overview](#7-data-model-overview)
- [8. Non-Functional Requirements](#8-non-functional-requirements)
- [9. Analytics & Success Measurement](#9-analytics--success-measurement)
- [10. Release & Rollout Strategy](#10-release--rollout-strategy)
- [11. Risks & Mitigations](#11-risks--mitigations)
- [12. Open Questions](#12-open-questions)
- [13. Roadmap & Future Enhancements](#13-roadmap--future-enhancements)
- [Appendix A: Environment & Configuration](#appendix-a-environment--configuration)
- [Appendix B: Glossary](#appendix-b-glossary)

## 1. Executive Summary
EduSync is the unified operations platform for Charis Hope Learning Centre. It centralizes daily workflows—scheduling, announcements, attendance, leave management, behavior reporting, and AI-assisted planning—across all staff roles. The platform is delivered as a responsive web application built with React 18, TypeScript, Tailwind CSS, and Supabase, and is designed to run on both desktop and mobile devices. This PRD captures the end-to-end requirements for the current production build (phase 3) and the foundation for near-term enhancements.

## 2. Vision & Objectives
**Vision:** Provide every staff member with a single, reliable digital workspace that keeps the school day running smoothly, reduces administrative overhead, and unlocks data-informed decision making.

**Strategic Objectives**
- Eliminate fragmented spreadsheets and chat-based coordination by consolidating core processes into EduSync dashboards.
- Give leadership real-time visibility into teacher status, class coverage, and student behavior trends.
- Empower teachers with self-service tools for attendance, behavior logging, and leave requests that respect approval workflows.
- Introduce safe, configurable AI support that accelerates planning tasks without bypassing human oversight.
- Keep the platform resilient to maintenance events and secure by design.

**Target Success Metrics**
- ≥ 95 % of staff daily logins occurring through EduSync (measured via Supabase auth logs).
- ≥ 90 % of teachers submitting attendance by 9:00 AM local time each school day.
- < 1 business day average turnaround for leave approvals/rejections.
- ≥ 75 % of schedule updates initiated through the Admin dashboard or AI scheduler (eliminating external spreadsheets).
- < 30 minutes per month of unscheduled downtime for staff-facing routes.

## 3. Stakeholders & Personas

| Persona | Role in School | Primary Goals | Definition of Success |
| --- | --- | --- | --- |
| **Creator (Platform Owner)** | Technical owner / super admin | Configure AI, manage users, oversee diagnostics, control maintenance windows | Platform uptime, secure access, rapid support response |
| **Admin** | Academic operations lead | Build weekly timetables, coordinate class coverage, publish announcements | Accurate schedules with minimal clashes, responsive change management |
| **Head of School** | School leadership | Monitor teacher attendance, review behavior reports, approve leave | Real-time awareness of staffing gaps, timely approvals, actionable summaries |
| **Teacher** | Classroom staff | View schedules, mark attendance, manage classes, submit leave and behavior reports | Quick daily workflows, transparency on leave balances, responsive leadership support |

Secondary stakeholders include office staff who may read announcements and future guardians/parents for planned portal features.

## 4. Product Scope

### 4.1 In Scope
- Role-based authentication via dedicated login flows for creators and staff.
- Protected dashboards for Creator, Admin, Head, and Teacher roles surfaced through React Router.
- Global announcement feed with creation modal for authorized roles.
- Weekly scheduling CRUD, AI-assisted scheduling, and class session tracking.
- Teacher attendance logging (present/break/absent) with leader dashboards.
- Annual leave management with balances, approvals, and cancellations.
- Behavior reporting dashboards and consolidated notifications for leadership.
- AI assistant full-page experience with configurable access levels and audit logging.
- System diagnostics, maintenance mode gating, and default configuration controls.
- Data export helpers (CSV) and printable daily status reports.
- Responsive layout with Tailwind-driven theming optimized for mobile and desktop.
- Supabase-backed persistence including row-level security (RLS) enforcement.

### 4.2 Out of Scope / Deferred
- Guardian/parent-facing portal and student self-service access.
- External communication channels (SMS/email push) beyond in-app announcements.
- Offline-first mode and background data sync.
- Detailed academic analytics dashboards with charts (planned roadmap item).
- Integration with payroll, HRIS, or national education systems.
- Student records module, form builder, and drag-and-drop timetable UI (see roadmap).
- Automated push notifications (OneSignal, Firebase) and native mobile app release.

## 5. Key Assumptions & Dependencies
- Supabase supplies authentication, Postgres storage, row-level security, and RPC functions (e.g., leave approvals). Availability of Supabase is critical to all core workflows.
- Environment variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and AI provider keys are configured at build time (Netlify or equivalent).
- All staff access EduSync via modern browsers (Chrome, Edge, Safari) on desktop or mobile with stable connectivity.
- Supabase policies ensure only authorized roles can query/modify data; client-side checks supplement but do not replace RLS.
- AI assistant relies on configured third-party LLM provider; without valid keys, AI features are disabled but other workflows remain unaffected.
- Maintenance windows block non-creator traffic via `system_flags.maintenance_mode`; creators must communicate windows externally if needed.

## 6. Detailed Functional Requirements

### 6.1 Authentication & Session Management
**User Stories**
- As a creator, I can authenticate through `/creator-login` and retain session state across refreshes.
- As any staff member, I can log in via `/login` and be redirected to the dashboard for my role.

**Acceptance Criteria**
- Client-side validation ensures email/password are provided; errors show via toast.
- Passwords are hashed client-side (`hashPassword`) before being sent to Supabase for storage or update.
- On successful login, session info is cached (local storage) for `ProtectedRoute` checks; unauthorized access redirects to login.
- Logout clears cached user data and Supabase session.

**Notes**
- `getCurrentStaffUser()` retrieves current user metadata for gating UI elements.
- Future work: support password reset or Supabase magic link flows.

### 6.2 Application Shell & Navigation
- `App.tsx` wires React Router routes through `ToastProvider`, `AnnouncementProvider`, and `MaintenanceProvider`.
- `ProtectedRoute` verifies role access; unauthorized attempts redirect to `/login` or `/maintenance` when applicable.
- `MaintenanceGuardContent` ensures only creators bypass maintenance (with banner), while others see the maintenance page.
- `Layout` component centralizes navigation, responsive sidebar, and top-level actions; each dashboard instantiates its own layout to allow role-specific nav links (including `/ai`).
- `IntroSplash` animates on first load to reinforce brand; auto-dismiss is required before the rest of the app becomes interactive.

### 6.3 Announcements
**Functional Requirements**
- Announcement feed (`AnnouncementFeed`) lists latest entries from `announcements` table descending by date.
- Authorized roles (creator, admin, head) can open `AnnouncementCreateModal` to post new items with title, message, and optional metadata.
- Teachers have read-only access.
- Feed auto-refreshes through `AnnouncementProvider`; manual refresh button optional.
- Announcements display on relevant dashboards and on the dedicated announcement tab.

**Acceptance Criteria**
- Creation requires non-empty content; success/failure surfaces via toasts.
- Announcements respect maintenance mode (creators can still post).
- Supabase row-level policies prevent unauthorized insert/update/delete.

### 6.4 Role Dashboards

#### 6.4.1 Creator Dashboard
**Key Capabilities**
- Tabbed interface: Dashboard (operations) and Announcements.
- User management: list, create, edit, delete non-creator users (roles: admin, head, teacher). Password changes optional for edits.
- AI configuration: manage API key(s), model name, and access level stored in `ai_settings`. Confirmation modal required before save.
- Maintenance toggle: flip `system_flags.maintenance_mode` with optimistic UI feedback.
- Diagnostics access: open `DiagnosticPanel` for system health (Supabase connection, counts, version info).
- Feedback feed: surface entries from `feedbacks`, providing quick oversight.
- Quick actions to add users and configure AI.

**Acceptance Criteria**
- All CRUD operations display success/error via toast and refresh data via `loadCreatorData`.
- AI settings require non-empty model, API key, and access level.
- Maintenance change persists timestamp and is reversible.
- Soft loading states present while fetching.

#### 6.4.2 Admin Dashboard
**Key Capabilities**
- Weekly schedule grid from `schedules` table with day, time, level, subject, teacher assignment.
- CRUD form for schedule entries; editing pre-populates form.
- Bulk reset for weekly data (clears `attendance_logs` and `schedules` after confirmation).
- AI scheduler mode: Build matrix, request suggestions via `AIAssistant`, review/validate commands using `validateCommand`, and apply after manual approval. Errors logged to `ai_command_errors`.
- Announcement tab identical to other roles.
- Teacher directory in context for assignment selection.

**Acceptance Criteria**
- Duplicate schedule entries on same day/time/level are prevented by DB constraints; errors surface to user.
- AI-generated commands must be reviewed, optionally edited JSON, and validated prior to applying.
- Reset action requires explicit confirmation and shows success/failure.
- Loading indicators appear while fetching schedules/teachers.

#### 6.4.3 Head of School Dashboard
**Key Capabilities**
- Overview tab summarizing teacher attendance status (present, break, absent, no check-in) using `attendance_logs`.
- Behavior reports feed (latest entries with teacher context).
- Active classes view referencing `class_sessions`.
- Leaves tab: pending approvals list with approve/reject (with optional notes) using Supabase RPC functions; ability to view teachers on leave.
- Leave Settings tab: edit each teacher’s total leave allowance via `updateTeacherTotalLeaves`.
- Notifications summary (attendance events, leave requests, behavior reports) with quick filters.
- Generate "School Status Report" via `ReportViewer` to print/email a daily digest.
- Access to `/all-behavior-reports` and `/notifications` pages for deeper dives.
- AI assistant accessible for leadership tasks.

**Acceptance Criteria**
- Data refreshes at least every 60 seconds for teacher status/active sessions; manual refresh option available.
- Leave approval updates DB, reduces teacher leave balance, and provides toast feedback.
- Reject flow supports reviewer note collection and ensures reason persisted.
- Report generation populates template including attendance counts, teachers on leave, active classes, and latest behavior summaries.

#### 6.4.4 Teacher Dashboard
**Key Capabilities**
- Dashboard tab summarizing today’s schedule, attendance status, and active sessions.
- Attendance actions: confirm present, mark break/absent with remarks, and update existing record.
- Class session controls: start/end classes, track duration, capture summary.
- Behavior reporting: log incidents with student details, view recent submissions.
- Leave management: view leave balance, submit new leave with type and reason, cancel pending requests.
- Announcements tab for feed consumption.
- Access to AI assistant (floating button toggled to full page).
- Support for responsive mobile bottom navigation.

**Acceptance Criteria**
- Attendance can only be submitted once per day; updates modify existing record instead of duplicating.
- Leave requests enforce future dates, available leave balance, and duplication checks (via Supabase unique constraints).
- Cancel leave limited to pending requests belonging to teacher.
- Behavior report submission requires student, incident, action fields; success resets form.
- Loading states and toasts guide user during asynchronous operations.

### 6.5 Leave Management
- Core tables: `annual_leaves`, `teacher_leave_balances`, `system_flags` (`default_annual_leaves`), RPCs `approve_leave_request`, `reject_leave_request`, `cancel_leave_request_by_teacher`.
- Leave types supported: Annual, Medical, Emergency, Sick, Maternity, Paternity, Unpaid, Other.
- Balances auto-create using system default if absent.
- Admin/Head can view pending applications with pagination filters; decisions adjust balances and record reviewer metadata.
- Teachers view history with pagination via `getTeacherLeaveApplications`.
- System default leave days adjustable by leadership; validation prevents lowering below used leaves.

**Acceptance Criteria**
- Balance retrieval is resilient—auto-inserts default record when missing.
- Duplicate leave submissions for same date with Pending/Approved status are blocked.
- Approvals/rejections capture reviewer ID, notes, decision timestamp, and update status.
- Cancelling a leave returns days to balance if previously decremented.

### 6.6 Attendance & Class Sessions
- `attendance_logs` track daily status; statuses limited to present/break/absent.
- Teachers can update attendance once per day; subsequent actions update existing log.
- `class_sessions` store start/end timestamps, status (active/completed), and association to schedule.
- Teachers can have multiple sessions per day; head dashboard surfaces active ones.
- Completed session generates summary with duration for teacher review; future iterations may store in DB (currently handled in UI state).

### 6.7 Behavior Reporting & Notifications
- Behavior reports stored in `behavior_reports` with teacher linkage.
- Teachers submit incidents; head dashboard and `/all-behavior-reports` page aggregate by date (Today, Yesterday, etc.).
- Notifications page composes three data sources: leave applications, behavior reports, attendance logs, providing filter controls.
- Behavior report groups expand/collapse per date; detailed view shows incidents, actions taken, and teacher.

### 6.8 AI Assistant & Automation
- Dedicated `/ai` route renders `AIPage` with `AIAssistant` component in full-page mode.
- Access controlled by `ProtectedRoute` requiring role in {creator, admin, head, teacher} and by `ai_settings.access_level`.
- `ai_settings` table stores API keys (rotated list), current index, model, and per-role access configuration.
- Admin dashboard integrates AI for schedule planning; commands must pass JSON validation and manual approval.
- AI interactions log warnings/errors to `ai_command_errors` for auditability.
- UI surfaces fallback messaging when API keys missing or feature disabled.

### 6.9 Events & Calendar Management
- `eventManagement.ts` provides helpers to create, fetch, update, delete events in `events` table, including level tags and conflict detection.
- Currently no UI page surfaces events; module supports future calendar features and exports.
- Conflict detection checks overlapping time blocks and tag clashes; returns warnings for UI to display.
- Events join with `users` to label creator; requires authenticated user for creation.

### 6.10 System Diagnostics & Maintenance Controls
- `DiagnosticPanel` exposes system metadata (Supabase connectivity, counts, version).
- Creator toggles `maintenance_mode` flag to route non-creators to `Maintenance` page with static message.
- Additional flags (e.g., `default_annual_leaves`, theme toggles) stored in `system_flags`.
- Maintenance UI shows banner to creators when mode active.
- Diagnostics should remain accessible even during maintenance for creators.

### 6.11 Data Export & Reporting
- `exportHelpers.ts` offers CSV generation for users, schedules, attendance, leave data.
- Creator dashboard includes placeholders/buttons for exporting core datasets (future enhancement to hook into helper functions).
- Head dashboard can generate daily "School Status Report" string sent to `ReportViewer` for preview and print/share.
- Exports must respect role-based access (only creator for full user export; leadership for aggregated reports).

### 6.12 Feedback Collection
- `feedbacks` table stores message, submitter, timestamp.
- Creator dashboard lists latest feedback with refresh control for manual sync.
- Future iterations may allow other roles to see filtered feedback; currently read-only for creator.
- Feedback retrieval must handle errors gracefully and surface messages to user.

## 7. Data Model Overview

| Table | Purpose | Key Columns | Notes |
| --- | --- | --- | --- |
| `users` | Staff directory & auth metadata | `id`, `name`, `email`, `password_hash`, `role`, timestamps | Creators manage all records except other creators |
| `announcements` | System-wide communications | `title`, `content`, `audience`, `created_by`, timestamps | RLS restricts write to elevated roles |
| `ai_settings` | AI configuration | `api_keys[]`, `current_index`, `model`, `access_level` | Stores rotating keys, per-role access |
| `ai_command_errors` | AI audit log | `command_json`, `error_message`, `user_role`, `created_at` | Populated when AI schedule commands fail |
| `attendance_logs` | Daily teacher attendance | `teacher_id`, `date`, `status`, `remarks`, timestamps | One record per teacher/day |
| `schedules` | Weekly timetable | `day`, `time`, `level`, `subject`, `teacher_id`, timestamps | Admin-managed; unique per (day, time, level) |
| `class_sessions` | Real-time class tracking | `teacher_id`, `schedule_id`, `class_level`, `status`, `start_time`, `end_time` | Created when teachers start class |
| `annual_leaves` | Leave applications | `teacher_id`, `leave_date`, `leave_type`, `reason`, `status`, `reviewed_by`, `reviewer_notes`, `decision_time` | RPCs update status/allowances |
| `teacher_leave_balances` | Leave allowances per teacher | `teacher_id`, `total_leaves`, `used_leaves`, `updated_at` | Auto-created when missing |
| `system_flags` | Platform configuration | `flag_name`, `flag_value`, `is_active`, `updated_at` | Includes maintenance mode, default leaves |
| `behavior_reports` | Student behavior incidents | `student_name`, `class_level`, `incident`, `action_taken`, `teacher_id`, `created_at` | Referenced in dashboards |
| `feedbacks` | Staff feedback submissions | `user_id`, `user_name`, `feedback`, `created_at` | Creator view |
| `events` | School events calendar | `title`, `description`, `start_time`, `end_time`, `level_tags`, `created_by` | Helpers available for future UI |
| `attendance_logs`, `class_sessions`, `announcements`, etc. | Support notifications and reporting | — | Additional indexes recommended for perf |

## 8. Non-Functional Requirements
- **Performance:** Dashboards must load primary data within 3 seconds on broadband connections. Database queries should paginate large datasets (leave history, behavior reports).
- **Reliability:** Supabase outage should degrade gracefully—display toast and fallback messaging. Maintenance mode ensures controlled downtime.
- **Security & Privacy:** Enforce Supabase RLS for all tables, store passwords as salted hashes, transmit over HTTPS, and restrict AI keys to privileged roles. No PII beyond staff names/emails and student incident descriptions.
- **Accessibility:** Use semantic HTML, keyboard navigation (tab order), adequate color contrast (Tailwind classes), and descriptive button labels. Mobile layouts must keep tap targets ≥ 44px height.
- **Scalability:** Architecture supports adding new roles, tables, and modules. Supabase table indexes reviewed before large dataset growth.
- **Observability:** Capture client errors via console logs; extend to logging provider (e.g., Sentry) in future phase. AI errors already persisted for analysis.
- **Localization:** UI copy currently English-only; structure strings to allow future localization.

## 9. Analytics & Success Measurement

| Metric | Definition | Data Source | Owner |
| --- | --- | --- | --- |
| Staff daily active users | Count of unique staff logins per weekday | Supabase auth logs | Creator / Platform Ops |
| Teacher attendance compliance | % teachers marking attendance by 9:00 AM | `attendance_logs` timestamps | Head/Admin |
| Leave request SLA | Average hours from submission to decision | `annual_leaves` `created_at` vs `decision_time` | Head of School |
| Behavior report volume | # incidents per week & per level | `behavior_reports` | Head/Counseling |
| AI usage | # AI commands executed, # validation failures | `ai_command_errors`, AI request logs | Creator/Admin |
| Announcement engagement | View counts / open rate (future) | To be instrumented | Admin |

Instrumentation backlog: integrate Supabase analytics dashboards or external BI tool; add event logging for key interactions (attendance submission, leave actions, AI command approvals).

## 10. Release & Rollout Strategy
1. **Internal Pilot (Creator + Admin):** Verify core flows, AI config, maintenance mode. Collect feedback on scheduling workflows.
2. **Leadership Launch (Head of School):** Enable head dashboard, reporting, and leave approvals. Provide quick reference guide.
3. **Teacher Rollout:** Train teachers on attendance, session management, leave requests, and behavior reporting. Offer sandbox data for practice.
4. **Stabilization:** Monitor logs, gather adoption metrics, iterate UI/UX improvements. Introduce instrumentation for analytics metrics.
5. **Phase 4 Enhancements:** Begin implementing roadmap items (attendance analytics, timetable builder upgrades, messaging) after stabilization KPIs met.

## 11. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- |
| Supabase service disruption | Users unable to log in or access data | Medium | Configure status alerts, prepare maintenance messaging, document manual fallback processes |
| Incorrect AI-generated schedules | Misassigned classes, teacher confusion | Medium | Mandatory human review & validation, error logging, restrict AI command execution to admin |
| Data privacy breach (student incidents) | Reputational & compliance risk | Low | Enforce RLS, limit access to behavior reports, review audit logs periodically |
| Low teacher adoption | Manual processes persist, data gaps | Medium | Provide training, highlight quick wins, monitor attendance compliance metric |
| Missing environment configuration | Build failures or AI disabled | Medium | Add deployment checklist, CI validation for required env vars |
| Maintenance mode misconfiguration | Unexpected downtime for staff | Low | Double-confirm toggles, display creator banner, document rollback steps |

## 12. Open Questions
- Should we enable password reset / forgot password flows through Supabase magic links or admin-managed resets?
- What retention policies apply to behavior reports and feedback (e.g., archival after academic year)?
- Do we need granular AI access per role beyond current "all" vs specific roles?
- Will announcements require attachments or rich text formatting in future?
- Should daily reports be emailed automatically or remain manual downloads?

## 13. Roadmap & Future Enhancements
**Near-Term (next 1–2 releases)**
- Timetable builder with drag-and-drop UI and conflict checks.
- Attendance tracking enhancements: reporting dashboard, absence alerts.
- Student records module with profiles and guardian contact details.
- Internal messaging system between staff roles.
- Push notifications using Supabase Realtime or OneSignal.
- Performance analytics dashboard for behavior, attendance, leave trends.
- Leave audit logs surfaced to leadership.

**Mid-Term (future phase)**
- Parent/guardian portal with read-only access to announcements and attendance.
- Dark mode toggle for accessibility.
- Activity/session history for security audits.
- Offline caching for key teacher workflows.
- Custom form builder for surveys and registrations.

**Long-Term / Exploratory**
- AI-driven lesson planner and reusable templates.
- Student feedback loop for weekly performance summaries.
- Sticky notes, dashboard quick actions, birthday reminders.
- Advanced exports (PDF, CSV) for all modules.
- Integration with third-party SMS/email providers for urgent alerts.

Roadmap aligns with items listed in `README.md` under Upcoming Features and should be revisited quarterly.

## Appendix A: Environment & Configuration
- **Environment Variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_SERVICE_ROLE` (server contexts), `VITE_OPENAI_API_KEY` or equivalent stored in Supabase `ai_settings`.
- **Deployment:** Vite build, deployable to Netlify (see `netlify.toml`). Ensure Netlify env matches production Supabase project.
- **Access Control:** Supabase RLS policies must be applied for each table to align with role expectations documented above.
- **Local Setup:** `npm install`, `npm run dev` for development; update `src/lib/supabase.ts` if environment changes.
- **Monitoring:** Configure Supabase logs and optionally external services (Sentry, Logflare) for client/server errors.

## Appendix B: Glossary
- **AI Assistant:** Full-page conversational interface sourcing responses from configured LLM to assist with scheduling and operations.
- **Creator:** Platform owner with unrestricted access, responsible for configuration and maintenance.
- **Head of School:** Leadership persona overseeing teacher operations, leave, and behavior.
- **RLS (Row-Level Security):** Supabase feature restricting data access per user role.
- **Class Session:** Real-time record of a teacher-led class, including start/end times and status.
- **Maintenance Mode:** System flag that restricts access for non-creators during maintenance windows.

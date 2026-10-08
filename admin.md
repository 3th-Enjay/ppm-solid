# Admin Operations Console Specification

Date: 2026-03-02  
Platform: Healthcare Training Platform  
Stack: Next.js App Router, TypeScript, TailwindCSS, `components/ui/*`, Recharts, role-based layouts, `/app/api/admin/*`

## Mission
Refactor `app/admin/*` from a feature dashboard into an institutional operations console that is:
- calm
- structured
- reliable
- audit-safe
- scale-ready

## Core Objectives
- Standardize workflows across admin pages.
- Improve operational clarity.
- Increase data reliability.
- Remove unsafe UI patterns.
- Prepare for scale with pagination/performance controls.
- Improve auditability and trust.
- Ensure consistency across all admin interactions.

## Admin UX Tone Rules
- Calm, professional, operational.
- Clear hierarchy and strong legibility.
- No marketing-style visuals.
- No gradients, glows, or decorative effects.
- State colors: green success, amber warning, red destructive.

## Execution Phases

### Phase 1 - Critical Interaction Standardization (Highest Priority)
- Remove all native `confirm()`, `alert()`, `prompt()` from admin flows.
- Introduce shared `components/admin/AdminActionDialog.tsx`.
- Dialog capabilities:
- title + description
- warning badge
- optional secondary explanation
- optional textarea input
- primary and cancel actions
- loading state
- success/error toast
- Use dialog for:
- suspend/activate user
- delete user
- refund payment
- approve/reject lesson
- delete course
- publish/unpublish and approval toggles

### Phase 2 - Shared Admin Primitives
- Build shared primitives:
- `AdminDataTable`
- `AdminFilterBar`
- `AdminStatRow`
- Standard requirements:
- server pagination
- server sorting
- URL-synced filters
- loading/empty/error states

### Phase 3 - Dashboard Redesign (Operations-First)
- Executive snapshot row (today/7d/30d controls).
- Operational queue as primary section.
- Insights preview cards only; full analysis in `/admin/analytics`.

### Phase 4 - Payments Upgrade
- Replace raw IDs with user identity context.
- Move currency normalization server-side.
- Add pagination/sorting.
- Refund dialog requires reason.
- Display refund audit metadata.

### Phase 5 - Users and Students Upgrade
- Unified list patterns and shared table.
- Add verification, activity, and lifecycle filters.
- URL-synced state and shareable views.

### Phase 6 - Courses and Moderation Upgrade
- Structured moderation states.
- Rejection dialog with required note and validation.
- Review-focused filtering and badges.

### Phase 7 - Settings Reliability
- Dirty-state detection.
- Unsaved-change warnings.
- Strong schema validation on server.
- Versioned settings audit log.
- Maintenance mode banner in shell.

### Phase 8 - Audit and Logging
- Expand `/api/admin/logs` schema:
- actor id/role
- action type
- entity type/id
- before/after partial states
- timestamp
- Logs UI: actor/action/date filters + pagination.

### Phase 9 - Performance and Scale
- Server-side pagination on all list pages.
- Avoid large client-side full loads.
- Incremental fetch and partial hydration.
- Skeleton loaders and non-waterfall data loading.

## Accessibility Rules
- Keyboard-navigable tables.
- Focus-trapped dialogs.
- ARIA labels on filters.
- Clear destructive contrast.
- 44px minimum touch targets.
- Accessible pagination controls.

## Code Architecture Rules
- No duplicate fetch logic for admin mutations.
- Centralized admin API utility layer.
- Zod validation for admin inputs.
- Strong typing from route to UI.
- Consistent error handling + toast feedback.

## Enterprise Readiness Checklist
- [x] No native browser dialogs in admin pages.
- [ ] No unpaginated large datasets.
- [ ] No client-side revenue normalization.
- [x] All admin mutations have explicit pending/disabled behavior.
- [ ] All filters are URL-synced.
- [ ] All destructive actions emit structured audit logs.

## Implementation Snapshot (2026-03-02)
- Added shared dialog component: `components/admin/AdminActionDialog.tsx`.
- Replaced native dialogs in:
- `app/admin/users/page.tsx`
- `app/admin/payments/page.tsx`
- `app/admin/courses/page.tsx`
- `app/admin/courses/[courseId]/edit/page.tsx`
- Added explicit mutation pending-state handling and double-submit prevention for updated flows.
- Standardized destructive and operational confirmation UX around one component and toast system.

## Immediate Next Work
1. Introduce `AdminDataTable`, `AdminFilterBar`, and `AdminStatRow`.
2. Move payments normalization and rollups to server responses.
3. Add URL query-state sync for all admin filters.
4. Expand `/api/admin/logs` to structured before/after payloads and paging.
5. Redesign `/admin` into executive snapshot + operational queue model.

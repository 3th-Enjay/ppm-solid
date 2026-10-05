# Instructor and Student Dashboard UI Working Doc

Date: 2026-04-15
Scope: instructor dashboard, student dashboard, supporting dashboard APIs, and near-term UI/product improvements.

## Status Update

### Phase 1

Status: Complete

Completed work:

- secured `payments` access with authenticated role-based scoping
- secured `notes` access with authenticated ownership checks
- removed broad unused student dashboard payments fetching
- updated dashboard callers to use authenticated scoped requests
- cleaned dashboard-facing encoding issues on student, instructor, and finance transaction surfaces
- verified the implementation with `pnpm -s tsc --noEmit`

### Phase 2

Status: In progress

Completed so far:

- student dashboard refactored around a primary next-action card
- instructor dashboard now includes a `Needs Attention` panel
- student dashboard layout aligned to the shared `RoleDashboardShell`
- finance transactions page encoding cleanup completed

Still in progress:

- standardizing loading, empty, and error states across dashboard pages
- continuing consistency improvements on secondary dashboard routes

## Purpose

This document captures the current findings from the dashboard scan so we can use it as a working source for UI and product improvements.

It focuses on:

- what is currently working
- the highest-risk issues
- the most valuable UX improvements
- a practical implementation order

## Current Snapshot

### Instructor side

Current routes reviewed:

- `app/instructor/page.tsx`
- `app/instructor/layout.tsx`
- `app/instructor/courses/page.tsx`
- `app/instructor/analytics/page.tsx`

Current strengths:

- instructor flow is coherent from dashboard to courses, analytics, settings, and creation
- shared shell usage is better standardized through `RoleDashboardShell`
- dashboard already exposes meaningful business metrics
- course cards provide clear edit and management entry points

### Student side

Current routes reviewed:

- `app/dashboard/page.tsx`
- `app/dashboard/layout.tsx`
- `app/dashboard/courses/page.tsx`
- `app/dashboard/certificates/page.tsx`
- related student profile and feed APIs

Current strengths:

- student dashboard has a rich learning-oriented surface
- progress, history, notes, and continuation flows are already connected
- profile completion and onsite training nudges are integrated into the dashboard
- dashboard-to-course-player path is straightforward

## Key Findings

### 1. Payments data needs tighter access control

The payments API currently loads all payments first and filters afterward. The student dashboard also calls `/api/payments` broadly and filters on the client.

Impact:

- privacy risk
- unnecessary payload size
- weaker long-term scalability

Relevant files:

- `app/api/payments/route.ts`
- `app/dashboard/page.tsx`
- `app/instructor/page.tsx`
- `app/instructor/analytics/page.tsx`

### 2. Notes API needs auth and ownership checks

The notes route currently trusts the `userId` provided by the client for read, create, and delete.

Impact:

- cross-user access risk
- weak trust boundary
- poor foundation for expanding learner notes later

Relevant file:

- `app/api/notes/route.ts`

### 3. Student history and activity are only partially real

Some timeline data is synthesized from enrollment timestamps rather than actual learning-event timestamps.

Impact:

- learner activity can look valid while being inaccurate
- dashboard trust drops when users notice inconsistent chronology
- analytics quality is limited

Relevant files:

- `app/api/history/route.ts`
- `app/api/activity/route.ts`

### 4. Instructor revenue reporting is not reliable enough yet

Revenue normalization is currently done on the client with duplicated hardcoded conversion assumptions.

Impact:

- reporting inconsistency
- finance mismatch risk
- duplication across instructor surfaces

Relevant files:

- `app/instructor/page.tsx`
- `app/instructor/analytics/page.tsx`

### 5. Student dashboard is rich but overloaded

The student dashboard includes profile prompts, onsite status, analytics charts, notes, history, activity, and continuation rails in a single view.

Impact:

- weak visual priority
- less obvious next step for the learner
- more cognitive load than necessary on return visits

Relevant file:

- `app/dashboard/page.tsx`

### 6. Student shell is less reusable than instructor shell

The instructor experience already uses a shared role shell, while the student layout still carries its own shell structure.

Impact:

- harder to keep role dashboards visually aligned
- duplicated shell maintenance
- slower future UI polish work

Relevant files:

- `app/dashboard/layout.tsx`
- `app/instructor/layout.tsx`

### 7. UI polish issues still remain

There are visible encoding artifacts in some strings and several places still use raw `img` tags where optimized image handling would be better.

Impact:

- lower perceived quality
- avoidable rendering inconsistency
- weaker accessibility and performance polish

Relevant files:

- `app/dashboard/courses/page.tsx`
- `app/instructor/page.tsx`
- `app/dashboard/page.tsx`

### 8. Certificates are still incomplete on the student side

The certificates page is currently a placeholder empty state rather than a true achievement surface.

Impact:

- incomplete learner journey
- weak payoff after course completion
- missed retention and motivation opportunity

Relevant file:

- `app/dashboard/certificates/page.tsx`

## Instructor UI Improvements

### Priority improvements for instructors

1. Make the dashboard action-first, not just metric-first.
2. Add a `Needs Attention` area for:
- draft courses
- low-rated courses
- courses with no recent enrollments
- lessons pending review or approval

3. Move revenue reporting to the backend and return normalized dashboard metrics from one trusted source.
4. Add deeper teaching insights:
- completion rate by course
- learner drop-off points
- last active learner signal
- course health status

5. Improve authoring productivity:
- autosave
- unsaved-change warning
- step or tab-based content editing
- duplicate course flow

6. Standardize loading, empty, and error states across instructor pages.

### Recommended instructor dashboard structure

Suggested top-to-bottom order:

1. Welcome and primary CTA
2. Needs Attention panel
3. High-level metrics
4. Course health and engagement charts
5. Recent courses with clear edit actions
6. Secondary tools such as settings and deeper analytics

## Student UI Improvements

### Priority improvements for students

1. Make the dashboard state-based around the single best next action:
- continue learning
- finish learner profile
- complete onsite payment
- browse first course

2. Reduce dashboard clutter by grouping secondary widgets behind tabs, collapsible cards, or progressive disclosure.
3. Turn notes into lesson-linked study notes, not only dashboard notes.
4. Replace synthetic history/activity with true event-driven records.
5. Build certificates into a real page with:
- earned certificates
- download action
- verification info
- milestone framing

### Recommended student dashboard structure

Suggested top-to-bottom order:

1. Welcome and primary next action
2. Continue learning rail
3. profile/payment/onboarding blocker card when relevant
4. progress summary
5. secondary activity widgets

## API and Architecture Recommendations

### Immediate backend improvements

1. Require auth on notes and payments access.
2. Enforce ownership checks server-side instead of trusting query params.
3. Add scoped dashboard endpoints for each role instead of assembling everything from multiple broad endpoints in the client.
4. Centralize instructor analytics and revenue reporting server-side.
5. Introduce real event logging for:
- lesson completion
- course progress changes
- note creation
- certificate issuance

## Priority Roadmap

### Phase 1: trust and correctness

Status: Complete

Completed items:

1. Secure `payments` access rules.
2. Secure `notes` access rules.
3. Stop broad client-side filtering of sensitive data.
4. Fix encoding artifacts in dashboard-facing strings.

### Phase 2: dashboard clarity

Status: In progress

Completed items:

1. Refactor student dashboard into clearer next-action sections.
2. Add instructor `Needs Attention` panel.
3. Align dashboard shell structure across roles.

Remaining items:

1. Standardize loading and empty states.
2. Continue consistency improvements on secondary dashboard pages.

### Phase 3: product depth

1. Build real certificates experience.
2. Add instructor course health analytics.
3. Add lesson-linked learner notes.
4. Replace synthetic activity/history with real events.

### Phase 4: productivity and polish

1. Improve instructor authoring workflow with autosave and section-based editing.
2. Replace remaining raw image usage in dashboard surfaces.
3. Tighten visual consistency across instructor and student experiences.

## Proposed Working Order

If we use this document as our implementation guide, the best next sequence is:

1. secure dashboard-sensitive APIs
2. simplify and prioritize student dashboard actions
3. improve instructor dashboard actionability
4. complete certificates and richer learner progress surfaces
5. refine authoring and analytics depth

## Notes

- The instructor side is structurally stronger today because its shell and workflow are more consistent.
- The student side is feature-rich, but it now needs simplification and stronger trust in the underlying data.
- The biggest improvement opportunity is not adding more widgets first. It is making each dashboard more trustworthy, more focused, and more actionable.


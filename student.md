# Student Module Audit

Date: 2026-03-02
Scope: `app/dashboard/*`, student-facing learning flow, and related API usage.

## 1) Current Student Functions

### Access and dashboard shell
- Student role gating in `app/dashboard/layout.tsx`.
- Dashboard shell includes:
- Desktop sidebar
- Sticky responsive header
- Mobile drawer navigation
- User panel and logout
- Student nav items:
- Dashboard
- My Courses
- Certificates
- Payments
- Profile

### Student dashboard (`app/dashboard/page.tsx`)
- Loads and aggregates:
- Enrollments with course info (`GET /api/enrollments?userId=...`)
- User payments (`GET /api/payments` then filtered)
- Learning history (`GET /api/history` with pagination)
- Activity feed (`GET /api/activity` with pagination)
- Personal notes (`GET /api/notes`)
- Dashboard features:
- KPI metric cards
- Progress analytics chart
- Status distribution chart
- Learning notes create/remove
- Paginated learning history/activity blocks
- Continue-learning rail with progress bars and deep links

### My courses (`app/dashboard/courses/page.tsx`)
- Lists enrolled courses with progress and duration.
- Entry point to course player (`/dashboard/courses/[courseId]/learn`).

### Course learning page (`app/dashboard/courses/[courseId]/learn/page.tsx`)
- Loads course and verifies user enrollment.
- Sidebar module/lesson navigator with progress display.
- Lesson player supports:
- YouTube embed when URL matches
- Native video fallback for direct media URL
- External resource link fallback
- Navigation controls:
- Previous/next lesson
- Mark complete (`PATCH /api/enrollments/[id]/progress`)

### Payments page (`app/dashboard/payments/page.tsx`)
- Shows student transaction history with course title mapping.
- Displays payment amount, method, status, date, reference.

### Profile page (`app/dashboard/profile/page.tsx`)
- Profile tabs for general and security.
- Security tab supports password update (`POST /api/users/password`).
- General tab currently updates local UI state and toast only (no persistence API call).

### Certificates page (`app/dashboard/certificates/page.tsx`)
- Placeholder empty state (no listing/download flow yet).

### Student APIs currently used
- `GET /api/enrollments`, `PATCH /api/enrollments/[id]/progress`
- `GET /api/payments`
- `GET /api/history`, `GET /api/activity`
- `GET/POST/DELETE /api/notes`
- `POST /api/users/password`

## 2) Current Style Guide (As Implemented)

### Shared design and components
- Built on global tokenized theme from `app/globals.css`.
- Student shell uses dedicated dashboard header + nav components.
- Uses shared primitives:
- Card, Button, Progress, Input, Select, Tabs, Badge, Accordion
- Uses Recharts for progress and status analytics.

### Interaction patterns
- Responsive role-dashboard layout with sticky nav/header.
- Card-based widgets and chart sections.
- Contextual continuation patterns in learning dashboard.
- Feed-like history/activity sections with load-more controls.

### Motion and visual tone
- Light motion and hover transitions.
- Utility-first spacing and typographic hierarchy consistent with broader app.

## 3) Student UI Review

### What is working well
- Student dashboard combines learning progress, activity, and quick continuation effectively.
- Learning player supports multiple content URL types with fallback behavior.
- Notes/history/activity add useful continuity for learners.
- Navigation and role-gating are coherent.

### Gaps and risks
- Profile general settings do not persist to backend yet.
- Certificates page is only a placeholder.
- Notes/history/activity endpoints rely on `userId` query usage and need stronger auth enforcement to prevent cross-user reads/writes.
- Learning page progress updates are fire-and-forget with limited error feedback.
- Payments page pulls all courses to map titles; could be optimized server-side.
- Some textual separators/symbols show encoding artifacts in UI.

## 4) Improvement Plan (Prioritized)

### Priority 1: trust and correctness
1. Persist profile general updates via secure user update API.
2. Enforce auth ownership checks in notes/history/activity endpoints.
3. Add robust error handling and retry feedback for progress updates.

### Priority 2: learning workflow depth
1. Implement notes tied to specific lessons with quick in-player access.
2. Add lesson completion checkpoints and resume-from-last-position support.
3. Add course completion timeline and milestone indicators.

### Priority 3: product completeness
1. Implement real certificate listing/download/verification UX.
2. Add payment invoice download and richer receipt details.
3. Add saved dashboard filters/time windows for analytics widgets.

### Priority 4: performance and UX consistency
1. Move expensive mapping operations (course title hydration) server-side.
2. Add pagination/infinite strategies for enrollments and feeds at scale.
3. Standardize loading/empty/error states and fix encoding artifacts.

## 5) Suggested Near-Term Delivery Sequence
1. Wire profile general save to backend with validation and success/error states.
2. Harden notes/history/activity APIs with auth ownership checks.
3. Implement first version of certificates list + download action.
4. Improve learning player completion feedback and resilient progress sync.
5. Optimize student payments and dashboard data aggregation endpoints.

## 6) Reference Files
- `app/dashboard/layout.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/courses/page.tsx`
- `app/dashboard/courses/[courseId]/learn/page.tsx`
- `app/dashboard/payments/page.tsx`
- `app/dashboard/profile/page.tsx`
- `app/dashboard/certificates/page.tsx`
- `app/api/enrollments/route.ts`
- `app/api/enrollments/[id]/progress/route.ts`
- `app/api/payments/route.ts`
- `app/api/history/route.ts`
- `app/api/activity/route.ts`
- `app/api/notes/route.ts`
- `app/api/users/password/route.ts`
- `app/globals.css`
- `components/skillup/dashboard-nav.tsx`
- `components/skillup/dashboard-header.tsx`

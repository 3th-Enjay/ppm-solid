# Instructor Module Audit

Date: 2026-03-02
Scope: `app/instructor/*`, instructor-related API usage, and shared UI/style infrastructure.

## 1) Current Instructor Functions

### Access and layout shell
- Instructor role-gated layout in `app/instructor/layout.tsx`.
- Shared role shell provides:
- Desktop sidebar + sticky top header
- Mobile drawer navigation
- Avatar menu and logout
- Nav items:
- Dashboard
- My Courses
- Create Course
- Analytics
- Settings

### Instructor dashboard (`app/instructor/page.tsx`)
- Loads instructor courses (`GET /api/courses?instructorId=...&includeDrafts=true`).
- Loads enrollments/payments for instructor course IDs.
- Computes stats:
- Total courses
- Unique students
- Total enrollments
- Average rating
- Revenue estimate (NGN conversion)
- Displays analytics charts:
- Enrollment by course
- Course quality trend
- Includes quick actions and recent course cards with view/edit actions.

### Instructor analytics (`app/instructor/analytics/page.tsx`)
- Extended metrics view for instructor performance.
- Charts:
- Enrollment by course
- Course quality line chart
- Enrollment completion mix pie chart

### Instructor courses index (`app/instructor/courses/page.tsx`)
- Lists all instructor courses.
- Actions:
- View public course page
- Edit content
- Edit details
- Create new course

### Course creation (`app/instructor/courses/new/page.tsx`)
- Form sections for:
- Details (title, description, category, level)
- Pricing (NGN/USD/EUR/GBP)
- Media (thumbnail upload + duration)
- First lessons with YouTube URL and preview
- Publish toggle
- Category create/rename support from within form.
- Saves to `POST /api/courses`.

### Course details editor (`app/instructor/courses/[courseId]/edit/page.tsx`)
- Loads course + categories.
- Edits title, description, overview, category/level, pricing, thumbnail, duration, publish state.
- Supports category creation from editor.
- Supports course deletion with confirmation dialog.
- Saves to `PUT /api/courses/[id]`.

### Course content editor (`app/instructor/courses/[courseId]/content/page.tsx`)
- Module and lesson authoring:
- Add/remove modules
- Add/remove lessons
- Lesson type control (`video`, `article`, `quiz`, `assignment`)
- Lesson duration/free preview settings
- Video URL and embedded preview
- Resource list add/edit/remove
- Supports lesson review state controls (`pendingApproval`, `approved`, rejection note handling).
- Saves content + price updates via `PUT /api/courses/[id]`.

### Instructor settings (`app/instructor/settings/page.tsx`)
- Profile updates for name, bio, avatar (`PATCH /api/users/[id]`).

### Instructor helper and alias routes
- Upload guide (`app/instructor/upload/page.tsx`) describing YouTube workflow.
- Alias redirects:
- `/instructor/create-course` -> `/instructor/courses/new`
- `/instructor/edit-course/[courseId]` -> `/instructor/courses/[courseId]/edit`

### Instructor APIs currently used
- `GET/POST /api/courses`
- `GET/PUT/DELETE /api/courses/[id]`
- `POST /api/categories`, `PUT /api/categories/[id]`, `GET /api/categories`
- `GET /api/enrollments` (filtered by course IDs)
- `GET /api/payments` (filtered by course IDs)
- `PATCH /api/users/[id]`

## 2) Current Style Guide (As Implemented)

### Shared design system usage
- Instructor surfaces use global tokens from `app/globals.css`.
- Uses shared UI primitives extensively:
- Card, Button, Input, Textarea, Label, Select, Checkbox, Alert, Badge, Dialog
- Uses chart wrappers (`RoleAnalyticsCard`) and Recharts for metrics.

### Layout and interaction patterns
- Uses `RoleDashboardShell` for consistency with other role consoles.
- Follows card-heavy information architecture and grid-driven layout.
- Includes practical inline workflow help for course creation/editing.

### Content authoring UX profile
- Rich but dense forms with many controls in single pages.
- Strong use of inline feedback (alerts, previews, badges).

## 3) Instructor UI Review

### What is working well
- End-to-end instructor lifecycle exists: create, edit details, edit content, publish.
- Content editor supports multiple lesson types and resources.
- Analytics and dashboard views provide meaningful teaching signals.
- Alias routes reduce broken links from older URLs.

### Gaps and risks
- Revenue conversion uses hardcoded client-side exchange assumptions.
- Content editor is large and can overwhelm users without section collapse/step flow.
- Some save/error feedback is generic; API field-level errors are not consistently surfaced.
- Mixed quality of loading/error states across pages.
- Uses direct `img` tags in several places instead of optimized image component.
- Some text/currency symbols show encoding artifacts in UI output.

## 4) Improvement Plan (Prioritized)

### Priority 1: authoring quality and reliability
1. Split content editor into tabs/steps (modules, lesson settings, resources, pricing).
2. Add granular validation + inline field errors for lesson URLs and required metadata.
3. Add save-state indicators per section and unsaved-change protection.

### Priority 2: workflow performance
1. Add autosave drafts for details/content editor.
2. Add server-side pagination/virtualization for large module/lesson structures.
3. Add course duplicate/clone workflow for faster content production.

### Priority 3: analytics and trust
1. Move revenue normalization to backend and expose consistent reporting fields.
2. Expand analytics with completion rate per module and drop-off hotspots.
3. Add review queue panel for rejected/pending lessons with actionable filters.

### Priority 4: UX consistency
1. Standardize loading/empty/error components across instructor pages.
2. Replace long vertical forms with progressive disclosure.
3. Normalize media and symbol rendering, and ensure encoding-safe formatting.

## 5) Suggested Near-Term Delivery Sequence
1. Refactor content editor into sectional tabs with per-section save states.
2. Add stronger validation/feedback for lesson and pricing forms.
3. Implement autosave draft behavior for course editing.
4. Move revenue/reporting math server-side.
5. Run focused UX QA for instructor create/edit content journeys.

## 6) Reference Files
- `app/instructor/layout.tsx`
- `app/instructor/page.tsx`
- `app/instructor/analytics/page.tsx`
- `app/instructor/courses/page.tsx`
- `app/instructor/courses/new/page.tsx`
- `app/instructor/courses/[courseId]/edit/page.tsx`
- `app/instructor/courses/[courseId]/content/page.tsx`
- `app/instructor/settings/page.tsx`
- `app/instructor/upload/page.tsx`
- `app/instructor/create-course/page.tsx`
- `app/instructor/edit-course/[courseId]/page.tsx`
- `app/api/courses/route.ts`
- `app/api/courses/[id]/route.ts`
- `app/api/enrollments/route.ts`
- `app/api/payments/route.ts`
- `app/globals.css`
- `components/skillup/role-dashboard-shell.tsx`
- `components/skillup/role-analytics-card.tsx`

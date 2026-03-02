# Finance Module Audit

Date: 2026-03-02
Scope: `app/finance/*`, finance-related API usage, and shared UI/style infrastructure.

## 1) Current Finance Functions

### Access and layout shell
- Finance role-gated layout is enforced in `app/finance/layout.tsx`.
- Shared role shell provides:
- Desktop sidebar nav
- Sticky header
- Mobile drawer
- Avatar/logout controls
- Configured nav items:
- Dashboard (`/finance`)
- Transactions (`/finance/transactions`)
- Reports (`/finance/reports`)
- Settings (`/finance/settings`)

### Finance dashboard (`app/finance/page.tsx`)
- Loads payments dataset (`GET /api/payments`) and computes:
- Revenue by NGN/USD/GBP
- Transaction status counts
- Daily and monthly NGN-estimated revenue
- Unique paying users
- Renders KPI cards with trend indicators.
- Supports transaction filtering:
- Search
- Status
- Currency
- Displays a recent transaction table.
- Includes password change flow (`POST /api/users/password`).
- Includes analytics cards/charts:
- Revenue by currency
- Payment status mix

### Transactions page (`app/finance/transactions/page.tsx`)
- Full payment list with filters and sort.
- Revenue/status summary cards.
- Table columns:
- Reference
- Student ID
- Amount
- Currency
- Status
- Date
- CSV export from filtered dataset.

### Reports page (`app/finance/reports/page.tsx`)
- Aggregated reporting metrics:
- Total revenue (NGN estimate)
- Monthly revenue
- Total transactions
- Successful transactions
- Analytics visualizations:
- Currency revenue bar chart
- Payment status pie chart
- Monthly revenue trend line chart
- Placeholder export queue buttons (CSV/Excel/PDF).

### Finance APIs currently used
- `GET /api/payments`
- List/filter by `userId`, `status`, `currency`, `courseId`, `courseIds`, `reference`.
- `PATCH /api/payments/[id]`
- Updates payment status (including `refunded`) and triggers refund processing.
- `POST /api/users/password`
- Password update with validation and auth checks.

## 2) Current Style Guide (As Implemented)

### Shared design system usage
- Finance pages are built on the global token system in `app/globals.css`.
- Uses semantic color tokens (`--primary`, `--accent`, `--muted`, etc.) and theme-aware surfaces.
- Uses shared `components/ui/*` primitives:
- Card, Button, Input, Select, Badge, Alert, Label

### Layout and visual language
- Relies on `RoleDashboardShell` for consistent role-console experience.
- Uses dense dashboard cards, filter bars, and data tables.
- Applies chart components through `RoleAnalyticsCard` + Recharts.
- Visual style is coherent with admin/instructor dashboards.

### Typography and interaction
- Standard heading hierarchy with utility classes and display font from global theme.
- Micro-interactions include hover highlights, badges, transitions, and sticky shell behavior.

## 3) Finance UI Review

### What is working well
- Finance workflows are centered around real operational tasks (monitoring, filtering, exports).
- Dashboard and transactions views are functionally complete.
- Charting coverage is good for quick trend inspection.
- CSV export is already available in transactions.

### Gaps and risks
- Finance nav includes `/finance/settings`, but no `app/finance/settings/page.tsx` exists.
- Currency conversion to NGN is hardcoded in frontend, risking inaccurate reporting.
- `GET /api/payments` currently has no route-level auth check, despite finance-sensitive data.
- Dashboard includes an `Export Report` button without wired behavior.
- Student context in tables is raw `userId` instead of readable user identity.
- Several currency symbols render with encoding artifacts in UI strings.

## 4) Improvement Plan (Prioritized)

### Priority 1: correctness and security
1. Add route authorization and role checks for finance-relevant payment endpoints.
2. Move currency normalization logic server-side and expose canonical reporting fields.
3. Implement or remove `/finance/settings` navigation target to avoid dead navigation.

### Priority 2: operational usability
1. Resolve `userId` to user name/email in finance tables.
2. Add pagination and server-side filtering for large transaction sets.
3. Add actionable transaction detail drawer/page (metadata, timeline, refund notes).

### Priority 3: UX consistency
1. Replace placeholder export actions with real export jobs or remove temporary buttons.
2. Standardize empty/loading/error states across finance pages.
3. Fix currency symbol encoding and normalize formatting via shared utility functions.

### Priority 4: scale and observability
1. Add date-range filters and report presets (today, 7d, 30d, custom).
2. Add audit events for refunds/overrides and expose them in finance reporting.
3. Add background export jobs for large CSV/Excel/PDF reports.

## 5) Suggested Near-Term Delivery Sequence
1. Add role auth checks to payment APIs and validate finance access paths.
2. Implement `/finance/settings` or remove the nav item.
3. Refactor currency/revenue math to backend response fields.
4. Add paginated transaction table with user identity joins.
5. Wire real report exports and finalize finance QA pass.

## 6) Reference Files
- `app/finance/layout.tsx`
- `app/finance/page.tsx`
- `app/finance/transactions/page.tsx`
- `app/finance/reports/page.tsx`
- `app/api/payments/route.ts`
- `app/api/payments/[id]/route.ts`
- `app/api/users/password/route.ts`
- `app/globals.css`
- `components/skillup/role-dashboard-shell.tsx`
- `components/skillup/role-analytics-card.tsx`

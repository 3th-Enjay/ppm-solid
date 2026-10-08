# Course UI Audit & Improvement Plan

## Scope
- Public course list page: `app/(public)/courses/page.tsx`
- Public course detail page: `app/(public)/courses/[slug]/page.tsx`
- Related UI components:
  - `components/skillup/course-card.tsx`
  - `components/skillup/filter-panel.tsx`

## Current Behavior

## 1) Public Course List (`/courses`)
- Loads courses from `/api/courses` and categories from `/api/categories`.
- Supports:
  - search (title/description)
  - category filter
  - level filter
  - sorting (popular, rating, price low/high)
- Uses responsive filter UX:
  - desktop sidebar filter panel
  - mobile filter sheet
- Course cards show:
  - thumbnail
  - level/category
  - rating/enrollment
  - duration
  - price in selected currency
- Add-to-cart behavior:
  - blocks duplicate cart entries
  - blocks already-enrolled courses
  - currently allows add-to-cart whether authenticated or not

## 2) Public Course Detail (`/courses/[slug]`)
- Loads selected course by slug and related courses by category.
- Displays:
  - hero summary (title, category, level, rating, duration, enrollment)
  - instructor snippet
  - promo media panel
  - curriculum tabs (curriculum, overview, instructor)
  - sticky purchase sidebar
- Purchase actions:
  - `Buy Now` adds to cart (if needed) then routes to `/cart`
  - `Add to Cart` adds directly
  - enrolled users go to `/dashboard`
  - currently allows cart/checkout flow without forcing authentication at interaction point

## Current UI Style Guide (Observed)
- Visual language:
  - clean card-based layout
  - muted neutral backgrounds
  - green accent available but mostly secondary in course flow
- Typography:
  - bold section headers and concise supporting body text
- Motion:
  - reveal motion via existing `fadeUp` usage
  - no strong cinematic transitions yet on courses
- Interaction:
  - straightforward utility-first behavior
  - clear list/detail information hierarchy

## How Courses Work in the App
- Discovery:
  - user browses and filters on `/courses`
- Evaluation:
  - user opens detail page for curriculum, instructor, and outcomes
- Intent:
  - user adds course to cart or clicks buy-now
- Conversion:
  - user is routed to cart/checkout flow
- Post-purchase:
  - enrolled user accesses training in `/dashboard`

## Key UX Gap (Important)
- Current flow does not explicitly require account creation before initiating purchase actions in public course pages.
- This can create friction later and weaker identity capture for admissions/enrollment lifecycle.

## Recommended Improvement: Account-Required Purchase Gating
- Goal:
  - users should not be able to purchase/add paid course without an account
  - unauthenticated purchase intent should prompt registration/login first

## Proposed Behavior
1. User clicks `Buy Now` or `Add to Cart` on list/detail page.
2. If user is not authenticated:
- Show prompt modal/sheet:
  - title: `Create an account to continue`
  - message: explain account is required for secure enrollment/progress tracking
  - actions:
    - `Register` (primary) -> `/register?next=<current-course-or-cart-target>`
    - `Login` (secondary) -> `/login?next=<current-course-or-cart-target>`
3. After successful auth:
- redirect to `next`
- continue with purchase/cart action

## Suggested Implementation Notes
- Centralize guard logic in a shared helper (used by list + detail).
- Preserve existing already-enrolled and duplicate-cart checks.
- Keep CTA copy warm and conversion-focused, not blocking/harsh.
- Ensure the prompt is keyboard accessible and mobile friendly.

## Suggested Public Course UI Improvements (Next Iteration)
1. Add cinematic section rhythm to `/courses`:
- stronger top hero + trust line + active filter chips
2. Improve card interaction polish:
- overlay gradient on thumbnails
- clearer hover states for price and CTA
3. Upgrade detail purchase sidebar:
- clearer value stack (outcomes, certification, support)
- stronger confidence signals above CTA
4. Add account-required purchase gating UX (high priority)

## Delivery Note
- This document captures current behavior and recommended next-step improvements.
- No code behavior changes were applied in this step.

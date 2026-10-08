# Onboarding Implementation Blueprint

This document turns `onboarding-prompt.md` into a build plan.
It assumes the current auth model stays intact.

## Status

Phases 0 through 6 are implemented in the codebase.
This document now also records how closely the delivered system matches `onboarding-prompt.md`, what is fully complete, what is partial, and what remains worth improving.

## Prompt Fulfillment Review

### Overall verdict

The current implementation fulfills the core architecture and most of the user-flow requirements in `onboarding-prompt.md`.

Best short summary:
- backend correctness requirements are satisfied
- the unified student signup model is in place
- instructor onboarding is aligned to the same system
- OTP, welcome screens, onboarding state, and dashboard onsite flow are implemented
- a few UX-detail requirements are only partially fulfilled, not fully complete

### Fully fulfilled

- OTP-first registration remains intact
- no real public user is created before OTP verification
- pending registration model remains intact
- one canonical public student signup route exists
- `/register-online` and `/register-onsite` no longer act as primary public flows
- instructor signup uses the same shared onboarding system quality
- OTP screen has role-aware copy, resend cooldown, next-step messaging, and change-email path
- student welcome screen exists after verification
- instructor welcome screen exists after verification
- onboarding state is persisted and used by welcome/dashboard experiences
- onsite training was moved into the authenticated dashboard flow
- onsite banner and sidebar-style dashboard entry exist
- onsite payment initializes from authenticated user context
- course access outcome follows the onsite-paid versus regular-student model
- heavier profile fields were deferred out of public signup
- unverified-login recovery behavior remains intact

### Partially fulfilled

These are implemented in spirit, but not fully to the exact prompt wording.

#### 1. Student step granularity

Prompt intent:
- one input per screen or very tight micro-step flow

Current implementation:
- uses a guided stepper with grouped fields per step
- account step groups name, email, password, confirm password
- contact step groups phone and WhatsApp

Assessment:
- good UX improvement and clearly guided
- not literally one-input-per-screen

#### 2. Instructor step breakdown

Prompt intent:
- separate teaching basics and expertise summary steps

Current implementation:
- instructor flow is guided and reduced
- but it is slightly more compressed than the most granular version described in the prompt

Assessment:
- functionally aligned
- step granularity could still be refined further if desired

#### 3. "AI assistant" behavior in signup

Prompt intent:
- explain secure login
- show email preview
- validate in real time in a more assistant-like way

Current implementation:
- includes guided copy, review step, password visibility, and validation
- but there is no actual assistant layer or adaptive helper behavior

Assessment:
- partially fulfilled through UX guidance
- not a literal assistant implementation

#### 4. Keyboard-navigation-specific polish

Prompt intent:
- explicit keyboard-friendly onboarding behavior

Current implementation:
- autofocus is present
- standard form navigation works
- but there is no dedicated keyboard shortcut or explicit keyboard-navigation system called out in code

Assessment:
- acceptable baseline
- not a full deliberate keyboard-optimized pass yet

#### 5. Success-state normalization beyond onboarding

Prompt intent:
- replace weak toast and auto-redirect patterns with clearer next-step screens consistently

Current implementation:
- student and instructor signup now use explicit OTP and welcome steps
- but some surrounding flows still retain toast-style feedback in places

Assessment:
- core onboarding path is normalized
- broader app consistency can still improve

### Not fully delivered yet

These are the main gaps relative to the strongest interpretation of the prompt.

- no dedicated draft recovery for partially completed signup steps beyond normal in-memory flow
- `/dashboard/profile/setup` now exists as the guided post-signup profile completion flow
- no literal assistant-style email preview helper layer in signup
- the legacy `/register-onsite/success` compatibility route has been retired
- the workspace-root warning is resolved through explicit Next.js turbopack root configuration

## Non-Negotiable Rules

1. OTP email must be sent successfully before a public pending registration is stored.
2. No real public user record is created before OTP verification succeeds.
3. The unverified-login recovery path must remain available.
4. Existing pending registration to payment reassociation must remain intact during migration.
5. Legacy routes must keep working until the new flow is fully rolled out.

## Target Experience Summary

### Student

1. User opens one public student signup route.
2. User completes a short guided stepper.
3. Backend creates a pending registration only after OTP send succeeds.
4. User verifies OTP.
5. Real user is created.
6. User lands on a welcome screen before the dashboard.
7. Onsite training is offered later inside the authenticated student product.

### Instructor

1. User opens the instructor signup route.
2. User completes the same onboarding shell with instructor-specific steps.
3. Backend creates a pending registration only after OTP send succeeds.
4. User verifies OTP.
5. Real instructor user is created.
6. User lands on an instructor welcome screen before the workspace.

## Route Changes

| Current Route | Target Route | Change | Notes |
| --- | --- | --- | --- |
| `/register` | `/register` | repurpose | becomes the single public student signup stepper |
| `/register-online` | `/register` | redirect | keep legacy route, redirect to canonical student signup |
| `/register-onsite` | `/register` | redirect | remove public onsite branch from signup entry |
| `/register-instructor` | `/register-instructor` | redesign in place | keep route, rebuild with shared onboarding shell |
| `/verify-otp` | `/verify-otp` | enhance in place | same backend path, role-aware UI and stronger state handoff |
| `/register-onsite/success` | `/dashboard/onsite-training/success` | retired | authenticated onsite success now lives in dashboard context only |
| none | `/welcome/student` | add | first-login landing after student OTP verification |
| none | `/welcome/instructor` | add | first-login landing after instructor OTP verification |
| none | `/dashboard/onsite-training` | add | authenticated onsite information and payment page |
| none | `/dashboard/profile/setup` | add | guided learner profile completion flow inside the authenticated dashboard |

## Phase Status

## Phase 0: Stabilize contracts and instrumentation

Status: implemented

- analytics and onboarding shell groundwork added
- OTP timing and feature control flags introduced

## Phase 1: Shared onboarding shell and OTP upgrade

Status: implemented

- shared stepper layout shipped
- OTP page upgraded with timer, role-aware copy, and change-email path

## Phase 2: Student signup consolidation

Status: implemented

- `/register` is the canonical student signup route
- public `/register-online` and `/register-onsite` redirect safely
- student signup uses the minimal contract

## Phase 3: Post-verification welcome and progressive profile

Status: implemented

- `/welcome/student` and `/welcome/instructor` exist
- onboarding state endpoint and persisted state are in place

## Phase 4: Move onsite into authenticated dashboard flow

Status: implemented

- onsite payment starts inside the authenticated dashboard
- dashboard onsite route and success route are live
- canonical onsite initialization uses the authenticated user context

## Phase 5: Instructor onboarding convergence

Status: implemented

- instructor signup uses the shared onboarding shell
- instructor signup was reduced to essential fields
- instructor welcome/checklist flow is live

## Phase 6: Legacy cleanup and hardening

Status: implemented

- legacy student and instructor form components retired
- old student union validation branches removed
- extra onsite dashboard init wrapper route removed
- docs updated to reflect the current route map

## Recommended Improvement Backlog

1. Add draft persistence for signup step state so users can recover partial progress after refresh or interruption.
2. Add a dedicated profile-setup route if we want a tighter post-welcome completion funnel.
3. Refine student and instructor steppers into even smaller micro-steps if we want closer adherence to the original UX prompt.
4. Add stronger inline helper behavior such as email preview, password strength cues, or assistant-style contextual hints.
5. Remove `/register-onsite/success` once the compatibility window is no longer needed.
6. Clean up the multiple-lockfile workspace-root warning in the build environment.

## Remaining compatibility surfaces

- `/register-online` redirect
- `/register-onsite` redirect
- `/register-onsite/success` compatibility page
- legacy pending-registration payment reassociation for historic flows

## QA and verification checklist

- student can sign up with minimal fields and reaches OTP
- instructor can sign up with reduced fields and reaches OTP
- failed OTP send does not persist a pending registration
- login still redirects unverified users to OTP
- legacy `/register-online` and `/register-onsite` links resolve safely
- new `/verify-otp` works from direct URL entry with `email` and `role`
- authenticated onsite payment works for the dashboard flow
- welcome screens only appear on intended first-login states

## Decision log items still open

1. Whether step state should also be recoverable from draft local storage before submit.
2. Whether onboarding state belongs on the user record or a separate onboarding collection.
3. Whether `/dashboard/profile/setup` should exist as a dedicated page or remain embedded in dashboard widgets.
4. Whether instructor specialties should be stored as a string array immediately or normalized later.
5. Whether any additional legacy redirects can now be retired after usage monitoring.

# Onboarding Completion Plan (Phase-by-Phase Execution)

## Goal

Move from:

? Functionally complete onboarding system

To:

?? Polished, conversion-optimized, production-grade onboarding experience

## Phase 7: UX Refinement and Micro-Interaction Upgrade

Objective:
Tighten the current experience without breaking existing flows.

Tasks:
1. Convert stepper to micro-step flow (optional but high impact).
2. Add inline smart assistance (light AI UX).
3. Improve keyboard UX.
4. Add step transitions, checkmarks, and loading states.

Exit criteria:
Flow feels guided, not form-heavy.
No visual clutter.
Smooth transitions across all steps.

## Phase 8: Draft Persistence and Recovery

Objective:
Prevent drop-offs and improve resilience.

Tasks:
1. Save draft step data to local storage or IndexedDB.
2. On reload, detect drafts and prompt to continue.
3. Clear draft after signup success or after 24 hours.

Exit criteria:
Users never lose progress mid-signup.
Recovery works across refresh or browser close.

## Phase 9: Profile Completion Funnel

Status: implemented

Objective:
Move remaining fields into a clear, guided post-signup flow.

Tasks:
1. Create `/dashboard/profile/setup` (recommended).
2. Add profile completion tracker.
3. Add profile completion nudges.

Exit criteria:
Heavy fields remain out of signup entirely.
Profile completion becomes a guided funnel.

## Phase 10: Onsite Training Conversion Optimization

Status: implemented

Objective:
Turn onsite training into a high-converting upgrade funnel.

Tasks:
1. Improve dashboard banner with icon, CTA, and dismiss persistence.
2. Enhance onsite page with benefits, comparison, and testimonials (optional).
3. Add conversion triggers such as countdown, limited slots, and enrollment count.

Exit criteria:
Onsite page feels like a premium offer page.
Clear upgrade path for users.

## Phase 11: Success State Standardization

Objective:
Remove inconsistent feedback patterns across the app.

Tasks:
1. Replace toast-only success with dedicated success screens or states.
2. Normalize critical flows with clear results and next-step CTAs.

Exit criteria:
No confusing transitions.
Users always know what to do next.

## Phase 12: Legacy Cleanup (Safe Removal Phase)

Objective:
Remove technical debt safely.

Tasks:
1. Remove `/register-onsite/success` after the validation window.
2. Resolve the multiple lockfile warning and workspace root config.
3. Remove dead redirects after monitoring usage.

Exit criteria:
No legacy routes actively used.
Clean build pipeline.

## Phase 13: Advanced UX Enhancements (Polish Layer)

Objective:
Push the system to premium SaaS UX.

Tasks:
1. Add global search (optional).
2. Add smart recommendations.
3. Add a notification system for payments and onboarding updates.

Exit criteria:
Product feels intelligent and responsive.

## Phase 14: Analytics and Optimization

Objective:
Make onboarding measurable and improvable.

Tasks:
1. Track drop-off per step, OTP success rate, and onsite conversion rate.
2. Add a funnel dashboard (admin side optional).

Exit criteria:
You can answer where users drop off and what converts best.

## Phase 15: QA, Edge Cases, and Hardening

Objective:
Ensure production stability.

Tasks:
1. Test OTP failure scenarios, payment edge cases, session loss, duplicate signup.
2. Fix email persistence reliability and retry flows.

Exit criteria:
System is stable under all edge cases.

## Final Execution Strategy

Recommended order:
1. Phase 7 (UX polish)
2. Phase 8 (draft recovery)
3. Phase 9 (profile funnel)
4. Phase 10 (onsite optimization)
5. Phase 11 (success states)
6. Phase 12 (cleanup)
7. Phase 14 (analytics)
8. Phase 15 (QA hardening)

## Final Outcome

After these phases, the system becomes:
- fast to start (= 1 min signup)
- guided (step-by-step, no overwhelm)
- monetized (onsite funnel)
- resilient (draft + recovery)
- measurable (analytics-driven)

# Implementation Plan (No Skipped Steps)

This section expands phases 7 to 15 into concrete, ordered execution steps.
Each step is intentionally small enough to implement, review, and verify before moving forward.

## Phase 7: UX Refinement and Micro-Interaction Upgrade

Status: implemented

Execution steps:
1. Split student onboarding into micro-steps with one or two related inputs per step.
2. Split instructor onboarding into micro-steps aligned to the same micro-step philosophy.
3. Add inline helper text for email, password, name preview, and role-specific guidance.
4. Add password strength indicator using a lightweight score and progress UI.
5. Add keyboard navigation: Enter advances, Escape goes back, avoid interfering with textarea.
6. Keep the existing step transition animation in the shell and ensure steps animate between transitions.
7. Confirm that step completion checkmarks and button loading states still render correctly.
8. Verify micro-step flow still uses the same backend contracts and OTP handoff.

Files touched:
- components/auth/guided-student-registration-form.tsx
- components/auth/guided-instructor-registration-form.tsx
- components/auth/onboarding-shell.tsx (kept, already handles motion)

Verification:
- `pnpm -s tsc --noEmit`
- manual UX pass: check Enter advances, Escape goes back, step counts update, helpers render

## Phase 8: Draft Persistence and Recovery

Execution steps:
1. Add a `useOnboardingDraft` helper that stores and loads draft state for student and instructor flows.
2. Store draft after every field change with a timestamp.
3. On page load, check for a draft and show a resume prompt.
4. If accepted, restore form state and step index.
5. Clear draft after successful OTP submission or after 24 hours.

Files to add or update:
- components/auth/guided-student-registration-form.tsx
- components/auth/guided-instructor-registration-form.tsx
- lib/onboarding-draft.ts (new)
- components/auth/onboarding-shell.tsx (optional: add a restore banner slot)

Verification:
- reload with draft present shows resume prompt
- draft clears after successful registration
- draft expires after 24 hours

## Phase 9: Profile Completion Funnel

Status: implemented

Execution steps:
1. Create `/dashboard/profile/setup` as a guided stepper for deferred fields.
2. Build a lightweight profile completion tracker using `api/onboarding/state`.
3. Add a profile completion card or banner in dashboard/home to drive traffic to the setup flow.
4. Update welcome screens to optionally deep link to the profile setup flow.

Files to add or update:
- app/dashboard/profile/setup/page.tsx (new)
- app/api/onboarding/state/route.ts (extend for profile completion progress updates)
- app/dashboard/page.tsx (add profile completion CTA)
- app/welcome/student/page.tsx

Verification:
- profile setup saves data to the existing profile endpoint
- completion percent updates after save

## Phase 10: Onsite Training Conversion Optimization

Status: implemented

Execution steps:
1. Enhance the dashboard banner copy, icon, and CTA layout.
2. Expand `/dashboard/onsite-training` with benefits, comparison, and testimonials section.
3. Add conversion triggers such as countdown, limited slots, or enrollment count.
4. Ensure dismiss persistence still works through onboarding state.

Files to add or update:
- components/skillup/onsite-training-banner.tsx
- app/dashboard/onsite-training/page.tsx
- lib/onboarding-state.ts (if new fields are needed)

Verification:
- conversion sections render correctly on desktop and mobile
- CTA still routes to Paystack flow

## Phase 11: Success State Standardization

Execution steps:
1. Identify all actions that still rely on toast-only success feedback.
2. Add lightweight success states or pages for those actions.
3. Ensure each success state includes a clear next-step CTA.

Files to add or update:
- selected UI pages and modals

Verification:
- critical flows include a next-step CTA after success

## Phase 12: Legacy Cleanup (Safe Removal Phase)

Execution steps:
1. Confirm `/register-onsite/success` is no longer receiving traffic.
2. Remove the route and any related fallback logic.
3. Clean the lockfile warning by deleting unused lockfiles or setting `turbopack.root`.
4. Remove any remaining old redirects after monitoring.

Files to add or update:
- app/(auth)/register-onsite/success/page.tsx (remove)
- next.config.js (optional `turbopack.root`)

Verification:
- build warning is gone
- no legacy routes remain in the app router

## Phase 13: Advanced UX Enhancements

Execution steps:
1. Define the global search scope (courses, users, resources).
2. Add recommendation tiles on student and instructor dashboards.
3. Add notification surface for onboarding-related events.

Files to add or update:
- app/dashboard/page.tsx
- app/instructor/page.tsx
- components/notifications (new)

Verification:
- recommendations render and link correctly

## Phase 14: Analytics and Optimization

Execution steps:
1. Add event tracking for each micro-step and for OTP completion.
2. Track onsite conversion events.
3. Add a basic admin dashboard view to inspect funnel completion rates.

Files to add or update:
- lib/onboarding-analytics.ts
- app/admin/analytics/page.tsx (extend)

Verification:
- events fire in dev console or analytics provider

## Phase 15: QA, Edge Cases, and Hardening

Execution steps:
1. Validate OTP failure and resend flows.
2. Validate payment return failures and retries.
3. Validate duplicate signup and login edge cases.
4. Review email persistence and recovery paths.

Files to add or update:
- app/(auth)/verify-otp/verify-otp-client.tsx
- app/api/auth/*
- app/api/payments/*

Verification:
- documented test cases are clean
- no regressions on signup or payment flows





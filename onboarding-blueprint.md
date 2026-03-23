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
- no dedicated `/dashboard/profile/setup` experience; profile completion still happens through existing profile/settings pages
- no literal assistant-style email preview helper layer in signup
- the remaining compatibility route `/register-onsite/success` still exists and should eventually be retired
- the build warning about inferred workspace root and multiple lockfiles still exists and should be cleaned up

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
| `/register-onsite/success` | `/dashboard/onsite-training/success` | migrate | keep legacy success page temporarily; new onsite flow returns to dashboard context |
| none | `/welcome/student` | add | first-login landing after student OTP verification |
| none | `/welcome/instructor` | add | first-login landing after instructor OTP verification |
| none | `/dashboard/onsite-training` | add | authenticated onsite information and payment page |
| none | `/dashboard/profile/setup` | optional add | still not implemented; profile completion lives in existing profile/settings pages |

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
5. When to fully remove the legacy `/register-onsite/success` compatibility surface.

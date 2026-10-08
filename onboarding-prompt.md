# POWER PROMPT: Unified Student and Instructor Signup & Onboarding Redesign

## Objective

Redesign the current onboarding system into a cleaner public onboarding model that is:

- minimal at entry
- guided step-by-step
- consistent across student and instructor journeys
- built on the existing OTP + pending registration architecture

Do not break these backend rules:

- OTP-first system must remain
- no real user before verification
- pending registration + payment linking must stay intact

## Core UX Shift

### Current problem

Users currently face too much complexity too early.

Students are asked to choose online vs onsite before signup is complete.
The forms are long and overwhelming.
Instructor and student signup feel like different products.
OTP verification is generic and weak as a transition state.

### New approach

#### Student side

There should be only one student signup flow.

This means:
- no more `/register-online` vs `/register-onsite` as the primary public split
- no branching at the beginning
- no mode decision during signup

#### Instructor side

Instructor signup can remain a separate role entry point, but it should use the same onboarding system principles:
- same step-based interaction model
- same visual structure
- same OTP transition quality
- same post-verification onboarding pattern

The goal is role-appropriate flows built on one coherent onboarding system.

## 1. New Student Signup Flow

### Step structure

Use a step-based flow where each step shows one input or one tightly related input group per screen.
A modal-based or focused single-panel stepper is acceptable as long as it stays minimal and guided.

### Step 1: Account Creation

Fields:
- full name
- email
- password with visibility toggle

Assistant behavior:
- explain the importance of secure login
- show email preview
- validate in real time

### Step 2: Basic Info

Fields:
- phone number
- WhatsApp number optional

Remove or defer these from signup:
- address
- date of birth
- gender
- training preferences

### Step 3: Confirmation Preview

Show all entered data before submit.

Display rules:
- desktop: table layout
- mobile: stacked rows

Actions:
- edit any section
- confirm and proceed

### Step 4: Submit -> OTP Flow

Call the student registration backend path.

Current intended target:
- `/api/auth/register`

Then redirect to:
- `/verify-otp?email=...&role=student`

## 2. OTP Flow

Keep the same backend logic, but improve the UX.

Enhancements for `/verify-otp`:
- context-aware message: "We've sent a code to your email to complete your registration"
- resend countdown timer, for example 60 seconds
- change-email option
- clear next-step copy: "After verification, your account will be activated"
- role-aware copy for student vs instructor

## 3. Remove Onsite From Student Signup

Remove onsite selection and payment from the public student signup path.

This means:
- no dedicated onsite decision during student signup
- no payment during signup

## 4. Student Post-Signup Onboarding Layer

After OTP verification, do not redirect straight to the student dashboard.

Instead, show a welcome screen with first-time actions such as:
- complete profile
- explore courses
- view onsite training

## 5. Onsite Training Moved to Dashboard

### Entry point 1: top banner

Add a full-width, minimal banner.

Suggested text:
- "Register for onsite training now"
- "Onsite training" should be visually emphasized and clickable
- dismiss action should persist preference

### Entry point 2: sidebar

Add an "Onsite Training" menu item in the student area.

## 6. Onsite Flow as Separate Post-Activation Flow

The onsite flow should become a separate dashboard experience.

On the onsite page, show:
- benefits
- location
- price
- schedule

Primary CTA:
- "Register & Pay"

Payment flow:
1. user clicks pay
2. payment is initialized
3. redirect to Paystack
4. return and verify payment
5. if success, mark the student as enrolled for onsite and grant the related full-access outcome

## 7. Course Access Logic

Target model:
- onsite paid -> all courses unlocked
- regular student -> pay per course

## 8. Progressive Profile Completion

Move heavier profile fields into the post-activation dashboard.

Student examples:
- address
- date of birth
- gender
- training preferences

Instructor examples:
- long bio
- avatar
- refined specialty tags
- optional public profile details

Add:
- profile completion bar
- step checklist such as complete profile, enroll in course, join onsite training, create first course

## 9. Shared UI and UX Enhancements

Signup should be:
- one input per screen or tightly grouped micro-step
- centered
- low-clutter
- smoothly animated with fade or slide transitions

Add:
- progress indicator, for example "Step 1 of 3"
- keyboard navigation
- autofocus
- consistent success-state design
- consistent confirmation-preview pattern

## 10. Important Fixes to the Current System

### Fix email persistence

Stop relying only on `sessionStorage`.
Always pass email via:
- URL param, or
- backend-backed state

### Normalize success states

Replace weak toast + auto-redirect patterns with a clear next-step screen.

### Preserve backend correctness

Do not weaken:
- pending registration lifecycle
- OTP-first verification
- payment reassociation from pending registration to real user
- unverified-login recovery behavior

## 11. Instructor Flow Plan

### Entry model

Keep instructor as a separate role entry point, but make the interaction model consistent with student onboarding.

Recommended public route:
- keep `/register-instructor`

Recommended UX model:
- same stepper shell as student signup
- same real-time validation patterns
- same confirmation-preview step
- same improved OTP handoff
- same post-verification welcome layer

### Instructor Step 1: Account Creation

Fields:
- full name
- email
- password with visibility toggle

This should match the student account-creation step visually and behaviorally.

### Instructor Step 2: Teaching Basics

Fields:
- phone number
- professional headline
- years of experience

### Instructor Step 3: Expertise Summary

Fields:
- specialties

Defer these to post-verification profile completion where possible:
- long bio
- avatar URL
- extra public profile details

### Instructor Step 4: Confirmation Preview

Show entered data before submission.

Display rules:
- desktop: table layout
- mobile: stacked rows

Actions:
- edit any section
- confirm and proceed

### Instructor Step 5: Submit -> OTP Flow

Call:
- `/api/auth/register-instructor`

Then redirect to:
- `/verify-otp?email=...&role=instructor`

### Instructor OTP Experience

Use the same improved OTP screen, but with instructor-specific copy.

Examples:
- "Verify your instructor account"
- "After verification, you will be able to complete your teaching profile and access your instructor workspace"

### Instructor Post-Verification Welcome Screen

After verification, do not redirect straight to `/instructor`.

Show a first-time instructor welcome screen with actions such as:
- complete teaching profile
- add bio and avatar
- review publishing guidelines
- create first course

### Instructor Progressive Onboarding

Inside the instructor area, add a first-time checklist such as:
- complete profile
- add specialties
- upload avatar
- create first course
- submit first course for review

## 12. Final Experience Flow

### Student journey

1. signup (fast, guided)
2. OTP verification
3. welcome screen
4. dashboard access
5. user sees onsite training as an optional upgrade
6. user pays for onsite and unlocks the expanded access outcome

### Instructor journey

1. instructor signup (fast, guided)
2. OTP verification
3. instructor welcome screen
4. instructor workspace access
5. complete teaching profile
6. create first course

## 13. Product Upgrade Goal

This redesign should turn the current fragmented onboarding into a cleaner SaaS-style onboarding funnel with:
- lower drop-off
- better conversions
- clearer progression
- more scalable architecture
- consistent cross-role onboarding quality

# Comparison Against onboarding.md

## Does this satisfy the improvements listed in onboarding.md?

Short answer:
- yes for the student signup redesign goals
- yes for instructor consistency now that a parallel instructor plan is included
- yes, it goes beyond `onboarding.md` in several areas
- remaining open items are mostly migration and data-contract decisions, not product-direction gaps

## Coverage comparison

### 1. Long single-step student form

`onboarding.md` improvement:
- split the student form into steps
- reduce cognitive load
- add progress feedback

`onboarding-prompt.md` response:
- fully satisfies this
- introduces a step-based signup
- reduces the initial required fields
- adds progress indicator and guided flow

Assessment:
- satisfies and improves beyond the baseline

### 2. Fragmented online vs onsite student flow

`onboarding.md` improvement:
- normalize fragmented flows
- reduce inconsistency between student journeys

`onboarding-prompt.md` response:
- fully satisfies this for students
- removes the online vs onsite branch at signup
- creates one public student signup funnel
- moves onsite into a later optional path

Assessment:
- satisfies and goes further than the baseline

### 3. Weak OTP UX

`onboarding.md` improvement:
- contextual OTP page
- countdown timer
- clearer next-step messaging
- edit or restart path

`onboarding-prompt.md` response:
- fully satisfies this
- adds contextual copy
- adds resend countdown
- adds change-email option
- adds clear explanation of what happens after verification
- adds role-aware OTP framing

Assessment:
- satisfies directly

### 4. Confusing onsite ordering

`onboarding.md` improvement:
- make onsite flow easier to follow
- present it as clearer progression
- preserve linking and correctness

`onboarding-prompt.md` response:
- satisfies this by taking a stronger position
- instead of making signup + payment + OTP clearer, it removes onsite from signup entirely
- moves onsite to a separate post-activation dashboard flow

Assessment:
- satisfies the UX goal
- changes the product structure more aggressively than `onboarding.md`

### 5. Too many fields during signup

`onboarding.md` improvement:
- re-evaluate required fields
- defer non-essential fields

`onboarding-prompt.md` response:
- fully satisfies this
- keeps signup to a minimal account + contact flow for students
- simplifies instructor entry too
- defers address, date of birth, gender, training preferences, and heavy profile content

Assessment:
- satisfies directly

### 6. Weak success states

`onboarding.md` improvement:
- replace brief or auto-dismiss patterns with explicit next-step screens

`onboarding-prompt.md` response:
- fully satisfies this
- explicitly replaces weak success states with:
  - OTP step
  - welcome screen
  - dashboard-first onboarding layer
  - first-time instructor onboarding layer

Assessment:
- satisfies directly

### 7. Better state clarity and persistence

`onboarding.md` improvement:
- reduce reliance on `sessionStorage`
- make state handoff more explicit

`onboarding-prompt.md` response:
- satisfies this
- explicitly calls out email persistence as a fix
- requires URL param or backend-backed state instead of only `sessionStorage`

Assessment:
- satisfies directly

### 8. Missing in-app onboarding after activation

`onboarding.md` improvement:
- add role-aware onboarding after verification
- add checklist / next best actions

`onboarding-prompt.md` response:
- fully satisfies this
- adds a welcome screen for students
- adds a welcome screen for instructors
- adds quick actions
- adds profile completion bar and checklist
- adds onsite training discovery inside the student dashboard

Assessment:
- satisfies and goes beyond the baseline

### 9. Instructor-flow inconsistency

`onboarding.md` improvement:
- reduce inconsistency between student and instructor onboarding

`onboarding-prompt.md` response:
- now satisfies this directly
- keeps instructor as a separate role entry point where appropriate
- gives instructor the same onboarding system structure as student
- preserves role-specific payloads while standardizing the UX model

Assessment:
- now covered

## What this prompt adds beyond onboarding.md

This prompt adds several stronger product decisions that `onboarding.md` only suggested indirectly:

- one unified student signup with no early mode split
- complete removal of onsite from public student signup
- a dedicated post-verification welcome layer before dashboard
- onsite upsell surfaces inside the student product itself
- dashboard-level progressive profile completion
- a parallel instructor onboarding plan built on the same UX system
- a more explicit conversion funnel perspective

These are stronger and more opinionated than the baseline improvement list.

## What this prompt still does not fully cover

There are still some implementation gaps compared with the broader observations in `onboarding.md`:

### 1. Existing route compatibility is not specified

The prompt says:
- no more `/register-online`
- no more `/register-onsite` as public entry points

But implementation still needs a compatibility plan.
For example:
- keep old routes and redirect them, or
- remove them and update all links

Conclusion:
- product direction is clear
- migration plan still needs to be defined

### 2. New access flags need mapping to existing data model

The prompt uses concepts like:
- `onsiteEnrolled = true`
- `fullAccess = true`

The current codebase already expresses this outcome through payment state and auto-enrollment behavior.
So implementation should map these ideas onto the existing model instead of inventing parallel state unnecessarily.

Conclusion:
- concept is good
- data-model expression should be aligned with current architecture

### 3. Current registration API contracts would need redesign

The prompt says to keep using:
- `/api/auth/register`
- `/api/auth/register-instructor`

But the current routes expect heavier payloads than the new prompt intends.
If we follow the prompt literally, validation schemas and request shapes will need to change.

Conclusion:
- backend rule stays
- request shape will likely change

### 4. Phased rollout still needs to be decided

Even with both student and instructor covered, implementation still needs a rollout choice.
For example:
- redesign student first, then align instructor, or
- build the shared onboarding shell once and roll out both together

Conclusion:
- target experience is clearer
- delivery sequencing is still open

## Final verdict

Does `onboarding-prompt.md` satisfy the improvements in `onboarding.md`?

Answer:
- yes, for the student signup and onboarding experience
- yes, now also for instructor-flow consistency
- yes, it goes beyond the baseline in a useful way
- the remaining open items are implementation and migration details, not missing UX direction

Best summary:
- `onboarding.md` identifies the problems and improvement areas
- `onboarding-prompt.md` now turns those improvements into a broader, more opinionated redesign direction for both student and instructor onboarding
- the new prompt satisfies the baseline and adds more product clarity

If we implement this, the next design decision is whether we want to:
1. build the shared onboarding shell first and then plug in student + instructor steps, or
2. redesign the student flow first and bring instructor onto the same system immediately after
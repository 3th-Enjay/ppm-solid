# Student Profile Implementation Plan

This document converts the student profile review into a full implementation plan.
It is intended to guide the redesign and extension of the student profile system without leaving out any part of the current flow.

It covers:
- routes
- current behavior
- UI and UX expectations
- responsive behavior
- data model changes
- milestone and achievement rollout
- implementation phases
- verification expectations
- what is already done
- what is next

## Goal

Turn the student profile system into a polished learner identity hub that:
- still preserves fast signup
- keeps guided setup separate from the main profile page
- improves clarity and visual quality on `/dashboard/profile`
- makes completion progress visible everywhere it matters
- introduces student milestones and study achievements
- stays responsive across desktop, tablet, and mobile
- keeps the relationship between profile, setup, dashboard, welcome flow, and onsite training consistent

## Product Definition

The student profile system should become a connected experience with two primary roles:

### 1. `/dashboard/profile`
This becomes the long-term student profile home.

It should act as:
- account center
- learner identity hub
- training record view
- milestone and achievement surface
- entry point to guided profile completion

### 2. `/dashboard/profile/setup`
This remains the guided completion funnel.

It should act as:
- structured onboarding continuation flow
- deferred learner data collection flow
- completion accelerator
- profile editing path for structured student fields

The two pages should feel related, not duplicated.

## Current State Summary

## Already implemented

### Routing and flow
- `/dashboard/profile` exists
- `/dashboard/profile/setup` exists
- `/welcome/student` links to setup
- `/dashboard` nudges incomplete students to setup
- `/api/profile/setup` saves guided learner fields
- `/api/onboarding/state` returns completion data
- `/dashboard/profile?setup=complete` triggers a success state after setup finishes

### Main profile page
- tabbed structure exists
- training profile tab exists
- general account tab exists
- security tab exists
- explicit success states replaced toast-only success in key profile actions

### Setup page
- guided multi-step setup exists
- completion tracker is visible in setup
- setup updates auth store and redirects back to main profile page

### Completion logic
- profile completion is computed centrally in `lib/onboarding-state.ts`
- dashboard and welcome flow already use completion percent

## Not yet implemented

### Main profile page improvements
- completion-aware hero summary
- dynamic profile progress card
- milestone overview
- study achievement section
- improved training tab information hierarchy
- explicit edit routing cues inside profile sections
- stronger responsive profile-page redesign

### Student milestone system
- milestone data model
- milestone unlocking logic
- milestone UI on the profile page
- recent achievements list
- next milestone guidance

### Better handoff between profile and setup
- dynamic setup CTA on `/dashboard/profile`
- direct explanation of what is edited here versus in setup
- profile page awareness of remaining completion items

## Full Route Map

## Student-facing routes

### `/dashboard/profile`
Purpose:
- main profile home
- profile summary
- account editing
- training record and payment view
- milestone and achievement home

### `/dashboard/profile/setup`
Purpose:
- guided learner-field completion and structured editing

### `/dashboard`
Purpose:
- dashboard nudge to setup when incomplete
- should remain a feeder route into profile setup

### `/welcome/student`
Purpose:
- first-login onboarding landing
- should remain an early feeder route into setup

### `/dashboard/onsite-training`
Purpose:
- onsite offer, status, and payment action page
- should also contribute milestone progress and learner badges

## Supporting APIs

### `GET /api/onboarding/state`
Current role:
- source of completion tracker data

Planned role:
- also support milestone summary in future phases

### `PATCH /api/profile/setup`
Current role:
- saves structured learner fields

Planned role:
- should become one of the sources of milestone triggers

### `PATCH /api/users/[id]`
Current role:
- saves `name` and `bio`

Planned role:
- can contribute milestone progress for general profile editing if needed

### `POST /api/users/password`
Current role:
- password update only

Planned role:
- remains scoped; no milestone dependency needed unless a security milestone is introduced later

## Data Domains In Scope

## User-level fields
- `name`
- `email`
- `bio`
- password update state

## Student-level fields
- `phoneNumber`
- `whatsappNumber`
- `gender`
- `dateOfBirth`
- `currentAddress`
- `isHealthcareProfessional`
- `currentRoleOrField`
- `preferredLocation`
- `preferredLocationStartDate`
- `trainingInterest`
- `trainingMode`
- `formTitle`
- `registrationFeeNgn`
- `paymentStatus`
- `paymentReference`
- `submittedAt`

## Milestone domain to add
Recommended future shape:
- `studentMilestones[]` on user
or
- dedicated `student_milestones` collection keyed by `userId`

Each milestone should include:
- `key`
- `title`
- `description`
- `category`
- `unlockedAt`
- optional `progressValue`
- optional `targetValue`
- optional `metadata`

## UX and Design Principles

Every phase should improve UX, not just add data.

### Required UX principles
- clear hierarchy
- low cognitive load
- visible next action
- celebratory progress language
- no dead-end tabs
- no confusing edit ownership
- mobile-first survivability
- desktop polish without mobile penalty

### Required responsive principles
- no critical content hidden only in desktop sidebars
- profile hero should stack cleanly on mobile
- progress and milestone cards should collapse into single-column cards on small screens
- data-dense sections should use grouped cards, not unreadable multi-column walls
- achievement cards should scroll or wrap gracefully
- tab content should remain usable without horizontal overflow

## Implementation Direction

## Main profile page should evolve into this structure

### Section 1. Profile hero
Contents:
- student avatar or initials
- full name
- learner status badge
  - `Online Learner`
  - `Onsite Learner`
- completion percentage
- primary CTA
- secondary CTA when appropriate

### Section 2. Dynamic completion card
Contents:
- completion percent
- completed count versus total count
- 3 remaining items
- CTA to continue or review setup

### Section 3. Milestones overview
Contents:
- total unlocked milestones
- featured achievement
- next milestone
- progress hint

### Section 4. Recent achievements
Contents:
- latest milestone cards
- category icon
- unlocked time
- short celebratory description

### Section 5. Tabs
Keep tabs, but improve hierarchy.

#### `Training Profile`
Should become:
- learner status summary
- training mode and cohort
- onsite payment block
- learner personal details
- support and action links

#### `General`
Should remain:
- editable basic account information
- name
- email
- bio

#### `Security`
Should remain:
- password update flow
- success state after update

### Section 6. Edit routing hints
Each relevant section should explain:
- what is editable here
- what is editable in setup
- what is managed in onsite training

## Milestone System Scope

The student profile page should become the home of milestones and achievements.

## Milestone categories
- onboarding
- profile
- learning
- progress
- consistency
- onsite
- completion

## Milestones to implement in roadmap

1. `Student Activated`
Trigger:
- OTP verification success

2. `Welcome Aboard`
Trigger:
- first visit to `/welcome/student`

3. `Profile Starter`
Trigger:
- first visit to `/dashboard/profile/setup`

4. `Identity Confirmed`
Trigger:
- personal-info setup block saved

5. `Profile Complete`
Trigger:
- profile completion reaches 100%

6. `First Dashboard Visit`
Trigger:
- first `/dashboard` visit

7. `Course Explorer`
Trigger:
- first `/courses` visit

8. `First Enrollment`
Trigger:
- first course enrollment

9. `Lesson Starter`
Trigger:
- first lesson start or first progress record

10. `Steady Learner`
Trigger:
- 3 distinct study days

11. `Focused Learner`
Trigger:
- 7 distinct study days

12. `Learning Streak`
Trigger:
- 5 consecutive study days

13. `Note Taker`
Trigger:
- first learning note created

14. `Progress Builder`
Trigger:
- first course reaches 25%

15. `Halfway There`
Trigger:
- first course reaches 50%

16. `Almost Done`
Trigger:
- first course reaches 75%

17. `Course Finisher`
Trigger:
- first course completion

18. `Certified Learner`
Trigger:
- first certificate issued

19. `Onsite Interested`
Trigger:
- first visit to `/dashboard/onsite-training`

20. `Onsite Learner`
Trigger:
- onsite payment success/completion

## UI treatment for milestones

### Milestones Overview card
Show:
- `X of 20 unlocked`
- featured badge
- nearest next milestone

### Recent Achievements strip
Show:
- latest 3 to 6 milestones
- icon
- title
- unlocked date

### Next Up card
Show:
- next 1 to 3 milestones
- short progress guidance

Examples:
- `Complete your profile to unlock Profile Complete`
- `Study on 2 more days to unlock Steady Learner`
- `Visit onsite training to unlock Onsite Interested`

## Phase-by-Phase Implementation Plan

Each phase below must improve both behavior and UI/UX.
Each phase must remain responsive.
Each phase keeps everything already in scope and expands the implementation detail with:
- objective
- exact implementation targets
- UI/UX enhancement goals
- responsive expectations
- verification
- phase outcome
- what comes next

## Phase 0: Baseline Audit and Protection

Status:
- implemented

Objective:
- protect the existing student profile and setup flow while preparing for redesign and expansion

What is already done:
- main student profile page exists
- guided setup page exists
- profile completion tracker exists
- dashboard and welcome nudges exist
- success state after setup exists

Exact implementation targets:
- preserve `/dashboard/profile` as the long-term learner hub
- preserve `/dashboard/profile/setup` as the structured guided flow
- avoid breaking the auth store update after setup submission
- avoid breaking the `?setup=complete` success handoff
- keep current general and security save flows working while redesign lands

UI/UX enhancement goals:
- keep today’s working experience stable during incremental rollout
- avoid introducing regressions that make the profile page harder to use before improvements are complete

Responsive expectations:
- keep current routes usable on mobile while redesign work lands incrementally
- avoid introducing horizontal overflow or layout regressions during intermediate phases

Verification:
- signup still lands users correctly
- setup still redirects back to profile
- profile page still renders for students on mobile and desktop

Phase outcome:
- the baseline is protected and safe to build on

Next:
- Phase 1 profile hero and completion awareness

## Phase 1: Profile Hero + Completion Awareness

Status:
- next

Objective:
- make the profile page instantly meaningful at first glance
- make `/dashboard/profile` feel like a learner hub instead of a plain settings screen

Exact implementation targets:
1. Add a `Profile Hero` section at the top of `/dashboard/profile`
2. Include:
   - avatar with initials fallback
   - full name
   - email as subtle supporting text
   - learner badge:
     - `Online Learner`
     - `Onsite Learner`
   - profile completion percentage
3. Add a visual completion component:
   - progress bar
   - or circular progress ring if it fits the design system well
4. Replace the static setup CTA card with a dynamic progress card
5. Dynamic progress card logic:
   - if completion is below 100%, show `Profile X% complete`, remaining steps, and `Continue setup`
   - if completion is 100%, show `Profile Complete` and `Review profile`
6. Add contextual primary action logic so only one primary CTA leads the page at a time:
   - `Continue setup`
   - `Open onsite training`
   - `Explore courses`
7. Improve card rhythm, spacing, and section hierarchy so the first screen is scannable immediately
8. Fetch and display completion tracker data directly on the profile page using the existing onboarding state source

UI/UX enhancement goals:
- stronger first impression
- clear identity at the top of the page
- visible progress without opening another route
- fast understanding of what to do next
- less “settings page” feeling and more “student home base” feeling

Responsive expectations:
- mobile: hero stacks into a single clean column
- tablet: hero summary and progress blocks feel balanced, not cramped
- desktop: summary and dynamic action/progress blocks can sit side by side
- completion component must stay readable without shrinking text too aggressively

Verification:
- user instantly understands who they are, where they are, and what the next action is
- setup CTA changes correctly based on completion state
- onsite learners and online learners receive the correct badge
- no hero block causes horizontal overflow

Phase outcome:
- the profile page becomes meaningful at first glance and clearly action-oriented

Next:
- Phase 2 milestones system MVP

## Phase 2: Milestones System (MVP)

Status:
- next

Objective:
- turn the student profile into a progress and motivation surface
- establish the first milestone foundation without waiting for the full study-achievement rollout

Exact implementation targets:
1. Add a first milestone data layer
2. Start simple with milestone storage on the user model:
   - `user.studentMilestones[]`
3. Minimum milestone shape:
   - `key`
   - `title`
   - `unlockedAt`
4. Keep the longer-term roadmap open for richer milestone metadata later
5. Implement the initial milestone set only:
   - `Student Activated`
   - `Welcome Aboard`
   - `Profile Starter`
   - `Profile Complete`
   - `First Dashboard Visit`
   - `Onsite Interested`
   - `Onsite Learner`
   - `First Enrollment`
   - `Course Finisher`
6. Add milestone trigger helpers that are idempotent
7. Add milestone summary support to profile-facing data so milestone UI can render without heavy client-side recomputation
8. Keep this phase compatible with the broader 20-milestone roadmap already defined in this document

UI/UX enhancement goals:
- make the profile feel alive
- create early reward loops for onboarding and learning progress
- start building emotional momentum and a sense of achievement

Responsive expectations:
- milestone payloads must support compact mobile cards and larger desktop summary views
- milestone labels should remain concise enough to render well across breakpoints

Verification:
- repeated visits do not create duplicate milestones
- newly eligible users unlock milestones automatically
- milestone summaries can be rendered reliably with minimal client logic

Phase outcome:
- the profile gains a foundational motivation layer and the milestone engine exists

Next:
- Phase 3 training-tab restructure

## Phase 3: Training Tab Restructure

Status:
- next

Objective:
- improve readability and hierarchy in the training tab
- remove the current “data dump” feeling

Exact implementation targets:
1. Reorder training-tab sections into a clearer structure:
   - `Identity & Status`
   - `Training Mode`
   - `Payment Status`
   - `Preferences`
   - `Additional Info`
2. Add section dividers
3. Add muted uppercase section labels
4. Add icons per section for faster scanning
5. Group the existing fields into meaningful blocks instead of one uniform wall of cards
6. Add smart links:
   - `Edit learner details` -> `/dashboard/profile/setup`
   - `Manage onsite training` -> `/dashboard/onsite-training`
7. Make payment and access states visually easier to distinguish
8. Preserve support and action links such as program summary and onsite payment actions

UI/UX enhancement goals:
- better scanability
- clearer hierarchy
- faster recognition of status and important actions
- reduced cognitive load when viewing training records

Responsive expectations:
- mobile: grouped sections stack into vertical cards
- tablet: sections can use simple two-column support where helpful
- desktop: grouped blocks remain readable without overcrowding or tiny text
- no card wall should feel dense or exhausting at any breakpoint

Verification:
- no more undifferentiated data wall
- students can identify payment status, training mode, and preferences at a glance
- navigation links to setup and onsite routes are obvious and correct

Phase outcome:
- the training tab becomes a structured learner record view with clear navigation

Next:
- Phase 4 unify profile and setup UX

## Phase 4: Unify Profile + Setup UX

Status:
- next

Objective:
- make the main profile page and setup page feel like one connected system

Exact implementation targets:
1. Reuse visual language across `/dashboard/profile` and `/dashboard/profile/setup`:
   - card styles
   - spacing
   - typography rhythm
   - progress presentation
2. Match the onboarding shell styling where appropriate without duplicating the setup page exactly
3. Share progress language and completion wording between setup and profile
4. Improve the return handoff after setup completion:
   - smooth scroll to the relevant tab or section
   - highlight the updated area
   - preserve the completion success context
5. Make post-setup re-entry feel intentional rather than like a generic redirect

UI/UX enhancement goals:
- eliminate context-switch feeling
- reinforce that setup is part of the profile system, not a disconnected flow
- make the transition back from setup feel rewarding and clear

Responsive expectations:
- highlighted and scrolled-to sections must remain visible and understandable on small screens
- profile and setup spacing should feel related across mobile, tablet, and desktop

Verification:
- returning from setup feels seamless
- profile and setup use aligned progress terminology
- the student can immediately tell what changed after saving setup details

Phase outcome:
- profile and setup behave like one coordinated learner system

Next:
- Phase 5 profile completion logic fix

## Phase 5: Profile Completion Logic Fix

Status:
- next

Objective:
- align the completion system with real UX expectations
- remove confusion between setup completion and full profile completion

Exact implementation targets:
1. Normalize completion sources so setup fields and general profile fields contribute to one unified completion model
2. Fix the mismatch where setup completion can be interpreted as profile completion
3. Explicitly show both states when needed:
   - `Setup Complete`
   - `Profile 85% complete`
4. Add missing-field indicators on the profile page
5. Show incomplete fields with muted or locked visual treatment where appropriate
6. Add a clear CTA path to finish the missing items
7. Keep the completion computation centered in the shared onboarding logic

UI/UX enhancement goals:
- completion feels honest and accurate
- students understand the difference between guided setup completion and total profile completion
- missing items become actionable, not confusing

Responsive expectations:
- remaining-item and incomplete-field indicators should wrap cleanly on mobile
- completion summaries should remain visible without dominating the screen

Verification:
- setup complete and profile complete states no longer blur together
- general fields and setup fields contribute consistently
- incomplete indicators are accurate and useful

Phase outcome:
- completion now reflects the real user experience and removes ambiguity

Next:
- Phase 6 edit experience clarity

## Phase 6: Edit Experience Clarity

Status:
- next

Objective:
- remove confusion about where users edit different kinds of profile information

Exact implementation targets:
1. Add inline edit guidance throughout relevant profile sections
2. Examples:
   - under training details: `Edit in guided setup`
   - under general account information: `Edit here`
   - under onsite status: `Manage onsite training`
3. Add quick navigation buttons or links to:
   - setup page
   - general tab
   - onsite training page
4. Add helper copy inside tabs explaining edit ownership
5. Ensure every major piece of profile data has a clear editing destination

UI/UX enhancement goals:
- eliminate “where do I edit this?” confusion
- reduce friction when students need to update details
- make the profile page feel helpful, not passive

Responsive expectations:
- inline edit cues must remain close to the related content on small screens
- quick navigation actions should wrap neatly without becoming tiny or crowded

Verification:
- users can identify the correct edit path for every major profile section
- no important data area is left without edit guidance

Phase outcome:
- the profile page clearly teaches users how to manage their own information

Next:
- Phase 7 remove weak behaviors

## Phase 7: Remove Weak Behaviors

Status:
- next

Objective:
- clean technical and UX inconsistencies that weaken trust

Exact implementation targets:
1. Remove placeholder or misleading data behavior
2. Specifically remove any email-to-phone or fake fallback patterns and replace them with empty or incomplete states
3. Improve success persistence by storing important success states in:
   - URL state
   - or a shared state store
   - instead of relying only on temporary banners
4. Clean CTA decision logic so the page does not show conflicting actions
5. Hide or downgrade setup CTA once the relevant completion state is satisfied
6. Review all success, empty, and incomplete states for clarity and trustworthiness

UI/UX enhancement goals:
- stronger user trust
- no fake completeness
- clearer and calmer page behavior

Responsive expectations:
- empty and incomplete states should still look intentional on mobile and tablet
- success states should not dominate or break the page hierarchy on smaller screens

Verification:
- no placeholder data appears as real profile content
- success state survives the expected navigation path
- CTA logic stays clean and non-conflicting

Phase outcome:
- the profile page becomes more trustworthy and less brittle

Next:
- Phase 8 milestones overview and achievements UI

## Phase 8: Milestones Overview and Achievements UI

Status:
- next

Objective:
- make achievements visible on the profile page and strengthen the learner identity layer

Exact implementation targets:
1. Add a `Milestones Overview` card
2. Show:
   - total unlocked milestones
   - featured milestone
3. Add a `Recent Achievements` section with 3 to 6 cards
4. Add a `Next Up` section with 1 to 3 upcoming milestones
5. Use Lucide icons for milestone categories and featured states
6. Add subtle hover effects and soft emphasis for the newest milestone
7. Keep the design celebratory but restrained
8. Ensure this UI can later support the full 20-milestone roadmap

UI/UX enhancement goals:
- profile becomes motivating and revisit-worthy
- students can see growth, not only account data
- newest achievements feel rewarding without overwhelming the page

Responsive expectations:
- mobile: milestone sections stack vertically
- tablet: overview and next-up can share space where readable
- desktop: overview, recent achievements, and next-up can form a clear grid
- badge rows and cards must never feel cramped

Verification:
- empty-state milestone UI still feels intentional
- newest milestone is visually distinct
- next milestone guidance is understandable

Phase outcome:
- the profile starts functioning as a learner progress hub, not just an account page

Next:
- Phase 9 study achievements and consistency milestones

## Phase 9: Study Achievements and Consistency Tracking

Status:
- next

Objective:
- connect actual study behavior to visible profile achievements

Exact implementation targets:
1. Add triggers for:
   - `Lesson Starter`
   - `Steady Learner`
   - `Focused Learner`
   - `Learning Streak`
   - `Note Taker`
   - `Progress Builder`
   - `Halfway There`
   - `Almost Done`
   - `Certified Learner`
2. Read from existing learning history, note activity, enrollment progress, and certificate issuance
3. Surface these milestones in recent achievements and next-up guidance
4. Make streak and multi-day progress logic explicit and testable

UI/UX enhancement goals:
- profile reflects real learning, not just onboarding
- students feel recognized for consistency and course progress
- the page rewards studying behavior in a visible way

Responsive expectations:
- longer milestone descriptions stay readable on smaller screens
- progress hints stay concise enough for card layouts

Verification:
- milestones unlock when the matching study activity occurs
- streak logic is correct
- achievement ordering remains stable and understandable

Phase outcome:
- milestones now reflect real student effort and learning momentum

Next:
- Phase 10 onsite learner identity layer

## Phase 10: Onsite Learner Identity Layer

Status:
- next

Objective:
- make onsite conversion visible as a meaningful identity upgrade inside the profile system

Exact implementation targets:
1. Add learner badge logic:
   - `Online Learner`
   - `Onsite Learner`
2. Feature the `Onsite Learner` milestone prominently if unlocked
3. Add onsite-specific status summary in the hero or training summary area
4. Add a clear path from profile to onsite status verification and payment history
5. Reinforce the premium nature of onsite participation without making online students feel secondary

UI/UX enhancement goals:
- make onsite payment feel rewarded and visible
- reduce uncertainty about onsite status
- strengthen student identity after conversion

Responsive expectations:
- learner badges must fit smaller screens gracefully
- onsite status cards must stack cleanly and remain scannable

Verification:
- onsite-paid students see the right badge and milestone treatment
- online students still see an appropriate CTA and status
- profile and onsite page remain clearly connected

Phase outcome:
- onsite becomes part of the student’s visible identity, not only a payment event

Next:
- Phase 11 polish, consistency, and advanced enhancements

## Phase 11: Polish, Copy, and Cross-Route Consistency

Status:
- next

Objective:
- ensure the student profile system feels cohesive across all entry points and interactions

Exact implementation targets:
1. Align copy between:
   - `/welcome/student`
   - `/dashboard`
   - `/dashboard/profile`
   - `/dashboard/profile/setup`
2. Make milestone language consistent everywhere
3. Tighten success-state copy and CTA logic
4. Improve empty states and no-data states
5. Ensure all profile-related routes feel like one system
6. Add advanced polish where valuable:
   - progress bar animation
   - milestone unlock animation
   - subtle card hover effects
   - dark mode support
   - milestone and completion notifications
7. Keep these enhancements optional where needed, but plan for them now so the architecture supports them

UI/UX enhancement goals:
- reduce friction
- improve emotional tone
- increase clarity and confidence
- make the final experience feel premium and polished

Responsive expectations:
- final pass on mobile spacing, tablet grids, and desktop hierarchy
- animations and notifications must not harm usability on smaller devices
- dark mode should preserve readability and contrast across breakpoints

Verification:
- all routes use consistent language for setup and profile completion
- milestone labels and CTA labels are aligned
- no mobile clipping or tablet awkwardness remains
- optional premium touches feel additive, not distracting

Phase outcome:
- the student profile system is cohesive, polished, responsive, and production-grade

## Done vs Next Summary

## Done
- `/dashboard/profile` exists
- `/dashboard/profile/setup` exists
- completion tracker logic exists
- dashboard and welcome routes nudge students into setup
- explicit success states exist for setup completion and key profile actions
- training/general/security tab structure exists

## Next
- redesign main profile page hero and hierarchy
- make the profile page completion-aware
- add milestone data model and trigger system
- restructure the training tab for readability and edit clarity
- unify profile and setup UX language and transitions
- fix completion logic edge cases
- remove weak placeholder and CTA behaviors
- add milestone and achievement UI
- connect study behavior to achievements
- add premium onsite learner identity state
- run full responsive polish pass across profile-related routes

## Verification Checklist for the Full Plan

- `/dashboard/profile` remains usable as the long-term student profile hub
- `/dashboard/profile/setup` remains the structured learner-field completion flow
- profile completion percent remains accurate after redesign
- setup CTA changes correctly based on completion state
- milestone unlocking is idempotent
- newly registered students automatically receive `Student Activated`
- onsite-paid students automatically receive `Onsite Learner`
- profile-complete students automatically receive `Profile Complete`
- learning and note activity can unlock study milestones
- profile page remains readable and attractive on mobile
- tab content remains scanable on tablet and desktop
- no route confusion remains about where students edit each class of information
- profile and setup feel like parts of one system
- weak placeholder states and conflicting CTAs are removed
- premium polish enhancements remain additive rather than distracting

## Final Expected Outcome

After all phases, the student profile system should feel like:
- a learner identity page
- a guided completion companion
- a training record view
- a milestone and achievement surface
- a strong bridge between onboarding, studying, and onsite progression
- a responsive and polished product surface

The profile page should no longer feel like a passive settings tab.
It should feel like the student's home base for progress, growth, and recognition.

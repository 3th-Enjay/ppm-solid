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
- learner hero, dynamic completion, milestone surface, and grouped training record sections are now implemented

### Setup page
- guided multi-step setup exists
- completion tracker is visible in setup
- setup updates auth store and redirects back to main profile page
- setup now returns with a targeted handoff into the training area of the profile page

### Completion logic
- profile completion is computed centrally in `lib/onboarding-state.ts`
- dashboard and welcome flow already use completion percent
- profile page now consumes the same completion source directly

### Milestones foundation
- MVP student milestone storage exists on the user model
- milestone syncing and summary generation exist in `lib/student-milestones.ts`
- milestone summary now flows through `/api/onboarding/state`

## Still to implement

### Main profile page improvements
- setup-complete versus full-profile-complete distinction in the UI
- incomplete-field treatment inside profile sections
- deeper study achievement coverage
- richer onsite premium identity treatment
- final polish and animation pass

### Student milestone system
- remaining milestones beyond the MVP set
- learning streak and multi-day study logic
- note, progress-band, certificate, and explorer milestones
- more expressive milestone empty states and notifications

### Better handoff between profile and setup
- stronger cross-route copy consistency in all banners and helper text
- optional section-level update summaries after setup
- improved URL cleanup after handoff if needed

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
- source of student milestone summary data

Planned role:
- continue as the shared profile/setup/dashboard summary endpoint

### `PATCH /api/profile/setup`
Current role:
- saves structured learner fields
- marks setup start state
- syncs milestone eligibility after setup saves

Planned role:
- continue as one of the core milestone trigger sources

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
- `studentMilestones[]`

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
Current implemented shape:
- `studentMilestones[]` on user

Each milestone currently includes:
- `key`
- `title`
- optional `description`
- optional `category`
- `unlockedAt`

Future extension room:
- optional `progressValue`
- optional `targetValue`
- optional `metadata`
- optional dedicated collection if milestone complexity grows

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

Status:
- implemented in the current Phase 1 pass

### Section 2. Dynamic completion card
Contents:
- completion percent
- completed count versus total count
- 3 remaining items
- CTA to continue or review setup

Status:
- implemented in the current Phase 1 pass

### Section 3. Milestones overview
Contents:
- total unlocked milestones
- featured achievement
- next milestone
- progress hint

Status:
- implemented in the current Phase 2 pass

### Section 4. Recent achievements
Contents:
- latest milestone cards
- category icon
- unlocked time
- short celebratory description

Status:
- implemented in the current Phase 2 pass

### Section 5. Tabs
Keep tabs, but improve hierarchy.

#### `Training Profile`
Should become:
- learner status summary
- training mode and cohort
- onsite payment block
- learner personal details
- support and action links

Status:
- implemented in the current Phase 3 pass with grouped sections and route cues

#### `General`
Should remain:
- editable basic account information
- name
- email
- bio

Status:
- retained and working

#### `Security`
Should remain:
- password update flow
- success state after update

Status:
- retained and working

### Section 6. Edit routing hints
Each relevant section should explain:
- what is editable here
- what is editable in setup
- what is managed in onsite training

Status:
- partially implemented in the Phase 3 training tab and general tab
- more explicit inline treatment is still planned in later phases

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

Implemented so far:
1. `Student Activated`
2. `Welcome Aboard`
3. `Profile Starter`
4. `Profile Complete`
5. `First Dashboard Visit`
6. `Onsite Interested`
7. `Onsite Learner`
8. `First Enrollment`
9. `Course Finisher`

Still planned:
10. `Identity Confirmed`
11. `Course Explorer`
12. `Lesson Starter`
13. `Steady Learner`
14. `Focused Learner`
15. `Learning Streak`
16. `Note Taker`
17. `Progress Builder`
18. `Halfway There`
19. `Almost Done`
20. `Certified Learner`

## UI treatment for milestones

### Milestones Overview card
Show:
- `X of 20 unlocked`
- featured badge
- nearest next milestone

Current status:
- implemented with current unlocked count and featured milestone
- improvement opportunity: use the full 20-milestone denominator once the rest of the milestone set is live

### Recent Achievements strip
Show:
- latest 3 to 6 milestones
- icon
- title
- unlocked date

Current status:
- implemented with recent milestone cards
- improvement opportunity: add unlock animation or richer empty state later

### Next Up card
Show:
- next 1 to 3 milestones
- short progress guidance

Current status:
- implemented with milestone previews from the remaining MVP milestone set
- improvement opportunity: tie guidance to actual progress values once non-binary milestones arrive

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
- keep today's working experience stable during incremental rollout
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
- implemented

Objective:
- make the profile page instantly meaningful at first glance
- make `/dashboard/profile` feel like a learner hub instead of a plain settings screen

Exactly implemented:
- added a learner hero section with initials fallback, learner name, subtle email text, and learner program context
- added learner-type badges for `Online Learner` and `Onsite Learner`
- added top-level completion visibility tied to the shared onboarding state
- replaced the earlier static setup card with a dynamic completion card
- added primary next-step logic so the main CTA can switch between setup, onsite training, and courses
- improved top-level spacing, card rhythm, and desktop/mobile hierarchy

Possible improvements:
- consider a circular completion ring if the current bar/card treatment still feels too linear
- add a compact secondary action near the hero for returning students with complete profiles
- add subtle transition animation when completion percent changes

UI/UX enhancement goals:
- stronger first impression
- clear identity at the top of the page
- visible progress without opening another route
- fast understanding of what to do next
- less settings page feeling and more student home base feeling

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
- implemented page passed `pnpm -s tsc --noEmit`

Phase outcome:
- the profile page now feels like a learner hub and clearly communicates identity, status, and next action

Next:
- Phase 2 milestones system MVP

## Phase 2: Milestones System (MVP)

Status:
- implemented

Objective:
- turn the student profile into a progress and motivation surface
- establish the first milestone foundation without waiting for the full study-achievement rollout

Exactly implemented:
- added milestone support to the shared user type
- created `lib/student-milestones.ts` for milestone definitions, syncing, and summary generation
- added milestone summary support to `resolveOnboardingState`
- surfaced milestone summary through `/api/onboarding/state`
- implemented milestone syncing for these milestones:
  - `Student Activated`
  - `Welcome Aboard`
  - `Profile Starter`
  - `Profile Complete`
  - `First Dashboard Visit`
  - `Onsite Interested`
  - `Onsite Learner`
  - `First Enrollment`
  - `Course Finisher`
- hooked milestone syncing into OTP verification, onboarding state updates, setup saves, dashboard visits, enrollments, and course completion
- added visible milestone UI on the profile page:
  - `Milestones Overview`
  - `Recent Achievements`
  - `Next Up`

Possible improvements:
- add richer milestone metadata and progress counters for non-binary milestones
- add milestone notifications or unlock animation
- normalize recent-achievement date formatting and empty-state polish

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
- milestone summaries render from shared server data with minimal client logic
- implemented flow passed `pnpm -s tsc --noEmit`

Phase outcome:
- the profile now has a real achievement layer and a milestone engine that is safe to extend

Next:
- Phase 3 training-tab restructure

## Phase 3: Training Tab Restructure

Status:
- implemented

Objective:
- improve readability and hierarchy in the training tab
- remove the current data dump feeling

Exactly implemented:
- reorganized the training tab into clearer grouped sections:
  - `Identity & Status`
  - `Identity & Contact`
  - `Training Mode`
  - `Payment Status`
  - `Preferences`
  - `Additional Info`
- added stronger routing cues to setup, onsite training, and courses
- added a quick-routing block that explains edit ownership
- preserved program summary and action links while reducing the former flat-card wall
- improved scanning order so students see learner state, access model, payment, and preferences more naturally

Possible improvements:
- add stronger visual section separators for extra-long profiles
- consider collapsible sub-sections on smaller devices if the profile grows further
- add lightweight section summaries like `Last updated` or `Managed in setup`

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
- implemented page passed `pnpm -s tsc --noEmit`

Phase outcome:
- the training tab is now a structured learner record with better information hierarchy and edit routing

Next:
- Phase 4 unify profile and setup UX

## Phase 4: Unify Profile + Setup UX

Status:
- implemented

Objective:
- make the main profile page and setup page feel like one connected system

Exactly implemented:
- aligned profile/setup copy more closely around learner profile completion and training record language
- changed setup completion redirect to target the training tab explicitly using query state
- added profile-page handoff handling for `tab` and `highlight` query params
- added smooth scroll back into the training area after setup completion
- added a visible highlight ring around the returned training section so users can immediately review what changed
- updated setup footer copy to point back to the profile page instead of the generic dashboard

Possible improvements:
- clear query parameters after the first highlighted visit if a cleaner URL is desired
- add section-specific change summaries such as `Updated: preferences, address, training interest`
- align the profile page gradient and card rhythm even more closely with `OnboardingShell` if deeper visual unity is wanted

UI/UX enhancement goals:
- eliminate context-switch feeling
- reinforce that setup is part of the profile system, not a disconnected flow
- make the transition back from setup feel rewarding and clear

Responsive expectations:
- highlighted and scrolled-to sections must remain visible and understandable on small screens
- profile and setup spacing should feel related across mobile, tablet, and desktop

Verification:
- returning from setup now lands in the intended training context
- profile and setup use more aligned progress language
- the student can immediately tell what changed after saving setup details
- implemented flow passed `pnpm -s tsc --noEmit`

Phase outcome:
- profile and setup now behave more like one coordinated learner journey instead of two separate pages

Next:
- Phase 5 profile completion logic fix

## Phase 5: Profile Completion Logic Fix

Status:
- implemented

Objective:
- align the completion system with real UX expectations
- remove confusion between setup completion and full profile completion

Exactly implemented:
- kept completion computation anchored to the shared onboarding state returned from `/api/onboarding/state`
- updated the profile hero to distinguish between `Profile Complete`, `Setup Complete - Profile still in progress`, and active incomplete setup states
- strengthened the dynamic completion card so it explicitly explains when guided setup is complete but the total profile is still below 100%
- kept general-account completion and guided-setup completion visible as separate surfaces inside the same profile summary area
- continued surfacing missing profile items from the shared completion tracker instead of duplicating client-only completion logic
- added section-level incomplete treatment in the training tab with visible status cards for:
  - identity and contact
  - preferences
  - additional info
- added clearer copy that turns missing fields into action-oriented next steps rather than vague incomplete states

Possible improvements:
- add field-level anchor navigation from each missing item directly into the relevant setup step
- introduce stronger visual treatment for incomplete sections, such as icons or locked-state chips
- add a compact "last updated" signal so students can tell whether they have already reviewed a recently completed section

UI/UX enhancement goals:
- completion feels honest and accurate
- students understand the difference between guided setup completion and total profile completion
- missing items become actionable, not confusing
- incomplete sections are visible without turning the page into an error wall

Responsive expectations:
- remaining-item and incomplete-field indicators should wrap cleanly on mobile
- completion summaries should remain visible without dominating the screen
- training-section status cards should stack cleanly into a single column on smaller screens

Verification:
- setup complete and profile complete states no longer blur together
- general fields and setup fields contribute consistently
- incomplete indicators are accurate and useful
- implemented page passed `pnpm -s tsc --noEmit`

Phase outcome:
- completion now reflects the real user experience and removes ambiguity across hero, completion card, and training sections

Next:
- Phase 6 edit experience clarity

## Phase 6: Edit Experience Clarity

Status:
- implemented

Objective:
- remove confusion about where users edit different kinds of profile information

Exactly implemented:
- kept the cross-page edit-routing cards near the top of the profile page for setup, general account edits, and onsite management
- replaced the generic hero helper cards with stronger edit guidance that tells users whether they should stay in General, return to guided setup, or open onsite training
- preserved explicit quick actions in the dynamic completion card so students can jump into:
  - guided setup
  - the General tab
  - training details review
- added tab-level guidance in the General tab explaining that account identity is edited there while structured learner data stays in guided setup
- added a new General-tab status card with quick actions back to the training tab and guided setup
- expanded the training tab with quick-routing explanation cards and section-status summaries so major learner-data areas now point back to guided setup as the editing destination
- kept onsite management actions visible inside the training record and footer action row so payment/status edits remain easy to find

Possible improvements:
- add deep links from each section-status card directly to the matching setup step rather than the setup landing page
- add a lightweight "edited here" label beside name and bio inputs in the General tab for even faster scanability
- extend the same edit-ownership pattern into milestone-related prompts once study achievements are added

UI/UX enhancement goals:
- eliminate "where do I edit this?" confusion
- reduce friction when students need to update details
- make the profile page feel helpful, not passive
- ensure navigation and helper copy work together instead of competing for attention

Responsive expectations:
- inline edit cues must remain close to the related content on small screens
- quick navigation actions should wrap neatly without becoming tiny or crowded
- training summary cards and General-tab actions should keep their hierarchy when stacked on mobile

Verification:
- users can identify the correct edit path for every major profile section
- no important data area is left without edit guidance
- general-tab actions and training-tab helper cards stay usable on smaller breakpoints
- implemented page passed `pnpm -s tsc --noEmit`

Phase outcome:
- the profile page now teaches students where each kind of data is managed and gives them direct paths to act on that guidance

Next:
- Phase 7 remove weak behaviors

## Phase 7: Remove Weak Behaviors

Status:
- implemented

Objective:
- clean technical and UX inconsistencies that weaken trust

Exactly implemented:
- moved key success feedback away from temporary local-only banners by persisting setup, profile-save, and password-update success states in the profile URL
- added dismiss logic for success states so the user can clear the message without losing the rest of the current profile context
- cleaned the primary CTA logic so the page now chooses one truthful next step at a time:
  - guided setup when setup fields are still incomplete
  - General tab completion when only account-level fields remain
  - onsite training when the learner is onsite but unpaid
  - course discovery once the profile is fully ready
- downgraded the hero completion badge so `Setup Complete` no longer implies full profile completion by itself
- removed the misleading default onsite training title fallback from the training tab and replaced it with a neutral `Training Profile` label when no learner record exists yet
- replaced the weak no-data training state with a clearer learner-record empty state and direct actions back to setup or dashboard
- kept the profile page free of fake phone/email substitution behavior while continuing to surface incomplete fields from shared completion data

Possible improvements:
- replace remaining soft text fallbacks like `Not provided yet` with a more explicit incomplete-field presentation system if the product wants fully uniform empty states
- centralize success-state route handling into a shared helper if the same pattern expands to other dashboard pages
- add URL cleanup after external navigation returns so long-lived success query params do not linger unnecessarily

UI/UX enhancement goals:
- stronger user trust
- no fake completeness
- clearer and calmer page behavior
- one primary action at a time, with supporting actions that do not compete with it

Responsive expectations:
- empty and incomplete states should still look intentional on mobile and tablet
- success states should not dominate or break the page hierarchy on smaller screens
- CTA groups should wrap cleanly without hiding the primary next step

Verification:
- no placeholder data appears as real profile content in the training-tab empty state
- success state survives the expected navigation path through URL-backed query state
- CTA logic stays clean and non-conflicting across setup-incomplete, general-incomplete, onsite-unpaid, and profile-complete states
- implemented page passed `pnpm -s tsc --noEmit`

Phase outcome:
- the profile page is now more trustworthy, less brittle, and more honest about what has actually been completed versus what still needs action

Next:
- Phase 8 milestones overview and achievements UI extension
## Phase 8: Milestones Overview and Achievements UI Extension

Status:
- implemented

Objective:
- extend the already-live milestone UI so it supports the full roadmap and richer learner motivation

Exactly implemented:
- expanded the milestone roadmap from the MVP set to the full 20 planned student milestones in `lib/student-milestones.ts`
- updated the milestone summary model so the profile page now receives:
  - total unlocked
  - total available
  - remaining count
  - recent achievements
  - next-up roadmap items
  - category progress breakdown
- upgraded the `Milestones Overview` card on `/dashboard/profile` so it now shows:
  - full-roadmap denominator
  - remaining milestone count
  - overall roadmap progress
  - featured milestone copy
  - category progress cards
- improved `Recent Achievements` with a clearer empty state and support for up to six visible recent milestones
- improved `Next Up` with roadmap-count context and a completion-state fallback when all current milestones are unlocked
- added support for the new milestone icon mapping used by the expanded roadmap

Possible improvements:
- add category-specific accent colors so roadmap groups are distinguishable at a glance
- add unlock animation or subtle reveal motion for the newest achievement card
- introduce milestone rarity or difficulty labels if the product wants more game-like progression cues

UI/UX enhancement goals:
- profile becomes more motivating and revisit-worthy
- students can see growth, not only account data
- newest achievements feel rewarding without overwhelming the page
- roadmap progress becomes easier to scan on both first visit and return visits

Responsive expectations:
- mobile: milestone sections stack vertically
- tablet: overview and next-up can share space where readable
- desktop: overview, recent achievements, and next-up form a clearer roadmap grid
- category progress cards and empty states stay readable without cramped text

Verification:
- milestone UI now reflects the expanded roadmap instead of the older MVP denominator
- recent achievements and next-up sections remain meaningful even when the learner has no milestones yet or has unlocked many milestones already
- implemented page passed `pnpm -s tsc --noEmit`

Phase outcome:
- the milestone experience now reads as a real learner roadmap instead of a small MVP widget set

Next:
- Phase 9 study achievements and consistency milestones

## Phase 9: Study Achievements and Consistency Tracking

Status:
- implemented

Objective:
- connect actual study behavior to visible profile achievements

Exactly implemented:
- expanded the shared milestone key/category unions in `lib/types.ts` to support the full study and consistency milestone set
- added real study-driven milestone unlock logic in `lib/student-milestones.ts` for:
  - `Lesson Starter`
  - `Steady Learner`
  - `Focused Learner`
  - `Learning Streak`
  - `Note Taker`
  - `Progress Builder`
  - `Halfway There`
  - `Almost Done`
  - `Certified Learner`
- added supporting roadmap milestones such as `Identity Confirmed` and `Course Explorer` so the full 20-milestone plan is now represented in code
- wired milestone sync to read from:
  - enrollment progress and completed lessons
  - note activity
  - certificate issuance records
  - existing onboarding and onsite signals
- made study-milestone evaluation explicit and testable by deriving metrics such as:
  - total completed lessons
  - highest course progress
  - distinct activity days from enrollments, notes, and certificates
- updated the notes API to resync milestones immediately after a learner creates a note, so note-based achievements can unlock from a real backend action
- kept enrollment progress and completion milestone syncing active through the existing enrollment routes

Possible improvements:
- add richer temporal tracking if the product later wants a stricter true-day streak model instead of the current distinct-activity-day heuristic
- trigger milestone sync directly from certificate creation once the app has an active certificate issuance workflow
- add per-milestone progress values for lessons, notes, and streaks so next-up guidance becomes even more specific

UI/UX enhancement goals:
- profile reflects real learning, not just onboarding
- students feel recognized for consistency and course progress
- the page rewards studying behavior in a visible way
- milestone momentum now comes from actual learner effort, not only account setup events

Responsive expectations:
- longer milestone descriptions stay readable on smaller screens
- category and roadmap cards still support the added study milestones without crowding
- achievement empty states and next-up guidance remain concise enough for card layouts

Verification:
- study milestones unlock when the matching enrollment, progress, note, or certificate data exists
- streak logic is explicit and deterministic through the distinct-activity-day calculation
- achievement ordering remains stable and understandable through milestone order plus recent unlock timestamps
- implemented code passed `pnpm -s tsc --noEmit`

Phase outcome:
- milestones now reflect real student effort, learning momentum, and completion outcomes across the broader roadmap

Next:
- Phase 10 onsite learner identity layer
## Phase 10: Onsite Learner Identity Layer

Status:
- implemented

Objective:
- make onsite conversion visible as a meaningful identity upgrade inside the profile system

Exactly implemented:
- kept learner badge logic visible at the top of the profile and training record so `Online Learner` and `Onsite Learner` remain explicit identity states
- added a dedicated onsite identity layer inside the profile hero that now:
  - distinguishes premium onsite activation from pending onsite payment
  - explains what the onsite pathway means inside the learner hub
  - keeps the onsite pathway visible to online learners without treating them as lesser students
- added a dedicated onsite milestone spotlight so `Onsite Learner` or `Onsite Interested` can surface as a premium identity cue instead of remaining buried in the generic milestone grid
- added direct onsite actions from the hero into:
  - `/dashboard/onsite-training`
  - `/dashboard/payments`
  - guided setup when the learner is still online and incomplete
- extended the training-tab payment area with onsite verification and next-action cards so students can verify seat/payment state and move into the right route quickly
- aligned the onsite route copy so it now explicitly tells students that successful payment updates the learner hub with onsite status, reference data, and cohort details

Possible improvements:
- add a dedicated onsite certificate or cohort badge if the onsite track later gets more granular post-payment milestones
- show seat confirmation or cohort capacity changes directly inside the profile hero once that data becomes available
- add a premium visual accent variant for paid onsite learners if the product wants stronger differentiation later

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
- implemented pages passed `pnpm -s tsc --noEmit`

Phase outcome:
- onsite now reads as part of the student identity system, not only a payment event or side route

Next:
- Phase 11 polish, consistency, and advanced enhancements
## Phase 11: Polish, Copy, and Cross-Route Consistency

Status:
- implemented

Objective:
- ensure the student profile system feels cohesive across all entry points and interactions

Exactly implemented:
- aligned copy across:
  - `/welcome/student`
  - `/dashboard`
  - `/dashboard/profile`
  - `/dashboard/profile/setup`
  - `/dashboard/onsite-training`
- normalized language around:
  - learner hub
  - guided setup
  - learner record
  - onsite pathway
- tightened the profile success-state copy so save, password, and setup-complete states now point back into the same learner-hub narrative instead of sounding like unrelated route events
- improved supporting no-data and explanatory states by making the setup, welcome, onsite, and profile pages describe the same system instead of competing metaphors
- added a lightweight polish pass with subtle hover elevation on major cards across profile, setup, welcome, and onsite routes
- kept the changes responsive by limiting polish to layout-safe card transitions and copy improvements rather than heavy motion that could disrupt smaller devices

Possible improvements:
- add shared route helpers for success-state copy and query cleanup if more dashboard pages adopt the same pattern
- introduce milestone unlock toast notifications once the team is ready to add product-wide celebratory messaging
- add progress-bar or newest-achievement reveal motion once the design system has a stable motion standard
- run a final dedicated dark-mode contrast pass after the full dashboard polish wave lands

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
- implemented pages passed `pnpm -s tsc --noEmit`

Phase outcome:
- the student profile system is cohesive, polished, responsive, and production-grade

## Step-by-Step Action Plan for Remaining Improvements

This converts every remaining `Possible improvements` note in the roadmap into a concrete execution backlog.

### Step 1. Upgrade the hero completion treatment
Status:
- implemented

Exactly implemented:
- replaced the old numeric completion summary card with a circular completion ring inside the learner hero
- kept the completion percentage visible in the center of the ring so it remains legible at a glance
- preserved supporting count context beside the ring so students still see completed items versus total items
- kept the new treatment mobile-safe by using a compact side-by-side layout that stacks cleanly when space tightens

Outcome:
- the hero completion state is now more visually meaningful and easier to scan without overwhelming the rest of the learner hub

### Step 2. Add a compact hero secondary action pattern
Status:
- implemented

Exactly implemented:
- added a compact secondary hero action that appears only for fully complete learners
- made the secondary action `Review achievements`, which scrolls directly to the milestone section instead of competing with the page's main CTA logic
- kept the primary CTA singular by limiting the secondary action to the completed-profile state only
- placed the action near the new completion ring so returning learners can quickly jump into achievement review without hunting through the page

Outcome:
- fully complete learners now get a low-friction return action in the hero while the main next-step system stays focused and uncluttered

### Step 3. Animate progress state changes carefully
Status:
- implemented

Exactly implemented:
- tightened the shared `Progress` component so indicator movement now uses an explicit calm transform animation with motion-reduce support
- animated the learner-hub completion bar, milestone roadmap bar, category progress bars, and hero completion ring with smoother timing
- kept the transition subtle enough to avoid distracting movement or layout shift

Outcome:
- progress changes now feel intentional and polished without making the profile page feel busy

### Step 4. Expand milestone metadata and progress counters
Status:
- implemented

Exactly implemented:
- extended the shared milestone summary items with optional `progressValue`, `targetValue`, `progressPercent`, and `progressLabel`
- upgraded `buildStudentMilestoneSummary` so locked milestones can now carry real progress context instead of only static copy
- threaded enrollment, note, and certificate data into the onboarding-state milestone summary so progress-aware `Next Up` guidance reflects real learner activity
- upgraded the `Next Up` cards on the profile page to show progress counters and mini progress bars where useful

Outcome:
- the milestone roadmap now explains not just what comes next, but how close the learner already is to reaching it

### Step 5. Add milestone feedback moments
Status:
- implemented

Exactly implemented:
- added a lightweight one-time milestone unlock toast on the profile page using local storage so the newest achievement can be acknowledged without repeating on every refresh
- added a subtle reveal animation to recent achievement cards, with the newest achievement receiving the strongest emphasis
- normalized recent achievement date formatting into a consistent month-day-year presentation

Outcome:
- new achievements now feel noticed and rewarding while still staying lightweight and product-safe

### Step 6. Strengthen section summaries in the training record
Status:
- implemented

Exactly implemented:
- added summary cues across the major training-record sections so students now see whether a section is managed in guided setup, onsite training, or the current page
- surfaced `Last learner update` context in the training status cards and section-summary strips so the record feels more current and trustworthy
- introduced clearer separator cards ahead of the major training groups, including Identity and Contact, Training Mode, Payment Status, Preferences, and Additional Info
- kept the section-summary layout responsive so the helper copy and quick actions wrap cleanly instead of crowding the training record on smaller screens
- left collapsible sections out for now because the new summary treatment improved scanability without adding extra interaction overhead

Outcome:
- the training record is easier to scan, feels more intentionally structured, and explains ownership of each section before the learner has to interpret the data block itself

### Step 7. Deep-link incomplete items to the right setup step
Status:
- implemented

Exactly implemented:
- mapped setup-related completion fields into concrete guided-setup groups for `personal`, `preferences`, and `optional`
- upgraded completion and status cards on the profile page so incomplete setup items can now open the matching setup step directly instead of always sending the learner to the generic setup landing state
- added query-driven setup-step support on `/dashboard/profile/setup`, so the setup flow can land directly on the requested step when linked from the profile page
- expanded the setup form to include real `phoneNumber` and `whatsappNumber` fields in the personal step and the setup API, replacing the old weak fallback behavior with editable learner-owned data
- updated review content and validation so the deep-linked setup path still preserves a coherent end-to-end setup experience
- kept the remaining future extension simple: field-level anchors can still be added later if the setup flow becomes more granular than step-based routing

Outcome:
- students can now jump from an incomplete profile signal straight into the right setup step, which removes extra navigation friction and makes the learner hub feel much more connected to the guided setup flow

### Step 8. Add section-specific return summaries after setup
Status:
- implemented

Exactly implemented:
- expanded the setup redirect so returning learners now arrive on `/dashboard/profile` with a richer setup handoff state, including the refreshed training tab, highlighted training record, and the section list updated by the latest save
- added a compact `Latest setup refresh` summary card near the top of the learner hub that lists the refreshed sections from the latest guided setup save
- made each return-summary item show whether the section is now ready or still needs attention, so the handoff does not stop at a generic success message
- added direct links from each updated section summary back into the matching setup step so the learner can continue immediately if anything still needs work
- tightened dismiss behavior so clearing the success state also clears the setup-summary query state instead of leaving stale handoff data behind

Outcome:
- the setup-to-profile handoff now feels intentional and reviewable, with a clear picture of what changed in the latest save instead of a generic success banner only

### Step 9. Strengthen incomplete-state visual language
Status:
- implemented

Exactly implemented:
- added stronger `Needs attention` and `Ready` chips to the major training-record status cards and section headings so incomplete sections are easier to spot at a glance
- introduced a shared training-field card treatment that now handles complete, incomplete, and awaiting-update states in one consistent visual system
- replaced weak fallback copy in the training record, including the payment reference area, with clearer incomplete-state messaging that explains what is missing and where to fix it
- wired the new field cards to the guided setup steps when appropriate, so incomplete-state messaging is paired with a real next action instead of passive warning text
- kept the cards calm and readable on smaller screens by using soft warning surfaces, short helper copy, and inline links rather than heavy alert blocks

Outcome:
- the learner record is now more honest and easier to scan, with incomplete details clearly visible without making the page feel error-heavy or punitive

### Step 10. Extend edit-ownership clarity even further
Status:
- implemented

Exactly implemented:
- added `Edited here` badges on the General tab's name and bio inputs so every account-level edit now explicitly marks where the change happens
- kept the section cards, training status strips, and milestone prompts tied to specific edit sources, so each area shows whether guided setup, the General tab, or the onsite page owns the content
- fortified the milestone UI with soft reminder copy and CTA buttons that remind students to update guided setup or course progress when the Next Up roadmap is still active

Outcome:
- the learner hub now teaches students how to edit each kind of detail and keeps progress/milestone prompts connected to the right actions instead of leaving them abstract

### Step 11. Consolidate route-state handling
Status:
- implemented

Exactly implemented:
- added a shared profile route-state helper with `parseProfileRouteState` and `buildProfileRouteQuery` so every success/query state is parsed consistently
- rewired the profile page to rely on the helper for `updateProfileRoute`, the success-card state machine, and the section-highlight/return summary logic
- redirected the setup page through the helper instead of manually constructing query strings, which keeps handoff state aligned with the new `Latest setup refresh` card

Outcome:
- success messaging, deep links, and summary highlights all come from one plumbing layer, making the profile/setup experience easier to maintain and extend

### Step 12. Enrich the milestone roadmap presentation
Status:
- implemented

Exactly implemented:
- extended the milestone summary layer with category tone metadata so profile cards can render calm, category-specific accents without hardcoding visual meaning in the page alone
- upgraded the `Milestones Overview` category grid with richer category summaries, accent chips, and progress bars that now differentiate onboarding, profile, learning, onsite, completion, consistency, and progress groups more clearly
- updated recent-achievement and next-up cards so each milestone now carries its category accent into the icon surface and category badge
- introduced lightweight effort labels in `Next Up` using restrained language like `Short path`, `Building`, and `Longer arc` so roadmap difficulty is clearer without turning the profile into a noisy gamification surface
- kept the presentation responsive by preserving stacked card layouts, short labels, and soft color surfaces that stay readable on mobile and tablet

Outcome:
- the milestone roadmap now feels richer and easier to scan, while still staying calm, premium, and product-oriented

### Step 13. Tighten study-achievement precision
Status:
- implemented

Exactly implemented:
- upgraded the milestone engine to carry stronger study-progress signals for note-taking and streak-based achievements instead of relying only on binary unlock logic
- added per-milestone note progress so `Note Taker` now reflects real note volume in roadmap previews before and after unlock
- replaced the old distinct-activity-day heuristic for `Learning Streak` with consecutive-day streak logic, so the streak milestone now tracks real contiguous learning momentum
- kept lesson- and course-progress milestone counters flowing through the shared milestone summary so roadmap cards continue to show lesson, progress-band, and completion progress from real enrollment activity
- left direct certificate-issuance syncing as a future integration point because that workflow is not yet a first-class standalone issuance flow in the current product

Outcome:
- study achievements now feel more trustworthy and precise, especially for note-taking and streak momentum, and the roadmap guidance is more grounded in real learner behavior

### Step 14. Deepen the onsite identity layer
Status:
- implemented

Exactly implemented:
- connected the learner hub to the shared admin-managed onsite training config so the profile page can now surface live cohort label, venue, start date, seat availability, and location-specific enrollment signals instead of relying only on static learner data
- upgraded the onsite identity layer on `/dashboard/profile` with richer cohort and seat badges, a premium paid-onsite visual accent, and dedicated cohort/seat summary cards inside the hero area
- extended the training-record payment section so onsite learners now see cohort and seat-signal cards alongside payment status, reference, and fee details
- aligned `/dashboard/onsite-training` with the same premium identity treatment by adding seat-status badges, stronger paid-state visuals, and learner-hub status copy that explains exactly how payment changes the profile page
- left future post-payment milestone expansion intentionally open for attendance, internship, or downstream certification states once those data points exist as first-class workflows

Outcome:
- onsite now reads like a visible identity upgrade with cohort and seat context, not just a payment branch hidden off to the side

### Step 15. Finish the final product-polish pass
Status:
- implemented

Exactly implemented:
- applied a shared motion-safe card interaction pattern across the main profile, setup, welcome, and onsite pages so hover elevation remains polished while respecting reduced-motion preferences
- ran a focused dark-mode contrast pass across the major profile-related cards and premium surfaces, especially the onsite and hero states, so the gradients and status blocks stay readable in darker themes
- tightened the final route polish by keeping premium cards, setup sidebars, and welcome actions responsive and layout-safe across mobile, tablet, and desktop breakpoints
- preserved the calmer motion standard introduced earlier by avoiding heavy animations and limiting the final polish to subtle transform, shadow, and contrast improvements that do not disrupt smaller devices

Outcome:
- the student profile system now closes out with a more premium, consistent, and accessible finish across the connected learner-hub routes
## Done vs Next Summary

## Done
- `/dashboard/profile` exists and now has a learner hero, dynamic completion card, milestone surface, and grouped training record view
- `/dashboard/profile/setup` exists and now hands off back into the profile with a targeted training-section review state
- completion tracker logic exists and is shared across profile, setup, dashboard, and welcome flows
- the full 20-milestone student roadmap, syncing, and summary rendering are implemented
- dashboard, welcome, setup, profile, and onsite routes now use more consistent learner-hub language
- onsite learner identity is now visible in the profile hero and training record
- explicit success states exist for setup completion and key profile actions

## Next
- keep certificate-issuance milestone syncing on deck for the moment a first-class issuance workflow lands
- extend onsite-specific milestones later if attendance, internship, cohort completion, or certification states become first-class product events
- use this roadmap as the baseline for any future learner-hub refinement instead of reopening solved profile/setup ownership questions

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






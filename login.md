# Login and Auth Flow Audit

This document reflects the current auth implementation in the repo and tracks the phased work toward a true one-click returning-user login plus a more consistent login and signup experience.

## Goal

You want returning users who have already logged in before to reach their dashboard with a single click, without retyping email or password, while keeping login and signup visually and behaviorally aligned.

## Current Status

Implemented so far:
- Phase 1: done
- Phase 2: done
- Phase 3: done with Option A
- Phase 4: done
- Phase 5: done
- Shared login/signup auth UI consistency pass: done
- Public navbar dashboard-return improvement: done

## What Has Been Done

### Phase 1: true one-click return for already authenticated users

Implemented:
- `/login` now checks `/api/auth/me` when the page loads.
- if a valid session exists, the app restores client auth state and avoids forcing the user to type credentials again.
- a short session-check loading state is shown while the app confirms whether a user is already signed in.

Result:
- returning users with a valid session no longer need to manually log in again.

### Phase 2: real dashboard shortcut for active sessions

Implemented:
- users with an active session now see a dedicated `Continue as {name}` experience.
- the main CTA is now a real `Go to dashboard` button.
- the page also auto-continues after a short delay if the user does nothing.
- the old remembered-user card no longer pretends to be a one-click login when no active session exists.

Result:
- the login page now distinguishes clearly between:
  - active session users
  - remembered identity users without an active session
  - brand-new login attempts

### Phase 3: remember me wired properly

Implemented using Option A:
- unchecked: login uses a browser-session cookie.
- checked: login sets a 30-day cookie.
- the login API now accepts `remember` and applies the correct cookie lifetime.
- the login page now explains the real remember-me behavior in plain language.

Result:
- the UI promise now matches actual auth persistence behavior.

### Phase 4: rebuild client auth from cookie on app load

Implemented:
- added a root auth bootstrap that runs on app load.
- when the client store is empty but a valid cookie-backed session exists, the app restores the Zustand auth store from `/api/auth/me`.
- this reduces mismatch between proxy-protected access and client-side rendering.

Result:
- better refresh behavior
- fewer false redirects
- more stable authenticated navigation

### Phase 5: improve login copy

Implemented:
- active-session state now says the user can continue directly to dashboard.
- remembered-user state now says `Welcome back, {name}. Enter your password to continue.`
- standard login state remains a clean generic sign-in form.
- login helper text is now closer in tone and structure to the guided signup flow.

Result:
- login states now feel more deliberate and easier to understand.

## Shared Login / Signup UI Improvements Implemented

Implemented:
- upgraded the shared auth layout so login and signup now live inside a more polished, consistent auth shell.
- aligned auth header and footer navigation across login and signup routes.
- refactored login into a fuller auth experience with:
  - headline and helper structure closer to guided signup
  - a dedicated right-rail with reassurance, guidance, and alternate auth paths
  - clearer state separation for active session, remembered identity, and standard login
- kept signup flows inside the existing guided onboarding shell while improving consistency of path-switching links.
- aligned auth footer actions so users can move between student and instructor paths more easily.

Result:
- login and signup now feel much more like parts of the same product flow instead of separate screens.

## Navbar Improvements Implemented

Implemented:
- public navbar now shows an `Open Dashboard` button for authenticated users.
- signed-in users can get back to their role home quickly from public or landing pages.
- placeholder avatar behavior is improved so initials display when a real profile image is missing.

Result:
- logged-in users can recover context faster and the public experience feels more polished.

## Current Auth Routes

### Public auth pages

- `/login`
  - File: `app/(auth)/login/page.tsx`
  - Purpose: login entry with active-session shortcut, remembered-user support, and aligned auth UX.
- `/register`
  - File: `app/(auth)/register/page.tsx`
  - Purpose: student signup entry.
- `/register-instructor`
  - File: `app/(auth)/register-instructor/page.tsx`
  - Purpose: instructor signup entry.
- `/register-online`
  - File: `app/(auth)/register-online/page.tsx`
- `/register-onsite`
  - File: `app/(auth)/register-onsite/page.tsx`
- `/verify-otp`
  - File: `app/(auth)/verify-otp/page.tsx`
- `/forgot-password`
  - File: `app/(auth)/forgot-password/page.tsx`
- `/reset-password`
  - File: `app/(auth)/reset-password/page.tsx`
- `/login-admin`
  - File: `app/login-admin/page.tsx`

### Protected dashboard routes

- `/dashboard`
- `/instructor`
- `/admin`
- `/finance`
- `/checkout`

## Current Auth API Routes

- `POST /api/auth/login`
  - now supports real `remember` behavior
  - unchecked = session cookie
  - checked = 30-day cookie
- `POST /api/auth/logout`
- `GET /api/auth/me`
  - now returns both `user` and `token` so the client store can be rebuilt from a valid cookie-backed session
- `POST /api/auth/register`
- `POST /api/auth/register-instructor`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-otp`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Current Session Behavior

There are still two layers, but they now work together more cleanly:

### 1. Cookie-based session

- used by proxy protection and server-validated access
- now supports session-only or 30-day duration based on `remember`

### 2. Client-persisted auth store

- still stores `user`, `token`, `lastLogin`, and hydration state
- now can be restored automatically from `/api/auth/me` on app boot when the cookie is valid

Result:
- much better consistency between server and client auth behavior

## Remaining Suggested Improvements

- make login and signup share even more reusable auth-section components instead of mirroring patterns manually
- add analytics for:
  - auto-redirect success
  - remembered-user usage
  - remember-me adoption
  - login drop-off
  - OTP-required login cases
- add optional device/session management in profile settings
- add optional last-login timestamp or device hint for extra reassurance
- add richer mobile auth transitions and motion parity across all auth routes
- consider a future remembered-dashboard shortcut outside the login page itself

## Steps Completed So Far

1. implemented active-session detection on `/login`
2. added one-click dashboard continuation for valid sessions
3. wired `Remember me` to real cookie duration behavior
4. restored client auth state from cookie-backed sessions on app load
5. improved state-specific login copy
6. aligned shared auth shell and login/signup navigation patterns
7. improved navbar recovery path for signed-in users on public pages

## Notes

- There is an older file at `sign up/login.md`, but it does not fully match the current implementation anymore.
- This file should be treated as the current source of truth for the login and auth flow.

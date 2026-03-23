# Signup and Onboarding: Current State

This document describes how signup and onboarding work today in the codebase after phases 0 to 6 of the redesign.
It is the updated baseline for future onboarding work.

## Scope

This covers:
- unified student signup
- instructor signup
- OTP verification
- onboarding welcome screens
- onboarding state tracking
- authenticated onsite training flow
- login behavior for unverified users
- admin-created admin and finance accounts

## Core Rules in the Current System

1. Public signup does not create a real user record immediately.
2. Public signup sends OTP successfully before a `pendingRegistration` is stored.
3. A real user record is created only after OTP verification succeeds.
4. Verified users are logged in immediately after OTP verification.
5. Onsite training payment now starts from an authenticated student account inside the dashboard.
6. Legacy pending-registration payment reassociation still exists only as compatibility for older payment records and return flows.
7. Admin and finance accounts are still created directly by an admin and do not use OTP.

## Route Map

| Route | Purpose | Notes |
| --- | --- | --- |
| `/register` | canonical student signup | guided minimal student stepper |
| `/register-online` | legacy student entry | redirects to `/register` |
| `/register-onsite` | legacy onsite entry | redirects to `/register` |
| `/register-instructor` | canonical instructor signup | guided instructor stepper |
| `/verify-otp` | OTP verification | shared by students and instructors |
| `/welcome/student` | first-login student welcome | uses onboarding state |
| `/welcome/instructor` | first-login instructor welcome | uses onboarding state |
| `/dashboard/onsite-training` | onsite offer and payment page | authenticated dashboard flow |
| `/dashboard/onsite-training/success` | dashboard return page | verifies onsite payment in dashboard context |
| `/register-onsite/success` | legacy return page | compatibility surface only |
| `/login` | sign-in page | redirects unverified users to OTP |
| `/admin` -> create user | admin creates admin/finance accounts | no public signup for these roles |

## Current Flow by User Type

## 1. Student signup flow

### Current step-by-step flow

1. User opens `/register`.
2. User completes a guided 3-step signup:
   - account
   - basic info
   - review
3. Frontend validates with `studentRegisterSchema`.
4. Frontend POSTs to `/api/auth/register`.
5. Backend sends OTP first, then stores `pendingRegistration`.
6. Frontend redirects to `/verify-otp?email=...&role=student&source=signup`.
7. User enters OTP.
8. Backend creates the real student user and returns JWT.
9. Frontend stores auth and redirects to `/welcome/student`.
10. Student continues to dashboard actions from the welcome screen.

### Current student signup fields

- full name
- email
- password
- confirm password
- phone number
- optional WhatsApp number
- accept terms

### Deferred until after verification

- address
- DOB
- gender
- training preferences
- healthcare background details

## 2. Instructor signup flow

### Current step-by-step flow

1. User opens `/register-instructor`.
2. User completes the guided instructor stepper.
3. Frontend validates with `instructorRegisterSchema`.
4. Frontend POSTs to `/api/auth/register-instructor`.
5. Backend sends OTP first, then stores `pendingRegistration`.
6. Frontend redirects to `/verify-otp?email=...&role=instructor&source=signup`.
7. User enters OTP.
8. Backend creates the real instructor user and returns JWT.
9. Frontend stores auth and redirects to `/welcome/instructor`.
10. Instructor continues into settings or workspace from the welcome screen.

### Current instructor signup fields

- full name
- email
- password
- confirm password
- phone number
- professional headline
- specialties
- years of experience
- accept terms

### Deferred until after verification

- bio
- avatar
- public profile polish

## 3. OTP verification flow

### Current step-by-step flow

1. User lands on `/verify-otp`.
2. Email is read from query param first, with `sessionStorage` only as a fallback.
3. User enters the 6-digit code.
4. Frontend POSTs to `/api/auth/verify-otp`.
5. On success:
   - auth store is set with user and token
   - `pending-otp-email` is removed from `sessionStorage`
   - user is redirected to role-specific welcome flow when enabled

### Current UX behavior

- role-aware copy for student, instructor, and legacy onsite contexts
- resend cooldown timer
- explicit change-email path
- explanation of what happens after verification

## 4. Welcome and onboarding state flow

### Current behavior

After OTP verification, students and instructors land on welcome screens before their main workspace.

What exists today:
- `/welcome/student`
- `/welcome/instructor`
- `/api/onboarding/state`
- persisted onboarding state on the user record
- checklist/progress driven from backend state

### Current onboarding state examples

- welcome seen
- profile completion percent
- onsite banner dismissed
- onsite page viewed
- instructor publishing guidelines reviewed

## 5. Onsite training flow

### Current step-by-step flow

1. Student signs up and verifies normally through `/register` and `/verify-otp`.
2. Student reaches dashboard and can discover onsite training from:
   - dashboard banner
   - dashboard navigation
   - relevant profile CTA
3. Student opens `/dashboard/onsite-training`.
4. Student chooses location and clicks `Register & Pay`.
5. Frontend POSTs to authenticated `/api/payments/initialize-onsite`.
6. Backend initializes Paystack using the real authenticated user.
7. Student returns to `/dashboard/onsite-training/success`.
8. Payment is verified and onsite access is reflected in the user experience.

### Current access model

- onsite paid: all courses unlocked
- regular student: standard course purchase flow

## 6. Login behavior for unverified users

### Current flow

1. User opens `/login`.
2. User submits email and password.
3. `/api/auth/login` tries normal login.
4. If credentials are valid but `emailVerified === false`:
   - API returns verification-required response
   - frontend redirects user to `/verify-otp?email=...&source=login`
5. User can complete verification and continue.

## 7. Admin-created admin and finance accounts

### Current flow

1. Admin creates user from admin dashboard.
2. `/api/admin/create-user` validates admin auth.
3. Backend calls direct registration flow.
4. User is created immediately with `emailVerified: true`.
5. Welcome email is sent.
6. Account can log in immediately.

## Current UI State Inventory

## Student signup (`/register`)

States currently present:
- step-based guided form
- inline validation and destructive alert
- loading submit state
- review step with edit actions
- explicit redirect to OTP on success

## Instructor signup (`/register-instructor`)

States currently present:
- shared onboarding shell
- inline validation and destructive alert
- loading submit state
- review step with edit actions
- explicit redirect to OTP on success

## OTP verification (`/verify-otp`)

States currently present:
- role-aware verification copy
- inline error alert
- loading verify state
- resend loading state
- resend cooldown timer
- change-email route
- next-step explanation

## Welcome screens

States currently present:
- onboarding state loading
- checklist/progress view
- role-specific quick actions
- first-visit state marking

## Onsite dashboard flow

States currently present:
- onsite information page
- location selection
- checkout loading state
- dashboard return verification state
- paid vs unpaid status summary

## Summary

Today the onboarding system is materially different from the old baseline:
- one canonical public student signup route
- instructor signup uses the same onboarding system quality
- OTP UX is stronger and more explicit
- welcome screens exist before main dashboards
- onboarding state is persisted
- onsite payment happens in authenticated dashboard context

The remaining legacy pieces are compatibility-only:
- `/register-online` redirect
- `/register-onsite` redirect
- `/register-onsite/success` compatibility return page
- legacy pending-registration payment reassociation logic for older records

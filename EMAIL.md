# Email Services Overview

This document describes all email-related behavior in this codebase as of now.

## Provider

- Provider: Resend API (`https://api.resend.com/emails`)
- Main implementation file: `lib/email.ts`

## Required Environment Variables

- `RESEND_API_KEY`
  - Required in non-development environments.
  - If missing in development, emails are not sent and OTP/reset values are logged to server console.
- `RESEND_FROM`
  - Sender used for all outbound emails.
  - Current local value: `PromptCare Academy <no-reply@promptcareacademy.com>`.
  - Important: this sender/domain must be verified in your Resend account or delivery will fail.
- `OTP_EXPIRES_MINUTES`
  - OTP validity window (default 15 minutes).

## OTP and Auth Email Flows

### 1) Signup OTP

- Trigger: `POST /api/auth/register`
- Code path:
  - `app/api/auth/register/route.ts`
  - `authService.registerWithOtp(...)` in `lib/auth.ts`
  - `sendOtpEmail(...)` in `lib/email.ts`
- Behavior:
  - Creates user with `emailVerified: false`
  - Generates/stores hashed OTP (`otpHash`, `otpExpiresAt`)
  - Attempts to send OTP email
  - Returns success response if account is created

### 2) Verify OTP

- Trigger: `POST /api/auth/verify-otp`
- Code path:
  - `app/api/auth/verify-otp/route.ts`
  - `authService.verifyOtp(...)` in `lib/auth.ts`
- Behavior:
  - Verifies OTP against stored hash and expiry
  - Marks user verified (`emailVerified: true`) and clears OTP fields
  - Returns login token + user data
  - Sends welcome email in a non-blocking `try/catch`

### 3) Resend OTP (explicit only)

- Trigger: `POST /api/auth/resend-otp`
- Code path:
  - `app/api/auth/resend-otp/route.ts`
  - `authService.resendOtp(...)` in `lib/auth.ts`
  - `sendOtpEmail(...)` in `lib/email.ts`
- Behavior:
  - Only for existing unverified users
  - Generates a new OTP + new expiry
  - Sends new OTP email

### 4) Login behavior for unverified users

- Trigger: `POST /api/auth/login`
- Code path:
  - `app/api/auth/login/route.ts`
  - `authService.login(...)` in `lib/auth.ts`
- Behavior now:
  - Login does **not** send a new OTP.
  - For unverified users, returns `403` with `requiresVerification: true`.
  - Frontend redirects to `/verify-otp` where user can use existing OTP or click Resend.

## Password Reset Email Flow

- Trigger: `POST /api/auth/forgot-password` (internally)
- Code path:
  - `authService.requestPasswordReset(...)` in `lib/auth.ts`
  - `sendPasswordResetEmail(...)` in `lib/email.ts`
- Behavior:
  - Generates reset token (stored in OTP fields) and expiry
  - Sends reset email containing both link and code

## Additional Notification Emails

- Welcome email after OTP verification:
  - `sendWelcomeEmail(...)`
- Instructor lesson moderation notifications:
  - `sendLessonRejectedEmail(...)`
  - `sendLessonApprovedEmail(...)`

## Troubleshooting Delivery Issues

If OTP is not received:

1. Confirm user is unverified and exists in DB.
2. Confirm `RESEND_API_KEY` is valid.
3. Confirm `RESEND_FROM` sender/domain is verified in Resend.
4. Check server logs for:
   - `Resend API error: ...`
   - `Failed to send OTP email: ...`
5. Use `/verify-otp` page and click Resend to test explicit resend flow.

## Security Notes

- OTP values are stored hashed (`bcrypt`), not plaintext.
- OTP is time-limited using `otpExpiresAt`.
- Verified accounts clear OTP fields after successful verification.

# Sign Up / Login Flow

This document describes the **current implemented flow** for student sign-up, OTP verification, and login.

## 1. Student Sign-Up Flow

UI entry:
- `GET /register`
- Page: `app/(auth)/register/page.tsx`

User submits the multi-step on-site training registration form with:
- Personal info (name, email, phone, WhatsApp, gender, DOB, address)
- Background info (healthcare professional, current field)
- Training details (preferred location, motivation)
- Payment info + agreements
- Password + confirm password

API call:
- `POST /api/auth/register`
- Route: `app/api/auth/register/route.ts`

What the backend does:
1. Validates payload with `registerSchema` (`lib/validation.ts`).
2. Forces public sign-up role to `student`.
3. Saves account with:
   - `emailVerified: false`
   - `otpHash` (hashed 6-digit OTP)
   - `otpExpiresAt` (default 15 minutes from creation)
   - `studentProfile` registration details
4. Sends OTP to user email.

Response:
- `200` with `{ success: true, user, message: "OTP sent to email" }`
- `409` if user exists
- `400` for validation failure

After success on UI:
1. Email is saved in `sessionStorage` as `pending-otp-email`.
2. User is redirected to `/verify-otp?email=<email>`.

## 2. OTP Verification Flow

UI entry:
- `GET /verify-otp`
- Page: `app/(auth)/verify-otp/page.tsx`
- Client: `app/(auth)/verify-otp/verify-otp-client.tsx`

Verification API:
- `POST /api/auth/verify-otp`
- Body: `{ email, otp }`

What verify does:
1. Finds user by email.
2. Checks `otpHash` + `otpExpiresAt`.
3. Rejects invalid/expired codes.
4. On success:
   - sets `emailVerified: true`
   - clears `otpHash` and `otpExpiresAt`
   - returns JWT token + user object
   - sends welcome email (best effort)

UI behavior after successful verify:
1. Saves auth in Zustand store (`useAuthStore.setAuth(user, token)`).
2. Clears `pending-otp-email` from sessionStorage.
3. Redirects by role:
   - student -> `/dashboard`
   - instructor -> `/instructor`
   - admin -> `/admin`
   - finance -> `/finance`

Resend OTP:
- `POST /api/auth/resend-otp`
- Body: `{ email }`
- Works only for existing unverified users.

## 3. Login Flow

UI entry:
- `GET /login`
- Page: `app/(auth)/login/page.tsx`

API call:
- `POST /api/auth/login`
- Body: `{ email, password }`

Backend login behavior:
1. Validates payload (`loginSchema`).
2. Authenticates credentials.
3. If user exists but `emailVerified === false`, returns:
   - `403`
   - `{ requiresVerification: true, error: "Email not verified..." }`
4. On success:
   - returns `{ success: true, user, token }`
   - sets HTTP-only cookie `token` (7-day max age)

Frontend login behavior:
1. If `requiresVerification`, redirects to `/verify-otp?email=<email>`.
2. On success, stores user/token in Zustand.
3. Redirects to safe role route (`getSafeRedirectForRole`), e.g. `/dashboard` for students.

## 4. Route Protection and Session Sources

Auth token can be read from:
- `Authorization: Bearer <token>` header, or
- `token` cookie

Relevant helper:
- `lib/jwt.ts` (`getTokenFromRequest`)

Proxy protection:
- `proxy.ts` protects `/admin`, `/dashboard`, `/instructor`, `/finance`, `/checkout`
- If no cookie token on protected route, redirect to `/login?redirect=<path>`

Client-side role guards:
- Layouts also check hydrated auth store and role-specific access (e.g. student-only dashboard layout).

## 5. Logout

API:
- `POST /api/auth/logout`

Behavior:
- Clears `token` cookie (`maxAge: 0`)
- Client also clears Zustand auth state.

## 6. OTP Details Summary

- OTP is a random 6-digit code.
- OTP is hashed before storing (not stored in plain text).
- OTP expiration default: `OTP_EXPIRES_MINUTES` env, fallback `15`.
- OTP can be resent for unverified users.
- Verification is required before successful normal login for OTP-registered users.

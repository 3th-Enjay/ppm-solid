# Instructor and Student Registration

## Current Flows

### Student registration entry points
- `/register` : hub page with links
- `/register-onsite` : onsite registration form (captures full profile + payment fields)
- `/register-online` : online registration form (captures the same profile details except payment fields)

### Student registration details captured
- Full name
- Email
- Password + confirm password
- Phone number
- WhatsApp number
- Gender
- Date of birth
- Current address
- Healthcare professional (yes/no)
- Current role/field
- Preferred location (Enugu/Abuja)
- Training interest
- Details-correct confirmation
- Terms acceptance

### Onsite-only payment fields
- Payment status (must be `yes` to submit onsite form)
- Payment reference (optional)
- Slot-secured-after-payment agreement

### Student OTP and dashboard flow
1. User submits registration form.
2. Backend creates user with OTP (`emailVerified=false`).
3. User is redirected to `/verify-otp`.
4. After successful OTP:
   - Onsite student: auto-enrolled into all approved courses, then lands in `/dashboard`.
   - Online student: lands in `/dashboard`, but must purchase courses to access paid content.

### Instructor flow
- `/register-instructor` captures:
  - Name, email, password
  - Phone
  - Professional headline
  - Specialties
  - Years of experience
  - Bio
  - Avatar URL (optional)
- OTP verification uses same `/verify-otp` flow.
- After OTP success, instructor is routed to `/instructor` dashboard.

## Access Rules
- Onsite students: free access to courses/materials via automatic enrollment after OTP.
- Online students: no automatic enrollment; must pay to access paid courses.

## Paystack 404 Fix

### Why 404 happened
- The previous default URL pointed to a non-existent Paystack payment slug.
- If the slug is not created in your Paystack dashboard, Paystack returns `404`.

### What was changed in code
- Default onsite payment link now falls back to an internal contact page instead of a broken slug:
  - `lib/student-registration.ts`
  - `NEXT_PUBLIC_ONSITE_TRAINING_PAYMENT_URL || "/contact?subject=Onsite%20Training%20Payment%20Link"`

### Proper production fix (recommended)
1. Create a real Paystack payment page in your Paystack dashboard.
2. Copy the generated URL (example: `https://paystack.com/pay/<your-real-slug>`).
3. Set it in `.env.local`:

```env
NEXT_PUBLIC_ONSITE_TRAINING_PAYMENT_URL=https://paystack.com/pay/<your-real-slug>
```

4. Restart app/build.

This guarantees the "Open Payment Link" button resolves to a valid payment page.

## Suggested Improvements for Seamless Experience
- Add OTP countdown + resend cooldown UI to reduce repeated resend attempts.
- After OTP success, show role-specific success screen for 1 second before redirect.
- For onsite registration, validate payment reference format if `paymentStatus=yes`.
- For online students, add a guided first-run dashboard card with "Browse courses" and "How payment works".
- Add webhook reconciliation for onsite fee (if processed through Paystack API) so payment status updates automatically.
- Add email templates per role (student onsite/online, instructor) with clear next steps and direct dashboard links.

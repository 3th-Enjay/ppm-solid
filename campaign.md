# Campaign Update Notes

## What Was Done

- Added a new public campaign landing page at `/campaign/promptcare-academy` inside the public route group.
- Rebuilt the flyer into a responsive landing page with:
  - hero section
  - three signup CTA placements
  - restored call and WhatsApp contact access
  - training cost, cohort, date, duration, and venue sections
  - animated reveal and motion effects for a more polished experience
- Added a dedicated admin campaign editor at `/admin/campaign`.
- Added campaign configuration storage and API endpoints so campaign content can be edited without touching code.
- Connected campaign signups to the student registration flow so users coming from the campaign continue to `/dashboard/onsite-training` after successful OTP verification.
- Updated onboarding redirect logic so safe requested redirects can override the generic post-verification welcome route when needed.
- Fixed the production build issue on `/register` by wrapping the registration form in `Suspense` after introducing `useSearchParams` in the student registration flow.

## Main Files Changed

- `app/(public)/campaign/promptcare-academy/page.tsx`
- `app/(public)/campaign/promptcare-academy/campaign-page-client.tsx`
- `app/admin/campaign/page.tsx`
- `app/admin/layout.tsx`
- `app/api/campaign/route.ts`
- `app/(auth)/register/page.tsx`
- `components/auth/guided-student-registration-form.tsx`
- `lib/campaign-shared.ts`
- `lib/campaign-config.ts`
- `lib/onboarding-flow.ts`
- `public/promptcare-campaign.jpeg`

## Build and Verification

- Ran `pnpm -s tsc --noEmit`
- Ran `npm run build`
- Fixed the `/register` prerender error related to `useSearchParams`

## API Improvement Suggestions

- Add campaign versioning so admins can roll back to older campaign copies safely.
- Add draft/published campaign states so edits can be previewed before going live.
- Add campaign analytics endpoints to track:
  - visits
  - CTA clicks
  - WhatsApp clicks
  - completed registrations
  - onsite conversion rate
- Add support for multiple campaigns instead of a single hardcoded campaign config.
- Add image upload support from admin instead of requiring a public path string.
- Add validation for WhatsApp and phone formatting at save time.

## UI / UX Improvement Suggestions

- Add a sticky mobile CTA bar for signup and WhatsApp contact.
- Add a lighter testimonial or success-story section with real learner photos.
- Add a countdown or urgency banner tied to the next batch date.
- Add a small FAQ section directly on the campaign page to reduce drop-off.
- Add scroll progress or section indicator for long-page orientation.
- Add more visual rhythm between sections with alternating layouts and subtle parallax.
- Add an admin preview mode that shows how edits look on desktop and mobile before saving.

## Suggested Next Changes

- Turn campaign management into a reusable module that supports many campaign slugs.
- Track campaign attribution through registration, OTP verification, and onsite payment completion.
- Add a dedicated campaign performance dashboard in admin.
- Add A/B testing for CTA labels, hero copy, and contact placement.
- Add structured SEO fields in admin, including meta title, description, and social preview image.
- Add form-level capture for lead intent before registration for better follow-up.

## Notes

- There is an unrelated untracked file in the repo: `login.md`.
- If this campaign will be shared heavily, a good next step is deploying it with a custom Open Graph image and analytics events.

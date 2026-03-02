# Public Pages Redesign Guide

## Brand Vision
- We are shifting from a structured documentation feel to a cinematic healthcare-edtech brand.
- New direction: soft, confident, alive, motion-led, green-accent powered.
- Green (`#22c7a8`) is the emotional trigger for interaction and momentum.

## In-Scope Routes
- `/`
- `/about`
- `/contact`
- `/courses`
- `/courses/[slug]`
- `/faq`
- `/terms`
- `/privacy`
- `/refund`

## Core Design Shift
- From card-heavy static blocks to section storytelling with layered media.
- From simple entry reveals to multi-layer motion depth.
- From purple-forward emphasis to neutral-first with green interaction energy.

## Green As Brand Pulse
- Hover states: green text shift + underline sweep.
- Buttons: subtle scale + background morph on hover.
- Icons: animate stroke/accent toward green.
- Headline highlights: green gradient mask.
- Scroll progress bars: green.
- Focus states: subtle green glow ring.

## Motion System (All Must Respect Reduced Motion)

### 1) Reveal Motion
- Stagger fade-up for section children.
- Headline mask reveal.
- Image clip-path reveal.

### 2) Depth Motion
- Scroll parallax for section backgrounds.
- Floating decorative shapes.
- Image slow zoom (`scale 1 -> 1.05`).

### 3) Interaction Motion
- Magnetic button behavior.
- Hover glow.
- Underline sweep on interactive text.
- Card lift with very subtle rotation.

### 4) Ambient Motion
- Slow gradient blobs.
- Moving background mesh.
- Subtle grain/noise warmth overlay.

## Timing Standards
- Hover interactions: `200ms ease-out`.
- Reveal motion: `400ms`.
- Ambient loops: `1200ms+`.

## Token/Style Additions
- Keep accent green: `#22c7a8`.
- Add green glow token: `--glow-green: 0 0 0 3px rgba(34,199,168,0.25);`.
- Reduce dominant purple usage; purple remains secondary emphasis.

## Shared Primitive Upgrades (Phase L1 Baseline)

### SectionShell 2.0
- Add optional parallax background.
- Add optional floating accent media.
- Add soft gradient overlays.
- Add section divider shapes (wave/curve).
- Target props:
- `variant?: "default" | "split" | "immersive"`
- `hasParallax?: boolean`
- `hasFloatingAccent?: boolean`

### Hero System 2.0
- Cinematic split layout: storytelling text + moving image/video.
- Background gradient + subtle grain.
- Slow zoom hero media.
- Animated highlighted keyword in headline.
- Motion stack:
- Headline: mask reveal
- Subtext: fade
- CTA: slide
- Background: parallax drift

### CTA Band 2.0
- Gradient mesh background.
- Animated radial glow.
- Optional floating media.
- Button hover morph.
- CTA intent: emotional decision moment.

## Page-by-Page Direction

## Landing (`/`)
- Hero: immersive healthcare image, slow zoom, gradient overlay, floating green accent line.
- Trust band: horizontal marquee, hover pause, green tint response.
- Why Prompt Care: split layout with stacked floating cards and subtle parallax.
- Featured Courses: hover zoom, glow border, lift, max 1 degree tilt.
- Testimonials: horizontal slider with edge fade and floating green quote accent.

## About (`/about`)
- Keep strong story, reduce chaotic motion.
- Story becomes timeline-style scroll with section reveals and shifting background.
- Values: remove spin-shake; use icon-to-green morph and depth hover.
- Team: grayscale-to-color hover, soft zoom, green underline sweep.

## Contact (`/contact`)
- Warm hero with friendly image + slight parallax.
- Headline animated underline.
- Form: floating labels, green glow focus, animated success state.
- Sticky admissions panel on desktop: quick links, WhatsApp CTA, Explore Courses CTA.

## Courses (`/courses`, `/courses/[slug]`)
- Animated filter panel reveal.
- Animated result counts.
- Active tags pulse green.
- Course cards: image zoom, overlay gradient, metadata slide-up on hover.

## FAQ + Legal (`/faq`, `/terms`, `/privacy`, `/refund`)
- Unified article template.
- Sticky table of contents.
- Green scroll progress indicator.
- Section reveal on scroll.
- Heading hover highlights.

## Conversion Rule For Every Public Page
- End each page with:
- Emotional CTA
- Logical CTA
- Contact fallback
- Example set:
- Explore Courses
- Register Now
- Speak to Admissions

## Technical Direction (Next.js + Framer Motion)
- Use `useScroll` + transform bindings for parallax.
- Use `motion.div` with `style={{ y }}` for depth.
- Use `whileHover` and `layout` for micro-interactions and smooth filter transitions.
- Avoid heavy blur and large mobile scale animations.

## Sprint Sequence
1. Week 1: motion tokens + primitive upgrades (`SectionShell 2.0`, `Hero 2.0`, `CTA Band 2.0`).
2. Week 2: redesign `/` and `/about`.
3. Week 3: redesign `/contact` and `/courses`.
4. Week 4: redesign legal pages + QA.

## Immediate Next Implementation
- Start Phase L1 primitives and apply them to `/` and `/about` first.

## Active Implementation Brief: Full About Us Page Redesign

## Objective
- Redesign `/about` into a premium healthcare-edtech SaaS narrative that feels confident, human, calm, purpose-driven, layered, and trustworthy.
- Keep all existing meaning and routes intact while reducing heavy text density and replacing noisy motion.
- Green (`#22c7a8`) stays as precision interaction energy.

## Required About Page Structure
1. Immersive Hero
2. Our Story (Narrative Split Section)
3. Mission & Vision
4. Core Values (Cinematic Grid)
5. Leadership / Team
6. Impact & Outcomes
7. Final CTA Band

All sections must use `SectionShell 2.0`.

## Section Implementation Rules

## 1) Hero
- Use: `variant="immersive"`, `hasParallax`, `hasFloatingAccent`, `backgroundType="image"`.
- Background placeholder should represent real training/classroom clinical context.
- Motion: line mask reveal for headline, fade-up for subtext, slow zoom background, subtle parallax (max `-60px`).
- Green use: one highlighted word + CTA underline sweep.

## 2) Our Story
- Use: `variant="split"` with parallax depth.
- Left: green section label, headline, 2-3 short narrative paragraphs.
- Right: layered/staggered image stack (training/practice placeholders), soft shadow, max hover scale `1.03`.

## 3) Mission & Vision
- Use gradient-backed section shell.
- Two-column desktop, stacked mobile.
- Each block includes short copy + subtle green divider line.
- Motion: fade-up stagger + divider width reveal.

## 4) Core Values
- Cinematic grid (3 desktop / 1 mobile).
- Card behavior: hover lift (`y: -6`), stronger shadow, border `green-400/40`.
- Icon behavior: neutral to green on hover, max rotate `1deg`.
- Explicitly avoid spin, shake, bounce, overshoot.

## 5) Leadership / Team
- Use section shell with subtle parallax.
- Professional headshots with grayscale-to-color transition on hover.
- Slight image scale (`1.02`) and green underline sweep for names.
- Optional credibility line under grid.

## 6) Impact & Outcomes
- Use gradient section with floating accent.
- 3-4 stats with count-up on scroll.
- Green numbers, subtle green glow accent behind stats.

## 7) Final CTA Band
- Immersive gradient section with floating accent.
- Emotional headline + support line + two CTAs:
- `Explore Courses`
- `Contact Admissions`
- Motion: mask reveal + staggered buttons + subtle ambient background movement.

## Motion + Accessibility Constraints
- Allowed motion patterns only:
- `fadeUp`
- `sectionStagger`
- `maskReveal`
- `slowZoom`
- `hoverLift`
- Easing: `[0.22, 1, 0.36, 1]`
- Timing:
- Reveal `0.5s`
- Hover `0.2s`
- Ambient `8-14s`
- Reduced motion must be respected.
- Decorative layers must use `aria-hidden`.
- Strong contrast over media backgrounds and semantic heading order required.

## Technical Quality Constraints
- Next.js App Router + TypeScript + Tailwind + Framer Motion.
- Reusable subcomponents only; no heavy inline magic values.
- Use motion tokens from `lib/motion.ts` as source for this page.
- No console logs, no unused imports, optimized media rendering.

## Placeholder Media Rule
- Use placeholder images with comments describing intended final media:
- realistic training moments
- team leadership headshots
- outcomes/impact visuals
- All placeholders should be easy to swap later.

## Active Implementation Brief: Full Contact Page Redesign

## Objective
- Redesign `/contact` into a premium, conversion-focused healthcare-edtech contact experience.
- Tone must be warm, trustworthy, clear, human, professional, calm, and confident.
- Avoid corporate-cold layouts, plain form dumps, excessive decoration, and over-animation.
- Keep green (`#22c7a8`) as interaction highlight color.

## Required Contact Page Structure
1. Immersive Hero
2. Contact Options Grid (Admissions pathways)
3. Main Contact Form (split conversion layout)
4. Location / Map section
5. FAQ teaser
6. Final CTA band

All sections must use `SectionShell 2.0`.

## Contact Section Rules

## 1) Hero
- Use `variant="immersive"`, `hasParallax`, `backgroundType="image"`, `hasFloatingAccent`.
- Background placeholder intent:
- friendly admissions advisor + student interaction
- soft natural lighting
- healthcare-learning context
- Motion: `maskReveal` headline, `fadeUp` subtext, `slowZoom` background, subtle floating accent, parallax max `-60px`.
- Include credibility line such as response SLA.

## 2) Contact Options Grid
- 3 to 4 cards:
- call admissions
- WhatsApp chat
- email
- campus visit
- Card behavior: `hoverLift`, subtle shadow increase, border to green on hover, icon stroke to green on hover.
- Motion: `fadeUp` + staggered reveal.

## 3) Main Contact Form (Split)
- Use `variant="split"` and subtle parallax.
- Left: section label, headline, trust bullets (fast response, confidential, no obligation).
- Right: elevated form card with:
- rounded corners
- neutral background
- subtle green top border accent
- Fields:
- Name
- Email
- Phone (optional)
- Subject dropdown
- Message textarea
- Form interactions:
- floating labels
- neutral border default
- green focus border + soft green focus ring
- accessible error states with helper text
- success state with subtle check + confirmation
- no shake/spin/bounce.

## 4) Location / Map
- Use gradient-backed shell.
- Split layout:
- embedded map container
- address + hours + quick directions CTA
- Motion: `fadeUp` stagger only.

## 5) FAQ Teaser
- Include 3 common questions plus link to full `/faq`.
- Accordion style with smooth height and green active accents.

## 6) Final CTA Band
- Use immersive gradient shell with floating accent.
- Include:
- emotional headline
- two CTAs (`Explore Courses`, `Contact Admissions`)
- subtle floating glow behind content.

## Contact Motion + Accessibility Constraints
- Allowed tokens only:
- `fadeUp`
- `sectionStagger`
- `maskReveal`
- `slowZoom`
- `hoverLift`
- `floating`
- Easing: `[0.22, 1, 0.36, 1]`
- Durations:
- hover `0.2s`
- reveal `0.5s`
- ambient `8-14s`
- Reduced-motion mode disables parallax/ambient loops/long transitions.
- Form must be fully keyboard accessible with associated labels and validation ARIA states.
- Maintain strong contrast and touch-friendly spacing.

## Contact Technical Constraints
- Use `TypeScript`, `TailwindCSS`, `Framer Motion`, `SectionShell 2.0`, `lib/motion.ts`.
- Keep code clean and typed; avoid inline magic numbers and noisy logic.
- No console logs and no unused imports.
- Keep placeholder media commented for easy future asset swaps.

## Active Implementation Brief: Course Discovery + Detail Conversion Upgrade

## Objective
- Redesign `/courses`, `/courses/[slug]`, `course-card.tsx`, and `filter-panel.tsx` into a premium, healthcare-serious discovery and enrollment flow.
- Keep existing API behavior and data contracts while improving UX quality and conversion confidence.
- Green (`#22c7a8`) remains the focused interaction highlight.

## Required Outcomes
1. Immersive discovery hero on `/courses` with search + trust cues + quick filters.
2. Premium course cards with richer media hierarchy and stronger CTA clarity.
3. Detail page split hero with outcomes, instructor context, and cinematic media panel.
4. Sticky premium enrollment sidebar with trust stack and secure-payment cues.
5. Account-required purchase gating via accessible modal (no harsh redirect).
6. Shared purchase guard logic + reusable enrollment and auth-gate components.

## `/courses` Implementation Rules
- Hero must use `SectionShell 2.0` immersive treatment with restrained depth motion.
- Show active filters as removable chips above results.
- Results count must update dynamically.
- Mobile filters use full-height `Sheet` with soft backdrop and no bounce motion.
- Course grid reveals should use `fadeUp` with subtle stagger.

## `course-card.tsx` Rules
- Thumbnail layer should include:
- category badge
- level badge
- duration badge
- dark gradient overlay for readability
- Hover interactions:
- subtle lift (`hoverLift`)
- gentle image zoom
- title color shift to green
- clear price emphasis and action button

## `/courses/[slug]` Implementation Rules
- Top section uses split narrative structure:
- left: title/tags/outcomes/instructor signal
- right: cinematic media preview with subtle ambient depth
- Curriculum section must remain structured and scannable with accessible accordions.
- Add social proof strip below learning content.
- Keep related courses section for continuation browsing.

## Purchase Gating Requirements
- Any enrollment-triggering action (`Add to Cart`, `Buy Now`) checks auth first.
- If unauthenticated:
- open a modal with:
  - Register
  - Login
  - Continue browsing
- store pending purchase intent and resume action after authentication when the user returns.
- Modal must stay keyboard-accessible and use non-aggressive motion.

## Shared Architecture Requirements
- Add a reusable `usePurchaseGuard()` hook to centralize auth-gate and pending intent handling.
- Add reusable `<AuthGateModal />` and `<EnrollmentCard />`.
- Keep props fully typed and avoid logic duplication across list/detail pages.

## Motion + Accessibility Constraints
- Use only motion tokens from `lib/motion.ts` (`fadeUp`, `sectionStagger`, `maskReveal`, `hoverLift`, `slowZoom`, `floating`).
- Respect reduced-motion mode by disabling ambient loops/parallax effects.
- Preserve minimum touch target quality and clear focus styles.

## Active Implementation Brief: FAQ + Legal Trust Pages Upgrade

## Objective
- Transform `/faq`, `/terms`, `/privacy`, and `/refund` into structured trust pages that reduce friction, improve clarity, and strengthen authority.
- Keep tone calm, transparent, professional, and human.
- Green (`#22c7a8`) stays as interaction highlight only.

## FAQ Page Structure (`/faq`)
1. Immersive FAQ hero (`SectionShell` immersive + gradient + floating accent).
2. Sticky category navigation with active underline state and smooth section scroll.
3. Search input with live keyword filtering and matched-text highlight.
4. Category accordion blocks with accessible toggles and smooth height transitions.
5. “Still Need Help?” CTA section linking to admissions contact.

## FAQ Behavior Requirements
- Category nav must support horizontal scroll on mobile and sticky desktop behavior.
- Active category should update while scrolling (intersection observer).
- Accordion open state should surface green border/indicator and clean readability.
- Empty search state must include calm fallback copy and contact CTA.
- Add FAQ JSON-LD schema for SEO.

## Legal Pages Structure (`/terms`, `/privacy`, `/refund`)
1. Calm legal hero (title, date, short clarity line).
2. Split layout with sticky TOC (desktop) and dropdown TOC (mobile).
3. Structured legal sections with readable spacing (`max-w-3xl`) and clear H2/H3 hierarchy.
4. Final assurance block linking to contact for policy questions.

## Legal UX Requirements
- TOC must support smooth scroll + active section highlight while scrolling.
- Hash navigation should focus section targets and visually highlight arrivals.
- Optional copy-link affordance for section anchors on hover.
- No parallax or heavy ambient motion in legal content zone.

## Motion + Accessibility Constraints
- Allowed tokens: `fadeUp`, `sectionStagger`, `maskReveal`, `floating` (hero only), and height transitions.
- Use durations in `0.3s-0.5s`; no bounce/spring overshoot.
- Respect `prefers-reduced-motion`.
- FAQ accordion and legal navigation must be keyboard accessible with visible focus states.

## Code Requirements
- Reusable primitives:
1. `TOCNav`
2. `LegalSection`
- Fully typed props and no inline animation object duplication.
- Motion values sourced from `lib/motion.ts`.

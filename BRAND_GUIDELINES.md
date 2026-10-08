# PromptCare Academy - Brand Guidelines

## Brand Overview
**PromptCare Academy** is a premium, accessible learning platform dedicated to empowering professionals with cutting-edge education and prompt, responsive support. We believe in the power of quality education delivered with care.

---

## Brand Values
- **Prompt**: Fast, responsive, and always available support
- **Care**: Genuinely invested in student success and wellbeing
- **Academy**: Premium, professional, and rigorous education standards
- **Accessible**: Education for everyone, regardless of background or location

---

## Visual Identity

### Color Palette

#### Primary Colors
- **Teal (#10B981)**: Trust, growth, forward movement - represents the "prompt" aspect
- **Purple (#8B5CF6)**: Creativity, learning, professionalism - represents education
- **Gold (#F59E0B)**: Excellence, value, premium quality - represents care and recognition

#### Secondary Colors
- **Dark Navy (#1F2937)**: Authority, professionalism, text
- **Light Cream (#F9FAFB)**: Accessibility, welcoming, clean backgrounds
- **Soft Gray (#E5E7EB)**: Subtle divisions, secondary elements

#### Accent Colors
- **Success Green (#10B981)**: Completion, achievement, progress
- **Warning Orange (#F97316)**: Important notices, limited offers
- **Error Red (#EF4444)**: Errors, alerts

### Typography

#### Headline Font: **Inter Bold** (Modern, Professional)
- Hero Headlines: 48px, weight 700
- Section Headlines: 32px, weight 700
- Subsections: 24px, weight 600

#### Body Font: **Inter Regular** (Readable, Clean)
- Body Text: 16px, weight 400, line-height 1.6
- Small Text: 14px, weight 400
- Labels: 13px, weight 500, uppercase

### Logo Specifications

#### Full Logo (Primary)
- Used in headers, homepage, documents
- Minimum width: 200px
- Clear space: 20px from other elements
- File: `/public/logo-promptcare.png`

#### Icon/Favicon
- Used in browser tabs, navigation, shortcuts
- 256x256px square format
- File: `/public/logo-icon.png`

### Visual Elements

#### Gradients
- Primary Gradient: Teal (10B981) → Purple (8B5CF6)
- Premium Gradient: Purple (8B5CF6) → Gold (F59E0B)
- Subtle Gradient: Light Gray (F3F4F6) → White

#### Spacing & Rhythm
- Base unit: 4px
- Padding: 16px (4 units), 24px (6 units), 32px (8 units)
- Margin: 24px between sections, 16px between elements
- Border Radius: 8px (standard), 12px (large cards), 4px (small elements)

#### Icons & Illustrations
- Style: Line-based, minimalist
- Stroke width: 2px
- Color: Primary (Teal) or Accent colors
- Size: 16px, 20px, 24px, 32px (multiples of 4)

#### Photography & Images
- Professional, diverse, accessible subjects
- Warm lighting with teal/purple color grading
- Authentic, diverse representation
- Consistency in quality and tone

---

## Design Principles

### 1. Trust First
Everything should feel reliable and professional. Quality design builds confidence.

### 2. Clarity Over Decoration
Clean layouts with purposeful design. No unnecessary elements.

### 3. Accessibility
High contrast ratios (WCAG AA standard minimum). Clear hierarchy. Readable fonts.

### 4. Responsive Design
Mobile-first approach. Consistent experience across all devices.

### 5. Human-Centered
Focus on user needs. Clear calls-to-action. Helpful guidance at every step.

---

## Component Guidelines

### Buttons
- Primary: Teal background, white text, rounded corners
- Secondary: Purple outline, teal text
- Success: Green background (for completion)
- Disabled: Gray background, light gray text

### Cards
- Background: White or light cream
- Border: Subtle light gray (1px)
- Shadow: Subtle drop shadow (0px 1px 3px rgba(0,0,0,0.1))
- Padding: 24px
- Border radius: 12px

### Forms
- Input: Light gray border (1px), 12px border radius
- Focus state: Teal border (2px)
- Labels: Dark navy, 13px, weight 500
- Helper text: Light gray, 12px

### Navigation
- Active state: Teal underline or background
- Hover state: Light teal background (10% opacity)
- Text: Dark navy, 14px weight 500

### Badges & Tags
- Background: Light teal (10% opacity)
- Text: Teal (100%)
- Border radius: 20px
- Padding: 4px 12px

---

## Content Voice & Tone

### Voice: Warm, Approachable, Professional
- Speak directly to the user
- Use "you" language
- Be encouraging and supportive

### Tone: Helpful, Confident, Human
- Avoid jargon without explanation
- Be clear and concise
- Show empathy for user challenges

### Examples
- ✅ "Let's get you started on your learning journey"
- ❌ "Commence your educational experience"
- ✅ "Stuck? Our support team is here 24/7"
- ❌ "Technical assistance available upon request"

---

## Brand Applications

### Homepage
- Hero section with gradient background
- Clear value proposition
- Featured courses with course cards
- Testimonials section
- Call-to-action buttons

### Dashboard
- Consistent header with logo
- Intuitive navigation sidebar
- Card-based layout for courses
- Progress indicators in teal
- Success messages in green

### Course Page
- Hero image with gradient overlay
- Curriculum overview
- Instructor information
- Enrollment call-to-action
- Course reviews/ratings

### Checkout
- Progress indicator (step-by-step)
- Clear pricing with currency options (NGN/USD)
- Trust badges and security indicators
- Clear error messages
- Success confirmation

---

## Currency & Pricing Display

### Nigerian Naira (NGN)
- Symbol: ₦
- Format: ₦ 25,000
- Decimal places: 0 (whole numbers only)
- Example: ₦ 25,000.00 (display as ₦ 25,000)

### US Dollar (USD)
- Symbol: $
- Format: $ 99.99
- Decimal places: 2
- Example: $ 99.99

### Multi-Currency Selection
- Display currency selector in header
- Default to user's location currency
- Convert prices in real-time
- Clear exchange rate disclaimer

---

## Accessibility Checklist

- [ ] Color contrast ratio: 4.5:1 minimum for body text
- [ ] Headings use semantic HTML (h1, h2, h3)
- [ ] All images have descriptive alt text
- [ ] Form inputs have associated labels
- [ ] Interactive elements are keyboard accessible
- [ ] Focus states are clearly visible
- [ ] Icons are accompanied by text
- [ ] Videos have captions

---

## File Structure
\`\`\`
/public/
  ├── logo-promptcare.png       (Primary logo)
  ├── logo-icon.png             (Favicon/icon)
  ├── hero-bg.jpg               (Hero background)
  └── brand-assets/
      ├── gradient-bg.svg
      ├── pattern-accent.svg
      └── icons/

/styles/
  ├── globals.css               (Brand colors & tokens)
  └── components.css            (Component styles)

/docs/
  └── BRAND_GUIDELINES.md       (This file)
\`\`\`

---

## Quick Start for Developers

### Setting Up Brand Colors
\`\`\`css
/* In globals.css */
--primary-teal: #10B981;
--primary-purple: #8B5CF6;
--accent-gold: #F59E0B;
--dark-navy: #1F2937;
--light-cream: #F9FAFB;
\`\`\`

### Using Brand Colors
\`\`\`jsx
<button className="bg-primary-teal text-white">
  Enroll Now
</button>
\`\`\`

### Responsive Typography
\`\`\`jsx
<h1 className="text-4xl md:text-6xl font-bold text-dark-navy">
  Learn with PromptCare Academy
</h1>
\`\`\`

---

## Brand Consistency Checklist

Before publishing:
- [ ] Logo is properly sized and clear
- [ ] Color palette matches brand guidelines
- [ ] Typography uses Inter font family
- [ ] Spacing follows 4px grid system
- [ ] Buttons have proper hover/focus states
- [ ] Mobile responsiveness is verified
- [ ] Accessibility standards are met
- [ ] Tone of voice matches guidelines
- [ ] Currency formatting is correct (NGN/USD)
- [ ] All links work properly

---

## Contact & Support
For brand-related questions or assets, refer to the Brand Manager or check the `/docs` folder.

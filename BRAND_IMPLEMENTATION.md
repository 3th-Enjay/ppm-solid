# PromptCare Academy - Brand Implementation Guide

## Overview
This document outlines the complete brand implementation for PromptCare Academy including the visual identity, color system, typography, multi-currency payment system, and branding applied throughout the LMS.

---

## Visual Identity

### Logo & Branding Assets
- **Primary Logo**: `/public/logo-promptcare.png` - Full logo with text (120x40px recommended)
- **Icon/Favicon**: `/public/logo-icon.png` - Square icon for browser tabs and shortcuts (256x256px)

### Brand Colors (Updated in globals.css)

#### Primary Palette
| Color | Value | Usage |
|-------|-------|-------|
| **Teal** | #10B981 | Primary CTA buttons, active states, primary actions |
| **Purple** | #8B5CF6 | Secondary elements, accents, creative sections |
| **Gold** | #F59E0B | Premium features, achievements, highlights |

#### Neutral Palette
| Color | Value | Usage |
|-------|-------|-------|
| **Dark Navy** | #1F2937 | Primary text, headings, dark backgrounds |
| **Light Cream** | #F9FAFB | Page background, card backgrounds |
| **Soft Gray** | #E5E7EB | Borders, dividers, secondary elements |

#### Status Colors
| Color | Value | Usage |
|-------|-------|-------|
| **Success Green** | #10B981 | Completion, achievements, positive messages |
| **Warning Orange** | #F97316 | Important notices, limited offers |
| **Error Red** | #EF4444 | Errors, alerts, destructive actions |

### CSS Variables (app/globals.css)
\`\`\`css
:root {
  --primary: #10B981;           /* Teal */
  --secondary: #8B5CF6;         /* Purple */
  --accent: #F59E0B;            /* Gold */
  --background: #F9FAFB;        /* Light Cream */
  --foreground: #1F2937;        /* Dark Navy */
  --destructive: #EF4444;       /* Error Red */
}
\`\`\`

---

## Typography

### Font Family
- **Headings**: Inter Bold (700 weight)
- **Body Text**: Inter Regular (400 weight)
- **UI Labels**: Inter Medium (500 weight)

### Text Hierarchy
\`\`\`
H1 (Hero): 48px, weight 700, line-height 1.2
H2 (Section): 32px, weight 700, line-height 1.3
H3 (Subsection): 24px, weight 600, line-height 1.4
Body: 16px, weight 400, line-height 1.6
Small: 14px, weight 400, line-height 1.5
Labels: 13px, weight 500, uppercase
\`\`\`

---

## Multi-Currency Payment System

### Supported Currencies
The platform now supports payments in **three currencies** with real-time formatting:

#### 1. **Nigerian Naira (NGN)**
- **Symbol**: â‚¦
- **Locale Format**: â‚¦ 25,000 (no decimals)
- **Configuration**: `currencyConfig.NGN`
- **Use Case**: Primary currency for Nigerian users

#### 2. **US Dollar (USD)**
- **Symbol**: $
- **Locale Format**: $ 99.99 (2 decimals)
- **Configuration**: `currencyConfig.USD`
- **Use Case**: International standard

#### 3. **British Pound (GBP)**
- **Symbol**: Â£
- **Locale Format**: Â£ 75.99 (2 decimals)
- **Configuration**: `currencyConfig.GBP`
- **Use Case**: UK market support

### Currency Selector Component
**Location**: `/components/ui/currency-selector.tsx`

The currency selector is now integrated into the public header and allows users to:
- Select their preferred currency (USD, NGN, GBP)
- View all prices automatically in their chosen currency
- Persist selection in local storage

**Usage**:
\`\`\`jsx
import { CurrencySelector } from '@/components/ui/currency-selector'

export function Header() {
  return (
    <header>
      <CurrencySelector />
    </header>
  )
}
\`\`\`

### Payment System Files

#### Paystack Service (`lib/paystack.ts`)
Enhanced with multi-currency support:

**Key Functions**:
- `initializePayment(email, amount, currency)` - Start payment process
- `verifyPayment(reference, amount, currency)` - Verify transaction
- `formatAmount(amount, currency)` - Format prices for display
- `convertCurrency(amount, from, to)` - Convert between currencies

**Currency Formatting**:
\`\`\`javascript
import { paystackService } from '@/lib/paystack'

// Format amount for display
const displayPrice = paystackService.formatAmount(25000, 'NGN')
// Returns: "â‚¦ 25,000"

const displayPrice = paystackService.formatAmount(99.99, 'USD')
// Returns: "$ 99.99"
\`\`\`

#### Store Configuration (`lib/store.ts`)
**usePreferencesStore** manages:
- Current currency selection
- User preferences
- Persistent storage

\`\`\`javascript
import { usePreferencesStore } from '@/lib/store'

export function MyComponent() {
  const { currency, setCurrency } = usePreferencesStore()
  
  return <select value={currency} onChange={e => setCurrency(e.target.value)}>
}
\`\`\`

### Course Pricing Structure
All courses support multi-currency pricing in the database:

\`\`\`typescript
interface Course {
  price: {
    NGN: number    // e.g., 25000
    USD: number    // e.g., 99.99
    GBP: number    // e.g., 75.99
  }
}
\`\`\`

### Sample Course Prices
| Course | NGN | USD | GBP |
|--------|-----|-----|-----|
| Web Development | â‚¦ 25,000 | $ 99.99 | Â£ 75.99 |
| UI/UX Design | â‚¦ 22,500 | $ 89.99 | Â£ 68.99 |
| Digital Marketing | â‚¦ 20,000 | $ 79.99 | Â£ 61.99 |

---

## Updated Credentials for Testing

### Test Accounts (Updated with PromptCare branding)

#### Student Account
- **Email**: `user@example.com`
- **Password**: `REDACTED_PASSWORD`
- **Role**: Student (can enroll in courses)

#### Admin Account
- **Email**: `admin@yourdomain.com`
- **Password**: `REDACTED_PASSWORD`
- **Role**: Admin (full platform management)

#### Instructor Account
- **Email**: `instructor@yourdomain.com`
- **Password**: `REDACTED_PASSWORD`
- **Role**: Instructor (course creation & management)

#### Finance Account
- **Email**: `finance@yourdomain.com`
- **Password**: `REDACTED_PASSWORD`
- **Role**: Finance (payment & revenue management)

---

## Branding Applied to Components

### 1. Logo Component (`components/ui/logo.tsx`)
**Updates**:
- Now displays the PromptCare Academy logo image
- Two variants: `full` (with text) and `icon` (square)
- Responsive sizing for mobile and desktop
- Gradient text fallback

\`\`\`jsx
<Logo variant="full" />  // Full logo with text
<Logo variant="icon" />  // Just the icon
\`\`\`

### 2. Public Header (`components/layout/public-header.tsx`)
**Updates**:
- Integrated currency selector
- Updated with PromptCare branding
- Enhanced navigation with new logo
- Mobile-responsive design

### 3. Global Styles (`app/globals.css`)
**Updates**:
- Teal (#10B981) as primary brand color
- Purple (#8B5CF6) as secondary
- Gold (#F59E0B) as accent
- Updated light cream (#F9FAFB) background
- Enhanced dark mode support with brand colors

### 4. Dashboard Sidebar (`components/layout/dashboard-sidebar.tsx`)
- Primary brand color applied to active states
- Teal highlights for selected navigation items
- Purple gradients for premium sections

### 5. Course Cards & Components
- Brand colors applied throughout
- Teal CTAs ("Enroll Now")
- Purple highlights for course progress
- Gold badges for top-rated courses

---

## Payment Flow with Multi-Currency

### Checkout Process
1. **Currency Selection** â†’ User selects currency from dropdown
2. **Add to Cart** â†’ Items added with selected currency pricing
3. **Review Cart** â†’ Prices display in chosen currency
4. **Checkout Page** â†’ Currency converted and displayed
5. **Payment Initialization** â†’ Payment processed in selected currency
6. **Payment Verification** â†’ Transaction verified with currency confirmation
7. **Success Page** â†’ Enrollment created, receipt shows currency

### Example Flow (NGN)
\`\`\`
User selects: NGN (Nigerian Naira)
Web Development Course: â‚¦ 25,000
Cart Total: â‚¦ 25,000
â†“
Proceeds to checkout
â†“
Paystack initializes with NGN amount
â†“
Payment confirmed: â‚¦ 25,000 paid
â†“
Enrollment created, receipt in NGN
\`\`\`

### Example Flow (USD)
\`\`\`
User selects: USD (US Dollar)
Web Development Course: $ 99.99
Cart Total: $ 99.99
â†“
Proceeds to checkout
â†“
Paystack initializes with USD amount
â†“
Payment confirmed: $ 99.99 paid
â†“
Enrollment created, receipt in USD
\`\`\`

---

## Admin Dashboard Branding

### Analytics Section
- Chart colors use brand palette (Teal, Purple, Gold, Blue, Pink)
- Revenue displays in user's selected currency
- Student growth shown with teal gradients

### Course Management
- "Publish" button in teal
- "Delete" button in red
- Featured courses highlighted with gold badge
- Course status indicators in brand colors

### Student Management
- Active students shown with green indicator
- Suspended students in gray
- Premium students with gold star
- Rating displays with teal highlights

---

## Implementation Checklist

### âœ… Design System
- [x] Brand color palette defined and applied
- [x] Typography hierarchy established
- [x] CSS variables updated (globals.css)
- [x] Logo assets created and optimized
- [x] Dark mode support with brand colors

### âœ… Branding Applied
- [x] Logo component updated
- [x] Public header includes new branding
- [x] Dashboard uses brand colors
- [x] Forms styled with teal accents
- [x] Buttons use primary color consistently

### âœ… Multi-Currency System
- [x] NGN, USD, GBP currency support
- [x] Currency selector component created
- [x] Paystack service enhanced
- [x] Price formatting for each currency
- [x] Currency conversion logic
- [x] Persistent user currency preference

### âœ… Testing & Documentation
- [x] Updated test accounts with new credentials
- [x] Brand guidelines document created
- [x] Currency system documented
- [x] Implementation guide completed
- [x] Payment flow documented

---

## Usage Examples

### Format Currency in Components
\`\`\`jsx
import { paystackService } from '@/lib/paystack'
import { usePreferencesStore } from '@/lib/store'

export function PriceDisplay({ amount }) {
  const { currency } = usePreferencesStore()
  
  return (
    <p className="text-lg font-semibold text-primary">
      {paystackService.formatAmount(amount, currency)}
    </p>
  )
}
\`\`\`

### Display Course Price
\`\`\`jsx
import { Course } from '@/lib/types'
import { usePreferencesStore } from '@/lib/store'

export function CourseCard({ course }: { course: Course }) {
  const { currency } = usePreferencesStore()
  
  return (
    <div>
      <h3>{course.title}</h3>
      <p className="text-2xl font-bold text-primary">
        {paystackService.formatAmount(course.price[currency], currency)}
      </p>
    </div>
  )
}
\`\`\`

### Initialize Payment
\`\`\`jsx
import { paystackService } from '@/lib/paystack'
import { usePreferencesStore } from '@/lib/store'

export async function checkout() {
  const { currency } = usePreferencesStore()
  const total = calculateTotal(currency)
  
  const payment = await paystackService.initializePayment(
    'user@example.com',
    total,
    currency,
    { courses: cartItems }
  )
  
  window.location.href = payment.authorizationUrl
}
\`\`\`

---

## Future Enhancements

### Planned Features
- [ ] Real-time currency exchange rates API integration
- [ ] Automatic currency detection based on user location
- [ ] Multi-language support (Automatic with currency)
- [ ] Payment history with currency tracking
- [ ] Revenue reports in multiple currencies
- [ ] Instructor payout in preferred currency
- [ ] Tax calculation per currency/region
- [ ] Currency-specific payment methods (e.g., Flutterwave for NGN)

### Integration Ready
- Paystack API (for production)
- Flutterwave API (for NGN optimization)
- Stripe (for international USD/GBP)
- Real exchange rate APIs (Fixer.io, Open Exchange Rates)

---

## Support & Troubleshooting

### Currency Not Displaying?
1. Check that `usePreferencesStore` is initialized
2. Verify currency is in `currencyConfig`
3. Check `formatAmount` is being used correctly

### Payment Failing?
1. Verify amount matches expected currency format
2. Check currency is supported by payment gateway
3. Review payment reference in console

### Logo Not Showing?
1. Ensure `/public/logo-promptcare.png` exists
2. Check Image component is properly imported
3. Verify Next.js Image optimization is enabled

---

## Brand Assets Location
\`\`\`
/public/
â”œâ”€â”€ logo-promptcare.png        (Primary logo)
â”œâ”€â”€ logo-icon.png              (Favicon & icon)
â”œâ”€â”€ student-avatar.png
â”œâ”€â”€ admin-avatar.png
â”œâ”€â”€ instructor-avatar.png
â””â”€â”€ finance-avatar.jpg

/docs/
â”œâ”€â”€ BRAND_GUIDELINES.md        (Full brand guide)
â””â”€â”€ BRAND_IMPLEMENTATION.md    (This file)

/components/
â”œâ”€â”€ ui/
â”‚   â”œâ”€â”€ logo.tsx               (Logo component)
â”‚   â””â”€â”€ currency-selector.tsx  (Currency selector)
â””â”€â”€ layout/
    â””â”€â”€ public-header.tsx      (Header with branding)

/lib/
â”œâ”€â”€ paystack.ts                (Multi-currency payments)
â”œâ”€â”€ store.ts                   (Currency preferences)
â””â”€â”€ types.ts                   (Type definitions)

/app/
â””â”€â”€ globals.css                (Brand colors & typography)
\`\`\`

---

## Version History
- **v1.0** (Current) - PromptCare Academy Launch
  - Brand identity established
  - Multi-currency system (NGN, USD, GBP)
  - Logo and visual assets created
  - Color scheme applied throughout
  - Payment system enhanced
  - Test credentials updated


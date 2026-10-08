# PromptCare Academy - Centered Layout Structure

## Overview

The web application now features a professional centered layout where content is constrained to a maximum width with proper padding, creating an elegant reading experience while maintaining visual hierarchy.

## Layout Configuration

### Container Sizes

- **Max Width**: 1280px (max-w-7xl in Tailwind)
- **Padding**: 
  - Mobile: px-4 (16px)
  - Tablet: px-6 (24px)
  - Desktop: px-8 (32px)

### Structure

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                        Full Width                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Header (max-w-7xl)                  │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Main Content (max-w-7xl)             │  │
│  │                   Centered & Padded                   │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Footer (max-w-7xl)                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
\`\`\`

## CSS Classes Used

### Main Container Class
\`\`\`css
.container {
  @apply mx-auto w-full px-4 sm:px-6 lg:px-8;
  max-width: 1280px;
}
\`\`\`

**Breakdown:**
- `mx-auto` - Centers the container horizontally
- `w-full` - Takes full width available
- `px-4/6/8` - Responsive padding on sides
- `max-width: 1280px` - Prevents content from stretching too wide

### Public Layout Wrapper
The `(public)/layout.tsx` now wraps children with:
\`\`\`tsx
<main className="flex-1">
  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
    {children}
  </div>
</main>
\`\`\`

## Responsive Breakpoints

| Breakpoint | Width | Padding | Use Case |
|-----------|-------|---------|----------|
| Mobile | < 640px | px-4 (16px) | Phones |
| Tablet | 640px - 1024px | px-6 (24px) | Tablets, small laptops |
| Desktop | 1024px+ | px-8 (32px) | Large screens |

## Pages & Components Using Centered Layout

- ✅ Public Header
- ✅ Public Footer
- ✅ Home Page
- ✅ Courses Page
- ✅ Course Details Page
- ✅ About Page
- ✅ Contact Page
- ✅ FAQ Page
- ✅ Cart Page
- ✅ Checkout Page

## Animated Background

The `AnimatedBackground` component spans full width behind the centered content, creating a premium backdrop effect while content stays centered and readable.

## Benefits of This Structure

1. **Readability**: Text and content stay within optimal line lengths
2. **Mobile-First**: Responsive padding adjusts for all screen sizes
3. **Professional**: Creates premium, polished appearance
4. **Flexible**: Easy to adjust max-width or padding values
5. **Accessible**: Better content hierarchy and visual focus

## Customization

To adjust the centered layout:

1. **Change Max Width** (in `globals.css`):
   \`\`\`css
   .container {
     max-width: 1024px; /* Narrower */
     /* or */
     max-width: 1440px; /* Wider */
   }
   \`\`\`

2. **Adjust Padding** (in `globals.css`):
   \`\`\`css
   .container {
     @apply mx-auto w-full px-3 sm:px-4 lg:px-6; /* Tighter */
   }
   \`\`\`

3. **Apply to New Sections**:
   \`\`\`jsx
   <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
     {/* Your content */}
   </section>
   \`\`\`

## Technical Notes

- The layout uses Tailwind CSS v4 (latest)
- Responsive classes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Full-width sections (like header/footer) use `w-full`
- Content inside uses `.container` for centering
- No custom media queries needed - all responsive via Tailwind

---

**Result**: A modern, centered layout that looks professional on all devices while maintaining optimal content readability.

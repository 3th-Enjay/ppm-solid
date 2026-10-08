# PromptCare Academy - Next Implementation Roadmap

This document outlines the critical features and improvements needed to take PromptCare Academy from a demo to a production-ready platform.

## ✅ COMPLETED FEATURES

### Phase 1: Backend Integration - COMPLETED

#### 1.1 Database Setup ✅
- [x] Set up MongoDB Atlas database
- [x] Create database schemas based on types.ts
- [x] Implement connection pooling
- [x] MongoDB connection utility created (`lib/mongodb.ts`)
- [x] Full MongoDB database layer (`lib/mongodb-db.ts`)

**Files Created:**
- `lib/mongodb.ts` - MongoDB connection with pooling
- `lib/mongodb-db.ts` - Complete database operations layer
- `scripts/seed-db.ts` - Database seeding script

#### 1.3 API Routes - Converted to MongoDB ✅
- [x] Update `/api/courses/*` to fetch from database
- [x] Update `/api/enrollments/*` to use database
- [x] Update `/api/payments/*` to use database
- [x] Update `/api/auth/*` routes to use database
- [x] All API routes now use MongoDB when available

**Files Updated:**
- `app/api/courses/route.ts` - Uses MongoDB
- `app/api/courses/[id]/route.ts` - Uses MongoDB
- `app/api/enrollments/route.ts` - Uses MongoDB
- `app/api/enrollments/[id]/progress/route.ts` - Uses MongoDB
- `app/api/payments/initialize/route.ts` - Uses MongoDB
- `app/api/payments/verify/route.ts` - Uses MongoDB
- `app/api/auth/login/route.ts` - Uses MongoDB
- `app/api/auth/register/route.ts` - Uses MongoDB
- `lib/auth.ts` - Updated to use MongoDB
- `lib/mock-db.ts` - Auto-detects MongoDB and uses it when available

#### Dashboards Verified ✅
- [x] Student Dashboard (`/dashboard`) - Exists and functional
- [x] Instructor Dashboard (`/instructor`) - Exists and functional
- [x] Finance Dashboard (`/finance`) - Exists and functional
- [x] Admin Dashboard (`/admin`) - Exists and functional

---

## 🚀 NEXT PRIORITIES (Based on App Functionality Requirements)

### Priority 1: User Onboarding & Role Management (CRITICAL)

#### 1.1 Enhanced User Registration
- [ ] Add role selection during registration (Student, Instructor, Admin, Finance)
- [ ] Implement role-based registration flow
- [ ] Add admin approval workflow for Admin/Finance roles
- [ ] Create role assignment interface for admins

**Files to Create/Update:**
- `app/(auth)/register/page.tsx` - Add role selection
- `app/api/auth/register/route.ts` - Handle role assignment
- `app/admin/users/create/page.tsx` - Admin user creation
- `lib/validation.ts` - Add role validation schema

#### 1.2 Authentication & Security (CRITICAL)
- [ ] Implement JWT token generation and validation
- [ ] Add password hashing (bcrypt) - **SECURITY CRITICAL**
- [ ] Replace base64 token encoding with JWT
- [ ] Implement refresh token rotation
- [ ] Add rate limiting on auth endpoints
- [ ] Add email verification for new accounts (optional but recommended)

**Files to Update:**
- `lib/auth.ts` - Add JWT and bcrypt
- `app/api/auth/*` - Update for JWT
- `.env.example` - Add JWT_SECRET, BCRYPT_ROUNDS

**Dependencies to Install:**
```bash
npm install jsonwebtoken bcryptjs
npm install --save-dev @types/jsonwebtoken @types/bcryptjs
```

### Priority 2: Real Paystack Payment Integration (CRITICAL)

#### 2.1 Real Paystack Integration
- [ ] Replace mock Paystack with real API calls
- [ ] Implement real payment initialization
- [ ] Implement webhook for payment verification
- [ ] Add payment status tracking in database
- [ ] Handle payment callbacks and webhooks
- [ ] Add transaction logging

**Files to Update:**
- `lib/paystack.ts` - Replace mock with real Paystack API
- `app/api/payments/initialize/route.ts` - Real payment initialization
- `app/api/payments/verify/route.ts` - Real payment verification
- `app/api/webhooks/paystack/route.ts` - **NEW** Webhook endpoint

**Environment Variables Needed:**
```env
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
```

**Dependencies:**
```bash
npm install axios  # If not already installed
```

### Priority 3: Course Upload & Management (CRITICAL)

#### 3.1 Course Creation Wizard
- [ ] Create multi-step course creation form
- [ ] Add course title, description, category, level
- [ ] Implement course pricing (NGN, USD, GBP)
- [ ] Add course thumbnail upload
- [ ] Create module and lesson builder
- [ ] Add course preview functionality
- [ ] Implement course publishing workflow
- [ ] Add course drafts management

**Files to Create:**
- `app/instructor/courses/new/page.tsx` - Course creation wizard
- `app/instructor/courses/new/components/` - Wizard components
- `app/api/courses/route.ts` - POST endpoint for course creation
- `app/api/upload/image/route.ts` - Image upload endpoint

**Files to Update:**
- `app/instructor/upload/page.tsx` - Create if doesn't exist or redirect to new course wizard
- `app/api/courses/[id]/route.ts` - PUT endpoint for course updates

#### 3.2 Course Pricing Management
- [ ] Add pricing interface in course creation
- [ ] Validate pricing across currencies
- [ ] Display pricing in course listings
- [ ] Handle currency conversion in checkout

**Files to Update:**
- Course creation form components
- `app/api/courses/route.ts` - Validate pricing structure

### Priority 4: Database Indexes & Performance
- [ ] Add database indexes for frequently queried fields
- [ ] Index on: email, courseId, userId, reference (payments)
- [ ] Add query optimization
- [ ] Implement connection pooling (already done, verify)

**Files to Update:**
- `scripts/create-indexes.ts` - **NEW** Index creation script

### 2.2 Invoice Generation (Medium Priority)
- [ ] Implement PDF invoice generation
- [ ] Add invoice storage
- [ ] Implement invoice download functionality
- [ ] Add invoice email delivery

**Files to Create:**
- `lib/invoice-generator.ts`
- `app/api/invoices/*`

## Phase 3: Email Notifications (Week 3)

### 3.1 Email Service Setup
- [ ] Choose email provider (SendGrid, Mailgun, etc.)
- [ ] Create email templates
- [ ] Implement email queue system
- [ ] Add retry logic

**Emails to Implement:**
- [ ] Welcome email on registration
- [ ] Password reset email
- [ ] Payment confirmation email
- [ ] Course enrollment confirmation
- [ ] Certificate completion email
- [ ] Course update notifications
- [ ] Admin notifications (new user, payment)

**Files to Create:**
- `lib/email-service.ts`
- `lib/email-templates/`
- `app/api/email/*`

### 3.2 Notifications System
- [ ] Implement in-app notifications
- [ ] Add notification preferences
- [ ] Implement email notification settings

**Files to Create:**
- `lib/notifications.ts`
- `app/api/notifications/*`

## Phase 4: File Upload & Course Materials (After Core Features)

### 4.1 Course Video Upload
- [ ] Integrate with cloud storage (AWS S3, Google Cloud, or Vercel Blob)
- [ ] Implement video upload progress tracking
- [ ] Add video transcoding/optimization
- [ ] Implement video streaming

**Files to Create:**
- `lib/storage-service.ts`
- `lib/video-service.ts`
- `app/api/upload/video/route.ts`

### 4.2 Course Materials
- [ ] Implement PDF/document upload
- [ ] Add resource download tracking
- [ ] Implement content delivery

**Files to Create:**
- `app/api/upload/document/route.ts`
- `lib/storage-service.ts`

## Phase 5: Advanced Student Features (Week 5)

### 5.1 Progress Tracking
- [ ] Implement real-time progress calculation
- [ ] Add study streaks
- [ ] Add time tracking enhancements
- [ ] Implement progress notifications

**Files to Update:**
- `app/dashboard/page.tsx`
- `app/api/enrollments/*`

### 5.2 Certificates
- [ ] Implement certificate generation with design
- [ ] Add certificate download
- [ ] Implement certificate verification system
- [ ] Add LinkedIn integration for certificate sharing

**Files to Create:**
- `lib/certificate-generator.ts`
- `app/api/certificates/*`
- `app/certificates/verify/*`

### 5.3 Ratings & Reviews
- [ ] Implement course rating system
- [ ] Add student reviews
- [ ] Add instructor response to reviews
- [ ] Implement review moderation

**Files to Create:**
- `app/api/courses/[id]/reviews/*`
- Components for reviews

### 5.4 Bookmarks & Notes
- [ ] Implement lesson bookmarks
- [ ] Add notes feature
- [ ] Implement note search
- [ ] Add note sharing

**Files to Create:**
- `app/api/bookmarks/*`
- `app/api/notes/*`

## Phase 6: Instructor Dashboard Enhancements (Week 6)

### 6.1 Course Creation Wizard ✅ (Moved to Priority 3 above)

### 6.2 Student Management
- [ ] View all enrolled students per course
- [ ] Send messages to students
- [ ] Track student progress per course
- [ ] Implement student filtering and search

**Files to Create/Update:**
- `app/instructor/students/*`

### 6.3 Analytics Dashboard
- [ ] Course enrollment analytics
- [ ] Revenue tracking by course
- [ ] Student engagement metrics
- [ ] Course performance metrics

**Files to Create/Update:**
- `app/instructor/analytics/*`

### 6.4 Course Updates
- [ ] Send course update notifications to students
- [ ] Track course update history
- [ ] Manage course announcements

**Files to Create:**
- `app/instructor/announcements/*`

## Phase 7: Admin Dashboard Enhancements (Week 7)

### 7.1 User Management
- [ ] Comprehensive user admin panel
- [ ] User role management and switching
- [ ] User suspension/banning
- [ ] User activity logs

**Files to Create/Update:**
- `app/admin/users/*`

### 7.2 Content Moderation
- [ ] Review management system
- [ ] Course approval workflow
- [ ] Reported content handling
- [ ] Content flagging system

**Files to Create:**
- `app/admin/moderation/*`

### 7.3 Platform Analytics
- [ ] Enhanced dashboard with more metrics
- [ ] User growth charts
- [ ] Revenue projections
- [ ] Course performance rankings

**Files to Update:**
- `app/admin/page.tsx`
- `components/admin/charts/*`

### 7.4 Email Management
- [ ] Bulk email templates
- [ ] Mailing list management
- [ ] Campaign tracking

**Files to Create:**
- `app/admin/email/*`

## Phase 8: Finance Dashboard Enhancements (Week 8)

### 8.1 Advanced Payment Tracking
- [ ] Payment reconciliation tools
- [ ] Refund management
- [ ] Revenue reports by period
- [ ] Tax reporting

**Files to Create/Update:**
- `app/finance/reports/*`
- `lib/financial-reports.ts`

### 8.2 Payouts
- [ ] Instructor payout system
- [ ] Payout scheduling
- [ ] Payout history and tracking
- [ ] Tax form management

**Files to Create:**
- `app/finance/payouts/*`
- `lib/payout-service.ts`

### 8.3 Financial Reports
- [ ] Monthly revenue reports
- [ ] Student acquisition cost
- [ ] Customer lifetime value
- [ ] Churn analysis

**Files to Create:**
- `lib/financial-analytics.ts`
- `components/finance/reports/*`

## Phase 9: Marketing & SEO (Week 9)

### 9.1 SEO Optimization
- [ ] Add meta tags to all pages
- [ ] Implement sitemap.xml
- [ ] Add robots.txt
- [ ] Implement structured data (Schema.org)
- [ ] Add canonical tags
- [ ] Optimize images

**Files to Update:**
- `app/layout.tsx`
- All page files with metadata

### 9.2 Social Sharing
- [ ] Add social share buttons
- [ ] Implement OpenGraph tags
- [ ] Add course preview cards

**Files to Create:**
- `components/social-share.tsx`

### 9.3 Landing Page Optimization
- [ ] A/B testing setup
- [ ] Conversion tracking
- [ ] Analytics integration (Google Analytics)

**Files to Update:**
- `app/(public)/page.tsx`
- Marketing pages

### 9.4 Marketing Features
- [ ] Referral program
- [ ] Affiliate system
- [ ] Coupon/discount codes
- [ ] Email marketing integration

**Files to Create:**
- `lib/referral-service.ts`
- `lib/coupon-service.ts`
- `app/api/referrals/*`
- `app/api/coupons/*`

## Phase 10: Performance & Deployment (Week 10)

### 10.1 Optimization
- [ ] Add database query optimization
- [ ] Implement caching (Redis)
- [ ] Add image optimization
- [ ] Implement CDN for static assets
- [ ] Optimize bundle size

**Files to Update:**
- `next.config.mjs`
- API routes

### 10.2 Monitoring & Logging
- [ ] Set up error tracking (Sentry)
- [ ] Add performance monitoring
- [ ] Implement request logging
- [ ] Add uptime monitoring

**Files to Create:**
- `lib/monitoring.ts`
- `lib/logging.ts`

### 10.3 Testing
- [ ] Add unit tests for utilities
- [ ] Add integration tests for API routes
- [ ] Add E2E tests for critical flows
- [ ] Set up CI/CD pipeline

**Files to Create:**
- `__tests__/*`
- `.github/workflows/*`

### 10.4 Deployment
- [ ] Set up production environment
- [ ] Configure environment variables
- [ ] Set up database backups
- [ ] Implement zero-downtime deployments
- [ ] Set up monitoring and alerts

**Files to Update:**
- `.env.example` - Add production variables
- Deployment configs

## Phase 11: Mobile & PWA (Week 11)

### 11.1 Responsive Improvements
- [ ] Test and optimize mobile experience
- [ ] Add touch-friendly interactions
- [ ] Implement mobile menu improvements

### 11.2 PWA Features
- [ ] Add service worker
- [ ] Implement offline support
- [ ] Add install to home screen
- [ ] Implement push notifications

**Files to Create:**
- `public/manifest.json`
- `public/service-worker.js`
- `lib/push-notifications.ts`

## Phase 12: Advanced Features (Week 12+)

### 12.1 Live Classes
- [ ] Integrate video conferencing (Zoom API)
- [ ] Implement live chat
- [ ] Add recording and replay

**Files to Create:**
- `lib/video-conference.ts`
- `app/api/live-classes/*`

### 12.2 Discussion Forum
- [ ] Create course discussion forums
- [ ] Implement moderation
- [ ] Add reputation system

**Files to Create:**
- `app/forums/*`
- `app/api/forums/*`

### 12.3 Gamification
- [ ] Add points/badges system
- [ ] Implement leaderboards
- [ ] Add achievement tracking

**Files to Create:**
- `lib/gamification.ts`
- `app/api/gamification/*`

### 12.4 AI Features
- [ ] AI-powered course recommendations
- [ ] Quiz generation
- [ ] Summary generation
- [ ] Smart tutoring assistant

**Files to Create:**
- `lib/ai-service.ts`
- `app/api/ai/*`

## Critical Before Production

### Security Checklist
- [ ] Enable HTTPS everywhere
- [ ] Add CSRF protection
- [ ] Implement input validation on all endpoints
- [ ] Add SQL injection prevention
- [ ] Implement XSS protection
- [ ] Add security headers
- [ ] Implement rate limiting
- [ ] Add API key authentication for admin endpoints
- [ ] Regular security audits
- [ ] Penetration testing

### Testing Checklist
- [ ] All API endpoints tested
- [ ] All user flows tested
- [ ] Payment flow thoroughly tested
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Performance tested under load

### Documentation Checklist
- [ ] API documentation (Already done in BACKEND_API_DOCUMENTATION.md)
- [ ] Database schema documentation
- [ ] Deployment guide
- [ ] Admin manual
- [ ] Troubleshooting guide
- [ ] Architecture documentation

### Monitoring Checklist
- [ ] Error tracking setup
- [ ] Performance monitoring
- [ ] Database monitoring
- [ ] Security monitoring
- [ ] Uptime monitoring

## Implementation Priority (UPDATED)

**Critical (Must Have - Do First):**
1. ✅ Database integration - **COMPLETED**
2. **User onboarding with role selection** - **NEXT**
3. **Password hashing & JWT authentication** - **NEXT**
4. **Real Paystack payment integration** - **NEXT**
5. **Course upload & creation functionality** - **NEXT**
6. **Course pricing management** - **NEXT**

**High Priority (After Critical):**
1. Database indexes for performance
2. Email notifications (welcome, payment confirmations)
3. Course materials upload
4. Certificates generation
5. User management (admin panel)

**Medium Priority (Nice to Have):**
1. Reviews and ratings
2. Bookmarks and notes
3. Advanced analytics
4. Invoice generation
5. Social features

**Low Priority (Future):**
1. Live classes
2. Discussion forums
3. Gamification
4. AI features
5. Mobile app

## Timeline (UPDATED)

- **Week 1:** ✅ MongoDB integration - **COMPLETED**
- **Week 2 (Current):** User onboarding, JWT auth, Real Paystack
- **Week 3:** Course upload & pricing management
- **Week 4-5:** File uploads and course materials
- **Weeks 6-8:** Instructor and admin enhancements
- **Weeks 9-10:** Marketing and deployment
- **Weeks 11-12:** Advanced features

**Current Focus:** Weeks 2-3 (Critical features for MVP)

## Getting Started (UPDATED)

### ✅ Completed Steps:
1. ✅ MongoDB database connected
2. ✅ All API routes converted to use MongoDB
3. ✅ Database layer implemented
4. ✅ All dashboards verified

### 🎯 Next Steps (In Order):
1. **Implement user onboarding with role selection**
   - Update registration form to include role selection
   - Add role validation
   - Create admin user creation interface

2. **Add password hashing & JWT authentication**
   - Install bcryptjs and jsonwebtoken
   - Update auth service to hash passwords
   - Replace base64 tokens with JWT

3. **Integrate real Paystack payment gateway**
   - Get Paystack API keys
   - Replace mock Paystack service
   - Implement webhook endpoint
   - Test payment flow end-to-end

4. **Build course upload & creation functionality**
   - Create course creation wizard
   - Add pricing management
   - Implement course publishing workflow

5. **Add database indexes**
   - Create indexes for performance
   - Optimize queries

### Testing Checklist:
- [ ] Test user registration with all roles
- [ ] Test payment flow with real Paystack
- [ ] Test course creation and publishing
- [ ] Test course purchase flow
- [ ] Verify all dashboards work correctly

## Support & Resources

- API Documentation: See `BACKEND_API_DOCUMENTATION.md`
- Frontend Code: All in `/app` and `/components`
- Type Definitions: See `/lib/types.ts`
- Mock Data: See `/lib/mock-db.ts` for data structure reference

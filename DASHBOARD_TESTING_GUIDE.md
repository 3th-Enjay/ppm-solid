# PromptCare Academy - Dashboard Testing Guide

## Overview
All role-based dashboards are now fully functional and connected. Each user role redirects to their respective dashboard with real data from the mock database.

---

## Test Accounts & Dashboards

### 1. **Student Dashboard** - `/dashboard`
**Login Credentials:**
- Email: `user@example.com`
- Password: `REDACTED_PASSWORD`

**What You'll See:**
- Welcome message with total courses
- Stats: Total Courses, In Progress, Completed, Learning Hours
- List of enrolled courses with progress bars
- Course learning interface with lesson player
- Certificate achievements
- Payment history
- Profile management

**Features:**
âœ… Course enrollment (via cart/checkout)  
âœ… Study time tracking  
âœ… Progress tracking  
âœ… Certificate management  
âœ… Payment history  
âœ… Profile settings  

---

### 2. **Admin Dashboard** - `/admin`
**Login Credentials:**
- Email: `admin@yourdomain.com`
- Password: `REDACTED_PASSWORD`

**What You'll See:**
- Revenue analytics charts
- Student enrollment trends
- Course management with publish/unpublish
- Student management with search
- Payment transaction logs
- Platform settings

**Features:**
âœ… Real-time analytics  
âœ… Revenue tracking (NGN & USD)  
âœ… Student management  
âœ… Course publishing/unpublishing  
âœ… Payment monitoring  
âœ… Platform settings  

---

### 3. **Instructor Dashboard** - `/instructor`
**Login Credentials:**
- Email: `instructor@yourdomain.com`
- Password: `REDACTED_PASSWORD`

**What You'll See:**
- Instructor-specific stats
- Total courses authored
- Student count enrolled
- Total enrollments
- Average course ratings
- Course management interface
- Upload new course button

**Features:**
âœ… Course creation  
âœ… Student enrollment tracking  
âœ… Course analytics  
âœ… Student progress monitoring  
âœ… Course performance metrics  

---

### 4. **Finance Dashboard** - `/finance`
**Login Credentials:**
- Email: `finance@yourdomain.com`
- Password: `REDACTED_PASSWORD`

**What You'll See:**
- Total revenue in NGN
- Total revenue in USD
- Successful transaction count
- Unique students count
- Recent transactions table with:
  - Payment reference
  - Student name
  - Amount
  - Currency
  - Status
  - Date

**Features:**
âœ… Revenue tracking (multi-currency)  
âœ… Transaction history  
âœ… Payment status monitoring  
âœ… Student payment tracking  
âœ… Financial reports  

---

## Testing the Payment Flow

### Step 1: Student Purchases a Course
1. Log in as student: `user@example.com`
2. Browse courses at `/courses`
3. Click "Add to Cart" on any course
4. Go to cart page
5. Click "Proceed to Checkout"
6. Fill in billing information
7. Click "Complete Payment"
8. You'll be redirected to success page

### Step 2: Verify Payment in Finance Dashboard
1. Log out (click Logout in sidebar)
2. Log in as finance: `finance@yourdomain.com`
3. Go to Finance Dashboard
4. Verify the transaction appears in "Recent Transactions"
5. Check that amounts are correct in NGN/USD

### Step 3: Check Student Enrollment
1. Log out and log in as student again
2. Go to Dashboard
3. Verify new course appears in "My Courses"
4. Check enrollment count increased

---

## Multi-Currency Support

### Currency Selector
- Located in the public header (top right)
- Available on home, courses, and course details pages
- Dynamically changes all prices to selected currency

### Supported Currencies
- **NGN** (Nigerian Naira) - â‚¦
- **USD** (US Dollar) - $
- **GBP** (British Pound) - Â£

---

## Role-Based Access Control

Each role has protection:
- **Student** â†’ `/dashboard` (protected)
- **Admin** â†’ `/admin` (protected, admin only)
- **Instructor** â†’ `/instructor` (protected, instructor only)
- **Finance** â†’ `/finance` (protected, finance only)

Attempting to access a protected page with wrong role redirects to appropriate dashboard.

---

## Key Features Implemented

### Authentication
âœ… Login with role-based redirect  
âœ… Register as student  
âœ… Forgot password page  
âœ… Protected routes  
âœ… Token-based session management  

### Student Features
âœ… Course browsing  
âœ… Add to cart  
âœ… Checkout process  
âœ… Payment simulation  
âœ… Course enrollment  
âœ… Progress tracking  
âœ… Certificate generation  

### Admin Features
âœ… Dashboard analytics  
âœ… Course management  
âœ… Student management  
âœ… Payment monitoring  
âœ… Settings configuration  

### Instructor Features
âœ… Course creation/management  
âœ… Student tracking  
âœ… Performance analytics  
âœ… Course publishing  

### Finance Features
âœ… Revenue tracking  
âœ… Transaction monitoring  
âœ… Multi-currency support  
âœ… Payment status tracking  
âœ… Student payment history  

---

## Common Test Scenarios

### Scenario 1: Student Purchases Multiple Courses
1. Login as student
2. Add 3 courses to cart
3. Checkout and pay
4. Verify all 3 appear in "My Courses"
5. Check total study hours calculation

### Scenario 2: Admin Views Revenue
1. Login as admin
2. Check total revenue is updated
3. Verify student count increased
4. Check course completion percentage

### Scenario 3: Instructor Views Student Progress
1. Login as instructor
2. See student count for each course
3. View average rating
4. Check total enrollments

### Scenario 4: Finance Tracks Payments
1. Login as finance
2. See recent transactions
3. Filter by currency
4. Verify payment amounts

---

## Data Persistence

All data is stored in memory using the mock database. Data persists during the session but resets on page refresh due to in-memory storage.

For production, implement:
- MongoDB integration
- Real Paystack API
- JWT authentication
- Database transactions for payments

---

## Troubleshooting

### Login Not Working
- Verify email matches exactly: `user@example.com`, `admin@yourdomain.com`, etc.
- Check password: `REDACTED_PASSWORD`, `REDACTED_PASSWORD`, `REDACTED_PASSWORD`, `REDACTED_PASSWORD`
- Clear browser cache and try again

### Dashboard Not Loading
- Make sure you're logged in (check session)
- Verify role matches dashboard URL
- Check browser console for errors

### Currency Not Changing
- Click currency selector in header
- Select new currency
- Prices should update instantly
- Selection persists on page navigation

---

## Next Steps for Production

1. **Database Integration**
   - Connect to MongoDB
   - Implement user persistence
   - Store payments in database

2. **Payment Gateway**
   - Integrate real Paystack API
   - Add webhook handling
   - Implement payment verification

3. **Email Notifications**
   - Send enrollment confirmations
   - Payment receipts
   - Course completion certificates

4. **Advanced Features**
   - Video streaming for course content
   - Live classes/webinars
   - Student forums/discussions
   - Course reviews and ratings

5. **Analytics**
   - Advanced reporting
   - Student engagement metrics
   - Instructor performance tracking
   - Revenue forecasting

---

## Support

For issues or questions, refer to the comprehensive documentation in `/docs` folder.


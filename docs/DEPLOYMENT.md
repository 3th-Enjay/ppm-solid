# Deployment Guide

Complete guide for deploying the LMS Academy platform to production.

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database schema migrated
- [ ] Payment gateway configured
- [ ] Email service configured
- [ ] CDN setup for media files
- [ ] Security audit completed
- [ ] Performance testing completed

## Deploy to Vercel

### 1. Install Vercel CLI

\`\`\`bash
npm install -g vercel
\`\`\`

### 2. Login to Vercel

\`\`\`bash
vercel login
\`\`\`

### 3. Deploy

\`\`\`bash
# Preview deployment
vercel

# Production deployment
vercel --prod
\`\`\`

### 4. Configure Environment Variables

In Vercel Dashboard, add these environment variables:

**Database**:
- `MONGODB_URI` - MongoDB connection string
- `DATABASE_NAME` - Database name

**Authentication**:
- `JWT_SECRET` - Secret key for JWT tokens
- `SESSION_SECRET` - Secret for session encryption

**Payment Gateway (Paystack)**:
- `PAYSTACK_SECRET_KEY` - Your Paystack secret key
- `PAYSTACK_PUBLIC_KEY` - Your Paystack public key
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` - Public key for client

**Email Service**:
- `SMTP_HOST` - Email server host
- `SMTP_PORT` - Email server port
- `SMTP_USER` - Email username
- `SMTP_PASS` - Email password
- `FROM_EMAIL` - Sender email address

**File Storage**:
- `VERCEL_BLOB_READ_WRITE_TOKEN` - For Vercel Blob storage
- `AWS_ACCESS_KEY_ID` - If using AWS S3
- `AWS_SECRET_ACCESS_KEY` - If using AWS S3
- `AWS_REGION` - AWS region
- `S3_BUCKET_NAME` - S3 bucket name

**Analytics** (Optional):
- `GOOGLE_ANALYTICS_ID` - Google Analytics tracking ID
- `SENTRY_DSN` - Sentry error tracking

### 5. Configure Domains

Add custom domain in Vercel dashboard:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

## Database Migration

### MongoDB Setup

1. Create MongoDB Atlas account
2. Create new cluster
3. Whitelist Vercel IP addresses
4. Create database user
5. Get connection string

### Run Migrations

\`\`\`bash
npm run db:migrate
\`\`\`

### Seed Production Data

\`\`\`bash
npm run db:seed:prod
\`\`\`

## Payment Gateway Setup

### Paystack Configuration

1. Sign up at [paystack.com](https://paystack.com)
2. Complete KYC verification
3. Get API keys from Settings → API Keys
4. Configure webhooks:
   - URL: `https://your-domain.com/api/webhooks/paystack`
   - Events: `charge.success`, `charge.failed`

### Test Payment Flow

1. Use Paystack test cards
2. Verify webhook reception
3. Check enrollment creation
4. Verify email notifications

## Email Service Setup

### Using SendGrid

1. Create SendGrid account
2. Verify sender domain
3. Create API key
4. Configure templates:
   - Welcome email
   - Course enrollment
   - Password reset
   - Certificate delivery

## CDN Configuration

### For Course Videos

**Option 1: Vercel Blob**
\`\`\`typescript
import { put } from '@vercel/blob';

const blob = await put('videos/lesson-1.mp4', file, {
  access: 'public',
});
\`\`\`

**Option 2: AWS CloudFront + S3**
1. Create S3 bucket
2. Set up CloudFront distribution
3. Configure CORS
4. Enable signed URLs for premium content

## Security Configuration

### 1. Enable HTTPS

Automatic with Vercel. For custom domains:
- SSL certificate auto-provisioned
- Force HTTPS redirect enabled

### 2. Configure Security Headers

In `next.config.js`:
\`\`\`javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};
\`\`\`

### 3. Rate Limiting

Install rate-limit middleware:
\`\`\`bash
npm install express-rate-limit
\`\`\`

Configure in API routes:
\`\`\`typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
\`\`\`

### 4. CORS Configuration

\`\`\`typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  return response;
}
\`\`\`

## Monitoring & Logging

### 1. Error Tracking with Sentry

\`\`\`bash
npm install @sentry/nextjs
\`\`\`

\`\`\`typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
\`\`\`

### 2. Analytics with Vercel Analytics

\`\`\`typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
\`\`\`

### 3. Logging

Use structured logging:
\`\`\`typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
\`\`\`

## Performance Optimization

### 1. Enable Caching

\`\`\`typescript
// app/api/courses/route.ts
export const revalidate = 3600; // Revalidate every hour
\`\`\`

### 2. Image Optimization

Use Next.js Image component:
\`\`\`tsx
import Image from 'next/image';

<Image
  src="/course-thumbnail.jpg"
  alt="Course"
  width={400}
  height={300}
  priority
/>
\`\`\`

### 3. Database Indexing

Create indexes for frequently queried fields:
\`\`\`javascript
db.courses.createIndex({ slug: 1 });
db.enrollments.createIndex({ userId: 1, courseId: 1 });
db.payments.createIndex({ reference: 1 });
\`\`\`

## Backup Strategy

### 1. Database Backups

**MongoDB Atlas Auto-Backup**:
- Continuous backups enabled
- Point-in-time recovery available
- Retention period: 7 days

**Manual Backups**:
\`\`\`bash
mongodump --uri="mongodb+srv://..." --out=/backup/$(date +%Y%m%d)
\`\`\`

### 2. Media File Backups

Replicate S3 bucket to secondary region:
\`\`\`bash
aws s3 sync s3://primary-bucket s3://backup-bucket
\`\`\`

## Post-Deployment Testing

### 1. Smoke Tests

- [ ] Homepage loads
- [ ] User can register
- [ ] User can login
- [ ] Course catalog displays
- [ ] Course details load
- [ ] Add to cart works
- [ ] Checkout process completes
- [ ] Payment processes successfully
- [ ] Enrollment created
- [ ] Course player accessible
- [ ] Progress saves correctly
- [ ] Certificate generates

### 2. Performance Tests

\`\`\`bash
# Using Lighthouse
npm install -g lighthouse

lighthouse https://your-domain.com --view
\`\`\`

Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

### 3. Load Testing

\`\`\`bash
# Using Apache Bench
ab -n 1000 -c 100 https://your-domain.com/
\`\`\`

## Rollback Procedure

If deployment fails:

1. **Immediate Rollback**:
\`\`\`bash
vercel rollback
\`\`\`

2. **Database Rollback**:
\`\`\`bash
mongorestore --uri="mongodb+srv://..." /backup/latest
\`\`\`

3. **Verify System**:
- Check error logs
- Test critical paths
- Monitor error rates

## Maintenance Mode

To enable maintenance mode:

1. Create maintenance page: `app/maintenance/page.tsx`
2. Configure in `middleware.ts`:

\`\`\`typescript
if (process.env.MAINTENANCE_MODE === 'true') {
  return NextResponse.redirect(new URL('/maintenance', request.url));
}
\`\`\`

## Support & Troubleshooting

### Common Issues

**Issue**: Database connection timeout
**Solution**: Check IP whitelist in MongoDB Atlas

**Issue**: Payment webhook not received
**Solution**: Verify webhook URL and Paystack dashboard logs

**Issue**: Slow page loads
**Solution**: Enable caching and check database query performance

### Getting Help

- Documentation: `docs/`
- Support Email: support@lmsacademy.com
- Status Page: status.lmsacademy.com

## Compliance

### GDPR Compliance

- [ ] Privacy policy published
- [ ] Cookie consent implemented
- [ ] Data export functionality
- [ ] Right to deletion implemented
- [ ] Data processing agreements signed

### PCI DSS Compliance

- [ ] Payment processing via PCI-compliant gateway (Paystack)
- [ ] No card data stored locally
- [ ] Secure transmission (HTTPS)
- [ ] Regular security audits

## Scaling Considerations

### Vertical Scaling

Upgrade Vercel plan for:
- More concurrent builds
- Higher bandwidth
- Better performance

### Horizontal Scaling

For high traffic:
- Enable edge caching
- Use Redis for sessions
- Implement queue system for background jobs
- Add read replicas for database

## Monitoring Checklist

Daily checks:
- [ ] Error rate < 0.1%
- [ ] API response time < 200ms
- [ ] Database connections healthy
- [ ] Payment success rate > 98%
- [ ] Email delivery rate > 99%

Weekly checks:
- [ ] Review security logs
- [ ] Check backup integrity
- [ ] Monitor disk usage
- [ ] Review performance metrics
- [ ] Update dependencies

Monthly checks:
- [ ] Security audit
- [ ] Cost optimization review
- [ ] User feedback review
- [ ] Feature usage analytics
- [ ] Competitor analysis
\`\`\`

\`\`\`env.example file="" isHidden

# PromptCare Academy - Backend API Documentation

This document outlines all API endpoints required to connect PromptCare Academy to a MongoDB/PostgreSQL backend.

## Base URL
```
Production: https://api.promptcare.com/api/v1
Development: http://localhost:3000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer {token}
```

Tokens are obtained from the login endpoint and last 30 days by default.

---

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

Creates a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureREDACTED_PASSWORD!",
  "name": "John Doe",
  "role": "student"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student",
    "avatar": "https://...",
    "createdAt": "2024-01-30T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `409 Conflict` - Email already exists

---

### 2. Login
**POST** `/auth/login`

Authenticates user and returns auth token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureREDACTED_PASSWORD!"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student",
    "avatar": "https://...",
    "enrolledCourses": ["course-1", "course-2"],
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `404 Not Found` - User not found

---

### 3. Get Current User
**GET** `/auth/me`

Returns the authenticated user's profile.

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "student",
  "avatar": "https://...",
  "bio": "Passionate learner",
  "enrolledCourses": ["course-1", "course-2"],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-30T10:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired token
- `404 Not Found` - User not found

---

### 4. Logout
**POST** `/auth/logout`

Invalidates the current auth token.

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

---

### 5. Refresh Token
**POST** `/auth/refresh`

Generates a new token using the current one (still valid).

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 6. Reset Password
**POST** `/auth/reset-password`

Sends password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Reset link sent to email"
}
```

---

## Course Endpoints

### 7. Get All Courses
**GET** `/courses`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 12)
- `category` (optional): Filter by category
- `level` (optional): Filter by level (beginner/intermediate/advanced)
- `search` (optional): Search by title or description
- `sort` (optional): Sort by (newest/popular/price-asc/price-desc)

**Response (200 OK):**
```json
{
  "courses": [
    {
      "id": "course-1",
      "title": "Web Development Bootcamp",
      "description": "Learn full-stack development...",
      "category": "web-development",
      "level": "beginner",
      "instructor": {
        "id": "user-3",
        "name": "Michael Instructor",
        "avatar": "https://..."
      },
      "price": {
        "NGN": 25000,
        "USD": 20,
        "GBP": 15
      },
      "rating": 4.8,
      "enrollmentCount": 1250,
      "thumbnail": "https://...",
      "duration": "12 weeks",
      "status": "published",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 50,
    "pages": 5
  }
}
```

---

### 8. Get Course Details
**GET** `/courses/{courseId}`

**Response (200 OK):**
```json
{
  "id": "course-1",
  "title": "Web Development Bootcamp",
  "description": "Learn full-stack development...",
  "longDescription": "Comprehensive guide to...",
  "category": "web-development",
  "level": "beginner",
  "instructor": {
    "id": "user-3",
    "name": "Michael Instructor",
    "avatar": "https://...",
    "bio": "Senior developer with 10+ years experience"
  },
  "price": {
    "NGN": 25000,
    "USD": 20,
    "GBP": 15
  },
  "rating": 4.8,
  "totalReviews": 245,
  "enrollmentCount": 1250,
  "thumbnail": "https://...",
  "images": ["https://...", "https://..."],
  "duration": "12 weeks",
  "modules": [
    {
      "id": "module-1",
      "title": "Getting Started",
      "description": "Introduction to web development",
      "lessons": [
        {
          "id": "lesson-1",
          "title": "Course Overview",
          "type": "video",
          "duration": 15,
          "videoUrl": "https://..."
        }
      ]
    }
  ],
  "requirements": ["Basic computer knowledge"],
  "learningOutcomes": ["Build responsive websites", "Master JavaScript"],
  "status": "published",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

### 9. Create Course (Instructor Only)
**POST** `/courses`

**Headers:** `Authorization: Bearer {token}` (Instructor role required)

**Request Body:**
```json
{
  "title": "Advanced React Patterns",
  "description": "Deep dive into React...",
  "longDescription": "Comprehensive guide...",
  "category": "web-development",
  "level": "advanced",
  "price": {
    "NGN": 35000,
    "USD": 30,
    "GBP": 25
  },
  "duration": "8 weeks",
  "thumbnail": "https://...",
  "requirements": ["Basic React knowledge"],
  "learningOutcomes": ["Master advanced patterns"],
  "modules": [
    {
      "title": "Module 1",
      "lessons": [
        {
          "title": "Lesson 1",
          "type": "video",
          "videoUrl": "https://..."
        }
      ]
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "course-new",
  "title": "Advanced React Patterns",
  "instructorId": "user-3",
  "status": "draft",
  "createdAt": "2024-01-30T10:00:00Z"
}
```

---

### 10. Update Course (Instructor Only)
**PUT** `/courses/{courseId}`

**Headers:** `Authorization: Bearer {token}` (Must be course instructor)

**Request Body:** Same as create course

**Response (200 OK):** Updated course object

---

### 11. Publish Course (Instructor Only)
**PATCH** `/courses/{courseId}/publish`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "id": "course-1",
  "status": "published",
  "publishedAt": "2024-01-30T10:00:00Z"
}
```

---

### 12. Delete Course (Instructor Only)
**DELETE** `/courses/{courseId}`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "message": "Course deleted successfully"
}
```

---

## Enrollment Endpoints

### 13. Get My Enrollments (Student)
**GET** `/enrollments`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `page` (optional): Page number
- `status` (optional): Filter by status (in-progress/completed)

**Response (200 OK):**
```json
{
  "enrollments": [
    {
      "id": "enrollment-1",
      "userId": "user-1",
      "courseId": "course-1",
      "course": {
        "id": "course-1",
        "title": "Web Development Bootcamp",
        "thumbnail": "https://..."
      },
      "progress": 65,
      "completedLessons": 13,
      "totalLessons": 20,
      "studyTime": 12,
      "status": "in-progress",
      "enrolledAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 5
  }
}
```

---

### 14. Get Enrollment Details
**GET** `/enrollments/{enrollmentId}`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "id": "enrollment-1",
  "userId": "user-1",
  "courseId": "course-1",
  "course": {
    "id": "course-1",
    "title": "Web Development Bootcamp"
  },
  "progress": 65,
  "completedLessons": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  "lastAccessedLesson": 14,
  "studyTime": 12,
  "bookmarks": ["lesson-5", "lesson-12"],
  "notes": {
    "lesson-1": "Remember to practice DOM manipulation"
  },
  "status": "in-progress",
  "enrolledAt": "2024-01-15T10:00:00Z",
  "completedAt": null
}
```

---

### 15. Mark Lesson Complete
**POST** `/enrollments/{enrollmentId}/lessons/{lessonId}/complete`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "studyTime": 45
}
```

**Response (200 OK):**
```json
{
  "enrollmentId": "enrollment-1",
  "lessonId": "lesson-1",
  "progress": 67,
  "completedAt": "2024-01-30T10:00:00Z"
}
```

---

### 16. Update Course Progress
**PATCH** `/enrollments/{enrollmentId}/progress`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "completedLessons": [1, 2, 3],
  "studyTime": 120,
  "lastAccessedLesson": 4
}
```

**Response (200 OK):**
```json
{
  "progress": 67,
  "studyTime": 120
}
```

---

## Payment Endpoints

### 17. Initialize Payment
**POST** `/payments/initialize`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "courseId": "course-1",
  "currency": "NGN",
  "amount": 25000
}
```

**Response (200 OK):**
```json
{
  "reference": "PC-NGN-1706596800000-xyz123",
  "authorizationUrl": "https://checkout.paystack.com/...",
  "accessCode": "ACC-reference",
  "currency": "NGN",
  "amount": 25000
}
```

---

### 18. Verify Payment
**POST** `/payments/verify`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "reference": "PC-NGN-1706596800000-xyz123"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "reference": "PC-NGN-1706596800000-xyz123",
  "amount": 25000,
  "currency": "NGN",
  "transactionId": "TXN-1706596800000",
  "enrollmentId": "enrollment-new",
  "paidAt": "2024-01-30T10:00:00Z"
}
```

---

### 19. Get Payment History
**GET** `/payments`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `page` (optional): Page number
- `status` (optional): Filter by status (success/failed/pending)
- `currency` (optional): Filter by currency

**Response (200 OK):**
```json
{
  "payments": [
    {
      "id": "payment-1",
      "userId": "user-1",
      "courseId": "course-1",
      "course": {
        "title": "Web Development Bootcamp"
      },
      "reference": "PC-NGN-1706596800000-xyz123",
      "amount": 25000,
      "currency": "NGN",
      "status": "success",
      "transactionId": "TXN-1706596800000",
      "paymentMethod": "paystack",
      "paidAt": "2024-01-30T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 15
  }
}
```

---

### 20. Get Invoice
**GET** `/payments/{paymentId}/invoice`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK - PDF/JSON):**
```json
{
  "id": "invoice-1",
  "paymentId": "payment-1",
  "invoiceNumber": "INV-2024-001",
  "issueDate": "2024-01-30",
  "dueDate": "2024-02-30",
  "amount": 25000,
  "currency": "NGN",
  "status": "paid",
  "items": [
    {
      "description": "Web Development Bootcamp",
      "quantity": 1,
      "unitPrice": 25000,
      "total": 25000
    }
  ],
  "paidAt": "2024-01-30T10:00:00Z"
}
```

---

## Certificate Endpoints

### 21. Get Certificates
**GET** `/certificates`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "certificates": [
    {
      "id": "cert-1",
      "userId": "user-1",
      "courseId": "course-1",
      "courseName": "Web Development Bootcamp",
      "certificateNumber": "PC-2024-001",
      "issueDate": "2024-01-30",
      "credentialId": "credential-xyz",
      "verificationUrl": "https://promptcare.com/verify/credential-xyz",
      "pdfUrl": "https://..."
    }
  ]
}
```

---

### 22. Download Certificate
**GET** `/certificates/{certificateId}/download`

**Headers:** `Authorization: Bearer {token}`

**Response:** PDF file download

---

### 23. Verify Certificate
**GET** `/certificates/verify/{credentialId}`

**Response (200 OK):**
```json
{
  "valid": true,
  "certificate": {
    "id": "cert-1",
    "userName": "John Doe",
    "courseName": "Web Development Bootcamp",
    "issueDate": "2024-01-30",
    "credentialId": "credential-xyz"
  }
}
```

---

## Admin Endpoints

### 24. Get Platform Analytics
**GET** `/admin/analytics`

**Headers:** `Authorization: Bearer {token}` (Admin only)

**Response (200 OK):**
```json
{
  "totalUsers": 1250,
  "totalStudents": 1200,
  "totalInstructors": 50,
  "totalCourses": 50,
  "publishedCourses": 40,
  "totalEnrollments": 5000,
  "totalRevenue": {
    "NGN": 2500000,
    "USD": 2000,
    "GBP": 1500
  },
  "averageRating": 4.7,
  "lastMonthRevenue": {
    "NGN": 500000,
    "USD": 400,
    "GBP": 300
  },
  "conversionRate": 0.35,
  "userGrowth": {
    "thisMonth": 150,
    "lastMonth": 120
  }
}
```

---

### 25. Get All Users (Admin)
**GET** `/admin/users`

**Headers:** `Authorization: Bearer {token}` (Admin only)

**Query Parameters:**
- `page` (optional): Page number
- `role` (optional): Filter by role
- `status` (optional): Filter by status (active/suspended)

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": "user-1",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "student",
      "status": "active",
      "enrollmentCount": 5,
      "totalSpent": {
        "NGN": 100000,
        "USD": 80
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 1250
  }
}
```

---

### 26. Get All Payments (Finance/Admin)
**GET** `/admin/payments`

**Headers:** `Authorization: Bearer {token}` (Finance/Admin only)

**Query Parameters:**
- `page` (optional): Page number
- `status` (optional): Filter by status
- `currency` (optional): Filter by currency
- `startDate` (optional): Filter by date range
- `endDate` (optional): Filter by date range

**Response (200 OK):**
```json
{
  "payments": [
    {
      "id": "payment-1",
      "userId": "user-1",
      "userName": "John Doe",
      "courseId": "course-1",
      "courseName": "Web Development",
      "amount": 25000,
      "currency": "NGN",
      "reference": "PC-NGN-1706596800000-xyz123",
      "status": "success",
      "paymentMethod": "paystack",
      "paidAt": "2024-01-30T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 5000
  },
  "summary": {
    "totalRevenue": {
      "NGN": 2500000,
      "USD": 2000
    },
    "totalTransactions": 5000,
    "successRate": 0.98
  }
}
```

---

## Error Handling

All error responses follow this format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Field validation failed",
    "details": {
      "email": "Invalid email format"
    }
  }
}
```

### Error Codes:
- `INVALID_REQUEST` - 400 Bad Request
- `UNAUTHORIZED` - 401 Unauthorized
- `FORBIDDEN` - 403 Forbidden
- `NOT_FOUND` - 404 Not Found
- `CONFLICT` - 409 Conflict
- `RATE_LIMIT` - 429 Too Many Requests
- `SERVER_ERROR` - 500 Internal Server Error

---

## Rate Limiting

All endpoints are rate limited:
- 100 requests per minute for authenticated users
- 30 requests per minute for public endpoints
- 10 requests per minute for auth endpoints

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706596800
```

---

## Pagination

All list endpoints support pagination with:
- `page`: Current page (default: 1)
- `limit`: Results per page (default: 12, max: 100)

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 150,
    "pages": 13
  }
}
```

---

## Data Types

### Course Status
- `draft` - Not published
- `published` - Available for enrollment
- `archived` - No longer available

### Enrollment Status
- `in-progress` - Currently taking course
- `completed` - Finished all lessons
- `paused` - Temporarily suspended

### Payment Status
- `pending` - Awaiting verification
- `success` - Payment confirmed
- `failed` - Payment declined

### User Role
- `student` - Taking courses
- `instructor` - Creating courses
- `admin` - Full platform access
- `finance` - Payment management

---

## Next Steps for Backend Implementation

1. Set up MongoDB/PostgreSQL database
2. Implement authentication with JWT
3. Create all endpoints defined above
4. Add email notifications
5. Implement file uploads for course materials
6. Set up payment gateway integration (Paystack)
7. Add comprehensive error handling
8. Implement caching (Redis)
9. Add logging and monitoring
10. Set up automated testing


# API Documentation

Complete API reference for the LMS Academy platform.

## Base URL

\`\`\`
Development: http://localhost:3000/api
Production: https://your-domain.com/api
\`\`\`

## Authentication

All authenticated endpoints require a valid session. The system uses cookie-based authentication.

### Register

Create a new user account.

**Endpoint**: `POST /api/auth/register`

**Request Body**:
\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "REDACTED_PASSWORD"
}
\`\`\`

**Response** (201 Created):
\`\`\`json
{
  "user": {
    "id": "usr_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
\`\`\`

**Errors**:
- `400 Bad Request` - Missing required fields or validation error
- `409 Conflict` - Email already exists

---

### Login

Authenticate a user and create a session.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
\`\`\`json
{
  "email": "john@example.com",
  "password": "REDACTED_PASSWORD"
}
\`\`\`

**Response** (200 OK):
\`\`\`json
{
  "user": {
    "id": "usr_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "status": "active"
  }
}
\`\`\`

**Errors**:
- `400 Bad Request` - Missing email or password
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account suspended

---

### Logout

End the current user session.

**Endpoint**: `POST /api/auth/logout`

**Response** (200 OK):
\`\`\`json
{
  "success": true
}
\`\`\`

---

### Get Current User

Retrieve the authenticated user's information.

**Endpoint**: `GET /api/auth/me`

**Headers**:
- `Cookie: session=...` (automatically sent by browser)

**Response** (200 OK):
\`\`\`json
{
  "user": {
    "id": "usr_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "avatar": null,
    "bio": null,
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
\`\`\`

**Errors**:
- `401 Unauthorized` - Not authenticated

---

## Courses

### Get All Courses

Retrieve a list of published courses with optional filtering.

**Endpoint**: `GET /api/courses`

**Query Parameters**:
- `category` (optional) - Filter by category (e.g., "web-development", "data-science")
- `level` (optional) - Filter by level ("beginner", "intermediate", "advanced")
- `search` (optional) - Search in title, description, instructor

**Example**:
\`\`\`
GET /api/courses?category=web-development&level=beginner&search=react
\`\`\`

**Response** (200 OK):
\`\`\`json
{
  "courses": [
    {
      "id": "crs_123",
      "title": "Complete React Development Course",
      "slug": "complete-react-development",
      "description": "Master React from basics to advanced concepts",
      "instructor": "Sarah Johnson",
      "category": "Web Development",
      "level": "Intermediate",
      "price": 4999900,
      "thumbnail": "/images/react-course.jpg",
      "totalLessons": 156,
      "duration": "18 hours",
      "rating": 4.8,
      "students": 1234,
      "status": "published",
      "createdAt": "2024-01-10T00:00:00Z",
      "modules": [...]
    }
  ]
}
\`\`\`

---

### Get Course By ID

Retrieve detailed information about a specific course.

**Endpoint**: `GET /api/courses/[id]`

**Response** (200 OK):
\`\`\`json
{
  "course": {
    "id": "crs_123",
    "title": "Complete React Development Course",
    "slug": "complete-react-development",
    "description": "Master React from basics to advanced concepts",
    "instructor": "Sarah Johnson",
    "instructorBio": "Senior Full-Stack Developer with 10+ years experience",
    "instructorAvatar": "/images/instructors/sarah.jpg",
    "category": "Web Development",
    "level": "Intermediate",
    "price": 4999900,
    "thumbnail": "/images/react-course.jpg",
    "totalLessons": 156,
    "duration": "18 hours",
    "rating": 4.8,
    "students": 1234,
    "status": "published",
    "modules": [
      {
        "id": "mod_1",
        "title": "Getting Started with React",
        "lessons": [
          {
            "id": "les_1",
            "title": "Introduction to React",
            "duration": "10:30",
            "type": "video",
            "isFree": true
          }
        ]
      }
    ],
    "requirements": ["Basic JavaScript knowledge", "HTML & CSS"],
    "learningOutcomes": ["Build modern React applications", "..."],
    "ratings": [
      {
        "userId": "usr_456",
        "userName": "Jane Smith",
        "rating": 5,
        "comment": "Excellent course!",
        "createdAt": "2024-01-20T00:00:00Z"
      }
    ],
    "createdAt": "2024-01-10T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z"
  }
}
\`\`\`

**Errors**:
- `404 Not Found` - Course does not exist

---

## Enrollments

### Get User Enrollments

Retrieve all courses a user is enrolled in.

**Endpoint**: `GET /api/enrollments`

**Query Parameters**:
- `userId` (required) - User ID

**Example**:
\`\`\`
GET /api/enrollments?userId=usr_123
\`\`\`

**Response** (200 OK):
\`\`\`json
{
  "enrollments": [
    {
      "id": "enr_123",
      "userId": "usr_123",
      "courseId": "crs_123",
      "progress": 45,
      "completedLessons": ["les_1", "les_2", "les_3"],
      "enrolledAt": "2024-01-15T10:00:00Z",
      "lastAccessedAt": "2024-01-20T14:30:00Z",
      "certificateIssued": false,
      "course": {
        "id": "crs_123",
        "title": "Complete React Development Course",
        "thumbnail": "/images/react-course.jpg",
        "instructor": "Sarah Johnson",
        "totalLessons": 156
      }
    }
  ]
}
\`\`\`

**Errors**:
- `400 Bad Request` - Missing userId
- `401 Unauthorized` - Not authenticated

---

### Create Enrollment

Enroll a user in a course (typically called after successful payment).

**Endpoint**: `POST /api/enrollments`

**Request Body**:
\`\`\`json
{
  "userId": "usr_123",
  "courseId": "crs_123"
}
\`\`\`

**Response** (201 Created):
\`\`\`json
{
  "enrollment": {
    "id": "enr_123",
    "userId": "usr_123",
    "courseId": "crs_123",
    "progress": 0,
    "completedLessons": [],
    "enrolledAt": "2024-01-15T10:00:00Z",
    "lastAccessedAt": "2024-01-15T10:00:00Z",
    "certificateIssued": false
  }
}
\`\`\`

**Errors**:
- `400 Bad Request` - Missing required fields or already enrolled
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Course not found

---

### Update Enrollment Progress

Update a user's progress in a course.

**Endpoint**: `PATCH /api/enrollments/[id]/progress`

**Request Body**:
\`\`\`json
{
  "progress": 50,
  "completedLessons": ["les_1", "les_2", "les_3", "les_4"]
}
\`\`\`

**Response** (200 OK):
\`\`\`json
{
  "enrollment": {
    "id": "enr_123",
    "userId": "usr_123",
    "courseId": "crs_123",
    "progress": 50,
    "completedLessons": ["les_1", "les_2", "les_3", "les_4"],
    "lastAccessedAt": "2024-01-20T14:30:00Z"
  }
}
\`\`\`

**Errors**:
- `404 Not Found` - Enrollment not found
- `401 Unauthorized` - Not authenticated

---

## Payments

### Initialize Payment

Initialize a payment transaction with Paystack.

**Endpoint**: `POST /api/payments/initialize`

**Request Body**:
\`\`\`json
{
  "userId": "usr_123",
  "courseIds": ["crs_123", "crs_456"],
  "amount": 9999800,
  "email": "john@example.com"
}
\`\`\`

**Response** (200 OK):
\`\`\`json
{
  "success": true,
  "payment": {
    "id": "pay_123",
    "userId": "usr_123",
    "courseIds": ["crs_123", "crs_456"],
    "amount": 9999800,
    "currency": "NGN",
    "reference": "PAY_abc123xyz",
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "authorization_url": "https://paystack.com/pay/PAY_abc123xyz"
}
\`\`\`

**Errors**:
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - User not found

---

### Verify Payment

Verify a payment transaction status.

**Endpoint**: `GET /api/payments/verify`

**Query Parameters**:
- `reference` (required) - Payment reference

**Example**:
\`\`\`
GET /api/payments/verify?reference=PAY_abc123xyz
\`\`\`

**Response** (200 OK):
\`\`\`json
{
  "success": true,
  "verified": true,
  "payment": {
    "id": "pay_123",
    "userId": "usr_123",
    "courseIds": ["crs_123", "crs_456"],
    "amount": 9999800,
    "currency": "NGN",
    "reference": "PAY_abc123xyz",
    "status": "success",
    "createdAt": "2024-01-15T10:00:00Z",
    "verifiedAt": "2024-01-15T10:05:00Z"
  }
}
\`\`\`

**Errors**:
- `400 Bad Request` - Missing reference or verification failed
- `404 Not Found` - Payment not found

---

## Data Models

### User
\`\`\`typescript
{
  id: string
  name: string
  email: string
  password: string (hashed)
  role: "student" | "instructor" | "admin"
  avatar?: string
  bio?: string
  phone?: string
  status: "active" | "suspended"
  createdAt: string
}
\`\`\`

### Course
\`\`\`typescript
{
  id: string
  title: string
  slug: string
  description: string
  instructor: string
  instructorBio: string
  instructorAvatar: string
  category: string
  level: "Beginner" | "Intermediate" | "Advanced"
  price: number (in kobo/cents)
  thumbnail: string
  totalLessons: number
  duration: string
  rating: number
  students: number
  status: "draft" | "published" | "archived"
  modules: Module[]
  requirements: string[]
  learningOutcomes: string[]
  ratings: Rating[]
  createdAt: string
  updatedAt: string
}
\`\`\`

### Enrollment
\`\`\`typescript
{
  id: string
  userId: string
  courseId: string
  progress: number (0-100)
  completedLessons: string[]
  enrolledAt: string
  lastAccessedAt: string
  certificateIssued: boolean
  certificateId?: string
}
\`\`\`

### Payment
\`\`\`typescript
{
  id: string
  userId: string
  courseIds: string[]
  amount: number (in kobo/cents)
  currency: string
  reference: string
  status: "pending" | "success" | "failed"
  metadata?: object
  createdAt: string
  verifiedAt?: string
}
\`\`\`

## Rate Limiting

Currently no rate limiting is implemented in the mock version. In production, consider:

- **Authentication endpoints**: 5 requests per minute
- **General API**: 100 requests per minute per user
- **Admin endpoints**: 200 requests per minute

## Error Responses

All errors follow this format:

\`\`\`json
{
  "error": "Error message describing what went wrong"
}
\`\`\`

Common HTTP status codes:
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `500 Internal Server Error` - Server error

## Webhook Events (Future)

For real Paystack integration, implement these webhooks:

- `charge.success` - Payment successful
- `charge.failed` - Payment failed
- `subscription.create` - Subscription created (for course subscriptions)
- `subscription.disable` - Subscription cancelled

## Best Practices

1. **Always validate input** - Use Zod schemas for type-safe validation
2. **Handle errors gracefully** - Provide clear error messages
3. **Use proper HTTP methods** - GET for reads, POST for creates, PATCH for updates
4. **Secure sensitive data** - Never expose passwords or API keys
5. **Implement rate limiting** - Protect against abuse
6. **Log important events** - Track payments, enrollments, errors
7. **Test thoroughly** - Test all endpoints before production

## Testing

Use the mock accounts to test the API:

**Student**: user@example.com / REDACTED_PASSWORD
**Admin**: admin@yourdomain.com / REDACTED_PASSWORD

Example with `curl`:

\`\`\`bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"REDACTED_PASSWORD"}' \
  -c cookies.txt

# Get courses
curl http://localhost:3000/api/courses \
  -b cookies.txt

# Get enrollments
curl "http://localhost:3000/api/enrollments?userId=usr_student_1" \
  -b cookies.txt
\`\`\`

## Support

For API questions or issues:
- Email: api-support@lmsacademy.com
- Documentation: https://docs.lmsacademy.com
\`\`\`

\`\`\`env file="" isHidden


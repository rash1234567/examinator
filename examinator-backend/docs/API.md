# API reference

**Base URL:** `http://localhost:8989` (or `PORT` from `.env`)

**Content type:** `application/json` for bodies unless noted.

**Validation errors:** `400` with `{ "message": "field: error\\field2: error2" }` (backslash-separated).

---

## Table of contents

1. [Authentication](#authentication) — public routes under `/api/auth`
2. [Students & enrollment](./STUDENTS-AND-ENROLLMENT.md) — detailed guide
3. [Courses (single)](#courses-single) — `/api/course`
4. [Courses (bulk & list)](#courses-bulk--list) — `/api/courses`
5. [Common patterns](#common-patterns)

---

## Authentication

Base path: **`/api/auth`**

No `Authorization` header required unless stated.

### Password rules

Used for registration and password reset:

- Minimum 6 characters
- At least one letter
- At least one number
- At least one special character

---

### Register examiner (lecturer)

Creates a **LOCAL** account with role `EXAMINER` and sends a verification email.

| | |
|---|---|
| **Method / path** | `POST /api/auth/register-examiner` |
| **Auth** | None |

**Body**

| Field | Type | Required |
|-------|------|----------|
| `firstName` | string | Yes |
| `lastName` | string | Yes |
| `email` | string (email) | Yes |
| `password` | string | Yes (see rules) |
| `school` | string | Yes |
| `country` | string | No |
| `department` | string | No |
| `faculty` | string | No |

**Example**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@university.edu",
  "password": "Secure1!",
  "school": "Example University",
  "country": "NG",
  "department": "Computer Science",
  "faculty": "Science"
}
```

**Responses**

| Status | Body |
|--------|------|
| `201` | `{ "message": "Account created successfully check your email for verification" }` |
| `400` | `{ "message": "Email already exists" }` (duplicate email) |
| `400` | Validation errors |
| `500` | `{ "message": "Something went wrong" }` |

**Notes**

- `provider` defaults to `LOCAL` in the database.
- Verification link is sent by email (see [SETUP.md](./SETUP.md)).

---

### Verify email

| | |
|---|---|
| **Method / path** | `GET /api/auth/verify-email?token=<jwt>` |
| **Auth** | None |

**Responses**

| Status | Body |
|--------|------|
| `200` | `{ "message": "Email verified successfully 🎉" }` |
| `200` | `{ "message": "Email already verified. Please login." }` |
| `400` | `{ "message": "Token is required" }` |
| `400` | `{ "message": "Invalid verification link" }` |
| `401` | `{ "message": "Verification link expired. Please request a new one." }` |
| `404` | `{ "message": "User not found" }` |

Verification JWT expires in **1 day**.

---

### Resend verification email

| | |
|---|---|
| **Method / path** | `POST /api/auth/resend-verification-email` |
| **Auth** | None |

**Body**

```json
{ "email": "jane@university.edu" }
```

**Responses**

| Status | Body |
|--------|------|
| `200` | `{ "message": "Verification email resent successfully" }` |
| `400` | `{ "message": "Email already verified please login to your account" }` |
| `404` | `{ "message": "User not found" }` |

---

### Login

| | |
|---|---|
| **Method / path** | `POST /api/auth/login` |
| **Auth** | None |

**Body**

```json
{
  "school": "Example University",
  "email": "jane@university.edu",
  "password": "Secure1!"
}
```

Or login with matric (typical for students):

```json
{
  "school": "Example University",
  "matricNumber": "CSC/2025/001",
  "password": "Secure1!"
}
```

Provide **either** `email` or `matricNumber`, plus **school** and **password**.

**Success `200`**

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "user": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@university.edu",
    "role": "EXAMINER",
    "emailVerified": true,
    "school": "Example University",
    ...
  }
}
```

Password is omitted from `user`.

**Responses**

| Status | Body |
|--------|------|
| `200` | Tokens + user (above) |
| `401` | `{ "message": "Email not verified please check your email for verification" }` |
| `401` | `{ "message": "Invalid Credentials" }` |
| `404` | `{ "message": "Invalid Credentials" }` (user not found) |

**Token lifetimes**

| Token | Expiry |
|-------|--------|
| `accessToken` | 1 hour |
| `refreshToken` | 7 days |

JWT payload: `{ "userId": "<uuid>", "userRole": "EXAMINER" | "STUDENT" }`.

**Note:** Refresh token endpoint is not implemented yet; store `refreshToken` for a future refresh flow.

---

### Forgot password

Sends a reset email for **LOCAL** users who have a password. Response is always the same (no email enumeration).

| | |
|---|---|
| **Method / path** | `POST /api/auth/forgot-password` |
| **Auth** | None |

**Body**

```json
{ "email": "jane@university.edu" }
```

**Response `200`**

```json
{
  "message": "If an account exists with that email, we sent password reset instructions."
}
```

**Reset link format**

`{FRONTEND_URL}/reset-password?token=<opaque-token>`

Default `FRONTEND_URL`: `http://localhost:3000`. Token expires in **1 hour**. Token is single-use.

**Google / OAuth accounts:** No email is sent (`provider !== LOCAL` or no password). User should sign in with Google instead.

---

### Reset password

| | |
|---|---|
| **Method / path** | `POST /api/auth/reset-password` |
| **Auth** | None |

**Body**

```json
{
  "token": "<token from email link>",
  "password": "NewSecure1!"
}
```

**Responses**

| Status | Body |
|--------|------|
| `200` | `{ "message": "Password updated successfully. You can log in with your new password." }` |
| `400` | `{ "message": "Invalid or expired reset link. Please request a new one." }` |
| `400` | Validation errors |

---

## Courses (single)

Base path: **`/api/course`**

**Auth required:** `Authorization: Bearer <accessToken>`

**Role required:** `EXAMINER` (lecturer). Others receive `403`.

### Course fields (create / update)

| Field | Type | Required on create | Notes |
|-------|------|-------------------|--------|
| `courseCode` | string | Yes | Max 40 chars; stored **uppercase**; unique **per lecturer** |
| `title` | string | Yes | Max 500 |
| `description` | string | No | Default `""`; max 20000 |
| `academicYear` | string | Yes | Max 100; used in filters |
| `semester` | string | Yes | Max 100; used in filters |
| `studentLevel` | string \| null | No | Max 100; used in filters |
| `meta` | object | No | Arbitrary JSON for school-specific labels |

**Course code format:** Must start with a letter or digit; may include spaces, `-`, `_`, `.`, `/`.

---

### Create one course

| | |
|---|---|
| **Method / path** | `POST /api/course` |
| **Body** | Single course object |

**Example**

```json
{
  "courseCode": "CSC101",
  "title": "Introduction to Programming",
  "description": "First-year course.",
  "academicYear": "2025-2026",
  "semester": "harmattan",
  "studentLevel": "100",
  "meta": {
    "labels": {
      "semester": "Harmattan Semester",
      "level": "100 Level"
    }
  }
}
```

**Responses**

| Status | Body |
|--------|------|
| `201` | Full course object + nested `examiner` summary |
| `409` | `{ "message": "You already have a course with this code. Choose a different course code." }` |
| `401` | `{ "message": "No token provided" }` / invalid token |
| `403` | `{ "message": "Only lecturers (examiners) can manage courses" }` |

---

### Get one course

| | |
|---|---|
| **Method / path** | `GET /api/course/:id` |

**Responses**

| Status | Body |
|--------|------|
| `200` | Course object |
| `404` | `{ "message": "Course not found" }` (wrong id or not your course) |

---

### Update one course

| | |
|---|---|
| **Method / path** | `PATCH /api/course/:id` |
| **Body** | Any subset of course fields; **at least one** required |

**Example**

```json
{
  "title": "Intro to Programming (Updated)",
  "studentLevel": "200"
}
```

**Responses**

| Status | Body |
|--------|------|
| `200` | Updated course |
| `404` | Course not found |
| `409` | Duplicate `courseCode` for this lecturer |

---

### Delete one course

| | |
|---|---|
| **Method / path** | `DELETE /api/course/:id` |

**Response `200`**

```json
{ "message": "Course deleted" }
```

**`404`** if not found or not owned by you.

---

## Courses (bulk & list)

Base path: **`/api/courses`**

Same auth as above: **Bearer token**, role **EXAMINER**.

### List courses (with filters)

| | |
|---|---|
| **Method / path** | `GET /api/courses` |
| **Query** | All optional |

| Query param | Description |
|-------------|-------------|
| `page` | Page number (default `1`) |
| `limit` | Per page (default `50`, max `100`) |
| `academicYear` | Case-insensitive exact match |
| `semester` | Case-insensitive exact match |
| `studentLevel` | Case-insensitive exact match |
| `courseCode` | Case-insensitive exact match (normalized to uppercase) |

**Example**

```
GET /api/courses?page=1&limit=20&academicYear=2025-2026&semester=harmattan
```

**Response `200`**

```json
{
  "courses": [ /* full course objects, newest updatedAt first */ ],
  "pagination": { "page": 1, "limit": 20, "total": 14, "pages": 1 }
}
```

Only **your** courses are returned.

---

### Bulk create courses

| | |
|---|---|
| **Method / path** | `POST /api/courses` |
| **Body** | **JSON array** of course objects (same shape as single create) |

**Limits:** 1–50 courses per request. Duplicate `courseCode` **within the same request** is rejected. All inserts run in a **transaction** (all succeed or none).

**Example**

```json
[
  {
    "courseCode": "CSC101",
    "title": "Intro to Programming",
    "academicYear": "2025-2026",
    "semester": "harmattan",
    "studentLevel": "100"
  },
  {
    "courseCode": "CSC102",
    "title": "Data Structures",
    "academicYear": "2025-2026",
    "semester": "harmattan",
    "studentLevel": "100"
  }
]
```

**Response `201`**

```json
{
  "count": 2,
  "courses": [ /* full course objects */ ]
}
```

**`409`** if any code conflicts with an existing course or the batch fails uniqueness.

---

### Bulk delete courses

| | |
|---|---|
| **Method / path** | `DELETE /api/courses` |
| **Body** | Required (Postman: Body → raw → JSON) |

**Option A — object (recommended)**

```json
{
  "ids": [
    "cd24c12f-95b5-4267-8d6c-8408b5b20cf7",
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  ]
}
```

**Option B — raw array**

```json
[
  "cd24c12f-95b5-4267-8d6c-8408b5b20cf7",
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
]
```

**Invalid JSON (do not use):**

```json
{
  [ "id1", "id2" ]
}
```

Objects must have a property name (e.g. `"ids"`).

**Limits:** 1–50 UUIDs. Must be **course row ids**, not user/examiner ids.

**Response `200`**

```json
{
  "deletedCount": 2,
  "requestedIds": 2,
  "message": "All listed courses that belong to you were deleted."
}
```

If some ids are wrong, not yours, or already deleted, `deletedCount` may be less than `requestedIds` with a different `message`.

---

## Common patterns

### Authorization header

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Course response shape (example)

```json
{
  "id": "uuid",
  "courseCode": "CSC101",
  "title": "Introduction to Programming",
  "description": "...",
  "academicYear": "2025-2026",
  "semester": "harmattan",
  "studentLevel": "100",
  "meta": { "labels": { "semester": "Harmattan Semester" } },
  "examinerId": "uuid",
  "createdAt": "2026-05-18T12:00:00.000Z",
  "updatedAt": "2026-05-18T12:00:00.000Z",
  "examiner": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@university.edu",
    "school": "Example University",
    "department": "Computer Science",
    "faculty": "Science"
  }
}
```

### Route summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register-examiner` | No | Register lecturer |
| GET | `/api/auth/verify-email` | No | Verify email |
| POST | `/api/auth/resend-verification-email` | No | Resend verification |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/forgot-password` | No | Request reset email |
| POST | `/api/auth/reset-password` | No | Set new password |
| POST | `/api/course` | Bearer + EXAMINER | Create one course |
| GET | `/api/course/:id` | Bearer + EXAMINER | Get one course |
| PATCH | `/api/course/:id` | Bearer + EXAMINER | Update course |
| DELETE | `/api/course/:id` | Bearer + EXAMINER | Delete one course |
| GET | `/api/courses` | Bearer + EXAMINER | List + filter |
| POST | `/api/courses` | Bearer + EXAMINER | Bulk create (array body) |
| DELETE | `/api/courses` | Bearer + EXAMINER | Bulk delete |

### Postman tips

1. Set collection variable `baseUrl` = `http://localhost:8989`.
2. After login, save `accessToken` and use **Authorization → Bearer Token**.
3. For bulk delete, use **DELETE** with a valid JSON body (see above).
4. Use **course `id`** from list/create responses for delete/update — not your user id.

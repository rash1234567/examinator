# Students & enrollment

How student accounts and course enrollments work in the MVP.

## Concepts

| Concept | Description |
|---------|-------------|
| **Student (`User` + `STUDENT`)** | Identity at one **school** — matric required; email optional |
| **Enrollment** | One row = student is on one course (`ACTIVE` or `DROPPED`) |
| **School-scoped uniqueness** | Same email or matric at **different** schools = different accounts |

Students are **not** given courses on their user record. Courses are attached only via **enrollment**.

## Identity rules

- `@@unique([school, email])` — when email is set
- `@@unique([school, matricNumber])` — matric always set for students
- Lecturer-created students: `emailVerified: true` (can log in immediately)
- Self-registered students: `emailVerified: false` until they click the verification link

## Login (all roles)

`POST /api/auth/login`

```json
{
  "school": "Example University",
  "email": "student@university.edu",
  "password": "Secure1!"
}
```

Or with matric:

```json
{
  "school": "Example University",
  "matricNumber": "CSC/2025/001",
  "password": "Secure1!"
}
```

Provide **either** `email` or `matricNumber`, plus **school** and **password**.

---

## Student endpoints (`/api/students`)

All lecturer routes: `Authorization: Bearer <token>`, role **EXAMINER**.

### Create one student

`POST /api/students`

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "matricNumber": "CSC/2025/001",
  "email": "john@university.edu",
  "password": "Optional1!",
  "department": "Computer Science",
  "courseIds": ["course-uuid-1", "course-uuid-2"]
}
```

- `courseIds` optional — enrolls immediately into your courses.
- If `password` is omitted, the initial password is the student’s **last name** (trimmed, as entered in `lastName`). Students with an **email** can change it via **forgot password** → reset link.
- If a student **already exists** at the same school (matched by **matric** or **email**), the API **updates** their profile from your payload (name, email, department, etc.) and applies `courseIds` enrollments. **Password is not changed** unless you send `password` in the body.
- If matric points to one student and email to another → `409` conflict (fix the row).

### Bulk create (JSON)

`POST /api/students/bulk`

Max **1000** students per request.

```json
{
  "students": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "matricNumber": "CSC001"
    }
  ],
  "courseIds": ["course-uuid-1"]
}
```

Response includes `created`, `matched`, `updated`, `enrolled`, `passwordNote`, `mergeNote`, `errors[]`.

### List students

`GET /api/students?page=1&limit=50&search=john`

Returns students you created or who are enrolled in your courses (same school).

Each student includes:

- `courseIds` — active enrollments on **your** courses
- `totalCourses` — length of `courseIds` (convenience count)

### Student: my courses

`GET /api/students/me/courses?page=1&limit=20` — role **STUDENT**, Bearer token.

**How it is scoped (not a `school` query param):**

- Uses the **logged-in student** from the JWT (`userId`).
- Returns every **ACTIVE** enrollment for that account (any course they were enrolled in).
- Response includes `school` from the student profile for display; courses are **not** filtered by school in the query — one student account already belongs to one school.

**Pagination:** `page` (default 1), `limit` (default 50, max 100).

```json
{
  "school": "Example University",
  "courses": [ { "enrollmentId": "...", "enrolledAt": "...", "course": { ... } } ],
  "pagination": { "page": 1, "limit": 50, "total": 3, "pages": 1 }
}
```

---

## Self-registration

`POST /api/auth/register-student`

```json
{
  "firstName": "Mary",
  "lastName": "James",
  "matricNumber": "CSC/2025/002",
  "email": "mary@university.edu",
  "password": "Secure1!",
  "school": "Example University"
}
```

Sends verification email; must verify before login.

---

## Enrollment (`/api/course/:courseId/students`)

Lecturer must own the course.

| Method | Path | Body |
|--------|------|------|
| `POST` | `.../students` | `{ "studentId" }` or `{ "matricNumber" }` |
| `POST` | `.../students/bulk` | `{ "studentIds": [] }` or `{ "matricNumbers": [] }` |
| `GET` | `.../students` | Query: `page`, `limit` |
| `DELETE` | `.../students/:studentId` | Soft-unenroll (`DROPPED`) |

Idempotent: enrolling again returns `skipped: true`.

---

## Recommended workflow

1. Examiner creates courses.
2. `POST /api/students/bulk` — create roster from JSON (frontend parses CSV if needed).
3. `POST /api/course/:courseId/students/bulk` — assign to each course (or pass `courseIds` on upload).
4. Tell students: first login password is their **last name** (unless you set a custom password).
5. Students log in with **school + email/matric + password** (school optional for email if only one account exists).
6. To change password: `POST /api/auth/forgot-password` with `{ "email", "school" }` → email link → `POST /api/auth/reset-password` (requires a registered **email** on the student).
6. Students call `GET /api/students/me/courses`.

---

## Not in MVP yet

- Invite / join links (permanent self-register portal)
- Course representatives
- Student self add/drop courses
- Async import jobs for 10k+ rows

See [ROADMAP.md](./ROADMAP.md).

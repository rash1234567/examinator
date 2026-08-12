# Data model

PostgreSQL via Prisma. Schema: `prisma/schema.prisma`.

## User

Single table for examiners and students. Distinguished by `role`.

| Field | Type | Notes |
|-------|------|--------|
| `id` | UUID | Primary key |
| `firstName`, `lastName` | String | Required |
| `email` | String? | Unique per **school** with `school` |
| `matricNumber` | String? | Unique per **school** (required for students in practice) |
| `password` | String? | Bcrypt |
| `role` | `STUDENT` \| `EXAMINER` | |
| `school` | String | Institution scope for uniqueness and login |
| `emailVerified` | Boolean | |
| `createdByExaminerId` | String? | Who created this student account |
| `meta` | JSON? | Flexible fields |

**Uniqueness**

- `@@unique([school, email])`
- `@@unique([school, matricNumber])`

**Relations**

- `examinerCourses` — courses this user teaches (`EXAMINER`)
- `enrollments` — courses this student takes (`STUDENT`)
- `enrollmentsCreated` — enrollments this user performed as examiner

## Course

| Field | Notes |
|-------|--------|
| `courseCode` | Unique per `examinerId` |
| `examinerId` | Owning lecturer |
| `academicYear`, `semester`, `studentLevel` | Filterable |
| `meta` | School-specific display labels |

**Relations:** `enrollments`, `examiner` (User).

## Enrollment

Join table: **student ↔ course** (“checked” course).

| Field | Notes |
|-------|--------|
| `studentId` | `User` with `STUDENT` |
| `courseId` | |
| `status` | `ACTIVE` \| `DROPPED` |
| `source` | `EXAMINER` \| `BULK_UPLOAD` \| `SELF_REGISTER` |
| `enrolledById` | Examiner who enrolled |

`@@unique([studentId, courseId])` — one enrollment row per pair; re-enroll reactivates `DROPPED`.

## Diagram

```
User (EXAMINER) ──owns──▶ Course
User (STUDENT)  ──enrollments──▶ Course
                      ▲
                 Enrollment
```

Same student can be on many courses. Same course has many students. Two examiners at the same school share students only if you create one student user and both enroll them — student is scoped to **school**, not to one lecturer.

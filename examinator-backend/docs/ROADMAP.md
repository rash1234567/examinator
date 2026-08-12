# Roadmap

## Implemented

### Authentication

- [x] Examiner registration, email verification, resend, login
- [x] Login with **school + email** or **school + matric**
- [x] Forgot / reset password (optional `school` when email exists at multiple schools)
- [x] Student self-registration (`POST /api/auth/register-student`) with email verification

### Courses

- [x] Single + bulk create, list, get, patch, delete, bulk delete
- [x] `courseCode` unique per examiner

### Students & enrollment (MVP)

- [x] `Enrollment` model (`ACTIVE` / `DROPPED`)
- [x] School-scoped email and matric uniqueness
- [x] Create one student (`POST /api/students`) + optional `courseIds`
- [x] Bulk students JSON (`POST /api/students/bulk`, max 1000)
- [x] List students for examiner (`GET /api/students`)
- [x] Enroll one / bulk per course (`POST /api/course/:courseId/students`)
- [x] Course roster (`GET /api/course/:courseId/students`)
- [x] Unenroll (`DELETE /api/course/:courseId/students/:studentId`)
- [x] Student my courses (`GET /api/students/me/courses`)
- [x] Idempotent enroll + find-or-create on bulk

## Planned

### Phase 2 — Invite links

- [ ] Permanent lecturer invite URL
- [ ] Student picks courses; matric deduplication

### Phase 3 — Course reps

- [ ] `CourseStaff` permissions for bulk enroll on assigned courses

### Phase 4 — Student self-service

- [ ] Student add/drop courses (optional examiner approval)

### Later

- [ ] Semester entity
- [ ] Async import jobs (10k+ rows)
- [ ] Refresh token endpoint
- [ ] Google OAuth
- [ ] Course materials, assignments, exams, AI

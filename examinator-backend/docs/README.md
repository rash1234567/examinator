# Examinator Backend — Documentation

API and setup docs for the Examinator LMS backend (MVP).

## Documents

| Document | Description |
|----------|-------------|
| [SETUP.md](./SETUP.md) | Local development, database, email (Mailpit), environment variables |
| [API.md](./API.md) | Full REST API reference (auth + courses) |
| [STUDENTS-AND-ENROLLMENT.md](./STUDENTS-AND-ENROLLMENT.md) | Students, bulk JSON, enrollment |
| [DATA-MODEL.md](./DATA-MODEL.md) | Database models and relationships |
| [ROADMAP.md](./ROADMAP.md) | Implemented vs planned features |

## Base URL

Default local server:

```
http://localhost:8989
```

All API routes are prefixed with `/api`.

## Quick start (testing)

1. Start PostgreSQL and run migrations — see [SETUP.md](./SETUP.md).
2. Start Mailpit for email — see [SETUP.md](./SETUP.md).
3. `npm run dev` in `examinator-backend`.
4. Register an examiner → verify email → login → use `accessToken` on course routes — see [API.md](./API.md).

## Maintaining these docs

When you add or change a feature:

1. Update **[API.md](./API.md)** — new/changed endpoints, request bodies, status codes, examples.
2. Update **[DATA-MODEL.md](./DATA-MODEL.md)** if Prisma schema changes.
3. Update **[ROADMAP.md](./ROADMAP.md)** — move items from “Planned” to “Implemented”.
4. Add setup notes to **[SETUP.md](./SETUP.md)** only if env, services, or tooling change.

## Implemented (as of this doc)

- **Authentication** — examiner + student registration, school-scoped login, forgot/reset password
- **Courses** — CRUD, bulk create/delete, filters, `courseCode` per lecturer
- **Students & enrollment** — create/bulk JSON, enroll per course, roster, student “my courses”

## Next up

- **Invite links** and **course reps** — see [ROADMAP.md](./ROADMAP.md)

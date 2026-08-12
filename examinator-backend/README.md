# Examinator Backend

Node.js + Express + Prisma + PostgreSQL API for the Examinator LMS (MVP).

## Documentation

All feature documentation lives in **[`docs/`](./docs/README.md)**:

- [Setup](./docs/SETUP.md) — database, env, Mailpit, running locally
- [API reference](./docs/API.md) — auth and course endpoints
- [Data model](./docs/DATA-MODEL.md) — `User` and `Course` schema
- [Roadmap](./docs/ROADMAP.md) — implemented vs planned (next: student registration)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (`ts-node-dev`) |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npx prisma migrate deploy` | Apply migrations |

## Default URL

```
http://localhost:8989
```

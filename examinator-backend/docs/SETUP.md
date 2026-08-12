# Local setup

## Requirements

- Node.js (LTS recommended)
- PostgreSQL
- [Mailpit](https://github.com/axllent/mailpit) (or another SMTP server on port `1025`) for development email

## Install and run

```bash
cd examinator-backend
npm install
```

`postinstall` runs `prisma generate` automatically.

## Database

1. Configure `DATABASE_URL` in `.env` (see environment variables below).
2. Apply migrations:

```bash
npx prisma migrate deploy
```

3. Regenerate client after schema changes:

```bash
npm run db:generate
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `PORT` | No | HTTP port (default `8989`) |
| `FRONTEND_URL` | No | Base URL for password-reset links (default `http://localhost:3000`) |

Example `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/examinator"
JWT_SECRET="your-long-random-secret"
PORT=8989
FRONTEND_URL=http://localhost:3000
```

## Email (development)

The app sends mail via **SMTP** to `localhost:1025` (Mailpit).

Start Mailpit (avoid port clash with other Docker Mailpit on `8025`):

```bash
mailpit --smtp 127.0.0.1:1025 --listen 127.0.0.1:8026
```

- **SMTP:** `127.0.0.1:1025`
- **Web UI:** http://127.0.0.1:8026

If you see `ECONNREFUSED 127.0.0.1:1025`, Mailpit is not running.

## Run the API

```bash
npm run dev
```

Server logs: `Server running on port 8989` (or your `PORT`).

## Prisma Studio (optional)

```bash
npx prisma studio
```

Browse `User` and `Course` tables in the browser.

# Smart Bus Pass — Backend (starter)

This folder contains a starter Express + TypeScript backend with Prisma schema and placeholder routes.

Quick start (dev)

1. Copy env file:

```powershell
cd D:\Project\Harish\backend
copy .env.example .env
# edit .env and set DATABASE_URL when Postgres is running
```

2. Install dependencies and run in dev:

```powershell
npm install
npm run dev
```

What is included
- Basic Express app (`src/app.ts`, `src/index.ts`)
- Placeholder routes: `auth`, `college/registration`, `admin`, `rfid`
- Prisma schema at `prisma/schema.prisma` (run `npx prisma migrate dev` after setting DATABASE_URL)
- `infra/docker-compose.yml` with Postgres + backend service (build)

Next steps I can do for you
- Wire Prisma client into the routes and run initial migration.
- Add auth, JWT refresh, password hashing, and role-based middleware.
- Add tests for the endpoints.

Ask me which task you want next and I'll implement it.

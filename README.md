# BMTC Smart Bus Pass

A modern web application for managing student bus passes, including registration approval and RFID card integration.

## Features

- **College Portal**: Register students individually or upload CSV batches
- **Admin Panel**: Review, approve, or reject registrations
- **RFID Integration**: Generate RFID payloads and simulate/read card UIDs
- **Role-Based Access**: Separate login flows for colleges, passengers, and admins
- **Modern UI**: Light theme with smooth animations and responsive design

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (local dev), Postgres ready for production
- **ORM**: Prisma
- **Auth**: JWT tokens + bcryptjs password hashing
- **Hardware**: EM-18 RFID reader simulation/serial integration

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Running Locally

1. **Start backend** (Terminal 1):

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:4000`.

2. **Start frontend** (Terminal 2):

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` (or next available port).

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smartbus.local | password |
| College | college@smartbus.local | password |
| Passenger | passenger@smartbus.local | password |

## Key Workflows

### College Registration

1. Go to **College Login**
2. Log in with `college@smartbus.local` / `password`
3. Upload CSV (columns: `studentName`, `studentId`, `course` optional) or add manually
4. Registrations show as "pending"

### Admin Approval

1. Go to **BMTC Admin Login**
2. Log in with `admin@smartbus.local` / `password`
3. Review pending registrations and click **Approve**
4. Bus pass is created and RFID payload is available

### RFID Reader (Simulation)

```bash
cd tools
node reader.js --simulate
```

Generates random UIDs and posts to `/api/rfid/scan` every 3 seconds.

## API Endpoints

- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and get JWT token
- `POST /api/college/students` — Create a registration
- `POST /api/college/students/bulk` — Bulk upload CSV
- `GET /api/admin/registrations` — List pending registrations
- `POST /api/admin/registrations/:id/approve` — Approve registration
- `POST /api/rfid/scan` — Log a scanned UID

## Environment

Backend `.env`:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-change-in-production"
```

## Development Tips

- Hot-reload enabled for both frontend and backend
- Database: SQLite at `backend/dev.db`
- Reset DB: `cd backend && npx prisma migrate reset`
- View DB: `cd backend && npx prisma studio`

## Next Steps

- Implement deny/reject flow for admin
- Add email notifications on approval
- Implement passenger dashboard (view bus pass)
- Add integration tests
- Deploy to production (Vercel for frontend, Heroku/AWS for backend)

---

**Built for educational/demo purposes. Happy coding! 🚌✨**

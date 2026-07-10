# Ethara — Seat Allocation & Project Mapping System

A full-stack application for managing seat allocation and project mapping for
~5,000 employees. Built for HR, Admin, and Project teams to manage and search
employee seating, project assignments, seat availability, utilization
metrics, and new-joiner allocations — with a natural-language AI assistant
on top.

## Live Links

| | URL |
|---|---|
| **Live Frontend** | https://ethara-seat-allocation-flame.vercel.app |
| **Live Backend (API)** | https://seat-allocation-2.onrender.com |
| **API Docs (Swagger)** | https://seat-allocation-2.onrender.com/docs |
| **Backend Repository** | https://github.com/gunnuchauhan30/seat-allocation |
| **Full Project Repository (backend + frontend)** | https://github.com/gunnuchauhan30/Ethara-Seat-Allocation |

> ⚠️ The backend is hosted on Render's free tier, which spins down after
> inactivity. The first request after idle time can take 30–50 seconds to
> respond — this is expected, not a bug.

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@ethara.ai | admin123 |
| HR | hr@ethara.ai | hr123 |
| Employee | employee@ethara.ai | emp123 |

Employees have view-only access. HR and Admin can add employees,
allocate/release seats, allocate new joiners, and assign projects.

## Tech Stack

**Backend**
- FastAPI (Python)
- PostgreSQL (SQLAlchemy ORM + Alembic migrations)
- JWT-based authentication with role-based access (`employee`, `hr`, `admin`)
- Faker (seed data generation)
- Anthropic Claude API — natural language → SQL for the AI Assistant

**Frontend**
- React + Vite + TypeScript
- Tailwind CSS
- Three.js (`@react-three/fiber`, `@react-three/drei`) — 3D dashboard visual
- Zustand (auth/state management)

**Deployment**
- Backend: Render (Docker)
- Frontend: Vercel
- Database: Railway (PostgreSQL)

## Project Structure

```
Ethara-Seat-Allocation/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point, CORS, router registration
│   │   ├── core/
│   │   │   ├── database.py      # DB connection/session setup
│   │   │   └── auth.py          # JWT auth + role-based dependencies
│   │   ├── models/models.py     # SQLAlchemy models
│   │   ├── schemas/schemas.py   # Pydantic request/response schemas
│   │   └── routers/
│   │       ├── auth.py          # Login
│   │       ├── employees.py     # Employee CRUD + search
│   │       ├── seats.py         # Seat CRUD + allocate/release
│   │       ├── projects.py      # Project CRUD
│   │       ├── assignments.py   # Employee <-> Project mapping
│   │       ├── analytics.py     # Dashboard/utilization metrics
│   │       └── ai_assistant.py  # Natural language query endpoint
│   ├── alembic/                 # DB migrations
│   ├── seed.py                  # Generates ~5000 employees, seats, projects, demo users
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/                # Dashboard, Employees, Projects, Seats, AI Assistant, etc.
    │   ├── components/           # Sidebar, GlassCard, DashboardHero3D, SeatOccupancyGrid, etc.
    │   ├── api/                  # API client wrappers
    │   └── store/authStore.ts    # Auth state (Zustand)
    ├── package.json
    └── .env.example
```

## Database Schema (summary)

- **employees** — employee master data (name, email, code, department, designation, status)
- **seats** — physical seat inventory (floor, zone, status: vacant/occupied)
- **projects** — project master data
- **assignments** — employee ↔ project mapping (`end_date IS NULL` = active assignment)
- **seat_allocations** — seat allocation history (`released_date IS NULL` = currently occupied)
- **users** — login accounts (email, hashed password, role)

Relationships: an employee can have one active seat allocation at a time and
multiple active project assignments; a seat can have at most one active
allocation; a project can have many assigned employees.

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set DATABASE_URL, JWT_SECRET_KEY, ANTHROPIC_API_KEY

alembic upgrade head
python seed.py                  # creates ~5000 employees, seats, projects + 3 demo users

uvicorn app.main:app --reload
```
API runs at `http://localhost:8000` — Swagger docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# edit .env: set VITE_API_URL=http://localhost:8000

npm run dev
```
Runs at `http://localhost:5173`.

## API Overview

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `GET /auth/me` |
| Employees | `POST/GET /employees/`, `GET/PUT/DELETE /employees/{id}`, `GET /employees/{id}/seat`, `GET /employees/{id}/projects` |
| Seats | `POST/GET /seats/`, `GET /seats/available`, `POST /seats/{id}/allocate`, `POST /seats/{id}/release`, `POST /seats/new-joiner-allocate` |
| Projects | `POST/GET /projects/`, `GET/PUT/DELETE /projects/{id}`, `GET /projects/{id}/assignments` |
| Assignments | `POST/GET /assignments/`, `POST /assignments/{id}/end` |
| Analytics | `GET /analytics/summary`, `GET /analytics/by-floor`, `GET /analytics/by-department` |
| AI Assistant | `POST /ai/query` — send `{"question": "..."}`, receive a plain-English, natural-language-derived answer |

Full interactive documentation: https://seat-allocation-2.onrender.com/docs

### AI Assistant

`/ai/query` sends the DB schema plus the user's question to Claude, which
generates a read-only SQL `SELECT` query. The backend validates that the
query only contains `SELECT` (blocking `INSERT/UPDATE/DELETE/DROP/ALTER` as a
safety gate) before executing it against PostgreSQL, then asks Claude to
summarize the result in plain English rather than returning raw JSON.

## Deployment Notes

- **Backend → Render:** deployed via Docker (`backend/Dockerfile`), root
  directory set to `backend`. Environment variables (`DATABASE_URL`,
  `JWT_SECRET_KEY`, `ANTHROPIC_API_KEY`) set in the Render dashboard.
- **Database → Railway:** managed PostgreSQL instance. The backend connects
  using Railway's connection string set as `DATABASE_URL` on Render.
- **Frontend → Vercel:** root directory set to `frontend`, framework preset
  Vite. `VITE_API_URL` environment variable points to the live Render
  backend URL (must be set **before** building, since Vite bakes env vars in
  at build time — changing it requires a redeploy).

See `AI_PROMPTS.md` for the AI tools/prompts used during development, and
`DEBUGGING_NOTES.md` for issues encountered during development and
deployment along with how they were resolved.

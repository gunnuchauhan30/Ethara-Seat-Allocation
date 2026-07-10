# Ethara Seat Allocation & Project Mapping System — Backend

FastAPI + PostgreSQL backend for managing seat allocation and project mapping
for ~5,000 employees.

## Tech Stack
- **Framework:** FastAPI
- **Database:** PostgreSQL (SQLAlchemy ORM + Alembic migrations)
- **Seed data:** Faker
- **AI Assistant:** Claude API (Anthropic) — natural language → SQL

## Project Structure
```
ethara-backend/
├── app/
│   ├── main.py              # FastAPI app entry point, CORS, router registration

│   ├── core/
│   │   └── database.py      # DB connection/session setup
│   ├── models/
│   │   └── models.py        # SQLAlchemy models (Employee, Seat, Project, etc.)
│   ├── schemas/
│   │   └── schemas.py       # Pydantic request/response schemas
│   └── routers/
│       ├── employees.py     # Employee CRUD + search
│       ├── seats.py         # Seat CRUD + allocate/release logic
│       ├── projects.py      # Project CRUD
│       ├── assignments.py   # Employee <-> Project mapping
│       ├── analytics.py     # Dashboard/utilization metrics
│       └── ai_assistant.py  # Natural language query endpoint
├── alembic/                 # DB migrations
├── seed.py                  # Generates ~5000 employees, seats, projects
├── requirements.txt
├── Procfile                 # For Railway/Render deployment
├── railway.json
└── .env.example
```

## Local Setup

1. **Clone and install dependencies:**
   ```bash
   cd ethara-backend
   python -m venv venv
   source venv/bin/activate    # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Set up PostgreSQL** (locally or use a free instance on Railway/Neon/Supabase).
   Create a database, e.g. `ethara_seating`.

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # edit .env and set DATABASE_URL (and ANTHROPIC_API_KEY for the AI feature)
   ```

4. **Run migrations:**
   ```bash
   alembic revision --autogenerate -m "initial schema"
   alembic upgrade head
   ```

5. **Seed the database** (creates ~5000 employees, ~5200 seats, ~60 projects):
   ```bash
   python seed.py
   ```

6. **Run the server:**
   ```bash
   uvicorn app.main:app --reload
   ```
   API will be live at `http://localhost:8000`
   Interactive docs (Swagger UI): `http://localhost:8000/docs`

## Deploying to Railway

1. Push this repo to GitHub.
2. On [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. Add a **PostgreSQL** plugin to the project — Railway auto-generates `DATABASE_URL`.
4. In your service's **Variables** tab, add:
   - `DATABASE_URL` (auto-filled by the Postgres plugin, or copy it in)
   - `ANTHROPIC_API_KEY` (for the AI assistant endpoint)
5. Railway will detect `Procfile`/`railway.json` and deploy automatically.
6. Once deployed, run migrations + seed via Railway's shell (or a one-off deploy command):
   ```bash
   alembic upgrade head
   python seed.py
   ```
7. Your live backend URL will look like `https://<your-app>.up.railway.app`.

## Authentication & Roles
The API now has role-based login (`employee`, `hr`, `admin`) via JWT.

- `POST /auth/login` — body `{"email": "...", "password": "..."}`, returns `access_token` + user info
- `GET /auth/me` — returns the logged-in user (send `Authorization: Bearer <token>`)
- Mutating actions (creating employees, allocating/releasing seats, new-joiner allocation) require the `hr` or `admin` role. Read-only endpoints (listing, search, analytics, AI assistant) are open to any logged-in role.

**Demo accounts** (created by `seed.py`):
| Role | Email | Password |
|---|---|---|
| Admin | admin@ethara.ai | admin123 |
| HR | hr@ethara.ai | hr123 |
| Employee | employee@ethara.ai | emp123 |

Set a real `JWT_SECRET_KEY` env var in production (defaults to a dev value otherwise).

## API Overview

| Resource | Endpoints |
|---|---|
| Employees | `POST/GET /employees/`, `GET/PUT/DELETE /employees/{id}`, `GET /employees/{id}/seat`, `GET /employees/{id}/projects` |
| Seats | `POST/GET /seats/`, `GET /seats/available`, `POST /seats/{id}/allocate`, `POST /seats/{id}/release`, `POST /seats/new-joiner-allocate` |
| Projects | `POST/GET /projects/`, `GET/PUT/DELETE /projects/{id}`, `GET /projects/{id}/employees` |
| Assignments | `POST/GET /assignments/`, `POST /assignments/{id}/end` |
| Analytics | `GET /analytics/summary`, `GET /analytics/by-floor`, `GET /analytics/by-department`, `GET /analytics/by-project` |
| AI Assistant | `POST /ai/query` — send `{"question": "..."}`, get back a natural-language-derived answer |

Full interactive documentation is auto-generated at `/docs` (Swagger) and `/redoc`.

## Notes on the AI Assistant Endpoint
`/ai/query` sends the DB schema + the user's question to Claude, which generates
a read-only SQL `SELECT` query. The backend validates the query only contains
`SELECT` (blocks `INSERT/UPDATE/DELETE/DROP/ALTER` etc. as a safety gate) before
executing it against Postgres. Requires `ANTHROPIC_API_KEY` to be set.

## Database Schema (summary)
- **employees** — employee master data
- **seats** — physical seat inventory (floor, zone, status)
- **projects** — project master data
- **assignments** — employee ↔ project mapping (many-to-many via join table, `end_date IS NULL` = active)
- **seat_allocations** — seat allocation history (`released_date IS NULL` = currently occupied)

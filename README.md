# Ethara Seat Allocation & Project Mapping System

Full-stack project — FastAPI backend + React frontend, with role-based
login, a 3D dashboard visual, natural-language AI answers, and project
assignment from the UI.

## What's new in this version (v3)
- **AI Assistant now answers in plain English** instead of dumping raw JSON —
  it runs the SQL, then asks Claude to summarize the result in a sentence.
- **Employee ID is now visible and copyable** on the Employees page (small
  `#123` button next to each row — click to copy). You need this ID to
  allocate a seat or use New Joiner allocation.
- **"Assign" button per employee** on the Employees page — opens a modal to
  pick a project and role, no more guessing where to do this.
- **Visual polish** — gradient page titles, hover-lift on cards.
- **3D scene has a safety net** — if WebGL/Three.js fails to load in a
  browser, it now shows a graceful gradient fallback instead of a blank box.

```
ethara-fullstack/
├── backend/    ← FastAPI + PostgreSQL + JWT auth
└── frontend/   ← React + Vite + TypeScript + Three.js UI
```

## What's new in this version
- **Login & roles** — Admin / HR / Employee. Employees get view-only access;
  HR and Admin can add employees, allocate/release seats, and allocate new
  joiners.
- **3D dashboard visual** — a small animated Three.js scene at the top of the
  Dashboard page.

## First-time setup (important — do this once)

### 1. Backend: install new dependencies + run the new migration
```bash
cd backend
venv\Scripts\Activate.ps1          # or: source venv/bin/activate on Mac/Linux
pip install -r requirements.txt    # installs passlib, python-jose, etc.
alembic upgrade head               # creates the new "users" table
python seed.py                     # re-seeds data AND creates 3 demo login users
```
> `seed.py` clears and re-seeds everything, including 3 demo accounts:
> `admin@ethara.ai` / `admin123`, `hr@ethara.ai` / `hr123`, `employee@ethara.ai` / `emp123`.

### 2. Start the backend
```bash
uvicorn app.main:app --reload
```
Runs at `http://localhost:8000` — Swagger docs at `http://localhost:8000/docs`.

### 3. Frontend: install new dependencies
```bash
cd frontend
npm install     # installs three, @react-three/fiber, @react-three/drei, zustand
npm run dev
```
Runs at `http://localhost:5173`.

### 4. Log in
Open `http://localhost:5173` — you'll land on a login screen. Use one of the
demo accounts above (there are quick-login buttons for each role), or type
credentials manually.

## Deploying
- **Backend** → Railway. After deploying, run `alembic upgrade head` and
  `python seed.py` against the production database once (same as local setup),
  and set a real `JWT_SECRET_KEY` environment variable.
- **Frontend** → Vercel, with `VITE_API_URL` set to your live Railway backend URL.

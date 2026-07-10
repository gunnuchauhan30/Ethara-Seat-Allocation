# Ethara Seat Allocation & Project Mapping System — Frontend

React + TypeScript + Tailwind CSS frontend for the Ethara backend.

## Tech Stack
- **Build tool:** Vite
- **Framework:** React 19 + TypeScript
- **Styling:** Tailwind CSS v4 (dark, purple/black glassmorphism theme)
- **Animations:** Framer Motion
- **Data fetching:** TanStack Query (React Query) + Axios
- **Routing:** React Router
- **Icons:** Lucide React

## Authentication & Roles
The app now requires login. Demo accounts (seeded by the backend's `seed.py`):

| Role | Email | Password | Can do |
|---|---|---|---|
| Admin | admin@ethara.ai | admin123 | Everything |
| HR | hr@ethara.ai | hr123 | Everything |
| Employee | employee@ethara.ai | emp123 | View-only — seat allocate/release, add employee, and new-joiner allocation are hidden/blocked |

Auth state (JWT + user info) is stored via Zustand with `localStorage` persistence, and the
token is attached to every API request automatically (`src/api/client.ts`).

## 3D Dashboard Visual
The Dashboard's hero card (`src/components/DashboardHero3D.tsx`) renders a small,
low-poly Three.js scene (via `@react-three/fiber` + `@react-three/drei`) — a few
floating, glowing shapes that slowly rotate. It's intentionally minimal (5 meshes,
no physics/post-processing) so it stays smooth and doesn't affect the rest of the
app's performance.

## Pages
- **Dashboard** (`/`) — KPI cards, seat occupancy grid by floor, headcount by department
- **Employees** (`/employees`) — searchable, filterable directory of all employees
- **Seats** (`/seats`) — filter by floor/zone/status, allocate/release seats inline
- **Projects** (`/projects`) — browse all projects
- **New Joiner** (`/new-joiner`) — auto-allocate a seat to a new employee by floor/zone preference
- **AI Assistant** (`/assistant`) — natural language queries against the backend's `/ai/query` endpoint

## Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure the backend URL:**
   ```bash
   cp .env.example .env
   # edit .env and set VITE_API_URL to your backend URL
   ```
   For local development, this should point at your locally running FastAPI backend:
   ```
   VITE_API_URL=http://localhost:8000
   ```

3. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open the printed local URL (usually `http://localhost:5173`).

4. **Build for production:**
   ```bash
   npm run build
   ```
   Output goes to `dist/`.

## Deploying to Vercel

1. Push this repo to GitHub (can be the same repo as the backend, in a `frontend/` folder, or a separate repo).
2. On [vercel.com](https://vercel.com) → **New Project** → import the repo.
3. Framework preset: **Vite**.
4. Add an environment variable:
   - `VITE_API_URL` = your deployed backend URL (e.g. `https://your-backend.up.railway.app`)
5. Deploy. Vercel will give you a live URL like `https://your-app.vercel.app`.

## Important: CORS
Make sure your backend's CORS settings allow requests from your deployed frontend URL
(the backend in this project currently allows `*` for simplicity — for production it's
better to restrict `allow_origins` to your actual Vercel domain in `app/main.py`).

## Design Notes
- Dark theme with a purple/black palette, glassmorphism cards, and a violet-to-blue gradient accent.
- The dashboard's floor occupancy visual (`SeatOccupancyGrid`) renders each floor as a strip of
  small glowing squares — filled = occupied — instead of a generic bar chart, so it reads closer
  to an actual floor plan.
- Heavier effects (3D/Three.js, GSAP) were intentionally left out to keep the app stable and fast
  to ship within the assessment deadline; Framer Motion covers page transitions, hover states, and
  reveal animations.

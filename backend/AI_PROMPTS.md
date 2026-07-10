# AI Usage Documentation

This file documents how AI tools were used while building the Ethara Seat
Allocation & Project Mapping System, as required by the assessment.

> ⚠️ **Important:** Fill this in honestly with your own workflow. Below is a
> starting template based on how the backend in this repo was generated —
> edit it to reflect exactly what you did, including anything you changed
> after generation.

## Tool Used
- **Claude (Anthropic)** — used for scaffolding the backend (FastAPI models,
  routers, seed script) and for planning the project timeline.

## Prompts Used

### 1. Initial planning
**Prompt:** "Explain the assessment requirements and suggest a tech stack /
timeline to complete a full-stack seat allocation system for 5000 employees
in 2 days."
**Output:** A day-by-day roadmap covering backend, frontend, AI assistant,
deployment, and documentation tasks.
**Validation:** Reviewed the plan for feasibility given the 48-hour deadline;
adjusted priorities (deferred full auth, kept core CRUD + seat logic as
must-haves).

### 2. Backend generation
**Prompt:** "Generate a full ready-to-run FastAPI backend for the Ethara
Seat Allocation & Project Mapping System: SQLAlchemy models (Employee, Seat,
Project, Assignment, SeatAllocation), Pydantic schemas, CRUD routers, seat
allocate/release logic, new-joiner allocation, search/filter endpoints,
analytics/dashboard endpoints, an AI natural-language query endpoint, a Faker
based seed script for ~5000 employees, and Railway deployment config."
**Output:** Complete `app/` package (models, schemas, routers, core),
`seed.py`, `requirements.txt`, `Procfile`, `railway.json`, `.env.example`,
`README.md`.
**Manual fixes applied:**
- [ ] _List anything you personally changed, e.g. adjusted seat/floor counts,
  renamed fields, changed CORS origin from `*` to the actual frontend URL,
  fixed environment-specific bugs after deploying to Railway._
**Validation method:**
- Ran the app locally with `uvicorn app.main:app --reload` and exercised
  every endpoint via the Swagger UI (`/docs`).
- Ran `seed.py` against a local Postgres instance and confirmed employee /
  seat / project counts and seat status (`occupied` vs `vacant`) were
  correct via direct DB queries.
- Manually tested the seat allocate → release cycle and confirmed the
  "employee already has an active seat" and "seat not vacant" error cases
  return the correct HTTP 400 responses.
- Tested `/ai/query` with sample questions (e.g. "How many seats are vacant
  on floor 3?") and confirmed the generated SQL was a safe, read-only
  `SELECT` before it executed.

### 3. Frontend generation
_(Fill in once frontend is generated — same format: prompt, output, manual
fixes, validation.)_

## Manual Fixes / Deviations From AI Output
_List anything you changed by hand after generation — e.g., renamed a route,
adjusted a Pydantic field, fixed a deployment-specific bug, added a missing
index, etc. Be specific; this is what the reviewers are most interested in._

## Validation Summary
- All CRUD endpoints tested via Swagger UI (`/docs`) and/or Postman.
- Seed script verified to produce ~5000 employees, ~5200 seats, ~60 projects
  with correct seat-status distribution.
- End-to-end flow tested: create employee → allocate seat → assign to
  project → view in dashboard analytics.
- Deployment verified by hitting the live Railway/Render URL and confirming
  `/health` and `/docs` respond correctly.

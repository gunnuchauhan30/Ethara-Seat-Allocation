# AI_PROMPTS.md

This document records how AI tools (Claude) were used during the
development, debugging, and deployment of the Ethara Seat Allocation &
Project Mapping System, as required by the assessment guidelines.

## AI Tool Used
Claude (Anthropic) — used throughout for code generation, code review,
debugging, and deployment troubleshooting.

---

## 1. Initial Code Review / Audit

**Prompt:** Asked Claude to review and audit the existing full-stack
codebase (FastAPI backend + React frontend) for security, correctness, and
code quality issues.

**Output:** Claude identified several issues, most notably:
- A real database connection string and API key committed in
  `backend/.env.example` (not gitignored).
- Most endpoints (update/delete employee, create/update/delete project,
  all of assignments/analytics, `/ai/query`) had no authentication —
  `require_roles(...)` was only applied to 4 endpoints.
- `/ai/query` was unauthenticated and relied only on a keyword blocklist to
  prevent destructive SQL.
- A dead-code bug in `ai_assistant.py`: it referenced `ANTHROPIC_URL` and
  `ANTHROPIC_API_KEY` variables that were never defined, causing the
  summarization step to always throw and silently fall back to raw JSON.

**Manual validation:** Confirmed by reading the flagged files directly
(`employees.py`, `ai_assistant.py`, `.env.example`) before acting on any
suggested fix.

---

## 2. Feature Fixes (AI Assistant, Dashboard, Navigation)

**Prompt (paraphrased):** "AI assistant gives code/JSON output instead of
plain English. Employee count shows ~30 instead of 5,000. Seat occupancy
shows 0%. Clicking a project/employee/seat should open a detail page with
full information (assigned employees, personal details, floor/seat)."

**Output / fixes applied:**
- Fixed the undefined `ANTHROPIC_URL`/`ANTHROPIC_API_KEY` bug so the
  summarization call actually runs, and changed the frontend to render the
  AI answer as plain text instead of inside a `<pre>`/monospace block.
- Added backend pagination (`{total, items}`) to the employees list
  endpoint and built real Prev/Next pagination in the UI, replacing the
  hardcoded low limit.
- Made `seed.py` commit assignments/seat allocations in batches of 500
  instead of one commit at the very end, so an interrupted seed run doesn't
  silently leave seat occupancy at 0%.
- Added Employee Detail and Project Detail pages, and made
  employees/projects/occupied seats clickable to navigate to them.

**Manual validation:**
- `npm run build` and a backend import check (`python -c "import app.main"`)
  run locally before delivery to confirm no build/import errors.
- Re-seeded the database and manually verified occupancy and employee count
  in the UI.

---

## 3. Deployment — Backend (Render)

**Context:** Backend deployed to Render from GitHub via Docker.

**Issues encountered and how they were diagnosed/fixed (with AI assistance
reading the build logs at each step):**

1. **`requirements.txt` had unresolved Git merge-conflict markers**
   (`<<<<<<< HEAD` / `=======` / `>>>>>>>`), causing `pip install` to fail
   with `Invalid requirement: '<<<<<<< HEAD'`.
   → Fix: manually removed the conflict markers on GitHub, keeping the
   correct package line.

2. **Same merge-conflict pattern repeated across multiple files**
   (`employees.py`, `seats.py`, `models.py`) — each left two overlapping
   function definitions (an auth-protected version and a non-auth version)
   from an unresolved merge, causing `SyntaxError` / `IndentationError` at
   import time.
   → Fix: for each affected router, kept the version of the function that
   included the `require_roles(...)` auth dependency, and removed the
   duplicate/broken definition. Verified by pasting the full file back for
   review before committing.

3. **`ImportError: Could not import module "main"`**
   → Root cause: Dockerfile's `CMD` referenced `main:app`, but the FastAPI
   app lives at `app/main.py`. Fixed by using `app.main:app` in the start
   command.

4. **`sqlalchemy.exc.OperationalError: connection to server at "localhost"...
   Connection refused`**
   → Root cause: the `DATABASE_URL` environment variable was either not set
   on Render, or the variable key was misspelled (`database` instead of
   `DATABASE_URL`), so the app fell back to its local default.
   → Fix: corrected the environment variable key on Render to exactly
   `DATABASE_URL` and set the value to the Railway PostgreSQL connection
   string, then redeployed.

**Validation:** Confirmed via Render deploy logs showing `Application
startup complete` and `Your service is live`, then hit
`https://seat-allocation-2.onrender.com/docs` to confirm the API responds.

---

## 4. Deployment — Frontend (Vercel) & Frontend↔Backend Connection

**Issue:** Frontend deployed successfully on Vercel, but login failed with
`net::ERR_CONNECTION_REFUSED` on `http://localhost:8000/auth/login` — the
deployed frontend was still calling `localhost` instead of the live
backend.

**Diagnosis:** Used browser DevTools (Console tab) to inspect the actual
failing request URL, which confirmed the frontend build had baked in the
local API URL.

**Root cause:** The `VITE_API_URL` environment variable had never been set
in Vercel. Since Vite inlines environment variables at **build time** (not
runtime), the variable has to exist before the build runs.

**Fix:**
1. Added `VITE_API_URL=https://seat-allocation-2.onrender.com` in Vercel's
   Environment Variables settings.
2. Triggered a fresh **Redeploy** (a variable added after a build does not
   retroactively apply to that build).

**Validation:** Re-opened DevTools Console after redeploying and confirmed
the login request now targets the Render backend URL and returns `200 OK`.

---

## 5. GitHub Push Protection (Secret Scanning)

**Issue:** When pushing the full local project to a new GitHub repository,
the push was rejected:
`GH013: Repository rule violations found ... Push cannot contain secrets`
— a real GCP API key was present in `backend/.env.example` (line 12).

**Fix:** Replaced the real key with a placeholder value
(`GEMINI_API_KEY=your_gemini_api_key_here`) in `.env.example`, then:
```bash
git add backend/.env.example
git commit --amend --no-edit
git push -u origin main
```
This rewrote the same commit instead of adding a new one on top of the
still-secret-containing commit, which is required — GitHub's push
protection scans every commit in the push, not just the latest state of a
file.

**Validation:** Push succeeded with no rule violations after the amend.

---

## 6. AI Assistant Failing in Production — Missing `GEMINI_API_KEY` on Render

**Issue:** After the full stack (backend on Render, frontend on Vercel, DB
on Railway) was live and connected, the AI Assistant page returned:
`Error: GEMINI_API_KEY not configured on the server. Set it as an
environment variable.` for every question, even though the rest of the app
(Dashboard, Employees, Seats, Projects) worked correctly.

**Diagnosis:** The error message itself pointed directly at a missing
environment variable on the backend host (Render), rather than a code bug —
confirmed by checking Render's Environment tab, where the key was absent.

**Fix:**
1. Added `GEMINI_API_KEY` under Render → the backend service → Environment,
   with the real key value.
2. Saved changes, which triggered an automatic redeploy.

**Validation:** Confirmed via the Render deploy log showing a clean build
and `Your service is live`, and by checking runtime logs for
`POST /ai/query HTTP/1.1" 200 OK`. Re-tested the AI Assistant in the browser
with sample questions ("Which department has the most employees?", "How
many seats are vacant on floor 3?") and received plain-English answers
instead of the error.

---

## Summary

AI assistance (Claude) was used for:
- Reading and explaining error logs (build failures, runtime tracebacks,
  browser console errors) across three different platforms (Render,
  Vercel, Railway).
- Diagnosing root causes (merge-conflict artifacts, misconfigured or
  missing environment variables, build-time vs. runtime env var behavior).
- Proposing and applying targeted, minimal code fixes rather than
  regenerating whole files, so existing intended behavior (e.g.
  role-based auth on sensitive endpoints) was preserved rather than
  silently dropped during conflict resolution.

All fixes were validated manually by:
- Re-running builds/imports locally where possible before deploying.
- Reading deployment platform logs after each redeploy to confirm the
  specific error was resolved before moving to the next issue.
- End-to-end manual testing in the browser (login, employee creation,
  project assignment, seat allocation, AI Assistant queries) against the
  live deployed URLs.

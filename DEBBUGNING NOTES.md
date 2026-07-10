# DEBUGGING_NOTES.md

Issues encountered while deploying the Ethara Seat Allocation system, and
how each was resolved.

## Deployment Architecture

| Component | Platform | Notes |
|---|---|---|
| Backend (FastAPI) | Render | Deployed via Docker, root directory `backend` |
| Frontend (React/Vite) | Vercel | Root directory `frontend`, framework preset Vite |
| Database (PostgreSQL) | Railway | Managed Postgres instance |

---

## Issue 1: `pip install` fails — `Invalid requirement: '<<<<<<< HEAD'`

**Where:** Render build, `pip install -r requirements.txt`

**Cause:** `backend/requirements.txt` contained unresolved Git merge
conflict markers from an earlier merge that was never cleaned up.

**Fix:** Opened the file on GitHub, removed the `<<<<<<<`, `=======`,
`>>>>>>>` marker lines and kept the correct package version line, committed
directly to `main`.

---

## Issue 2: `SyntaxError` / `IndentationError` at import time

**Where:** Render deploy logs, e.g.:
```
File "/app/app/routers/employees.py", line 10
    >>>>>>> 864eaf3a156d9d6762df6aa2c185bfe074a3ba79
SyntaxError: invalid decimal literal
```
and later:
```
IndentationError: expected an indented block after function definition
```

**Cause:** Same root cause as Issue 1, but in Python source files
(`employees.py`, `seats.py`, `models.py`). The unresolved merge had left
**two overlapping function definitions** for the same endpoint — one with
role-based auth (`Depends(require_roles(...))`), one without — with no body
after the first `def`.

**Fix:** For each affected file, kept the auth-protected version of each
function and removed the duplicate/broken definition, preserving the
original security intent (mutating endpoints require `hr`/`admin` role).
Repeated across `employees.py`, `seats.py`, and `models.py` as each was
surfaced by the next build's traceback.

**Lesson:** A single unresolved merge can leave broken artifacts scattered
across many files, not just one — each fix surfaces the next file in the
import chain, so build logs were re-checked after every fix rather than
assuming one fix would resolve the whole deploy.

---

## Issue 3: `Could not import module "main"`

**Where:** Render deploy, after a successful build.

**Cause:** Docker `CMD` in the Dockerfile pointed to `main:app`, but the
FastAPI app object is at `app/main.py` (i.e. `app.main:app`).

**Fix:** Corrected the module path so uvicorn could locate the `app`
object.

---

## Issue 4: `OperationalError: connection to server at "localhost" ... Connection refused`

**Where:** Render deploy, backend starts but fails on first DB query.

**Cause:** The `DATABASE_URL` environment variable was not set correctly on
Render — first it was missing entirely, then it was present but under the
wrong key name (`database` instead of `DATABASE_URL`), so the app silently
fell back to its local default connection string.

**Fix:** Set the environment variable with the exact key `DATABASE_URL` on
Render, value = the Railway PostgreSQL **connection string** (using
Railway's public/external URL, since Render and Railway are separate
platforms — Railway's internal URL only works for services within the same
Railway project).

---

## Issue 5: Frontend login fails — `net::ERR_CONNECTION_REFUSED` to `localhost:8000`

**Where:** Browser console, on the deployed Vercel frontend.

**Cause:** `VITE_API_URL` was never set in Vercel's project settings, so
the frontend build baked in no override and defaulted to `localhost:8000`.
Vite environment variables are resolved at **build time**, not runtime —
setting the variable after a build has already run has no effect on that
build.

**Fix:**
1. Added `VITE_API_URL=https://seat-allocation-2.onrender.com` in Vercel →
   Project Settings → Environment Variables (all environments).
2. Triggered a new deployment (Redeploy) so the variable was present during
   the build.

**Validation:** Inspected the Network/Console tab in browser DevTools
before and after — request target changed from `localhost:8000` to the
live Render URL, and login succeeded.

---

## Issue 6: GitHub blocks push — leaked secret detected

**Where:** `git push` to a newly created GitHub repository.

**Cause:** `backend/.env.example` contained a real (not placeholder) GCP
API key. GitHub's push protection scans every commit being pushed and
blocks the push if a recognizable secret pattern is found anywhere in the
commit history being pushed — not just the current file state.

**Fix:** Replaced the real key with a placeholder in `.env.example`, then
amended the existing commit (`git commit --amend --no-edit`) instead of
adding a new commit on top, so the secret was removed from the commit
itself rather than just from the working tree. Pushed again successfully.

**Note:** Since the key had been pushed (even though blocked), it was
treated as compromised and flagged for rotation as a precaution.

---

## Issue 7: Railway auto-build failing with "Railpack could not determine how to build the app"

**Where:** Railway build logs, when a service was connected to the
monorepo containing both `backend/` and `frontend/`.

**Cause:** Railway's default builder (Railpack) analyzed the **repository
root**, which only contains `backend/`, `frontend/`, and `README.md` — no
buildable app at the root — so it couldn't detect a language/framework.

**Fix:** Set the service's **Root Directory** to `backend` in Railway →
Settings → Source, so Railway builds only that subdirectory (which
contains the `Dockerfile`).

---

## Key Takeaways

- Unresolved merge conflicts can hide in multiple files simultaneously —
  fixing the first error surfaced doesn't guarantee the deploy will
  succeed; each new build log needs to be checked for the *next* error.
- Environment variables behave differently by platform/tool: Vite bakes
  them in at **build time**, so a Vercel redeploy is required after adding
  or changing one; a typo in the variable *key* (not just the value) is a
  common and hard-to-spot failure mode.
- When services are split across different platforms (Render for backend,
  Railway for database), only the database's **public/external**
  connection string works across platforms — internal/private URLs are
  scoped to same-platform, same-project services only.
- Secret scanning on `git push` operates on the full commit being pushed;
  removing a secret from a file requires amending (or rewriting) the
  commit that introduced it, not just committing a fix on top.

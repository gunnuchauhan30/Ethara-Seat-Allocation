import os
import re
import json
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.schemas import schemas

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
# gemini-2.5-flash has a generous free tier (no card needed) and is plenty
# capable for simple text-to-SQL generation.
GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

# Used for the second call, which turns the raw SQL result into a plain-
# English sentence. This was previously referenced without being defined
# anywhere, which meant that call always crashed and silently fell back to
# dumping raw JSON at the user.
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"

# Only SELECT queries are allowed to be run against the DB — this is a hard
# safety gate so the LLM can never modify/delete data via this endpoint.
FORBIDDEN_KEYWORDS = [
    "insert", "update", "delete", "drop", "alter", "truncate", "create", "grant"
]

SCHEMA_CONTEXT = """
Tables:
- employees(id, employee_code, name, email, department, designation, joining_date, status)
- seats(id, seat_number, floor, zone, status)  -- status: vacant/occupied/reserved
- projects(id, name, description, status)
- assignments(id, employee_id, project_id, role_in_project, start_date, end_date)  -- end_date NULL = active
- seat_allocations(id, employee_id, seat_id, allocated_date, released_date)  -- released_date NULL = current seat
"""


def _plain_english_fallback(rows: list) -> str:
    """Best-effort plain-English rendering of query rows, used when the
    summarization LLM call is unavailable or fails. Never returns raw JSON."""
    if not rows:
        return "No results found."

    # Single row, single column (e.g. a COUNT(*)) — the common case.
    if len(rows) == 1 and len(rows[0]) == 1:
        value = list(rows[0].values())[0]
        return f"The answer is {value}."

    # Small result set — render as short "key: value, key: value" lines.
    if len(rows) <= 10:
        lines = []
        for row in rows:
            lines.append(", ".join(f"{k}: {v}" for k, v in row.items()))
        return "\n".join(lines)

    return f"Found {len(rows)} matching results."


def _is_safe_select(sql: str) -> bool:
    lowered = sql.strip().lower()
    if not lowered.startswith("select"):
        return False
    return not any(re.search(rf"\b{kw}\b", lowered) for kw in FORBIDDEN_KEYWORDS)


@router.post("/query", response_model=schemas.AIQueryResponse)
def ai_query(payload: schemas.AIQueryRequest, db: Session = Depends(get_db)):
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY not configured on the server. Set it as an environment variable.",
        )

    prompt = f"""You are a SQL assistant for a seat allocation system (PostgreSQL).
{SCHEMA_CONTEXT}

Given the user's question, write ONE read-only SQL SELECT query (no comments, no explanation, just the raw SQL) that answers it.
Only use the tables/columns listed above. Do not use INSERT/UPDATE/DELETE/DROP.

Question: {payload.question}

Return ONLY the SQL query, nothing else."""

    try:
        response = httpx.post(
            GEMINI_URL,
            headers={
                "x-goog-api-key": GEMINI_API_KEY,
                "content-type": "application/json",
            },
            json={
                "contents": [
                    {"parts": [{"text": prompt}]}
                ]
            },
            timeout=30.0,
        )
        response.raise_for_status()
        data = response.json()

        # Gemini can decline to answer (safety block, no candidates, etc.) —
        # guard against that instead of letting a raw KeyError/IndexError
        # turn into an opaque 502.
        candidates = data.get("candidates") or []
        if not candidates:
            block_reason = data.get("promptFeedback", {}).get("blockReason", "unknown")
            raise HTTPException(
                status_code=502,
                detail=f"Gemini returned no result (reason: {block_reason}).",
            )

        parts = candidates[0].get("content", {}).get("parts", [])
        generated_sql = "".join(p.get("text", "") for p in parts).strip()
        generated_sql = generated_sql.strip("`").replace("sql\n", "").strip()
    except httpx.HTTPStatusError as e:
        # Surface the real Gemini error message instead of swallowing it —
        # makes future issues (bad model name, auth, quota, etc.) obvious immediately.
        raise HTTPException(
            status_code=502,
            detail=f"AI service error ({e.response.status_code}): {e.response.text}",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    if not _is_safe_select(generated_sql):
        raise HTTPException(
            status_code=400,
            detail=f"Generated query was rejected for safety reasons: {generated_sql}",
        )

    try:
        result = db.execute(text(generated_sql))
        rows = [dict(row._mapping) for row in result.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query execution failed: {str(e)}")

    raw_results = json.dumps(rows, default=str)

    # Second call: turn the raw query results into a short, plain-English answer
    # instead of dumping JSON at the user.
    summarize_prompt = f"""The user asked: "{payload.question}"

The database returned this raw result: {raw_results}

Write a short, direct, plain-English answer to the user's question based on this data.
One or two sentences. No JSON, no code, no SQL — just the answer a person would say out loud.
If the result is empty or zero, say so plainly."""

    if not ANTHROPIC_API_KEY:
        # No key configured — skip the network call entirely and use the
        # deterministic plain-English formatter instead of raw JSON.
        answer = _plain_english_fallback(rows)
    else:
        try:
            summary_response = httpx.post(
                ANTHROPIC_URL,
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-6",
                    "max_tokens": 300,
                    "messages": [{"role": "user", "content": summarize_prompt}],
                },
                timeout=30.0,
            )
            summary_response.raise_for_status()
            summary_data = summary_response.json()
            answer = summary_data["content"][0]["text"].strip()
        except Exception:
            # Fall back to a plain-English rendering (never raw JSON) if the
            # summarization call fails for any reason — better to show
            # something readable than nothing.
            answer = _plain_english_fallback(rows)

    return schemas.AIQueryResponse(
        question=payload.question,
        answer=answer,
        generated_sql=generated_sql,
    )
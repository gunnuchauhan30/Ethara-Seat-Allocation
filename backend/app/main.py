from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()

from app.core.database import Base, engine
from app.routers import employees, seats, projects, assignments, analytics, ai_assistant, auth

# Creates tables if they don't exist (in addition to Alembic migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ethara Seat Allocation & Project Mapping System",
    description="Backend API for managing seat allocation and project mapping for ~5000 employees.",
    version="1.0.0",
)

# CORS — allows the frontend (Vercel) to call this API.
# Replace "*" with your actual frontend URL in production for tighter security.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(seats.router)
app.include_router(projects.router)
app.include_router(assignments.router)
app.include_router(analytics.router)
app.include_router(ai_assistant.router)


@app.get("/")
def root():
    return {
        "message": "Ethara Seat Allocation & Project Mapping System API is running",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}

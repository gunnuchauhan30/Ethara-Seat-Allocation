from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=schemas.DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db)):
    total_employees = db.query(func.count(models.Employee.id)).scalar()
    total_seats = db.query(func.count(models.Seat.id)).scalar()
    occupied_seats = db.query(func.count(models.Seat.id)).filter(
        models.Seat.status == models.SeatStatus.occupied
    ).scalar()
    vacant_seats = total_seats - occupied_seats
    total_projects = db.query(func.count(models.Project.id)).scalar()

    utilization = (occupied_seats / total_seats * 100) if total_seats else 0

    return schemas.DashboardSummary(
        total_employees=total_employees,
        total_seats=total_seats,
        occupied_seats=occupied_seats,
        vacant_seats=vacant_seats,
        utilization_percent=round(utilization, 2),
        total_projects=total_projects,
    )


@router.get("/by-floor", response_model=List[schemas.FloorUtilization])
def utilization_by_floor(db: Session = Depends(get_db)):
    floors = db.query(models.Seat.floor).distinct().all()
    result = []
    for (floor,) in floors:
        total = db.query(func.count(models.Seat.id)).filter(models.Seat.floor == floor).scalar()
        occupied = db.query(func.count(models.Seat.id)).filter(
            models.Seat.floor == floor, models.Seat.status == models.SeatStatus.occupied
        ).scalar()
        vacant = total - occupied
        pct = (occupied / total * 100) if total else 0
        result.append(
            schemas.FloorUtilization(
                floor=floor,
                total_seats=total,
                occupied=occupied,
                vacant=vacant,
                utilization_percent=round(pct, 2),
            )
        )
    return sorted(result, key=lambda x: x.floor)


@router.get("/by-department", response_model=List[schemas.DepartmentUtilization])
def employees_by_department(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Employee.department, func.count(models.Employee.id))
        .group_by(models.Employee.department)
        .all()
    )
    return [schemas.DepartmentUtilization(department=d, employee_count=c) for d, c in rows]


@router.get("/by-project")
def employees_by_project(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Project.name, func.count(models.Assignment.id))
        .join(models.Assignment, models.Assignment.project_id == models.Project.id)
        .filter(models.Assignment.end_date.is_(None))
        .group_by(models.Project.name)
        .all()
    )
    return [{"project": name, "employee_count": count} for name, count in rows]

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("/", response_model=schemas.ProjectOut)
def create_project(payload: schemas.ProjectCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Project).filter(models.Project.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Project with this name already exists")

    project = models.Project(**payload.dict())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/", response_model=List[schemas.ProjectOut])
def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    status: Optional[models.ProjectStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Project)
    if status:
        query = query.filter(models.Project.status == status)
    if search:
        query = query.filter(models.Project.name.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=schemas.ProjectOut)
def update_project(project_id: int, payload: schemas.ProjectCreate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for key, value in payload.dict().items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return {"detail": "Project deleted successfully"}


@router.get("/{project_id}/employees", response_model=List[schemas.EmployeeOut])
def get_project_employees(project_id: int, db: Session = Depends(get_db)):
    assignments = (
        db.query(models.Assignment)
        .filter(models.Assignment.project_id == project_id, models.Assignment.end_date.is_(None))
        .all()
    )
    employee_ids = [a.employee_id for a in assignments]
    if not employee_ids:
        return []
    return db.query(models.Employee).filter(models.Employee.id.in_(employee_ids)).all()


@router.get("/{project_id}/assignments", response_model=List[schemas.ProjectAssignmentDetail])
def get_project_assignments(project_id: int, db: Session = Depends(get_db)):
    """Full detail for the project detail page: who's assigned, their role
    and start date, plus their current seat/floor (if allocated)."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    rows = (
        db.query(models.Assignment, models.Employee)
        .join(models.Employee, models.Employee.id == models.Assignment.employee_id)
        .filter(models.Assignment.project_id == project_id)
        .order_by(models.Assignment.end_date.isnot(None), models.Assignment.start_date.desc())
        .all()
    )

    result = []
    for assignment, employee in rows:
        seat = (
            db.query(models.Seat)
            .join(models.SeatAllocation, models.SeatAllocation.seat_id == models.Seat.id)
            .filter(
                models.SeatAllocation.employee_id == employee.id,
                models.SeatAllocation.released_date.is_(None),
            )
            .first()
        )
        result.append(schemas.ProjectAssignmentDetail(
            assignment_id=assignment.id,
            employee_id=employee.id,
            employee_code=employee.employee_code,
            employee_name=employee.name,
            employee_email=employee.email,
            department=employee.department,
            designation=employee.designation,
            role_in_project=assignment.role_in_project,
            start_date=assignment.start_date,
            end_date=assignment.end_date,
            seat_number=seat.seat_number if seat else None,
            floor=seat.floor if seat else None,
            zone=seat.zone if seat else None,
        ))
    return result

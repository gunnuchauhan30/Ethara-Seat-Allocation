from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.auth import require_roles
from app.models import models
from app.schemas import schemas

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.post("/", response_model=schemas.EmployeeOut)
def create_employee(
    payload: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_roles("hr", "admin")),
):
    existing = db.query(models.Employee).filter(
        or_(
            models.Employee.email == payload.email,
            models.Employee.employee_code == payload.employee_code,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee with this email or code already exists")

    employee = models.Employee(**payload.dict())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.get("/", response_model=schemas.EmployeeListResponse)
def list_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    department: Optional[str] = None,
    status: Optional[models.EmployeeStatus] = None,
    search: Optional[str] = Query(None, description="Search by name, email or employee code"),
    db: Session = Depends(get_db),
):
    query = db.query(models.Employee)

    if department:
        query = query.filter(models.Employee.department == department)
    if status:
        query = query.filter(models.Employee.status == status)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                models.Employee.name.ilike(like),
                models.Employee.email.ilike(like),
                models.Employee.employee_code.ilike(like),
            )
        )

    total = query.count()
    items = query.order_by(models.Employee.id).offset(skip).limit(limit).all()
    return schemas.EmployeeListResponse(total=total, items=items)


@router.get("/{employee_id}", response_model=schemas.EmployeeOut)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.put("/{employee_id}", response_model=schemas.EmployeeOut)
def update_employee(employee_id: int, payload: schemas.EmployeeUpdate, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(employee, key, value)

    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    db.delete(employee)
    db.commit()
    return {"detail": "Employee deleted successfully"}


@router.get("/{employee_id}/seat", response_model=Optional[schemas.SeatOut])
def get_employee_current_seat(employee_id: int, db: Session = Depends(get_db)):
    """Returns the employee's currently active seat, if any."""
    allocation = (
        db.query(models.SeatAllocation)
        .filter(
            models.SeatAllocation.employee_id == employee_id,
            models.SeatAllocation.released_date.is_(None),
        )
        .first()
    )
    if not allocation:
        return None
    seat = db.query(models.Seat).filter(models.Seat.id == allocation.seat_id).first()
    return seat


@router.get("/{employee_id}/projects", response_model=List[schemas.ProjectOut])
def get_employee_projects(employee_id: int, db: Session = Depends(get_db)):
    assignments = (
        db.query(models.Assignment)
        .filter(models.Assignment.employee_id == employee_id, models.Assignment.end_date.is_(None))
        .all()
    )
    project_ids = [a.project_id for a in assignments]
    if not project_ids:
        return []
    return db.query(models.Project).filter(models.Project.id.in_(project_ids)).all()

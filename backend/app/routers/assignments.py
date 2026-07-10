from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter(prefix="/assignments", tags=["Assignments"])


@router.post("/", response_model=schemas.AssignmentOut)
def create_assignment(payload: schemas.AssignmentCreate, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(models.Employee.id == payload.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    project = db.query(models.Project).filter(models.Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # prevent duplicate active assignment
    existing = (
        db.query(models.Assignment)
        .filter(
            models.Assignment.employee_id == payload.employee_id,
            models.Assignment.project_id == payload.project_id,
            models.Assignment.end_date.is_(None),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Employee is already actively assigned to this project")

    assignment = models.Assignment(**payload.dict())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/", response_model=List[schemas.AssignmentOut])
def list_assignments(db: Session = Depends(get_db)):
    return db.query(models.Assignment).all()


@router.post("/{assignment_id}/end")
def end_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.end_date = datetime.utcnow()
    db.commit()
    return {"detail": "Assignment ended successfully"}


@router.delete("/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(assignment)
    db.commit()
    return {"detail": "Assignment deleted successfully"}

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import require_roles
from app.models import models
from app.schemas import schemas

router = APIRouter(prefix="/seats", tags=["Seats"])


@router.post("/", response_model=schemas.SeatOut)
def create_seat(payload: schemas.SeatCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Seat).filter(models.Seat.seat_number == payload.seat_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Seat number already exists")

    seat = models.Seat(**payload.dict())
    db.add(seat)
    db.commit()
    db.refresh(seat)
    return seat


@router.get("/", response_model=List[schemas.SeatOut])
def list_seats(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=500),
    floor: Optional[int] = None,
    zone: Optional[str] = None,
    status: Optional[models.SeatStatus] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Seat)
    if floor is not None:
        query = query.filter(models.Seat.floor == floor)
    if zone:
        query = query.filter(models.Seat.zone == zone)
    if status:
        query = query.filter(models.Seat.status == status)

    return query.offset(skip).limit(limit).all()


@router.get("/available", response_model=List[schemas.SeatOut])
def available_seats(
    floor: Optional[int] = None,
    zone: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Seat).filter(models.Seat.status == models.SeatStatus.vacant)
    if floor is not None:
        query = query.filter(models.Seat.floor == floor)
    if zone:
        query = query.filter(models.Seat.zone == zone)
    return query.all()


@router.get("/{seat_id}", response_model=schemas.SeatOut)
def get_seat(seat_id: int, db: Session = Depends(get_db)):
    seat = db.query(models.Seat).filter(models.Seat.id == seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    return seat


@router.get("/{seat_id}/occupant", response_model=Optional[schemas.EmployeeOut])
def get_seat_occupant(seat_id: int, db: Session = Depends(get_db)):
    """Who's currently sitting in this seat, if anyone — lets the frontend
    jump from a seat straight to that employee's detail page."""
    allocation = (
        db.query(models.SeatAllocation)
        .filter(
            models.SeatAllocation.seat_id == seat_id,
            models.SeatAllocation.released_date.is_(None),
        )
        .first()
    )
    if not allocation:
        return None
    return db.query(models.Employee).filter(models.Employee.id == allocation.employee_id).first()


@router.post("/{seat_id}/allocate", response_model=schemas.SeatAllocationOut)
def allocate_seat(
    seat_id: int,
    employee_id: int,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_roles("hr", "admin")),
):
    seat = db.query(models.Seat).filter(models.Seat.id == seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    if seat.status != models.SeatStatus.vacant:
        raise HTTPException(status_code=400, detail=f"Seat is currently {seat.status.value}, cannot allocate")

    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Check employee doesn't already have an active seat
    existing_allocation = (
        db.query(models.SeatAllocation)
        .filter(
            models.SeatAllocation.employee_id == employee_id,
            models.SeatAllocation.released_date.is_(None),
        )
        .first()
    )
    if existing_allocation:
        raise HTTPException(status_code=400, detail="Employee already has an active seat allocated")

    allocation = models.SeatAllocation(employee_id=employee_id, seat_id=seat_id)
    seat.status = models.SeatStatus.occupied

    db.add(allocation)
    db.commit()
    db.refresh(allocation)
    return allocation


@router.post("/{seat_id}/release")
def release_seat(
    seat_id: int,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_roles("hr", "admin")),
):
    seat = db.query(models.Seat).filter(models.Seat.id == seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")

    allocation = (
        db.query(models.SeatAllocation)
        .filter(
            models.SeatAllocation.seat_id == seat_id,
            models.SeatAllocation.released_date.is_(None),
        )
        .first()
    )
    if not allocation:
        raise HTTPException(status_code=400, detail="This seat has no active allocation")

    allocation.released_date = datetime.utcnow()
    seat.status = models.SeatStatus.vacant

    db.commit()
    return {"detail": "Seat released successfully", "seat_id": seat_id}


@router.post("/new-joiner-allocate", response_model=schemas.SeatAllocationOut)
def new_joiner_allocate(
    payload: schemas.NewJoinerAllocateRequest,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_roles("hr", "admin")),
):
    """Auto-picks the first available seat matching optional floor/zone preference."""
    employee = db.query(models.Employee).filter(models.Employee.id == payload.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    existing_allocation = (
        db.query(models.SeatAllocation)
        .filter(
            models.SeatAllocation.employee_id == payload.employee_id,
            models.SeatAllocation.released_date.is_(None),
        )
        .first()
    )
    if existing_allocation:
        raise HTTPException(status_code=400, detail="Employee already has an active seat allocated")

    query = db.query(models.Seat).filter(models.Seat.status == models.SeatStatus.vacant)
    if payload.floor is not None:
        query = query.filter(models.Seat.floor == payload.floor)
    if payload.zone:
        query = query.filter(models.Seat.zone == payload.zone)

    seat = query.first()
    if not seat:
        raise HTTPException(status_code=400, detail="No available seat matching the given preference")

    allocation = models.SeatAllocation(employee_id=payload.employee_id, seat_id=seat.id)
    seat.status = models.SeatStatus.occupied

    db.add(allocation)
    db.commit()
    db.refresh(allocation)
    return allocation

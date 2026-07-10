import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, DateTime, Enum, Text
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    employee = "employee"
    hr = "hr"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.employee, nullable=False)


class EmployeeStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


class SeatStatus(str, enum.Enum):
    vacant = "vacant"
    occupied = "occupied"
    reserved = "reserved"


class ProjectStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    on_hold = "on_hold"


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    department = Column(String(80), index=True, nullable=False)
    designation = Column(String(80), nullable=False)
    joining_date = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(EmployeeStatus), default=EmployeeStatus.active, index=True)

    seat_allocations = relationship("SeatAllocation", back_populates="employee")
    assignments = relationship("Assignment", back_populates="employee")


class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    seat_number = Column(String(20), unique=True, index=True, nullable=False)
    floor = Column(Integer, index=True, nullable=False)
    zone = Column(String(20), index=True, nullable=False)
    status = Column(Enum(SeatStatus), default=SeatStatus.vacant, index=True)

    allocations = relationship("SeatAllocation", back_populates="seat")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.active, index=True)

    assignments = relationship("Assignment", back_populates="project")


class Assignment(Base):
    """Employee <-> Project mapping"""
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    role_in_project = Column(String(80), nullable=True)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)  # null = ongoing

    employee = relationship("Employee", back_populates="assignments")
    project = relationship("Project", back_populates="assignments")


class SeatAllocation(Base):
    """History + current seat allocation for an employee"""
    __tablename__ = "seat_allocations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=False)
    allocated_date = Column(DateTime, default=datetime.utcnow)
    released_date = Column(DateTime, nullable=True)  # null = currently active

    employee = relationship("Employee", back_populates="seat_allocations")
    seat = relationship("Seat", back_populates="allocations")

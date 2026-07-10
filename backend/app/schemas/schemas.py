from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from app.models.models import EmployeeStatus, SeatStatus, ProjectStatus, UserRole


# ---------- Auth ----------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Employee ----------
class EmployeeBase(BaseModel):
    employee_code: str
    name: str
    email: EmailStr
    department: str
    designation: str
    status: EmployeeStatus = EmployeeStatus.active


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    status: Optional[EmployeeStatus] = None


class EmployeeOut(EmployeeBase):
    id: int
    joining_date: datetime

    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    """Wraps the employee list with a total count so the frontend can render
    real pagination (e.g. 'Showing 1-50 of 5000') instead of guessing."""
    total: int
    items: List[EmployeeOut]


# ---------- Seat ----------
class SeatBase(BaseModel):
    seat_number: str
    floor: int
    zone: str
    status: SeatStatus = SeatStatus.vacant


class SeatCreate(SeatBase):
    pass


class SeatOut(SeatBase):
    id: int

    class Config:
        from_attributes = True


# ---------- Project ----------
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.active


class ProjectCreate(ProjectBase):
    pass


class ProjectOut(ProjectBase):
    id: int

    class Config:
        from_attributes = True


# ---------- Assignment ----------
class AssignmentCreate(BaseModel):
    employee_id: int
    project_id: int
    role_in_project: Optional[str] = None


class AssignmentOut(BaseModel):
    id: int
    employee_id: int
    project_id: int
    role_in_project: Optional[str]
    start_date: datetime
    end_date: Optional[datetime]

    class Config:
        from_attributes = True


# ---------- Seat Allocation ----------
class SeatAllocationOut(BaseModel):
    id: int
    employee_id: int
    seat_id: int
    allocated_date: datetime
    released_date: Optional[datetime]

    class Config:
        from_attributes = True


class ProjectAssignmentDetail(BaseModel):
    """One row for the project detail page: who's assigned, their role and
    start date, plus their current seat (if any) so HR can see at a glance
    who's on a project and where they sit."""
    assignment_id: int
    employee_id: int
    employee_code: str
    employee_name: str
    employee_email: str
    department: str
    designation: str
    role_in_project: Optional[str]
    start_date: datetime
    end_date: Optional[datetime]
    seat_number: Optional[str] = None
    floor: Optional[int] = None
    zone: Optional[str] = None


class NewJoinerAllocateRequest(BaseModel):
    employee_id: int
    floor: Optional[int] = None  # optional preference
    zone: Optional[str] = None   # optional preference


# ---------- Analytics ----------
class FloorUtilization(BaseModel):
    floor: int
    total_seats: int
    occupied: int
    vacant: int
    utilization_percent: float


class DepartmentUtilization(BaseModel):
    department: str
    employee_count: int


class DashboardSummary(BaseModel):
    total_employees: int
    total_seats: int
    occupied_seats: int
    vacant_seats: int
    utilization_percent: float
    total_projects: int


# ---------- AI Assistant ----------
class AIQueryRequest(BaseModel):
    question: str


class AIQueryResponse(BaseModel):
    question: str
    answer: str
    generated_sql: Optional[str] = None

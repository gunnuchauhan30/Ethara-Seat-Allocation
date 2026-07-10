"""
Seed script — generates realistic sample data:
  - ~5000 employees
  - ~5200 seats across 10 floors
  - ~60 projects
  - random project assignments
  - seat allocations for ~85% of employees (rest are 'new joiners' with no seat yet)

Run with:  python seed.py
"""
import random
from datetime import datetime, timedelta

from faker import Faker


from app.core.database import SessionLocal, engine, Base
from app.models import models
from app.core.auth import hash_password

fake = Faker()
Faker.seed(42)
random.seed(42)

DEPARTMENTS = [
    "Engineering", "Product", "Design", "Sales", "Marketing",
    "HR", "Finance", "Operations", "Customer Support", "Legal",
]
DESIGNATIONS = [
    "Associate", "Senior Associate", "Team Lead", "Manager",
    "Senior Manager", "Director", "VP", "Intern",
]
FLOORS = list(range(1, 11))          # 10 floors
ZONES = ["A", "B", "C", "D"]         # 4 zones per floor
SEATS_PER_ZONE = 13                  # 10 floors * 4 zones * 13 = 520... adjust below

NUM_EMPLOYEES = 5000
NUM_PROJECTS = 60


def create_tables():
    Base.metadata.create_all(bind=engine)


def seed_seats(db):
    print("Seeding seats...")
    seats = []
    seat_counter = 1
    for floor in FLOORS:
        for zone in ZONES:
            for i in range(1, 131):  # ~130 seats per zone => 10*4*130 = 5200 seats
                seat_number = f"F{floor}-{zone}-{i:03d}"
                seats.append(models.Seat(
                    seat_number=seat_number,
                    floor=floor,
                    zone=zone,
                    status=models.SeatStatus.vacant,
                ))
                seat_counter += 1
    db.bulk_save_objects(seats)
    db.commit()
    print(f"  -> {seat_counter - 1} seats created")


def seed_projects(db):
    print("Seeding projects...")
    projects = []
    for _ in range(NUM_PROJECTS):
        projects.append(models.Project(
            name=fake.unique.catch_phrase(),
            description=fake.text(max_nb_chars=150),
            status=random.choice(list(models.ProjectStatus)),
        ))
    db.bulk_save_objects(projects)
    db.commit()
    print(f"  -> {NUM_PROJECTS} projects created")


def seed_employees(db):
    print(f"Seeding {NUM_EMPLOYEES} employees (this may take a minute)...")
    employees = []
    for i in range(1, NUM_EMPLOYEES + 1):
        employees.append(models.Employee(
            employee_code=f"ETH{i:05d}",
            name=fake.name(),
            email=f"employee{i}@ethara.ai",
            department=random.choice(DEPARTMENTS),
            designation=random.choice(DESIGNATIONS),
            joining_date=fake.date_time_between(start_date="-4y", end_date="now"),
            status=models.EmployeeStatus.active if random.random() > 0.03 else models.EmployeeStatus.inactive,
        ))
        if i % 1000 == 0:
            print(f"  ...{i} generated")
    db.bulk_save_objects(employees)
    db.commit()
    print(f"  -> {NUM_EMPLOYEES} employees created")


def seed_assignments_and_allocations(db):
    print("Assigning employees to projects and seats...")
    employees = db.query(models.Employee).all()
    projects = db.query(models.Project).all()
    seats = db.query(models.Seat).filter(models.Seat.status == models.SeatStatus.vacant).all()

    random.shuffle(seats)
    seat_pool = iter(seats)

    # Flushed in batches (rather than one giant bulk-insert at the very end)
    # so that if this step gets interrupted (e.g. Ctrl+C), the work already
    # done up to the last batch is preserved instead of being lost entirely —
    # this previously showed up as 0% seat occupancy on the dashboard even
    # though employees/seats/projects had seeded fine.
    BATCH_SIZE = 500
    assignments_batch = []
    allocations_batch = []
    seats_to_update_batch = []

    total_assignments = 0
    total_allocations = 0

    def flush():
        nonlocal assignments_batch, allocations_batch, seats_to_update_batch
        nonlocal total_assignments, total_allocations
        if assignments_batch:
            db.bulk_save_objects(assignments_batch)
            total_assignments += len(assignments_batch)
        if allocations_batch:
            db.bulk_save_objects(allocations_batch)
            total_allocations += len(allocations_batch)
        if seats_to_update_batch:
            db.query(models.Seat).filter(
                models.Seat.id.in_([s.id for s in seats_to_update_batch])
            ).update({"status": models.SeatStatus.occupied}, synchronize_session=False)
        db.commit()
        assignments_batch, allocations_batch, seats_to_update_batch = [], [], []

    for idx, emp in enumerate(employees):
        # Assign to 1-2 random projects
        for proj in random.sample(projects, k=random.choice([1, 1, 2])):
            assignments_batch.append(models.Assignment(
                employee_id=emp.id,
                project_id=proj.id,
                role_in_project=random.choice(["Contributor", "Lead", "Reviewer"]),
                start_date=fake.date_time_between(start_date="-2y", end_date="now"),
            ))

        # ~85% of employees get a seat allocated; rest simulate "new joiners"
        if random.random() < 0.85:
            seat = next(seat_pool, None)
            if seat:
                allocations_batch.append(models.SeatAllocation(
                    employee_id=emp.id,
                    seat_id=seat.id,
                    allocated_date=fake.date_time_between(start_date="-1y", end_date="now"),
                ))
                seat.status = models.SeatStatus.occupied
                seats_to_update_batch.append(seat)

        if (idx + 1) % BATCH_SIZE == 0:
            flush()
            print(f"  ...processed {idx + 1} employees (progress saved)")

    flush()
    print(f"  -> {total_assignments} assignments, {total_allocations} seat allocations created")


def seed_users(db):
    print("Seeding demo login users...")
    demo_users = [
        models.User(name="Admin User", email="admin@ethara.ai", password_hash=hash_password("admin123"), role=models.UserRole.admin),
        models.User(name="HR User", email="hr@ethara.ai", password_hash=hash_password("hr123"), role=models.UserRole.hr),
        models.User(name="Employee User", email="employee@ethara.ai", password_hash=hash_password("emp123"), role=models.UserRole.employee),
    ]
    db.bulk_save_objects(demo_users)
    db.commit()
    print("  -> 3 demo users created (admin@ethara.ai / hr@ethara.ai / employee@ethara.ai)")


def main():
    create_tables()
    db = SessionLocal()
    try:
        # Clear existing data (safe for repeated seeding in dev)
        print("Clearing existing data...")
        db.query(models.SeatAllocation).delete()
        db.query(models.Assignment).delete()
        db.query(models.Seat).delete()
        db.query(models.Project).delete()
        db.query(models.Employee).delete()
        db.query(models.User).delete()
        db.commit()

        seed_users(db)
        seed_seats(db)
        seed_projects(db)
        seed_employees(db)
        seed_assignments_and_allocations(db)

        print("\n✅ Seeding complete!")
    finally:
        db.close()


if __name__ == "__main__":
    main()

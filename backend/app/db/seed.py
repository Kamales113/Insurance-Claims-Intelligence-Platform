import asyncio
from datetime import datetime, date, timezone
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.customer import Customer
from app.models.agent import Agent
from app.models.policy import Policy
from app.models.claim import Claim
from app.models.history import ClaimStatusHistory


def parse_dt(dt_str: str) -> datetime:
    return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))


def parse_date(date_str: str) -> date:
    return date.fromisoformat(date_str)


async def seed_data(db: AsyncSession):
    default_password_hash = get_password_hash("password123")

    # 1. Users
    users_data = [
        {
            "id": "user_cust_001",
            "email": "customer@demo.com",
            "hashed_password": default_password_hash,
            "first_name": "Sarah",
            "last_name": "Jenkins",
            "role": "customer",
            "created_at": parse_dt("2024-01-15T09:30:00Z"),
        },
        {
            "id": "user_cust_002",
            "email": "michael.chen@example.com",
            "hashed_password": default_password_hash,
            "first_name": "Michael",
            "last_name": "Chen",
            "role": "customer",
            "created_at": parse_dt("2024-02-20T11:15:00Z"),
        },
        {
            "id": "user_cust_003",
            "email": "amanda.rodriguez@example.com",
            "hashed_password": default_password_hash,
            "first_name": "Amanda",
            "last_name": "Rodriguez",
            "role": "customer",
            "created_at": parse_dt("2024-03-10T14:45:00Z"),
        },
        {
            "id": "user_agent_001",
            "email": "agent@demo.com",
            "hashed_password": default_password_hash,
            "first_name": "David",
            "last_name": "Miller",
            "role": "agent",
            "created_at": parse_dt("2023-11-01T08:00:00Z"),
        },
    ]

    for item in users_data:
        res = await db.execute(select(User).where(User.id == item["id"]))
        if not res.scalars().first():
            db.add(User(**item))

    await db.flush()

    # 2. Customers
    customers_data = [
        {
            "id": "cust_001",
            "user_id": "user_cust_001",
            "phone": "+1 (555) 234-5678",
            "address": "742 Evergreen Terrace, Springfield, OR 97477",
            "date_of_birth": parse_date("1988-06-14"),
            "created_at": parse_dt("2024-01-15T09:30:00Z"),
        },
        {
            "id": "cust_002",
            "user_id": "user_cust_002",
            "phone": "+1 (555) 876-5432",
            "address": "1042 Market Street, San Francisco, CA 94103",
            "date_of_birth": parse_date("1982-11-03"),
            "created_at": parse_dt("2024-02-20T11:15:00Z"),
        },
        {
            "id": "cust_003",
            "user_id": "user_cust_003",
            "phone": "+1 (555) 345-6789",
            "address": "450 Ocean Drive, Miami, FL 33139",
            "date_of_birth": parse_date("1993-02-28"),
            "created_at": parse_dt("2024-03-10T14:45:00Z"),
        },
    ]

    for item in customers_data:
        res = await db.execute(select(Customer).where(Customer.id == item["id"]))
        if not res.scalars().first():
            db.add(Customer(**item))

    await db.flush()

    # 3. Agents
    agents_data = [
        {
            "id": "agt_001",
            "user_id": "user_agent_001",
            "department": "Claims Investigation",
            "employee_id": "EMP-9910",
            "created_at": parse_dt("2023-11-01T08:00:00Z"),
        },
    ]

    for item in agents_data:
        res = await db.execute(select(Agent).where(Agent.id == item["id"]))
        if not res.scalars().first():
            db.add(Agent(**item))

    await db.flush()

    # 4. Policies
    policies_data = [
        {
            "id": "pol_001",
            "policy_number": "POL-AUTO-8821",
            "customer_id": "cust_001",
            "type": "Auto Comprehensive",
            "status": "active",
            "start_date": parse_date("2025-01-01"),
            "end_date": parse_date("2026-01-01"),
            "coverage_amount": Decimal("50000.00"),
            "premium": Decimal("1400.00"),
            "created_at": parse_dt("2025-01-01T00:00:00Z"),
        },
        {
            "id": "pol_002",
            "policy_number": "POL-HOME-4402",
            "customer_id": "cust_001",
            "type": "Homeowners Protection",
            "status": "active",
            "start_date": parse_date("2024-06-15"),
            "end_date": parse_date("2026-06-15"),
            "coverage_amount": Decimal("450000.00"),
            "premium": Decimal("2200.00"),
            "created_at": parse_dt("2024-06-15T00:00:00Z"),
        },
        {
            "id": "pol_003",
            "policy_number": "POL-HLTH-1093",
            "customer_id": "cust_001",
            "type": "Individual Health Premier",
            "status": "active",
            "start_date": parse_date("2025-03-01"),
            "end_date": parse_date("2026-03-01"),
            "coverage_amount": Decimal("100000.00"),
            "premium": Decimal("3600.00"),
            "created_at": parse_dt("2025-03-01T00:00:00Z"),
        },
        {
            "id": "pol_004",
            "policy_number": "POL-AUTO-9912",
            "customer_id": "cust_002",
            "type": "Auto Liability",
            "status": "active",
            "start_date": parse_date("2024-11-01"),
            "end_date": parse_date("2025-11-01"),
            "coverage_amount": Decimal("35000.00"),
            "premium": Decimal("1100.00"),
            "created_at": parse_dt("2024-11-01T00:00:00Z"),
        },
        {
            "id": "pol_005",
            "policy_number": "POL-COMM-3301",
            "customer_id": "cust_003",
            "type": "Commercial Property",
            "status": "active",
            "start_date": parse_date("2025-02-01"),
            "end_date": parse_date("2026-02-01"),
            "coverage_amount": Decimal("1000000.00"),
            "premium": Decimal("8500.00"),
            "created_at": parse_dt("2025-02-01T00:00:00Z"),
        },
    ]

    for item in policies_data:
        res = await db.execute(select(Policy).where(Policy.id == item["id"]))
        if not res.scalars().first():
            db.add(Policy(**item))

    await db.flush()

    # 5. Claims
    claims_data = [
        {
            "id": "clm_001",
            "claim_number": "CLM-2026-101",
            "customer_id": "cust_001",
            "policy_id": "pol_001",
            "status": "UNDER_INVESTIGATION",
            "incident_date": parse_date("2026-08-26"),
            "submitted_at": parse_dt("2026-08-28T10:15:00Z"),
            "description": "Minor rear-end collision at intersection. Bumper damage and taillight replacement required.",
            "claim_amount": Decimal("4250.00"),
            "assigned_agent_id": "user_agent_001",
            "updated_at": parse_dt("2026-08-30T14:00:00Z"),
        },
        {
            "id": "clm_002",
            "claim_number": "CLM-2026-089",
            "customer_id": "cust_001",
            "policy_id": "pol_002",
            "status": "APPROVAL",
            "incident_date": parse_date("2026-08-12"),
            "submitted_at": parse_dt("2026-08-14T14:30:00Z"),
            "description": "Burst water pipe in upstairs bathroom causing floor and ceiling moisture damage.",
            "claim_amount": Decimal("12800.00"),
            "assigned_agent_id": "user_agent_001",
            "updated_at": parse_dt("2026-09-02T11:20:00Z"),
        },
        {
            "id": "clm_003",
            "claim_number": "CLM-2026-045",
            "customer_id": "cust_001",
            "policy_id": "pol_001",
            "status": "PAID",
            "incident_date": parse_date("2026-05-30"),
            "submitted_at": parse_dt("2026-06-02T09:00:00Z"),
            "description": "Windshield crack from highway debris. Full replacement completed.",
            "claim_amount": Decimal("650.00"),
            "assigned_agent_id": "user_agent_001",
            "updated_at": parse_dt("2026-06-10T16:45:00Z"),
        },
        {
            "id": "clm_004",
            "claim_number": "CLM-2026-012",
            "customer_id": "cust_001",
            "policy_id": "pol_003",
            "status": "SUBMITTED",
            "incident_date": parse_date("2026-09-03"),
            "submitted_at": parse_dt("2026-09-04T16:20:00Z"),
            "description": "Urgent care visit and diagnostic imaging for acute abdominal pain.",
            "claim_amount": Decimal("2100.00"),
            "assigned_agent_id": None,
            "updated_at": parse_dt("2026-09-04T16:20:00Z"),
        },
        {
            "id": "clm_005",
            "claim_number": "CLM-2025-980",
            "customer_id": "cust_001",
            "policy_id": "pol_002",
            "status": "REJECTED",
            "incident_date": parse_date("2025-12-08"),
            "submitted_at": parse_dt("2025-12-10T11:00:00Z"),
            "description": "Basement flooding following severe rainstorm. Excluded flood zone exception.",
            "claim_amount": Decimal("18500.00"),
            "assigned_agent_id": "user_agent_001",
            "updated_at": parse_dt("2025-12-18T15:30:00Z"),
        },
        {
            "id": "clm_006",
            "claim_number": "CLM-2026-050",
            "customer_id": "cust_002",
            "policy_id": "pol_004",
            "status": "POLICY_VALIDATION",
            "incident_date": parse_date("2026-07-04"),
            "submitted_at": parse_dt("2026-07-06T13:10:00Z"),
            "description": "Parking lot fender bender with third-party vehicle.",
            "claim_amount": Decimal("1850.00"),
            "assigned_agent_id": None,
            "updated_at": parse_dt("2026-07-08T09:40:00Z"),
        },
    ]

    for item in claims_data:
        res = await db.execute(select(Claim).where(Claim.id == item["id"]))
        if not res.scalars().first():
            db.add(Claim(**item))

    await db.flush()

    # 6. Claim Status History
    history_data = [
        {
            "id": "hist_001",
            "claim_id": "clm_001",
            "status": "SUBMITTED",
            "changed_at": parse_dt("2026-08-28T10:15:00Z"),
            "changed_by": "user_cust_001",
            "notes": "Initial claim submission by policyholder.",
        },
        {
            "id": "hist_002",
            "claim_id": "clm_001",
            "status": "DOCUMENT_VERIFICATION",
            "changed_at": parse_dt("2026-08-29T09:00:00Z"),
            "changed_by": "user_agent_001",
            "notes": "Reviewing photos of vehicle damage and police report.",
        },
        {
            "id": "hist_003",
            "claim_id": "clm_001",
            "status": "UNDER_INVESTIGATION",
            "changed_at": parse_dt("2026-08-30T14:00:00Z"),
            "changed_by": "user_agent_001",
            "notes": "Assigned to field adjuster for repair estimate verification.",
        },
        {
            "id": "hist_004",
            "claim_id": "clm_002",
            "status": "SUBMITTED",
            "changed_at": parse_dt("2026-08-14T14:30:00Z"),
            "changed_by": "user_cust_001",
            "notes": "Claim submitted with contractor estimate.",
        },
        {
            "id": "hist_005",
            "claim_id": "clm_002",
            "status": "APPROVAL",
            "changed_at": parse_dt("2026-09-02T11:20:00Z"),
            "changed_by": "user_agent_001",
            "notes": "Plumbing report verified. Claim approved for payout.",
        },
    ]

    for item in history_data:
        res = await db.execute(
            select(ClaimStatusHistory).where(ClaimStatusHistory.id == item["id"])
        )
        if not res.scalars().first():
            db.add(ClaimStatusHistory(**item))

    await db.commit()


async def main():
    async with AsyncSessionLocal() as session:
        await seed_data(session)


if __name__ == "__main__":
    asyncio.run(main())

# Insurance Claims Intelligence Platform — FastAPI Backend (Phase 2)

Production-oriented FastAPI + Async PostgreSQL backend for insurance claims management and investigation.

## Features

- **FastAPI**: Modern, async RESTful API framework.
- **SQLAlchemy 2.x & AsyncPG**: Fully async ORM layer with PostgreSQL database driver.
- **Alembic**: Database migrations management.
- **JWT Authentication**: Password hashing with Bcrypt and JWT Bearer token authentication.
- **Role-Based Access Control**: Strict `customer`, `agent`, and `admin` permission scoping.
- **Idempotent Data Seeder**: Pre-populates mock domain dataset matching existing frontend contract.
- **Pytest Suite**: Async integration and API unit test suite.

---

## Quick Start

### 1. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Database Migrations

```bash
alembic upgrade head
```

### 4. Seed Mock Data

```bash
python -m app.db.seed
```

### 5. Start Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API Base URL: `http://localhost:8000/api/v1`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- ReDoc API Documentation: `http://localhost:8000/redoc`

---

## Testing

Run tests with `pytest`:

```bash
pytest
```

---

## Seed Users

| Role | Email | Password | User ID | Customer / Agent ID |
| :--- | :--- | :--- | :--- | :--- |
| Customer | `customer@demo.com` / `sarah.jenkins@example.com` | `password123` | `user_cust_001` | `cust_001` |
| Customer | `michael.chen@example.com` | `password123` | `user_cust_002` | `cust_002` |
| Customer | `amanda.rodriguez@example.com` | `password123` | `user_cust_003` | `cust_003` |
| Agent | `agent@demo.com` / `david.miller@insurance.com` | `password123` | `user_agent_001` | `agt_001` |
